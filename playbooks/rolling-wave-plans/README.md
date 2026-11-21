# Rolling-wave plans (builds without full implementation plans)

A skill that runs a build from an agreed design without writing a full implementation plan
first. The stage in front of the agent is planned in detail, the next one as a list of outcomes,
and every later one as a single line. Each stage gets its detail when it starts, from what the
earlier stages taught. An Intent section works like a commander's intent: where the design is
silent, the agent decides from it. The owner is asked only at rare Stops. For any project where
agents build features from a written design. The skill is in Claude Code's format; other agents
can follow it as a plain file.

**Status: unproven.** The owner asked for this playbook directly. It grew out of the journal
entry "Detailed plans lock builds into early guesses", now folded in here, and one project's
build run from a plain stage outline. The skill itself hasn't run a full build yet, so the
figures below come from that outline.

**Adopt it when** a design is agreed and the build will take more than one sitting. This matters
most with superpowers, whose brainstorming hands off to writing-plans by default. Skip it for a
change that fits in one stage: just build it.

---

## 1. Why use it

Without it, plan skills such as superpowers writing-plans fix files, function signatures and
test code before the code has taught the agent anything. The agent then follows a stale route
or stops to re-plan, and the owner reviews detail that goes out of date. In one project, a full
plan named `x.ts` and `x.native.ts` as separate modules. The React Native bundler resolves `./x`
to the `.native` file, so the clash showed up only at build time. On a later build, the owner
stopped the plan before it was finished: a plan written at the start ties the build to early
guesses and leaves the agent no room to adapt.

With it, the plan is a short file that changes a line at a time. Its forerunner was a stage
outline with a few bullets per stage and the full design behind it. That outline ran a ten-stage
website rebuild in about a day and a half, and each change of route took one line. Two failures
in that run shaped this skill:

- the owner's checkpoints were passed with no record of them;
- a bullet holding two outcomes was ticked while one of them was still owed.

The figures come from one project, and no run has measured how long writing the plan takes.

It is a failure, even if it runs, when:

- the agent asks the owner about something the design and Intent already settle,
- a tick claims work that its check didn't confirm,
- the route changes with no Log line,
- or more than one stage is detailed at once, so the plan has grown back into a full plan.

## 2. How it works

Each build gets one plan file, copied from the template into a git-ignored folder:

| Part | What it holds |
|---|---|
| Header | The design's path, the branch, the Base commit, the start date |
| Intent | Purpose, End state, Fixed (promises no route may break), Open (unknowns the build answers) |
| Stages | Each goes `rough` (one line) → `next` (outcome bullets) → `detailed` (goal, bullets, risk, gates) → `done` |
| Final review | Independent reviewer, findings and their resolution |
| Log | Every change of route or plan, with its reason |
| Owner tasks | What only the owner can do, and which bullet needs it |

The loop, from [SKILL.md](files/.claude/skills/rolling-wave-plan/SKILL.md):

1. **Write the plan.** Fill in Intent from the design, write every stage as one line and detail
   stage 1. Start stage 1 in the same turn.
2. **Roll the wave** at the start of each stage. Detail this stage, list the next one's outcomes,
   and rewrite later stages to fit what the build taught. Log each change.
3. **Build the stage.** Prefer a thin end-to-end behavior through the needed layers. The route
   (files, names, order, tools) is the agent's choice. A bullet is ticked only after its check
   has passed.
4. **Close the stage.** Make one commit, record its hash in the plan, and tell the owner what's
   done, next and left.
5. **Finish.** Get an independent review against the design, fix material findings, and squash
   only a verified tail of this build's unpublished commits. Check that the tree and protected
   history are preserved, and report the End state item by item.

Gates are tick-box lines, so the plan records when each was passed:

- **Stop** is rare. It covers steps that can't be taken back and reach past the repo
  (publishing, a merge that deploys, a store submission, spending money), changes to Intent, and
  taste or product calls that nothing else settles. At a Stop, the agent finishes all the work
  that doesn't depend on it, asks with a recommendation, and ends its turn.
- **Look:** the owner checks something when free. Work never waits for it.
- **One-way step:** a step git can't undo. It gets an exact step list, and a Stop only if it
  meets the Stop test.

To resume, after a new session or a context summary, the agent reads the plan whose Branch line
names the current branch and compares it with `git log`.

## 3. Setup checklist

- [ ] Copy `files/.claude/skills/rolling-wave-plan/` into the project at the same path.
- [ ] Resolve its `TODO(project):` lines: the plans folder, the hand-back check command, where
      lasting decisions go, and where open owner tasks go. To find them:
      `grep -rn 'TODO(project)' .claude/skills/rolling-wave-plan`.
- [ ] Keep plans out of git: add the plans folder to `.gitignore` (`.superpowers/` by default).
- [ ] Paste the agent rule (section 5) into `AGENTS.md`, or into `CLAUDE.md` if only Claude Code
      runs builds.
- [ ] Optional: [Tiered test runs](../tiered-test-runs.md) gives the skill a hand-back check, and
      [Open-items ledgers](../open-items-ledgers.md) gives open owner tasks a home once the plan
      is deleted.

## 4. Starter code

| Path in [`files/`](files/) | What it is |
|---|---|
| `.claude/skills/rolling-wave-plan/SKILL.md` | The procedure (write, roll, build, close, finish), the gates, and how to word bullets |
| `.claude/skills/rolling-wave-plan/template.md` | The plan file, copied once per build |

There are no scripts or tests. The squash steps in SKILL.md were tried in a scratch repo, for
both one commit and two.

## 5. Agent rule

```md
Once a design is agreed, plan and run the build with the rolling-wave-plan skill
(`.claude/skills/rolling-wave-plan/SKILL.md`), in place of superpowers writing-plans and
executing-plans. A build under way keeps its plan in `.superpowers/plans/`: read it before
going on.
```

- **"In place of superpowers writing-plans and executing-plans":** superpowers brainstorming ends
  by handing off to writing-plans. Project instructions outrank skills, so this line wins that
  handoff, which the skill's description alone may not.
- **The path** lets agents without Claude Code's skill loader follow the same file.
- **"Read it before going on"** makes a new session, or one whose context was summarized, pick up
  the build from the plan rather than from memory.

## 6. Acceptance test

1. **Unprompted start.** With the rule installed, agree a small design in brainstorming and say
   "build it". Without being told about the skill, the agent writes the plan, with Base and Intent
   filled, every stage on one line, stage 1 detailed and stage 2 next. It gives the path and stage
   names and starts stage 1 in the same turn. No writing-plans plan appears. Stages prefer thin
   end-to-end behaviors, with the smallest complete path working first; a necessary preparatory
   stage names what it enables and has its own check.
2. **Stage close.** After stage 1:
   - the stage has one commit, its hash is recorded, and its heading reads `· done`;
   - stage 2 is detailed and stage 3 is next;
   - each change has a Log line;
   - any Look is marked `[~]` shown with the date, and work goes on.
3. **Hands off.** The agent asks nothing outside a Stop. Calls the design left open appear as Log
   lines.
4. **Resume.** Start a fresh session mid-stage and say "carry on". The agent reads the plan,
   checks `git log`, and goes on without redoing ticked bullets.
5. **Finish.** By the time it reaches the merge Stop, the agent has:
   - had a fresh reviewer check the full build against the design and Intent, including
     missing requirements and likely failure cases; material fixes were checked and reviewed;
   - recorded the reviewer and result in Final review, with deferred minor findings in the Log;
   - squashed only a verified, contiguous tail of owned unpublished commits: the check printed
     `kept`, or the Log explains why history stayed intact;
   - reported each End state item;
   - listed the Looks still unanswered.

   Then it asks with a recommendation and ends its turn. An unavailable independent reviewer
   remains an outstanding requirement before merge.
6. **Mixed history.** In a scratch repo, interleave another session's commit between stage
   commits, using the same author. Only the eligible tail is squashed; the other session's hash
   remains ancestral. Repeat with a published commit on another remote branch and no upstream: a
   verified remote ref protects that commit. If publication cannot be verified, or the checkout
   has another active session, history stays intact and the reason is logged.

## 7. Gotchas

Seen while running the forerunner outline and reviewing the skill:

- **Checkpoints passed with no record.** Gates are now tick-box lines. A Stop gets the owner's
  answer and its date; a Look gets `[~]`, "shown" and the date.
- **A bundled bullet was ticked half done.** Each bullet now holds one checkable outcome.
  SKILL.md's Bullets section shows an outcome, a route and a bundle side by side.
- **Too many Stops.** A first version made every one-way step a Stop, and the owner wanted the
  build hands off. Stops now cover three cases. Everything else is the agent's decision, with a
  Log line.
- **A commit per bullet was too noisy.** The owner chose one commit per stage and one squash at
  the end.
- **Agent shells can't drive `git rebase -i`.** The squash uses `git reset --soft`, then
  `git diff` checks that the tree didn't change.
- **Another session's commit was inside the build range.** An unchanged tree after squash
  does not prove ownership was preserved. Recorded stage hashes identify the build's work; only
  its verified unpublished linear tail may be rewritten. Published commits and other sessions'
  commits remain intact, including when the author matches or no upstream is configured.
- **Layer checks can delay integration.** Prefer the smallest complete behavior across the
  needed layers first, then widen it.
- **Outcome checks can miss requirements.** A fresh final reviewer checks the full design and
  likely failure cases, including behavior no outcome bullet covered.
- **The plan isn't in other worktrees.** Because it's git-ignored, a subagent in another worktree
  needs the plan's absolute path in its brief.

Expected, not yet seen:

- **The plan can grow back into a full plan.** Watch for more than one stage marked detailed, or
  for bullets that name files and functions (routes, not outcomes).

## 8. What it does not cover

- Designing. Brainstorming or a design doc comes first; the skill starts once the design is
  agreed.
- Small changes that fit in one stage.
- Teams that need the plan shared. Keep it in a tracked folder instead, and drop the delete step
  in Finish.
- Cloud sessions, which can't see a git-ignored plan left by an earlier session.

## 9. Builds on

- **superpowers** brainstorming, writing-plans and executing-plans: this replaces the last two,
  after brainstorming.
- [Delegated work in worktrees](../delegated-work-in-worktrees.md): briefs and reports for a
  stage handed to a subagent. This skill adds that the brief is written at hand-off and that ticks
  come from the subagent's check output.
- [Tiered test runs](../tiered-test-runs.md), [Open-items ledgers](../open-items-ledgers.md) and
  [Docs without copies](../docs-without-copies.md): the hand-back check, a home for open owner
  tasks, and the rule that working papers are deleted when the work ships.
