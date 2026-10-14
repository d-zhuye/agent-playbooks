# Delegated work in worktrees

How a lead agent hands independent tasks to subagents that each work in their own git worktree,
then checks and integrates the results. It covers the brief, the checks the subagent makes before
changing anything, the report it returns, and how the lead merges. Any project in git, any stack.

**Adopt it when** a task splits into independent parts, such as three unrelated cleanups, and
you want them done in parallel without the agents stepping on one another.

---

## 1. Why use it

Parallel agents in one checkout break each other's work: one agent's half-finished edit fails
another's tests. Separate worktrees fix that, but bring problems of their own:

- **Agents start from the wrong commit.** In the project this came from, all three worktrees
  started from `main`, not from the feature branch the lead was on, 17–18 commits behind. One
  agent then "verified" that recent files didn't exist and wrote its changes against old
  versions of them.
- **Agents report confidently.** A report can rest on a stale base, a guess, or a wrong
  diagnosis. One agent's careful check overturned the lead's claim that some tests were
  "flaky": no test was flaky.
- **Briefs that skip the "what could go wrong" step** produce changes that need rework.

With this playbook, three tasks ran in parallel and all three were integrated in about an hour.
Each was a small, checked commit, and the lead caught both base-commit problems before merging.

## 2. How it works

```
lead agent
 ├─ writes one self-contained brief per task (section 4)
 ├─ starts subagents, each in its own worktree, in the background
 │    subagent: check base → verify the proposal → list likely problems → implement → verify → commit
 │    returns a structured report (section 4)
 └─ for each report:
      1. check the branch's base commit
      2. replay its commits onto the current branch in a temporary worktree
      3. resolve conflicts against the newer files; rerun the checks
      4. fast-forward the real branch; remove the worktrees and branches
      5. summarize for the human
```

## 3. Setup checklist

1. A git repo, and an agent tool that can start subagents in worktrees (for example, an `Agent`
   tool with worktree isolation, or the lead running `git worktree add` itself).
2. Know where dependencies come from: a new worktree has no `node_modules`, virtualenv or build
   cache. Decide on a symlink (fast, read-only use) or a fresh install per worktree.
3. Ignore worktree folders: add the folder (for example `.claude/worktrees/`) to `.gitignore`.
4. Paste the agent rule (section 5) into `AGENTS.md`.

## 4. Starter code

### Brief template (lead → subagent)

```md
You are working in <project, one line on what it is>, in your own git worktree.

**First:** confirm your base. Run `git merge-base --is-ancestor <EXPECTED_SHA> HEAD`. If it
fails, run `git merge --ff-only <EXPECTED_SHA>` (or report back if that is impossible). Then set up
dependencies: TODO(project): e.g. `ln -s <main checkout>/node_modules node_modules` (never commit it).
Read AGENTS.md and follow it. Do not push. Do not write to any memory directory.

## Goal
<What to change and why, in the owner's words where possible. Known instances, with paths. What
is out of scope.>

## Step 1: double-check the proposal before changing anything
<The specific claims to verify: "does any test read X?", "why was flag Y added? (git log -S)".>

## Step 2: list what can likely go wrong, and how you'll handle it
Only issues likely to happen, each with a simple fix. Consider: <task-specific prompts>.

## Step 3: implement, verify, commit
<Which checks to run, at which tier.> Commit with conventional messages ending with
<attribution line, if any>.

## Report back (your final message is all I see)
1. Branch name, base commit, commit hashes.
2. Proposal check: what you verified, and anything that turned out wrong.
3. Likely problems and how each was handled.
4. What changed, file by file.
5. Verification: commands run and their actual results.
6. Anything the owner must decide.
```

Fill in `<EXPECTED_SHA>` with the lead's current `HEAD` when starting the subagent.

### Integration (lead)

```sh
B=<subagent branch>
git merge-base "$B" HEAD                  # the base: should be HEAD or a recent ancestor of it
git log --oneline "$(git merge-base "$B" HEAD)"..HEAD | wc -l   # how far behind it started

# Replay its commits onto the current branch, away from the main checkout:
git worktree add -b integrate/<task> .worktrees/integrate-<task> HEAD
cd .worktrees/integrate-<task>
git cherry-pick <its commits>             # resolve conflicts in favor of the NEWER files
<run the checks>
cd - && git merge --ff-only integrate/<task>

# Clean up:
git worktree remove .worktrees/integrate-<task> && git branch -d integrate/<task>
git worktree remove <subagent worktree> && git branch -D "$B"
```

When resolving a conflict from a stale base, the subagent's side is usually an *older* version of
the text with its change applied. Keep the newer text, and apply the subagent's change to it.

### Summary for the human (optional)

For each finished task: a **house tour** (each new or changed piece, where it lives and what it
does, in a few bullets) and a **three-sentence plain-language before and after**. The plain version
catches overstatement: if it can't be said simply, the change may not be clear.

## 5. Agent rule

Paste into `AGENTS.md`:

```md
- Experiments that break code on purpose run in their own git worktree, never the main checkout:
  other sessions run tests against it.
- When delegating to a subagent in a worktree, give it the expected base commit and have it
  confirm the base first. Before merging its work, check its base yourself, replay its commits
  onto the current branch, and rerun the checks. Treat its report as claims to verify, not facts.
```

Why each line is there:

- **The main-checkout line**: one agent's deliberate breakage caused another's "flaky" test
  failures.
- **"Expected base commit"**: worktree tools often branch from the default branch, not from the
  lead's current branch.
- **"Claims to verify"**: a subagent's "X doesn't exist" can mean "X doesn't exist in my stale
  checkout".

## 6. Acceptance test

1. **Base check catches drift.** Start a subagent whose worktree begins at an older commit. It
   detects the mismatch from the brief's first step, fast-forwards or reports, and doesn't
   implement against old files.
2. **Integration survives a stale base.** Take a subagent commit made on an old base that
   conflicts with newer changes. The lead replays it in a temporary worktree, resolves the
   conflicts keeping the newer text, the checks pass, and the main checkout is never left
   mid-conflict.
3. **Reports get verified.** A subagent claims "file F doesn't exist". The lead checks on the
   current branch before relaying the claim.
4. **Clean finish.** After integration, `git worktree list` shows no leftover task worktrees, and
   no task branches remain.

## 7. Gotchas

- **Worktrees started from `main`.** All three started from the default branch, not from the
  lead's feature branch. Two agents noticed and fast-forwarded; one didn't, and its audit
  reported newer files as missing. Put the base check first in the brief.
- **A partial fast-forward is still stale.** One agent fast-forwarded to the branch tip as of
  when it started; by the time it finished, the branch had moved on (another task had merged).
  Always replay onto the current tip, never merge as-is.
- **Old reports describe deleted history.** A subagent cited a review document that had been
  deleted on the current branch. Check that what a report cites still exists.
- **No dependencies in the worktree.** Commands fail confusingly (`missing script`, cannot find
  module) until dependencies are linked or installed. A symlinked `node_modules` shows up as an
  untracked file; never commit it.
- **Pre-commit hooks resolve paths from the main checkout.** In one worktree the hook needed a
  config file that existed only on the newer branch. That's another symptom of a stale base.
- **Locked worktrees.** Agent tools may lock their worktrees; removing one can need
  `git worktree remove --force --force`. Do it only after its branch is merged or abandoned.

## 8. What it does not cover

- Tasks that depend on each other: run those in sequence, or give the second task the first one's
  branch as its base.
- Reviewing the quality of the change itself (use a code-review process).
- Repos too large for multiple checkouts: use sparse checkouts, or run tasks in sequence.
