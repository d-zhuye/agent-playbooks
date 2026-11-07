# Home Monster Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Measure Home's animation on the owner's iPhone 13 Pro and remove confirmed redundant work while preserving its behavior.

**Architecture:** Keep the current state machine and SVG artwork. Establish an instrumented Release baseline, then make Home's existing UI callback publish per-part values only when they change and compile constant loop channels away. Keep generic `Part` consumers compatible and make larger changes conditional on evidence.

**Tech Stack:** Existing TypeScript, Expo Router, React Native, Reanimated 4.5.1, react-native-svg 15.15.4, Jest and EAS preview Release; no added packages.

**Spec:** `docs/superpowers/specs/2026-11-06-home-monster-performance-design.md`. Also read `docs/design/design.md` and `docs/reviews/2026-11-06-home-monster-performance/README.md` with its evidence.

## Global Constraints

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

## Review Focus

- Hidden or mirrored branches reappear at the current pose without stale limbs or compounded opacity: Task 2 parity/reveal tests.
- Route blur, foreground changes and repeated renders do not advance a paused clock or duplicate callbacks: Task 1 controlled callback tests and device run sheet.
- A greeting interrupted at a fractional story boundary preserves its outgoing influence: Task 3 original-versus-compiled replays.
- Production, unknown variants and unresolved motion preferences cannot start diagnostic motion: Task 1 gating tests.
- Shared-renderer/title-lime work arriving from another session retains its default behavior: Task 2 opt-in compatibility test and final related tests.

---

## Receiving-agent setup and file map

The author inspected commit `a481810`; another session is editing title-lime assets/tests.
Read `git status --short` and current commits first. Use `superpowers:using-git-worktrees`
before implementation; do not stash, reset or commit another session's work. Carry this
plan, its spec and the currently untracked review folder into the implementation branch
explicitly, preserving the review's pinned evidence. Revalidate the current renderer and
public signatures; record the chosen baseline SHA in the device evidence.

| File | Responsibility |
| --- | --- |
| `src/ui/homeMonsterProfile.ts` (new) | Pure bounded histograms, run metadata and summaries. |
| `src/ui/homeMonsterProfile.native.ts` (new) | Gated in-memory run commands, UI accumulator, summary transfer and React subscription. |
| `src/components/HomeMonsterProfileControls.tsx` (new) | Dev settings controls; no controls or live overlay on Home. |
| `src/components/SettingsScreen.tsx` | Mount diagnostic controls inside existing `DevSettings`. |
| `src/ui/HomeMonsters.tsx` | Isolated diagnostic machines, instrumentation, stable callback and changed-part publication. |
| `src/ui/homeMonsterParts.ts` (new) | Pure mounted-node descriptors and exact part-frame reconciliation. |
| `src/ui/MonsterParts.tsx` | Optional per-part bindings; retain original default path for other callers. |
| `src/ui/homeMonsters.ts` | Home-only sparse loop compilation after `storyEnd` is known. |
| Adjacent `*.test.ts`/`*.test.tsx` | Meaningful logic tests and a controlled native-hook harness. |
| `docs/reviews/2026-11-06-home-monster-performance/device-*.json` | Actual returned device summaries, never fabricated placeholders. |

Implementation tasks are sequential. The next agent owns implementation; this planning
session changes documents only. Each task's interfaces include the global constraints.

### Task 1: Instrumented baseline and device gate

**Files:** Create `src/ui/homeMonsterProfile.ts`, `src/ui/homeMonsterProfile.native.ts`,
`src/components/HomeMonsterProfileControls.tsx` and their adjacent tests. Modify
`src/ui/HomeMonsters.tsx`, `src/ui/HomeMonsters.test.tsx`, `src/components/SettingsScreen.tsx`.
Extend `test/setup-ui.ts` only if necessary; prefer a test-local controlled frame-callback mock.
Document the run sheet in the existing review README.

**Interfaces:**
- Consumes: `devSettingsEnabled`, `usePartyMotion()`, `START`, `STORY_FRAMES`, `Machine`, `scene()`, `step()` and `evaluate()` as currently exported.
- Produces in `homeMonsterProfile.ts`: `ProfileMode = 'live' | 'frozen'`; `ProfileScenario = 'story' | 'loop' | 'interaction'`; `ProfileRequest = { id: number; mode: ProfileMode; scenario: ProfileScenario; buildSha: string; iosVersion: string }`.
- Produces `ProfileAccumulator` with bounded interval/evaluator/publishing histograms, `evaluatorTicks`, `rigMounts`, `propRequests`, `requestSource: 'derived' | 'counted'`, and elapsed/pause bookkeeping. `ProfileSummary` exposes `intervalSamples`, `intervalP95Ms`, `intervalOverflow`, `histogramBinCount`, `evaluatorTicks`, `propRequests`, the other histogram summaries, request metadata and recorder bookkeeping mean/max duration. Use numeric fields for counts/milliseconds, `number[]` for the 1,001-bin histograms and nullable percentiles for empty histograms.
- Pure API: `createProfile(request: ProfileRequest): ProfileAccumulator`, `recordFrame(state: ProfileAccumulator, intervalMs: number | null, evaluatorMs: number | null, publishingMs: number | null, propRequests: number): ProfileAccumulator`, `summarizeProfile(state: ProfileAccumulator): ProfileSummary`. Frame recording may mutate its exclusively owned accumulator and returns it; no frame history arrays.
- Native API: `startHomeProfile(mode: ProfileMode, scenario: ProfileScenario, buildSha: string): void`, `stopHomeProfile(): void`, `useHomeProfile(): { request: ProfileRequest | null; summary: ProfileSummary | null; machines: SharedValue<Machine[]> | null }`; `HomeMonsterProfileControls(): ReactElement | null` (import `ReactElement` from React).
- A single native adapter owns UI shared state, run-scoped diagnostic machines and the completion deadline; machines/deadline survive `Story` unmounts and dispose when the run ends. Start the deadline when the first eligible Home frame starts the capture. UI→RN completion uses `scheduleOnRN` with a callback declared on the RN runtime. No app persistence or providers are added.

- [ ] **Step 1: Write the failing metric/gate tests.** Pin histogram bounds and null-resume handling with these assertions; add tests that disabled/unknown builds leave `request` null and return no controls even on direct invocation.

  ```ts
  const state = createProfile({
    id: 1, mode: 'live', scenario: 'loop', buildSha: 'a481810', iosVersion: 'test',
  });
  recordFrame(state, null, 0.4, null, 158);
  recordFrame(state, 16.6, 0.4, null, 158);
  // summarizeProfile exposes intervalSamples, intervalP95Ms, intervalOverflow,
  // evaluatorTicks, propRequests and histogramBinCount in addition to metadata.
  expect(summarizeProfile(state)).toMatchObject({
    intervalSamples: 1, evaluatorTicks: 2, propRequests: 316,
    intervalP95Ms: 16.6, intervalOverflow: 0, histogramBinCount: 1001,
  });
  ```

  Record 100,000 additional intervals including a 101 ms interval; assert every histogram
  still has exactly 1,001 bins and overflow increments. Count a frozen heartbeat with null
  evaluator duration as zero evaluator ticks. No interval is dropped just for being long.

- [ ] **Step 2: Run the new tests and confirm the missing-module/API failure.**
  Run `npm run test:related -- src/ui/homeMonsterProfile.test.ts src/ui/homeMonsterProfile.native.test.tsx src/components/HomeMonsterProfileControls.test.tsx --runInBand`.
- [ ] **Step 3: Implement the interfaces and diagnostic controls.** Use the spec's exact run durations and gates. Controls accept the 7–40-character build SHA once per process, arm live/frozen story, loop or interaction capture and return to `/`; stopping shows selectable JSON in Dev settings. Disable arming until the SHA is valid; the adapter fills iOS version from `Platform.Version`. `Story` borrows the adapter's run-scoped machines initialized for the scenario; normal module-level machines are untouched. Frozen mode renders the same SVG tree at `STORY_FRAMES` without stepping it. Disable diagnostic requests while motion is unavailable. Use the existing frame callback as the only measurement heartbeat, aggregate with an exclusively owned UI accumulator, and flush once at stop. Measure recorder mean/max duration around bookkeeping, labeled as partial observer cost. Label baseline request count as derived from the mounted animated-node inventory, not measured native updates. Timer completion must not manufacture frames while backgrounded.
- [ ] **Step 4: Add controlled scheduling tests.** The test-local `useFrameCallback` stub must retain the callback and active state and invoke it only while active. Drive a 16.667 ms frame, route blur, background, foreground, Reduce Motion and repeated rerenders. Assert the global story clock is unchanged by diagnostics; diagnostic machines preserve their clock across `Story` unmount/remount; opening Settings or toggling Reduce Motion does not cancel delivery of the summary; no evaluator call while inactive; no diagnostic start before preferences resolve; no duplicate registration; no elapsed catch-up after a null resume interval. Mock `useFocusEffect` with a manually driven focus subscription, not the current always-focused stub. Memoize the existing callback with `useCallback` and explicitly mark its body `'worklet';`.
- [ ] **Step 5: Verify and commit the diagnostic milestone.** Run `npm run test:related -- src/ui/HomeMonsters.tsx src/ui/homeMonsterProfile.ts src/ui/homeMonsterProfile.native.ts src/components/HomeMonsterProfileControls.tsx src/components/SettingsScreen.tsx --runInBand`, then `npm run check:quick`. Expected: all pass; no production controls or sampling. Commit only this task's files and run sheet with `git commit -m "Home monsters: add gated performance capture"`; stage explicit paths, including tests, before committing.
- [ ] **Step 6: Build and deliver the baseline.** First name expected screenshot changes: development/preview Settings controls and their report state only; Home unchanged. Follow `docs/development/web-preview.md`, run the targeted Settings web check, inspect each new image, approve only predicted changes, then finish on a clean full `npm run web:check`. Commit required baselines. Run `npm run build:preview` using the project wrapper; obtain the actual build/install URL with `npm run eas -- build:list`. Give the owner the URL, baseline SHA and concise run sheet. No production build or submission.
- [ ] **Step 7: Apply the device gate.** Owner runs the spec's three-repetition comparisons and returns the selectable summaries plus conditions. Save actual results to `device-baseline.json`, with each summary associated with its build SHA and scenario. Check frozen mode has zero evaluator ticks, normal focus/background/Reduce Motion pauses work, request counts are labeled derived, and observed cadence is recorded. If input is pending, hand off the committed diagnostic milestone and precise remaining device steps; do not invent a baseline or proceed to adopt optimizations. Preparation of Tasks 2–3 tests in isolation is independent work.

### Task 2: Home publishes only changed part frames

**Files:** Create `src/ui/homeMonsterParts.ts`, `src/ui/homeMonsterParts.test.ts`,
`src/ui/MonsterParts.test.tsx`. Modify `src/ui/MonsterParts.tsx`,
`src/ui/HomeMonsters.tsx` and its controlled tests. Do not change title-lime assets or machine.

**Interfaces:**
- Consumes: Task 1 profiling and current `Drawable`, `RigNode`, `TRANSFORM`, `matrix()`.
- Produces pure types `Matrix = [number, number, number, number, number, number]`, `PartFrame = { pose: [number, number, number, number, number, number]; matrix: Matrix; opacity: number }`, and `PartDefinition = { key: string; which: number; slots: [number, number, number, number, number, number]; base: [number, number, number, number, number, number]; visibility: { opacitySlot: number; opacityBase: number; soloSlot: number; soloIndex: number }[] }`. Pose/slot order is `TRANSFORM`; a slot of `-1` uses its base. Visibility predicates include the node and its ancestors; a Solo slot of `-1` imposes no selection test.
- Pure API: `compileHomeParts(monsters: readonly Monster[]): PartDefinition[]`; `resolvePartFrame(definition: PartDefinition, scene: number[][], previous: PartFrame | null): PartFrame`. Keys are `${monster.name}/${node.id}`. Preserve fixed-Solo pruning; emit only nodes currently classified as animated by `Part`.
- In `MonsterParts.tsx`, export `PartBinding = { initial: PartFrame; value: SharedValue<PartFrame> }` and `PartBindings = Readonly<Record<string, PartBinding>>`. Add optional `bindings?: PartBindings` to `Part`'s existing props; continue exporting `Matrix` for existing callers.
- Bound animated parts read only their binding in `useAnimatedProps`. `HomeMonsters` creates bindings once from the initial scene, reconciles after evaluating each frame, publishes only changed references and records the number of `.set()` requests as counted. Keep `values` for hit testing; preserve its fresh-array publication contract.

- [ ] **Step 1: Write failing reconciliation tests.** `same numeric pose returns the previous frame` asserts `resolvePartFrame(def, unchangedScene, previous) === previous`; opacity-only changes retain `previous.matrix` identity. A changed transform returns a fresh frame and the exact existing `matrix()` result. Add fixtures for negative scale, partial ancestor opacity, fixed/dynamic Solo selection, nested opacity zero, and hidden→visible transitions. While hidden, repeat pose changes must return the same zero-opacity frame; revealing must return the current transform without multiplying ancestor alpha.
- [ ] **Step 2: Run `npm run test:related -- src/ui/homeMonsterParts.test.ts --runInBand`.** Expected: FAIL because the new helper is missing.
- [ ] **Step 3: Implement the pure descriptor/reconciliation interfaces.** Walk the mounted tree in child-before-parent order so updated child poses are ready before a parent becomes visible. Compare exact local values and selection predicates before allocating matrices. A hidden frame caches its last transform and publishes opacity zero only on entry. Do not prune runtime channel evaluation or unmount hidden nodes in this task.
- [ ] **Step 4: Write binding integration tests, then opt Home into the bindings.** Capture animated-prop updater functions with a test-local mock and drive the Task 1 controlled callback. Assert unchanged scene ticks publish no part values; changed parts publish independently; revealing a parent publishes descendants' current poses before the parent; hit testing still uses the complete current scene. Render `Part` without bindings and assert its legacy transform/Solo output is unchanged. Missing expected Home bindings fail clearly during initialization rather than silently mixing renderer paths. The production updater only reads its own binding and never writes shared values or telemetry. Initialize native props from `binding.initial` without repeated JS reads of UI values.
- [ ] **Step 5: Verify all authored states and the workload target.** Extend the existing review probe or add a focused pure replay that compares local matrix/opacity output with the original renderer over the full story and two loops at 0.5-frame increments, with random inputs `0`, `0.5`, `0.999` and repeated taps. Include the existing interrupted-greeting cases. Compute application requests per tick; target at least 80% fewer in the untapped loop. Run `npm run test:related -- src/ui/homeMonsterParts.ts src/ui/MonsterParts.tsx src/ui/HomeMonsters.tsx src/ui/titleLime.ts --runInBand`. Expected: numerical parity and no shared-consumer regressions.
- [ ] **Step 6: Commit and obtain the paired device result.** Run `npm run check:quick`; commit explicit task files with `git commit -m "Home monsters: publish only changed SVG parts"`. Build a new preview and repeat the Task 1 run sheet under matching conditions. Save actual summaries as `device-parts.json`. Compare evaluator and publishing cost separately, normalized requests/tick and stable-cadence intervals. Keep the candidate only under the spec's acceptance rules; otherwise revert this isolated commit through a normal follow-up commit and document why. Do not claim native paint, CPU or battery savings from publication counts.

### Task 3: Remove redundant Home loop track sampling

**Files:** Modify `src/ui/homeMonsters.ts`, `src/ui/homeMonsters.test.ts`; use the
existing review probe for an additional pinned comparison. No JSON or generator edits.

**Interfaces:**
- Consumes: existing `Track`, `Runtime.storyEnd`, `trackOf()` and Task 1 measurements.
- Produces `omitBaselineChannels(track: Track, base: readonly number[]): Track`, called only when constructing a Home monster after `storyEnd` is calculated. The helper preserves duration, retained slot order and keys, and never mutates its inputs. `Runtime`, `evaluate()`, `apply()` and `trackOf()` keep their public contracts.

- [ ] **Step 1: Write failing tests.** With a fixture containing a channel constant at its base, a channel constant away from its base and a changing channel, assert only the first is omitted; inputs remain deeply equal to their pre-call copies and duration is preserved. In a full replay, reconstruct the unoptimized loop with `trackOf(who.index, raw.timelines[raw.story.loop])` from each original JSON and compare `evaluate()` against the compiled runtime. Use 0.5-frame steps through story plus two loops, random inputs `0`, `0.5`, `0.999`, repeated taps and every existing fractional interruption case. Assert exact channel equality and unchanged discrete Solo switches.
- [ ] **Step 2: Run `npm run test:related -- src/ui/homeMonsters.test.ts --runInBand`.** Expected: FAIL for missing helper or retained redundant channel.
- [ ] **Step 3: Implement the compile-time helper and Home-only call.** Omit only when every key value equals `base[slot]`; do not remove global channel identities, mutate authored keys or modify shared `trackOf()` behavior. Original base copying and greeting mixing supply the same complete output.
- [ ] **Step 4: Verify and commit.** Run `npm run test:related -- src/ui/homeMonsters.ts src/ui/titleLime.ts --runInBand`, the review probe and `npm run check:quick`. Expected: exact replay parity, fewer loop samples and unchanged title-lime behavior. Commit explicit task files with `git commit -m "Home monsters: compile constant loop channels away"`.
- [ ] **Step 5: Obtain the paired device result.** Build the candidate preview, repeat comparable loop/greeting runs and save `device-loop.json`. Report sampling reduction separately from native timing. Apply the same regression/rollback rule as Task 2; a verified operation reduction with inconclusive timing is labeled precisely and does not justify further engine changes.

### Task 4: Verify the final branch and hand back the evidence

**Files:** Update the existing review README with evidence links and measured decisions;
update `docs/design/design.md` only to describe adopted implementation intent and point to
the relevant code. Do not copy control text or measured counters into product design docs.

**Interfaces:** Consumes Tasks 1–3's committed code and actual device summaries; produces a
reviewable branch, a short results table keyed by SHA and a clear list of deferred work.

- [ ] **Step 1: Check the five Review Focus cases against their owning tests and received device runs.** Run the relevant tests once for the final code; use `npm run check:quick` before hand-back. Run full `npm run check`, `npx expo install --check` and `npm run export:ios` only if scope changed into foundation/config/dependency work, per `AGENTS.md`. Never skip hooks.
- [ ] **Step 2: Validate pixels and native feel.** Predict no normal Home or title-lime screenshot changes. For the complete change set, follow the web-preview procedure, inspect generated images, approve only the diagnostic Settings changes, then finish with a clean full `npm run web:check`. No `--decks` run is needed because prompt cards are untouched. Have the owner check greetings, all turns/limbs, the loop seam, scroll/tap behavior, route return, background/foreground, Reduce Motion and large text on the iPhone. Treat this as a required native check, not something web/Jest establishes.
- [ ] **Step 3: Write the results and close the scope.** Compare baseline/parts/loop summaries by scenario and matching stable-cadence run; mark ambiguous mixed-cadence runs inconclusive. Mark every target passed, missed or unmeasured; include histogram approximation, recorder bookkeeping cost and remaining observer effects. For viewport pause, eager greeting markup, retained-rig lifecycle changes, renderer migration and refresh caps, record “deferred” with the relevant evidence or missing measurement; do not silently implement them. A failing original timing target is reported honestly alongside any improvement.
- [ ] **Step 4: Commit task-owned documentation/screenshots and deliver the handoff.** Use `git commit -m "Home monsters: record device performance results"` after staging explicit paths. Give the owner the final preview URL, actual changes, tests, paired results and remaining limits. Add/publish the required playbook outcome using the exact commands in `AGENTS.md`. No merge, production submission or deployment is included in this plan.

## References and planning review

Use installed package source as the implementation reference. The public
[Reanimated reaction documentation](https://docs.swmansion.com/react-native-reanimated/docs/advanced/useAnimatedReaction/)
supports separation of read inputs and writes if another approach is proposed; this plan
deliberately uses the existing frame publisher. The installed Worklets package exports
[`scheduleOnRN`](https://docs.swmansion.com/react-native-worklets/docs/threading/scheduleOnRN/);
callbacks passed to it must be defined on the RN runtime. Check the pinned version rather
than assuming newer documentation describes additional available APIs.

Self-review completed against the spec: baseline/gate → Task 1; changed-part publishing and
shared-consumer safety → Task 2; sparse Home loop and greeting parity → Task 3; phone/layout
acceptance and deferred scope → Task 4. All five Review Focus items have an owning test step.
Signatures above are the handoff contracts; any receiving-branch change requires updating the
affected task before implementation, not guessing from the historical review line numbers.
