# Implementation results: While We Wait Home monsters, 2026-11-07

- Seen: 2026-11-07, while-we-wait (branch `home-monster-performance`, base `fd47736`)
- What happened: the planned measure-first pass was implemented on top of the shared
  `MonsterParts` renderer. At the owner's request the optimizations went in before the baseline
  device run; the per-optimization builds were folded into one baseline build (`a722d02`) and
  one candidate build (`987631c`, both optimizations).
- Status: workload reduction verified; paired iPhone 13 Pro captures received 2026-11-07 (below).

## Results without a device (application workload, not device timing)

| Measure | Before | After |
| --- | ---: | ---: |
| Part prop publications per untapped loop tick (60 Hz steps) | 158 (derived) | 6.51 (95.9% fewer) |
| Part prop publications per story tick | 158 (derived) | 14.53 (90.8% fewer) |
| Loop channels sampled per tick (cast) | 225 | 101 |
| Exact parity, half-frame replays with taps, random 0/0.5/0.999 | — | 0 mismatches |

## Tried

- Revalidated the review against the current code before touching it (probe rerun) → worked:
  every count still held after the renderer extraction, so the plan needed no re-scoping.
- One published frame per animated part, reconciled children-first with exact comparison;
  same numbers keep the same frame, opacity-only changes keep the same matrix, hidden branches
  publish opacity 0 once → worked: exact parity with the original drawn output, 95.9% fewer
  publications. Callers without bindings (the title lime) keep the original path.
- Compile loop channels that only hold the story-end pose away → worked: exact parity. The
  data had no constant channel *away* from its baseline, so replays could not tell a wrong
  rule from the right one; a hand-built fixture pins the rule.
- Timing publishing around `.set()` only → would have missed the work being removed:
  Reanimated 4.5.1 runs mappers (every part's prop updater) in a microtask after the set. The
  capture times until a microtask queued after the publication.
- Reanimated's stock Jest mock → insufficient: `useFrameCallback` is absent (projects stub it
  as never-running) and `useSharedValue` returns a fresh, reset proxy on every render, which
  hides re-registration bugs. A controlled harness mirroring 4.5.1's registry (null first
  interval per activation, active state kept across re-registration) made scheduling,
  memoization and pause/resume testable.
- The Worklets Jest mock is asynchronous (`scheduleOnUI` = `setTimeout(0)`, `scheduleOnRN` =
  microtask); under fake timers a zero-delay timeout created inside a tick fires 1 ms later.
- Plan named `x.ts` and `x.native.ts` as different modules → collision: Metro and jest-expo/ios
  resolve `./x` to the `.native` file. Renamed the adapter.
- Mutation checks on tests that passed before their feature existed caught one fixture that
  could not fail (float rounding needs a timestamp difference, not a decimal literal).

## Device results (iPhone 13 Pro, iOS 27.0.1, 3 runs per scenario per build)

| Scenario | Callbacks/s A → B | Over 25 ms A → B |
| --- | --- | --- |
| Loop, live | 31.1 → 35.2 | 97.6% → 78.2% |
| Story, live | 34.3 → 35.9 | 82.5% → 73.6% |
| Interaction, live | 31.2 → 38.8 | 98.9% → 64.0% |
| Loop, frozen (same tree, nothing moving) | 119.9 → 119.9 | 0% → 0% |

- Seen: 2026-11-07, while-we-wait — the real cost was not where the review looked. Evaluator
  p95 0.3–0.5 ms and publishing p95 0.1–0.3 ms, yet live callbacks ran every 3–5 vsyncs;
  frozen ran at 120 Hz. The cost is native (prop commit plus react-native-svg redrawing the
  whole canvas when anything changes), so it follows the drawing, not the changed-part count.
- Tried: cutting SVG prop requests 92–96% → partly: cadence improved 5–24%, nowhere near 60 or
  120 Hz; both builds miss the timing targets.
- Tried: the candidate bundled both optimizations in one build to save a round trip → it added
  a repeatable 60–69 ms interval about every 15 s (the loop length) that can't be attributed to
  either change. Keep one build per optimization when a regression is possible.
- Tried: reading battery percentages across back-to-back sessions → no conclusion (order, warm
  phone, unrecorded session lengths, coarse percentages).
- Frozen mode (same native tree, no motion) was the most useful diagnostic: it split the
  mounted-tree cost from the per-frame cost in one comparison, without native tools.

## For the eventual playbook

Separate code-proven workload cuts from device results; time through the framework's deferred
update phase; build a faithful frame harness before claiming pause/resume behavior; give the
tester one copyable session dump and a run sheet. Per-part publication is a verified workload cut but only a modest device gain under a
whole-canvas SVG renderer; measure the frozen-versus-live gap before optimizing JavaScript.
