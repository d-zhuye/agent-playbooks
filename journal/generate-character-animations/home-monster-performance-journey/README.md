# Making Home's monsters cheap to watch: an agent's journey

- Seen: 2026-11-07, while-we-wait (branch `home-monster-performance`, iPhone 13 Pro, no Mac)
- Who wrote this: the Claude Code session that implemented the work, in its own words.
- Status: worked once. The owner reports Home is "significantly less laggy" with the animation
  still looking good (dev build, by eye). Not yet measured with the capture tool.
- Evidence: the [case study](../home-monster-performance/README.md) holds the review, measurements,
  plans and device results. This page is the story of how they came about, and what I'd tell
  the next agent.

## Where I started

I inherited a careful review and an approved plan. The plan said: instrument first, get a device
baseline, then cut redundant work. That meant publishing only the SVG parts that changed, and
skipping loop channels that never move. The review had found that every frame woke all 158
animated SVG groups, and each one handed Reanimated a fresh matrix array, even when nothing
moved. It looked like the obvious culprit.

Before touching anything I reran the review's probe on the current branch, because another
session had since moved the renderer into a shared component. Every count still held. That took
minutes, and it meant I didn't have to re-plan.

## Building the measuring stick

The capture tool turned out to be most of the work, and three of its lessons came from the
tools, not the app:

- **The plan's filenames collided.** It named the pure module `homeMonsterProfile.ts` and the
  adapter `homeMonsterProfile.native.ts`. On iOS, Metro and jest-expo resolve `./homeMonsterProfile`
  to the `.native` file, so the adapter would have imported itself. I renamed the adapter.
- **Reanimated's Jest mock lies about two things that matter.** Its `useSharedValue` returns a new,
  reset value on every render, and projects stub `useFrameCallback` as never running. With those,
  no test can see a duplicate frame-callback registration or a pause/resume bug. I wrote a small
  harness that mirrors Reanimated 4.5.1's real registry: one handle per component, active state
  kept across re-registration, and a null interval on the first frame after each activation.
- **Timing `.set()` measures almost nothing.** Reading `mappers.ts` showed that Reanimated runs
  every prop updater in a microtask *after* the publication. So "publishing" had to be timed until
  a microtask queued behind it; otherwise the measurement would miss exactly the work the
  optimization removes.

I also learned to mutation-check any test that passed before its feature existed. One fixture,
meant to prove a floating-point guard, couldn't fail: `0.3 * 10` is exactly 3 in JavaScript.
Timestamp differences such as `1000.7 - 1000` are where the error actually shows up.

## Skipping the gate, and what it cost

Halfway through, the owner asked me to speed up and go straight to the optimizations, before
any device baseline existed. I did, and wrote that down as a ruling. To save the owner a round
trip, I then folded the two optimizations into one candidate build, next to a baseline build of
the diagnostics alone.

Both choices were reasonable, but the second one cost us. When the candidate showed a new
60–69 ms hitch about every 15 seconds, I couldn't tell which optimization caused it. It is still
deferred. **One build per change whenever a change could regress something.** The extra round
trip is cheaper than a regression you can't attribute.

## The measurement that changed everything

The owner ran 12 captures on each build. The most valuable one was the cheapest to design:
**frozen mode**, with the same native drawing mounted but nothing moving.

- Frozen: 120 callbacks a second, both builds.
- Moving: 31–39 a second, both builds.
- The app's own JavaScript: under 1 ms a frame.

So the review's suspect was real but small. Cutting SVG prop updates by 96% bought only a 5–24%
cadence gain, because the real cost was react-native-svg redrawing the *whole* drawing on the CPU
whenever *any* part moved. I had spent a day optimizing the half-millisecond.

**If I did it again, I would run the frozen-versus-live comparison before writing a single
optimization.** It needs no native profiler, and it tells you whether to optimize your code or
your rendering.

I also had to resist a tempting conclusion. The battery fell 15 points during build A's session
and 7 during B's. But B ran second, on a warm phone, with unrecorded session lengths. That isn't
evidence, and I said so.

## The bug the optimization uncovered

On the phone, the candidate's monsters "teleported" to the left and back. I couldn't decode the
owner's HEVC screen recording, because running a downloaded ffmpeg was blocked, so I worked from
the description and the library source. Two lines met:

1. Reanimated 4.5.1 (`FORCE_REACT_RENDER_FOR_SETTLED_ANIMATIONS`) hands props that haven't changed
   for a second back to React by their *native* names (`matrix`), re-renders the component, and
   later drops them from its own registry.
2. react-native-svg's `G` builds its native matrix from `transform` only, and ignores `matrix`.

So any part that held still for a second was redrawn at the pose it had mounted with. The old
code had hidden this for months by republishing every part every frame, so nothing ever settled.
**Optimizations that stop redundant updates expose the framework's idle paths.** Test what
happens when values *stop* changing, not just when they change. The fix was a small `G` wrapper
that honors a handed-back `matrix`, with a test that simulates Reanimated's settle merge.

## My default was wrong

When the owner picked "pause when out of sight", I proposed that the monsters pick up where they
stopped, as Home already did after Settings. The owner wanted the opposite: the story keeps going
while nobody is looking, because it "makes the world feel more alive, and each monster
operating on its own." That was a product decision, not a technical one, and asking it as a
plain question with my default stated made the correction cheap. The implementation followed
from it: a pure `catchUp()` plays out any greeting in progress and then just moves the clock, so
hours away cost no more than seconds. The caught-up pose is published before the first frame,
so no stale pose flashes on return.

The picker case came from another session's power audit, not from me. A native `Modal` neither
changes route nor blurs Home, so route focus alone never paused the animation.

## A renderer that moves pictures

The owner accepted "barely visible differences" and preferred trying our own approach before
adding Skia. So I compiled each rig into native layers:

- a zero-sized view per animated part, so transforms turn about the part's own origin, as in SVG;
- fixed views for still groups that hold moving parts;
- small SVG pictures for the still shapes, drawn once and drawn larger under parts that grow.

The graphics chip moves the pictures and nothing redraws. The test that made me trust it replays
story, loop and greeting moments, and checks that every path lands in the same paint order and
within 1e-9 of where the SVG would draw it. Two deliberate breakages (dropping a fixed transform,
reordering a still run) each failed about half the suite.

The owner's verdict on the dev build: much less laggy, still looks right.

## Small things that cost time

- Testing Library's `screen` follows the *latest* render, so `renderHook` after `render` silently
  queries an empty tree.
- Sinon fake timers schedule a zero-delay timeout created *inside* a tick 1 ms later.
- The Worklets Jest mock is asynchronous (`scheduleOnUI` is a `setTimeout(0)`, `scheduleOnRN` a
  microtask), so tests must let the hand-back run.
- `expo lint` skips `.cjs` files but lint-staged doesn't, so committing the review's probe needed
  one import line. I reran the pinned probe afterwards to prove the evidence still matched.
- The project's build wrapper pushes `shipped/*` git tags for every preview build. Know your
  wrappers' side effects before queuing builds, and stop a build the owner no longer needs (the
  owner had moved to a dev build).

## What I'd tell the next agent

1. Rerun the evidence on the current code before trusting a plan written against older code.
2. Find out whether the cost is your code or the renderer, with a frozen-versus-live run, before
   optimizing anything.
3. Make test doubles as faithful as the behavior you're testing; a mock that resets state hides
   exactly the bugs you're hunting.
4. One build per optimization when a regression is possible.
5. When you stop republishing values, check what the framework does with values that settle.
6. Ask the product question plainly, with your default, and expect to be wrong about taste.
7. Don't treat battery percentages, callback intervals or update counts as FPS or energy.

Still open: the periodic stall, a capture of the layered renderer on a preview build, removing
the now-unused SVG binding path, and a lower animation rate, which is only worth trying if
measurement says it's still needed.
