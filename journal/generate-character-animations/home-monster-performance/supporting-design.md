# Home monster performance improvement design

Direction approved in conversation on 2026-11-06: measure first, remove confirmed redundant
work, preserve the animation, and give a fresh agent an implementation handoff. The owner
tests on an iPhone 13 Pro and has no Mac/Xcode/Instruments. Architecture choices and numerical
targets below are planning decisions to verify, not measured device results.

## Inputs and current state

Read `AGENTS.md`, the Home animation section of `docs/design/design.md`, and
`docs/reviews/2026-11-06-home-monster-performance/README.md` with its probe and raw evidence.
The review measured commit `0550901`; this design inspected `a481810`. The renderer has moved
into `src/ui/MonsterParts.tsx` and is shared with the title lime. Another session is developing
that animation. Revalidate the receiving branch before implementation and preserve its work.

The native story already uses one Reanimated frame callback and pauses on route blur.
Its whole-scene publication wakes every animated part; each part creates a fresh matrix
array. The review established redundant submissions and constant loop sampling, but measured
neither their native cost nor battery impact. Node/V8 timing is not an iPhone baseline.

## Scope and constraints

- Keep Reanimated 4.5.1 and react-native-svg 15.15.4; add no dependencies.
- Preserve the current drawing, authored paths, fills, transforms, timing and tap hit testing.
- Preserve the once-per-launch story, saved clock, loop seam, greeting blends and interruptions.
- Preserve Reduce Motion, static web rendering, large-text hiding and VoiceOver exclusion.
- Keep domain transitions pure, with RNG/time passed in. Native effects live in adapters.
- Do not change content, persistence, purchases, identifiers, app configuration or build profiles.
- Preserve existing `Part` behavior for callers that do not opt into Home's optimized bindings.
- Diagnostics are available only under the existing development/preview gate; device comparisons use the preview Release build.
- Diagnostic results stay in memory, with no persistence, network, analytics, new permissions or automatic export.
- No production polling, per-frame logging or diagnostic overlay; no diagnostics branch may enable motion when the app normally disables it.
- Do not change the animation's render cadence or its elapsed-time/clamping rules.

## Measurement milestone

Build temporary tools into the existing Dev settings section. Let the owner arm a live or
frozen run, return to Home, stop it, and read selectable JSON afterward. Production and
unrecognized variants expose neither controls nor an operable diagnostic session. Start a
run only once Home is focused and its native motion preference has resolved. A frozen run
uses the same native SVG tree at the together pose; its machine does not advance.

Runs use isolated diagnostic machines owned by the native adapter for the run's lifetime,
surviving renderer unmounts; they neither reset nor replace the normal session's machines.
The adapter also owns the deadline, so opening Settings or switching Reduce Motion cannot
cancel completion. Story runs start at `START`, last 20 seconds; loop and interaction runs start at
`STORY_FRAMES`, last 60 seconds. A shared profile accumulator aggregates on the UI thread;
one asynchronous transfer returns the summary after stopping. No JS polling is needed.
The sampling heartbeat in frozen mode is diagnostic overhead, not an animation evaluation.

Record callback interval/evaluator duration histograms, evaluator ticks, rig mounts, and
application SVG update requests. Bound histogram storage: 1,001 bins at 0.1 ms, with bin
1,000 representing overflow at 100 ms. Report percentile upper bounds and overflow counts.
Exclude the null first interval after every callback activation, not arbitrary long samples.
Measure pause/resume separately so deliberate pauses do not masquerade as hitches.

Baseline SVG request volume is explicitly **derived** from mounted animated parts × scene
publications: current code creates fresh props for each subscriber. After optimization,
count actual per-part shared-value publications. Label those counts **counted**; neither
count is a native paint/presentation measurement. Never write telemetry from animated-prop
updaters or read telemetry inside their dependencies, which could create feedback loops.

Each summary identifies the build SHA supplied by the tester, iOS version, scenario, mode,
duration, instrumentation state, counts, histogram metadata and whether request counts were
derived or counted. The tester records Low Power Mode, frame-limit setting, brightness,
music, Reduce Motion and thermal conditions alongside the summary.
Accept the build's 7–40 hexadecimal SHA characters once in the diagnostic controls and
remember that input in memory for subsequent runs. Read the iOS version from `Platform.Version`.
Also measure mean/max recorder bookkeeping duration; this bounds part of the observer cost,
not all effects of enabling instrumentation. Keep those limits explicit in the results.

The implementing agent builds the first instrumented preview and gives the owner its install
link plus a short run sheet. Collect three comparable repetitions of live/frozen loop,
opening story, greetings, and focus/lifecycle interactions. Observe scrolling the header
fully away as well. Save the received non-identifying summaries and conditions beside the
review as `device-baseline.json`; do not create invented measurements or an empty results file.

**Gate:** until the owner returns those summaries, Tasks 2–3 may have tests prepared in an
isolated worktree, but no optimization is adopted or presented as verified. Report exactly
what is waiting for device input. A fresh agent can resume from the committed diagnostic
milestone. Lack of a Mac does not prevent collecting these application-side measurements.

## Proposed implementation choices

1. **Home publishes only changed parts.** Compile descriptors for the currently mounted
   animated nodes, respecting the existing fixed-Solo pruning and dynamic-Solo selection.
   Give each animated Home part its own published value. In the existing story callback,
   evaluate the scene, reconcile local transforms/visibility, and publish only changed
   values. Its animated-prop updater reads only its own published value. This avoids adding
   a reaction worklet per part and keeps all mutable writes outside animated-prop updaters.
   Exact equality preserves the existing numbers; no epsilon, rounding or quantization.
2. **Hidden branches remain fresh on reveal.** Ancestor visibility checks use opacity ≤ 0
   and Solo selection. Hidden parts publish opacity zero once, then keep their cached
   transform. On reveal, publish the current transform before exposing the branch. Do not
   multiply ancestor opacity into local opacity: SVG already composites it.
3. **Compile the Home loop sparsely.** Exclude a loop channel only when every key equals its
   `storyEnd` baseline. Keep the complete channel index/defaults, original JSON and greeting
   tracks. The existing `evaluate()` base copy supplies omitted values. Never apply this
   rule globally to `trackOf()`, which the title lime also uses.

The per-part publishing pass is a planner's architecture choice, not a proven native speedup.
Measure its additional callback work as well as the submissions it removes. Keep the two
optimizations in independently reversible commits and compare each against the same baseline.

## Acceptance and decision rules

- Numerical parity includes fractional frames, both greeting choices, interrupted blends,
  hidden-to-visible switches, negative scale, partial opacity and multiple loops.
- Untapped loop application SVG requests per evaluator tick decrease by at least 80% at the same observed cadence.
- Evaluator duration p95 upper bound is below 1 ms; report publishing duration separately.
- At a stable 60 Hz cadence, callback interval p95 is at most 18.3 ms and fewer than 1% exceed 25 ms.
- At a stable 120 Hz cadence, callback interval p95 is at most 9.2 ms and fewer than 1% exceed 12.5 ms.
- Compare matching stable-cadence runs separately; ambiguous mixed-cadence runs are inconclusive, not proof of dropped frames.
- Route blur, backgrounding and Reduce Motion produce zero recurring evaluator ticks after settling; null resume intervals are excluded.
- Preserve visual and interaction behavior on the iPhone; normal Home/web screenshots have no predicted changes.

These are proposed engineering targets. If the original build already misses a timing target,
show the measured baseline and change; do not call a lower cadence an optimization or keep
adding changes blindly. Reject a candidate if it regresses visible behavior or repeatably
misses a timing gate that the paired baseline passes. If measurements cannot distinguish a
change from noise, describe a verified workload reduction only, not an FPS/CPU/battery gain.

## Conditional and deferred work

| Finding | Decision for this plan |
| --- | --- |
| Header continues while scrolled away | Measure and report it. Pausing would change which story moment is seen on return; require an explicit follow-up decision and a focused spec before altering it. |
| Eager held-greeting SVG strings | Defer until startup/resume measurement establishes a meaningful cost. |
| Background swaps live/static renderers | Defer: retaining the rig changes shared motion/lifecycle behavior and has an unmeasured memory tradeoff. |
| Frame-callback registration on rerender | Memoize the existing callback while touching it; verify no clock reset or duplicate registration. |
| Reusing published output buffers | Excluded: same-reference publication can suppress updates. |
| Renderer replacement, Skia/Rive runtime, dependencies, flags or 60 Hz cap | Excluded without a measured reason and a separate approved design. |

## Completion and reporting

The handoff includes baseline and candidate SHAs, raw summaries, conditions, parity results,
layout checks and a decision for every scope item above. Diagnostic controls remain under
the existing development/preview gate for reproducibility; production must do no diagnostic
sampling. The implementing agent asks the owner to confirm native visual feel after each
candidate. True native presentation timing, CPU/GPU, energy and retained memory remain
unknown without suitable native tooling. Do not describe callback intervals as displayed FPS.
