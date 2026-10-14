# Agent playbooks

Proven setups to copy into a new project. Each playbook says what it does, why to use it, and how
to install it. Agents: read this index, then open the playbooks that fit the project.

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

To add or update a playbook, follow [CONTRIBUTING.md](CONTRIBUTING.md).
