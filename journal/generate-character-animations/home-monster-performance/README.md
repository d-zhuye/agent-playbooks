# Home monster performance: While We Wait

Archived 2026-11-06 as context for a future generate-character-animations playbook.
Project: `/home/zhu-ye-deng/while-we-wait`.

## Read in this order

1. [Full performance review](review.md): the rendering path, prioritized findings, measured facts, rejected hypotheses, device limits and proposed acceptance targets.
2. [Recorded measurements](baseline.json): deterministic counts and Node/V8 timing batches, pinned to the original review revision.
3. [Reproducible measurement probe](probe.cjs): loads the real pure evaluator and tests an isolated constant-channel omission with exact channel comparisons.
4. [Supporting design](supporting-design.md): approved direction, preserved behavior, planner decisions, measurement gate, acceptance rules and deferred work.
5. [Implementation plan](implementation-plan.md): receiving-agent setup, exact interfaces, test cycles, commits, owner device steps and rollback rules.
6. [Implementation results](implementation-results.md) (2026-11-07): what was built, workload results, what failed, and the device runs still pending.

[Provenance and file checksums](provenance.json) record the original project paths and any
archive-only link adjustment. The full project copies are retained for the implementing agent.

## What this evidence establishes

The review identified redundant work in the actual state-machine/SVG path. The raw timing
results came from Node/V8 on Linux; they are not Hermes/iPhone benchmarks. The exact replay
establishes numerical equivalence for the recorded scenarios, not a proven native speedup.

The owner's reference device is an iPhone 13 Pro, with no Mac/Xcode/Instruments available.
The implementation plan therefore starts with an instrumented EAS preview Release build and
owner-operated captures. Native device baseline/candidate results have not been collected,
and the planned optimizations have not been implemented by this review. No CPU, GPU, battery
or displayed-FPS improvement is claimed.

## Using the snapshot

Code and `docs/...` paths inside these documents refer to the While We Wait repository.
Run the review's reproduction commands from that checkout, using its pinned dependencies
and the stated baseline revision. The probe can also be run from that checkout with the
absolute path to this archived `probe.cjs` and the same snapshot-directory/SHA arguments.

The historical review baseline predates the shared-renderer extraction. The later plan
revalidates the shared renderer and keeps the title-lime caller compatible. Revalidate
against current code before applying either document; do not turn every review hypothesis
into mandatory implementation work.

## For the eventual playbook

Carry forward the distinction between code-proven redundant work and unmeasured device
impact, the need to inspect the actual engine and dependency graph, numerical/visual parity
across hidden views and interrupted gestures, and a self-contained implementation handoff.
Add actual device results and what failed before presenting these proposed optimizations as
a validated recipe.
