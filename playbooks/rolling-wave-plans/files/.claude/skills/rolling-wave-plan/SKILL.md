---
name: rolling-wave-plan
description: Rolling-wave plan for a build. Use when a design is agreed and building is about to start, in place of writing-plans, or when resuming a build that already has one.
---

Plan the build as a rolling wave: the stage in front of you in detail, the next one as a list of
outcomes, every later one as a single line. Each stage gets its detail when it starts, from what
the earlier stages taught. The agreed design says what to build, and the plan's Intent is the
commander's intent: where the design is silent or a route fails, decide from Intent. The route
(files, names, order, tools) is yours to choose and to change.

A stage is a slice of the build that ends on something that runs: the owner could look at it, or
a check could confirm it.

## 1. Write the plan

Copy [template.md](template.md) to `.superpowers/plans/<yyyy-mm-dd>-<feature>.md`
(TODO(project): your folder for working papers, kept out of git). The plan is a working paper:
the record that lasts is the commits and the design docs. Fill in Base (the short hash of HEAD
before the build's first commit) and Intent from the design. Write every stage as one rough
line, adding a **Stop** only where Gates calls for one. Then roll the wave for stage 1 (step 2).
Give the owner the plan's path and its stage names, and start stage 1 in the same turn. Done
when every stage has a line, stage 1 is detailed and the owner has the path.

When resuming a build, first read the plan whose Branch line names the current branch: it is the
record of where the build stands. Compare its detailed stage with `git status` and `git log`,
since work may have landed after the last tick. Then carry on at step 3.

## 2. Roll the wave

At the start of each stage:

- Make this stage detailed. Give it a one-sentence goal, its outcome bullets, the main risk with
  its first sign, and a **Look** if Gates calls for one.
- Write the exact steps of any one-way step in it (see Gates).
- Make the stage after it next, with its outcome bullets.
- Re-read the rough stages against what the build has taught you. Rewrite, merge, add or drop
  (`[-]`) any that no longer fit.
- Move answered Open items out of Intent and into the Log, with their answers.
- Give every change a Log line with its reason.

Done when exactly one stage is detailed and every change has a Log line.

## 3. Build the stage

Where Fixed or the design makes a promise a test can hold, write that test first.

- **Ticking:** tick a bullet `[x]` once you have run its check and seen it pass. Partial work
  stays `[~]`, with what is missing written on the bullet.
- **A better route:** take it, and add a Log line.
- **A bullet this stage can't finish** (a missing tool, an owner task): move it to a later stage
  or to Owner tasks, with a Log line.
- **A change to Intent** (Purpose, End state or Fixed): it is a Stop. Write the owner's answer
  into Intent and the Log. Open items are yours to answer.
- **Handing the stage to a subagent or another agent:** write its brief at that point. Include
  the detailed stage, Intent, the design sections it needs, and absolute paths. Ask for each
  bullet's check output back, and tick from that output.

Done when every outcome bullet is `[x]`, `[-]` or moved, each drop and move with a Log line.

## 4. Close the stage

Commit the stage's work as one commit: one sentence saying what changed, then a body saying why,
in the repo's style. The owner wants these commits made without asking; push only when the owner
asks. Then change the stage's heading from `· detailed` to `· done`, and show its Look (see
Gates). Send the owner done, next and left, the stage's commit, and its Log lines when it has
any. Then roll the wave for the next stage (step 2).

## 5. Finish

When the last stage closes, or on reaching a Stop that guards the merge if that comes first,
squash the build's stage commits (`git log --oneline <Base>..HEAD`) into the fewest commits that
each read as one change: seven stage commits end as one or two. Write each message in the repo's
style. Start from a clean `git status`:

```bash
before=$(git rev-parse HEAD)
git reset --soft <Base> && git commit -m "<what changed>" -m "<why>"   # one commit
# More than one: git reset <Base>, add each part's paths and commit it, git add -A for the last.
git diff --quiet "$before" HEAD && echo kept   # the squash kept every change
```

If the branch has been pushed, use `@{u}` in place of Base, so pushed commits stay as they are.
The squash is done when the check prints `kept`. Then:

- Report each End state item against the real result, one line each.
- List each Look the owner has yet to answer.
- Run the checks for handing back a change set (TODO(project): the command, such as
  `npm run check:quick`), and read their output before saying anything passed.
- When the work ships, move what lasts into the design docs (TODO(project): where), move open
  Owner tasks to the project's open-items list (TODO(project): which file), and delete the plan.

## Gates

The build runs hands off: the owner joins only where a Stop calls for them. Each gate is a
tick-box line, so the plan records when it was passed.

- **Stop** is rare: most builds have none before the final merge. Add one only for:
  - a step that can't be taken back and reaches past the repo, such as publishing, a merge that
    deploys, a store submission or spending money;
  - breaking a Fixed promise, or changing Purpose or End state;
  - a call on taste or product direction that the design, the code and research leave open.

  Decide everything else yourself, choosing what serves the product's users and researching
  when unsure, and give the decision a Log line. A Stop sits just above what it guards. On
  reaching it, finish everything that doesn't depend on it, ask the owner with your
  recommendation, and end your turn. Write their answer and its date on the line, tick it and go
  on.
- **Look** never waits. Give a stage one only when it changes something the owner can see or
  try. At the close, tell the owner what to look at and where, mark it `[~]` with "shown" and the
  date, and keep going. Tick it if the owner answers; what they ask for becomes bullets in the
  current stage or a new stage, with a Log line.
- **One-way step:** a step git can't undo. It gets an exact step list beneath it when its stage
  turns detailed, and a Stop only when it meets the test above.

## Bullets

Each bullet holds one outcome that a check can confirm. It says what must be true, worded so
that a command or a look settles it. Add "(checked by …)" when the check isn't obvious.

- **Outcome:** "Every product page builds and passes the link check". One check settles it.
- **Route:** "Make a page component that takes a title and a list of items". This is how to
  build it. Choose it while building, so the plan keeps only the outcome.
- **Bundle:** "The intro video, with a fallback format for older browsers". This is two
  outcomes, and one can be done while the other is still owed. Give each its own bullet.
