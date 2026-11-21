# <Feature>: rolling-wave plan

Design: <path to the agreed design> · Branch: <branch> · Base: <short hash of HEAD before the first commit> · Started: <yyyy-mm-dd>

`[x]` done · `[~]` in progress · `[ ]` to do · `[-]` dropped (reason in the Log)
Stages go rough → next → detailed → done, one detailed at a time.
Done stages record `Commit: <hash>` beneath their heading.
**Stop** (rare): what is below it waits for the owner's answer · **Look:** the owner checks when free, and work goes on

## Intent

- **Purpose:** <who this is for and why it exists, in one sentence>
- **End state:** <what is true when it is done, put the way the owner would check it>
- **Fixed:** <promises and limits from the design that no route may break>
- **Open:** <unknowns the build has to answer>

## Stages

### 1. <Stage name> · detailed

Goal: <one sentence>

- [ ] <one outcome a check can confirm> (checked by <command or look>, when not obvious)
- [ ] <one outcome>
- Risk: <what could derail this stage, and its first sign>
- [ ] **Look:** <what the owner sees, and where>

### 2. <Stage name> · next

- [ ] <outcome>
- [ ] <outcome>

### 3. <Stage name> · rough

- <one line: what this stage delivers>

### 4. <Stage name> · rough

- <one line>
- [ ] **Stop:** <the owner's decision, such as merge or publish>
- <the one-way step the Stop guards>

## Final review

- [ ] Independent review of the full build against the design and Intent, including missing requirements and likely failure cases
- Reviewer and result: <who reviewed, findings and their resolution; deferred items go in the Log>

## Log

- <yyyy-mm-dd>: <what changed in the route or the plan, and why>

## Owner tasks

- [ ] <what only the owner can do, and which bullet needs it>
