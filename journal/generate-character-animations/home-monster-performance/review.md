# Home monster performance review

Reviewed 2026-11-06. Baseline: `0550901321fea7261c539a969c5bdb2b1aa1e4f9`.
Reference device: the owner's iPhone 13 Pro; no Mac or Instruments available.
This is a review and local measurement artifact. No production optimization or device
performance improvement is claimed.

Another session changed the shared renderer during the review. Measurements use an archived
copy of the baseline commit. The renderer extraction in `a37dc96` retains the main finding
below in `src/ui/MonsterParts.tsx`; recheck findings against later edits before implementing.

## Recommendation

First measure and reduce redundant SVG prop updates. The state machine already runs in a UI
worklet, uses one scene callback, and avoids React renders on every frame. The most promising
remaining cost is the work between publishing a scene and drawing it: all animated groups
wake up, including hidden ones, and fresh matrix arrays cause unchanged poses to be submitted
again. Keep the current engine until a device comparison establishes a reason to replace it.

## Evidence and limits

The probe loads the real pure evaluator and JSON, reproduces the renderer's mounted tree and
Solo selection, and samples every integer frame of the opening story and one complete loop,
without taps. “Visible” means allowed by opacity and ancestor Solo selection; it does not
include viewport clipping or occlusion. Changes count local numeric transforms/opacity,
not how many parts move on screen when their parent moves.

| Measured property | Opening story | Repeating loop |
| --- | ---: | ---: |
| Animated groups subscribed to each scene publication | 158 | 158 |
| Groups visible by opacity/Solo rules, average | 48.53 | 73.70 |
| Groups whose local props differ from the preceding integer frame, average | 20.04 | 11.70 |
| Visible groups whose local props differ, average | 14.34 | 6.42 |

The four monsters mount 552 SVG groups and 252 paths, excluding scenery. Their 225 channel
slots are all evaluated each tick. Of the loop channels, 124 are constant and equal to the
baseline values already copied by `evaluate()`. The four source JSON files total 703,364
bytes; that is source size, not installed bundle size or runtime memory.

The Node 24/V8 probe on Linux measured the four-monster `step()`/`evaluate()` tick at medians
of 13.52 µs for the story, 10.26 µs for the loop, and 8.73 µs with periodic greetings. These
are seven batch timings after warmup, not individual-frame percentiles. The batches vary
substantially; raw ranges are in [baseline.json](baseline.json). These timings exclude shared
value publication, mapper execution, native prop application, SVG drawing, and display
presentation. They cannot establish iPhone smoothness, native cost, memory, or energy use.

## Findings, in recommended order

### 1. P2: New matrix arrays defeat suppression of unchanged native props

Baseline locations: `src/ui/HomeMonsters.tsx:83`, `:130`, `:150`.
After the extraction: `src/ui/MonsterParts.tsx:25` and `:45`.

Every tick replaces the whole shared `number[][]` scene. Every `AnimatedPart` subscribes to
that same value, so a change anywhere invalidates all 158 prop updaters. Each updater calls
`matrix()`, allocating a new six-element array even when its numeric transform is unchanged.

This matters specifically to the installed Reanimated 4.5.1 implementation:

- `src/mappers.ts` registers a listener on the shared value for every updater.
- `src/hook/useAnimatedStyle.ts:304` checks whether returned props changed before `updateProps()`.
- `src/hook/utils.ts:20` compares property values by identity. Two numerically identical
  matrix arrays compare unequal.

Consequently the native-prop update path is entered for unchanged groups too. At 60 callback
ticks per second, the scene can submit 9,480 group updates per second; at 120, 18,960. These
are code-derived update counts, not observed native paint counts. Reanimated batches updates,
and react-native-svg's native matrix setter also rejects equal transforms.

**Change to evaluate:** retain stable per-part transform values when their numbers have not
changed so the existing comparison can suppress native submissions. Then reduce downstream
evaluation for hidden Solo branches while keeping their visibility switch responsive and
evaluating their current pose before revealing them. Splitting into one shared value per
monster alone will not solve this: each monster still publishes on every tick in the loop.

**Verify:** count prop submissions and compare UI callback intervals before/after with the
same measurement code. Test fractional frames, view switches, greeting blends, interrupted
greetings, and resume. Native SVG equality guards make the time saved uncertain; do not
translate the redundant-update percentage into an FPS or battery claim.

### 2. P2: The animation continues when the header scrolls off screen

Locations: `src/ui/HomeMonsters.tsx` (`focused`, `playing`) and
`src/ui/primitives.tsx:40` (`Page`'s ScrollView).

Route focus pauses the story when another route covers Home. It does not track whether
the header has scrolled outside Home's viewport. Home uses a ScrollView, keeps the monster
mounted, and passes no scroll visibility signal to the animation. The evaluator and prop
updaters therefore continue while the player browses below the header. Native clipping
does not cancel the worklet.

**Change to evaluate:** pause the callback when the complete animated drawing area leaves
the viewport; resume the saved machine when it returns. Update only on visibility boundary
crossings, without React state changes on every scroll frame. Account for the overflowing
drawing area, not just the small layout box. This extends the existing pause behavior and
needs a design note because the story currently continues while Home is scrolled.

**Verify:** after the scroll settles with all artwork out of view, scene evaluations and
prop submissions should be zero; returning must preserve the story and greet correctly.

### 3. P3: More than half the loop's channel sampling is redundant

Locations: `src/ui/homeMonsters.ts` (`evaluate`, `apply`, `sample`) and
`scripts/monsters/rig.py:116` (`timeline`).

Every loop samples all 225 channels, including 124 channels whose keys are constant and
identical to `runtime.storyEnd`. `evaluate()` has already copied those values before applying
the loop. These channels can be excluded from the runtime loop track without changing the
base pose. Keep authored data and greeting overlays intact.

The probe makes that change in a separate in-memory engine and compares 1,035,000 channel
values exactly against the original during deterministic half-frame playback with repeated
taps, through the complete story and loop. No mismatch occurred. This establishes an
equivalent numerical result for that replay, not a measured native speedup or exhaustive
coverage of every greeting sequence.

**Change to evaluate:** precompile the loop to its changing channels, keeping `storyEnd`
as its base. This reduces loop track sampling from 225 to 101 channels, without removing
channels from the rig or changing content IDs.

**Verify:** keep the replay comparison and existing interruption/loop-seam tests; include
both allowed greeting choices and fractional timestamps before adopting the optimization.

### 4. P3: Static fallback preparation and lifecycle swaps add startup/resume work

Locations: `src/ui/HomeMonsters.tsx` (module-level `stillMarkup`/`stillGreetings`,
the `Story`/`Still` conditional) and `src/ui/motion.ts` (`PartyMotionProvider`).

Importing the component builds five complete scene SVG strings eagerly, including every
still greeting. Their combined UTF-8 size is 552,487 bytes. That is retained markup payload,
not measured heap use. It happens before the app knows whether a still greeting is needed.

Foreground state and Reduce Motion are combined into one motion flag. Backgrounding thus
unmounts the live rig and mounts the static SVG; returning rebuilds the live rig and its
animated groups. The global machine preserves story progress correctly, but the renderer
still incurs mount work. This is a plausible source of return-to-app hitches, unmeasured
on the phone.

**Change to evaluate:** lazily prepare held greeting markup on the first relevant tap, and
separate “motion preference” from “currently running” so lifecycle pauses can retain the rig
without ticking. Preserve the static launch preference fallback, Reduce Motion behavior,
and story clock. Measure whether retaining native views is worth its memory cost.

**Verify:** compare initial readiness and foreground-resume timing, held greeting behavior,
and retained memory when a native profiler becomes available. Count mounts immediately;
do not assume retaining views always wins.

## Smaller items and rejected shortcuts

- The frame callback is inline. Reanimated registers it in an effect keyed by function
  identity, so renders recreate its registration. Memoize it with `useCallback` when touching
  this code; this affects rerenders, not the steady-state frame loop. The
  [maintainer's performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
  also recommends memoizing frame callbacks and limiting animated component count.
- Output arrays are allocated and zero-filled before `evaluate()` overwrites every slot.
  Reduce allocation only after measurement. Reusing a published array with `values.set()`
  can suppress notifications because Reanimated's `valueSetter` rejects the same reference;
  scratch-buffer reuse needs an intentional publication strategy.
- The data's 60 fps is a timebase, not a rendering cap. The
  [iPhone 13 Pro supports adaptive refresh up to 120 Hz](https://support.apple.com/en-us/111871).
  Record actual callback cadence first. A local 60 Hz animation cap is an optional later
  energy experiment requiring visual approval; do not globally cap the app or lose elapsed
  time when skipping evaluation ticks.
- No constant cubic segment was found among the sampled story/loop segments. An early return
  for equal cubic endpoints does not address the workload measured here.
- Rive is the adult's authoring/export source. The app runs its own TypeScript sampler and
  SVG renderer; changing a Rive runtime setting cannot optimize this implementation.
- Reanimated's fast-path feature flags for view styles are not established fixes for this
  SVG `matrix` prop. Avoid a dependency or renderer migration before a device comparison.

## Device baseline without a Mac

Use the existing `preview` EAS profile: it explicitly builds Release and does not use the
development client. The project command and installation steps are in
`docs/development/builds.md` in the While We Wait repository. React Native explicitly calls for
[release-build performance testing](https://reactnative.dev/docs/performance).

The next implementation should add temporary, preview-only counters in an isolated branch.
This review does not add them or start a cloud build. Use the same counters in both builds:

1. Aggregate UI callback intervals, evaluator durations, prop submissions, rig mounts, and
   ticks by route/viewport/lifecycle state. Keep bounded histograms on the UI thread and
   send one summary after each run; avoid per-frame logs, polling shared values from JS,
   and live counters that cause React renders.
2. Provide two diagnostic modes: the current live story and a frozen pose rendered with
   the same SVG tree. Keep the rest of Home, music, brightness and settings identical. A
   frozen mode gives an incremental workload comparison without introducing a different
   static renderer. Record instrumentation overhead separately.
3. Record iOS version, build SHA, battery/Low Power Mode, Reduce Motion, display frame-limit
   setting, and thermal conditions. Repeat each scenario three times after a warmup.
4. Capture the opening story, one minute of the loop, all monsters' greetings, scrolling the
   header fully away and back, opening/closing another route, and background/foreground.
   Repeat the animation scenarios with Reduce Motion enabled.

**Proposed acceptance targets, pending the first phone baseline:**

- Preserve current poses, timing, taps, loop seam, pause/resume and accessibility behavior.
- With motion disabled, another route focused, or the complete drawing outside the viewport,
  record zero recurring evaluator ticks and prop submissions after the transition settles.
- Reduce prop submissions in the untapped loop by at least 80% at the same measured callback
  cadence. This is a workload target, not an estimated frame-time improvement.
- For a 60 Hz cadence, target a 95th-percentile UI callback interval no greater than 18.3 ms
  and fewer than 1% of intervals over 25 ms, excluding deliberate pauses. If the baseline
  sustains 120 Hz, use 9.2 ms and 12.5 ms respectively and preserve that cadence initially.
  Adaptive refresh changes must be reported separately from delayed callbacks.
- Target the evaluator's 95th-percentile duration below 1 ms; compare full callback cadence
  and prop volume before deciding whether faster sampling matters in practice.

These interval targets are scheduling proxies, not display-presentation measurements.
Temporary worklet counters cannot measure native rendering completion, actual dropped display
frames, total CPU/GPU usage, energy, or retained native memory. Those remain unknown without
native tooling. Do not claim a battery or FPS gain from these counters alone.

## Reproduce and verification

Run from the repository root. The probe uses the installed TypeScript compiler only to load
the pure evaluator in memory; it does not import React Native or change application files.

```sh
mkdir -p /tmp/while-we-wait-monster-review-baseline
git archive 0550901321fea7261c539a969c5bdb2b1aa1e4f9 src/ui/homeMonsters.ts src/ui/homeMonsters.json src/ui/homeLime.json src/ui/homePear.json src/ui/homeTeen.json src/ui/homeSign.json | tar -x -C /tmp/while-we-wait-monster-review-baseline
node docs/reviews/2026-11-06-home-monster-performance/probe.cjs /tmp/while-we-wait-monster-review-baseline 0550901321fea7261c539a969c5bdb2b1aa1e4f9 > /tmp/home-monster-performance-replay.json
```

Operation counts are deterministic. Batch timings depend on the machine and runtime. The
probe also runs without arguments against the working tree. Keep the source hash and raw
results with every later comparison.

During review, the existing related tests passed: 16 suites, 389 tests, using
`npm run test:related -- src/ui/HomeMonsters.tsx src/ui/homeMonsters.ts src/ui/motion.ts --runInBand`.
They use Reanimated mocks and establish behavior coverage, not native performance. In
particular, the current frame-callback mock never advances frames, so the UI tests do not
establish scheduling, pause/resume or lifecycle performance. No pixels or production behavior
were changed by this review; a web screenshot run is not applicable.

Final verification: `npm run check:quick` passed typechecking, lint, and 8 affected suites
(261 tests) in the shared checkout, which includes the other session's renderer extraction
and title-lime work. A second pinned probe run matched every saved deterministic measurement
and repeated all 1,035,000 exact channel comparisons successfully.
