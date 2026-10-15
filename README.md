# Agent playbooks

New machine? Start with [SETUP.md](SETUP.md).

What has worked, and what hasn't, across projects, so agents don't relearn the same lessons.
Each playbook below says what it does, why to use it, and how to install it. Agents: read this
index, then open the playbooks that fit the project. Also search [journal/](journal/) for
problems seen before that aren't playbooks yet.

- [App Store upload readiness](playbooks/app-store-upload-readiness.md): 14 pass/fail checks before an App Store
  Connect upload (current Xcode/SDK minimum, icon, privacy manifest, Info.plist, signing, binary
  contents) and a short report format. iOS apps; Expo / EAS commands included.
- [Delegated work in worktrees](playbooks/delegated-work-in-worktrees.md): briefs, base-commit checks, report
  format and integration for subagents working in parallel git worktrees. Any project in git.
- [Docs without copies](playbooks/docs-without-copies.md): docs record intent and point to the code or a
  command, never copying user-facing strings or counts; a rule plus a one-time audit. Any project
  with design docs, READMEs or specs.
- [Open-items ledgers](playbooks/open-items-ledgers.md): one short ledger of open items and decisions per area,
  plus a checked evidence file, instead of accumulating review documents. Any project agents
  review repeatedly.
- [Pre-launch search research](playbooks/pre-launch-search-research.md): a one-off audit of how people
  search for the product, from free autocomplete and App Store competition data, ending in
  proposed App Store, Google Play and web page text plus flagged conflicts with copy rules. Apps
  and sites before launch; Node scripts included.
- [Screenshot checks](playbooks/screenshot-checks.md): approved screenshots of every screen, compared after
  each UI change with one command; agents approve predicted changes and ask only about the rest.
  For Expo / React Native apps (and plain web apps).
- [Tiered test runs](playbooks/tiered-test-runs.md): related tests while editing, a quick check before
  hand-back, a pre-commit hook on staged files, the full check in CI. Starter code for Node/Jest
  with GitHub Actions; the tiers apply to any stack.

## Using a playbook in a project

Claude Code and Codex get the rules for using this repo at user level, so every project knows to
leave notes and to check for new playbooks. [SETUP.md](SETUP.md) installs them on a machine, and
covers other agent tools too. The rules themselves are in
[setup/agent-rules.md](setup/agent-rules.md).

Those notes are how the reviews know what's working. `.checks/` is ignored by git: each machine
keeps its own record of when each project last checked.

## Adding and reviewing

- To add a journal entry, a note or a playbook, follow [CONTRIBUTING.md](CONTRIBUTING.md).
- To run a review, follow [REVIEWING.md](REVIEWING.md): a monthly sweep of each playbook's
  notes, and a repo-wide review every 3 months.
