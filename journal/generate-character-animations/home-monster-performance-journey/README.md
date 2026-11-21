# Making Home's monsters cheap to watch: an agent's journey

- Seen: 2026-11-07, while-we-wait (branch `home-monster-performance`, iPhone 13 Pro, no Mac)
- Who wrote this: the Claude Code session that implemented the work, in its own words.
- Status: worked once. The owner reports Home is "significantly less laggy", with the animation
  still looking good (dev build, by eye; not yet captured on a preview build).
- Evidence: the [case study](../home-monster-performance/README.md) holds the review, measurements,
  plans and device results.
- Purpose: material for a system that builds, iterates on and optimizes character animations.
  Read it to work differently next time, not as a record of this project.
- Seen again: 2026-11-07, while-we-wait, the title lime on Who's playing. It had every cost Home
  had: one array woke all 30 parts while about 4 moved, the whole SVG was redrawn, and the frame
  callback registered again on every render.
- Tried: the same session reused this entry's system in about an hour:
  - a probe first;
  - the layer compiler generalized to take any rig plus its timelines;
  - the parity replay extended to every clip and blend, and mutation-checked;
  - pausing out of sight with a bounded catch-up.
  Lesson: when one character gets optimized, audit every animated character in the app for the
  same costs.
- Tried again: putting the lime on Home's native-layer renderer broke Home on the phone (one
  monster's eyes drawn on another) and misplaced a lime star, though every test passed. Reverted;
  the lime now uses changed-only publishing on its own SVG drawing. Lesson: a shared native
  renderer shares runtime state too; check every character on it by eye before calling it done
  ([report](title-lime-report.md#correction-what-happened-on-the-phone-2026-11-07)).

## The story in brief

I inherited a review and plan that blamed redundant SVG prop updates: 158 animated groups woke
every frame. I built a diagnostic capture tool, cut those updates by 96%, and compiled away loop
channels that never move. On the phone, that bought only a 5–24% smoother cadence. A "frozen"
capture (same drawing, nothing moving) ran at 120 Hz, while the moving story ran at 31–39 Hz,
with the app's own JavaScript taking under 1 ms a frame. The real cost was react-native-svg
redrawing the whole drawing whenever any part moved.

The optimization also exposed a hidden bug: still parts snapped back to their mount pose. After
fixing it, the owner chose two deeper changes:
- pause the work while nobody can see the monsters, with their story clock still running;
- a renderer that moves pre-drawn pictures instead of redrawing.

The owner reports the result as much less laggy, and still right visually.

## What worked well (build these into the system)

- **Revalidating evidence before acting.** I reran the review's probe on the current branch before
  writing code. Every count still held, so an older plan could be trusted in minutes.
  *System:* every animation keeps a deterministic probe that reports workload counts and can be
  rerun on any commit.
- **A frozen-versus-live capture.** The same native tree, once frozen and once moving, separates
  the cost of mounting from the cost of animating, and your code from the renderer, with no
  native profiler.
  *System:* make this the first measurement for any animation performance question.
- **An in-app capture tool, gated to development and preview builds.** The owner armed captures
  in Dev settings and copied one JSON for the whole session. Bounded histograms, pauses counted
  apart from hitches, labelled build SHA and conditions, and no logging or polling.
  *System:* reuse it for every character, with a short device run sheet.
- **Parity replays against a reference renderer.** A pure replay compared every part's drawn
  matrix and opacity, and later every path's paint order and position (within 1e-9), against the
  original SVG rules. It covered fractional frames, greetings, interruptions and hidden-to-visible
  switches. That is why two renderer changes shipped with no visual regression you could see.
  *System:* every renderer or evaluator change must pass parity against the reference before
  anyone looks at it on a device.
- **Mutation checks on new tests.** Deliberately breaking the guarded code proved which tests
  could fail. One fixture couldn't, and was fixed.
  *System:* make "break it and watch the test fail" part of finishing any test.
- **A faithful frame harness.** A test double mirroring Reanimated 4.5.1's frame-callback registry
  made pause/resume, focus, background and duplicate-registration bugs testable in Jest.
  *System:* ship this harness with the animation toolkit.
- **Asking product questions plainly, with a stated default.** It made a wrong default cheap to
  correct. I proposed resuming where the monsters stopped; the owner wanted the story to keep
  going, so the world feels alive.
- **Native layers instead of one redrawn SVG.** The rig compiles into zero-sized views per animated
  part, fixed views for still groups that hold parts, and small pictures drawn once (larger under
  parts that grow). No new library and no native rebuild; about 2 MB of pictures.
  *System:* make this the default renderer for vector characters on React Native, and keep the
  SVG markup for still poses and the web preview.
- **Out-of-sight pausing, with time catching up.** Stop evaluating and drawing when the character
  is scrolled away, covered (including native modals that don't blur the route) or backgrounded.
  On return, `catchUp()` plays out any greeting in progress and jumps the clock, then the
  caught-up pose is published before the first frame.
  *System:* every ambient character gets this by default.

## What didn't work well (and what fixed it)

- **I optimized before finding the bottleneck.** A day went into the half-millisecond of
  JavaScript, while the cost was native redrawing. *Fix:* frozen-versus-live first.
- **Two optimizations shared one device build.** It saved the owner a round trip, but a new
  60–69 ms stall about every 15 s couldn't be attributed to either change, and it's still
  deferred. *Fix:* one build per change whenever a regression is possible.
- **Stopping redundant updates exposed the framework's idle path.** Reanimated 4.5.1 hands props
  unchanged for a second back to React by their native names (`matrix`), but react-native-svg's
  `G` reads only `transform`. Still parts snapped to their mount pose until they next moved. The
  old code had hidden this by republishing every part every frame. *Fix:* a `G` that honors
  `matrix`, plus a test that simulates the settle merge.
- **The stock test mocks hid real bugs.** Reanimated's Jest `useSharedValue` returns a new, reset
  value on every render, and `useFrameCallback` was stubbed as never running. *Fix:* the faithful
  harness above.
- **The first timing design would have missed the work being removed.** Reanimated runs prop
  updaters in a microtask after `.set()`. *Fix:* time until a microtask queued after the
  publication.
- **The plan's filenames collided.** `x.ts` and `x.native.ts` resolve to the same import on iOS.
  *Fix:* a different name.
- **Media I couldn't inspect.** The owner's HEVC screen recording couldn't be decoded locally (a
  downloaded decoder was blocked). The library source and a clear description were enough this
  time. *System:* keep a sanctioned frame-extraction tool available, or ask for screenshots.

## What to avoid

- Don't claim FPS, CPU or battery gains from update counts, callback intervals or battery
  percentages. A 15-point versus 7-point battery drop across back-to-back sessions on a warm
  phone was not evidence.
- Don't compare dev-build timings with Release (preview) builds.
- Don't trust a test that passed before its feature existed until you've broken the code and
  watched it fail.
- Don't assume a framework's defaults are neutral when you change update patterns. Check what
  happens when values stop changing.
- Don't queue builds without knowing the build wrapper's side effects; this project's pushes
  `shipped/*` tags. Stop builds the owner no longer needs.
- Don't let Testing Library's `screen` point at the wrong tree: `renderHook` after `render`
  repoints it.
- Under fake timers, a zero-delay timeout created inside a tick fires 1 ms later, and the
  Worklets mock's thread hops are asynchronous.

## What the animation system should contain

1. **Reference renderer and parity replay.** One trusted evaluator plus SVG markup, and a replay
   that every faster renderer must match.
2. **A probe** for deterministic workload counts on any commit.
3. **An in-app capture tool** (live, frozen, story, loop, interaction) with a device run sheet,
   and results saved verbatim beside the evidence.
4. **A faithful frame-callback test harness.**
5. **The layered native renderer** for moving characters, and SVG markup for still poses and the
   web.
6. **Visibility policy:** pause out of sight, keep or skip time per character as a product choice,
   and publish the current pose before the first visible frame.
7. **Iteration rules:** one change per device build; frozen-versus-live before optimizing; parity
   before device; mutation-check new tests; record decisions and their costs.

## Still open

The owner closed the branch on 2026-11-07, judging performance fine by eye, and deferred these
to diagnose only if a problem shows up: the periodic stall; a capture of the layered renderer on a
preview build; the title lime on the phone; and a lower animation rate. The SVG binding path is no
longer unused: the title lime draws through it, so keep it.
