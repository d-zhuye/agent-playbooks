# Agent playbooks

What has worked, and what hasn't, across projects, so agents don't relearn the same lessons.
Each playbook below says what it does, why to use it, and how to install it. Agents: read this
index, then open the playbooks that fit the project. Also search [journal/](journal/) for
problems seen before that aren't playbooks yet.

- [Delegated work in worktrees](delegated-work-in-worktrees.md): briefs, base-commit checks, report
  format and integration for subagents working in parallel git worktrees. Any project in git.
- [Docs without copies](docs-without-copies.md): docs record intent and point to the code or a
  command, never copying user-facing strings or counts; a rule plus a one-time audit. Any project
  with design docs, READMEs or specs.
- [Open-items ledgers](open-items-ledgers.md): one short ledger of open items and decisions per area,
  plus a checked evidence file, instead of accumulating review documents. Any project agents
  review repeatedly.
- [Screenshot checks](screenshot-checks.md): approved screenshots of every screen, compared after
  each UI change with one command; agents approve predicted changes and ask only about the rest.
  For Expo / React Native apps (and plain web apps).
- [Tiered test runs](tiered-test-runs.md): related tests while editing, a quick check before
  hand-back, a pre-commit hook on staged files, the full check in CI. Starter code for Node/Jest
  with GitHub Actions; the tiers apply to any stack.

## Using a playbook in a project

On the owner's machine, Claude Code already has this rule at user level (`~/.claude/CLAUDE.md`),
so every project knows to leave notes. For other agent tools, paste this into the project's
`AGENTS.md` once, filling in the path to this repo and the playbooks you installed:

```md
- This project uses playbooks from TODO(project): <path to agent-playbooks>: TODO(project): <names>.
  When one helps, fails, needs changing or is skipped, add one line to
  <path>/notes/<playbook>.md (format in notes/README.md) and commit it there.
  When a problem keeps recurring and no playbook covers it, add or update a journal entry
  (<path>/CONTRIBUTING.md).
```

Those notes are how the reviews know what's working.

## Adding and reviewing

- To add a journal entry, a note or a playbook, follow [CONTRIBUTING.md](CONTRIBUTING.md).
- To run a review, follow [REVIEWING.md](REVIEWING.md): a monthly sweep of each playbook's
  notes, and a repo-wide review every 3 months.
