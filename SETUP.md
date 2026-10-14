# Setting up a new machine

This sets up Claude Code and Codex on a machine so that every project leaves notes here and
checks for new playbooks. It takes about 10 minutes. The canonical files are in [setup/](setup/);
[setup/fill.sh](setup/fill.sh) prints each one with this clone's path filled in.

Last verified: 2026-10-14, Claude Code 2.1.267 and Codex 0.152.1 on Linux.

## Before you start (you)

1. Clone the repo where it will stay (moving it later means redoing this):
   `git clone git@github.com:d-zhuye/agent-playbooks.git ~/agent-playbooks`
2. Check you can push from this machine: `git -C ~/agent-playbooks push --dry-run`.

## Setup (paste into Claude Code or Codex, opened in the clone)

```md
Set up this machine's agents to use the agent-playbooks repo in the current folder, following
SETUP.md. For each file below: back it up first (`<file>.bak-<date>`), merge into it rather than
replace it, keep everything already there, and leave out machine-specific settings such as
`model`. Use `setup/fill.sh` for the filled-in text; don't type paths by hand.

1. `~/.claude/CLAUDE.md`: add the output of `setup/fill.sh claude-md`. If a section between the
   same `agent-playbooks:start`/`end` markers exists, replace it. If an older, unmarked copy of
   the playbook rules exists, remove it.
2. `~/.codex/AGENTS.md`: the same with `setup/fill.sh codex-agents`.
3. `~/.codex/rules/agent-playbooks.rules`: write the output of `setup/fill.sh codex.rules`.
4. `~/.codex/config.toml`: merge `setup/fill.sh codex-config.toml`. If `[sandbox_workspace_write]`
   already exists, add the paths to its `writable_roots`; never add a second copy of a table.
   Check it parses: `python3 -c 'import tomllib,sys; tomllib.load(open(sys.argv[1],"rb"))' ~/.codex/config.toml`.
5. `~/.claude/settings.json`: Claude can't change its own permissions, so if you are Claude,
   show me the output of `setup/fill.sh claude-settings.json` and wait while I merge it into
   the `permissions` section. If you are Codex, merge it yourself and check it with
   `jq . ~/.claude/settings.json`.
6. Run the checks in "Check it works" in SETUP.md and tell me what passed and what didn't.
Don't commit, push or change anything in the repo itself.
```

## Check it works

1. `setup/fill.sh check` prints `Installed rules match the repo.`
2. `grep -n REPO ~/.codex/rules/agent-playbooks.rules ~/.codex/config.toml` finds nothing.
3. Codex allows publishing and blocks force-pushing (put in the real path):
   `codex execpolicy check --rules ~/.codex/rules/agent-playbooks.rules git -C <path> push` says
   `allow`, and the same with `push --force` says `forbidden`.
4. In a fresh Claude session in any project, `/memory` lists `setup/agent-rules.md` as loaded.
5. Real use: in any project, ask each agent to "check for new playbooks". It should read the
   `.checks` file and run `git log` without asking permission. The first time on a new machine
   it reports every playbook as new, because `.checks/` isn't in git; that happens once per
   project. If the old machine is still around, copy its `.checks/` folder over instead.

## What you don't need to redo

- **Cloud review routines** (monthly sweep, quarterly repo review) and the **Claude GitHub app**
  belong to your claude.ai and GitHub accounts, not the machine. They keep running.
- **Projects' own `AGENTS.md` files** come with each project's clone.

## When the setup changes

Claude loads `setup/agent-rules.md` straight from the repo, so a `git pull` updates it. Codex
keeps copies. After pulling a change to `setup/`, run `setup/fill.sh check`; if it reports
anything out of date, paste the setup prompt again (it replaces the marked sections).

Changes to `setup/` take effect in every Claude session on every machine as soon as they are
pulled, so review them yourself before merging. The review routines don't edit them.

## Other agent tools

For a tool with no user-level instructions file, add this to each project's `AGENTS.md`, with
the path filled in:

```md
- This project uses playbooks from <path to agent-playbooks>: <playbooks installed here>.
  Read and follow <path>/setup/agent-rules.md, where REPO means <path>.
```
