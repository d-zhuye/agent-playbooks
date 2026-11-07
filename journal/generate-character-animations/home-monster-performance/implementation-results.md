# Implementation results: While We Wait Home monsters, 2026-11-07

- Seen: 2026-11-07, while-we-wait (branch `home-monster-performance`, base `fd47736`)
- What happened: the planned measure-first pass was implemented on top of the shared
  `MonsterParts` renderer. At the owner's request the optimizations went in before the baseline
  device run; the per-optimization builds were folded into one baseline build (`a722d02`) and
  one candidate build (`987631c`, both optimizations).
- Status: workload reduction verified in Jest and the probe; **device results pending**.

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

## For the eventual playbook

Separate code-proven workload cuts from device results; time through the framework's deferred
update phase; build a faithful frame harness before claiming pause/resume behavior; give the
tester one copyable session dump and a run sheet. Add the paired device numbers here before
treating per-part publication as a validated recipe.
