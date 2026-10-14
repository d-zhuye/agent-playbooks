# Adding a playbook

A playbook is one Markdown file. Another agent will follow it to install a working setup in a new
project, without seeing the project the setup came from. Write it for that agent.

## When to add one

Add a playbook once a setup has actually run in a real project and you would want it again. If it
hasn't been tested yet, it's still an idea, not a playbook.

## Steps

1. **Name the file** after what the setup does, in kebab-case: `screenshot-checks.md`, not
   `playwright.md` or `while-we-wait-tests.md`.
2. **Write it using the sections below.** Leave out any section that doesn't apply, and keep
   the order of the rest.
3. **Remove project specifics.** That covers app names, screen names, people and private URLs.
   Use generic names, and mark the parts the reader must change with `TODO(project):`.
4. **Check it by following it.** Install it in a scratch or new project using only the playbook,
   then run its acceptance test. Fix every step where you had to guess.
5. **Add one line to [README.md](README.md):** the link, what the setup does, and which
   project types it's for. Keep entries in alphabetical order.
6. **Commit and push:** `Add <name> playbook`, or `Update <name> playbook: <what changed>`.

## Sections

1. **Title and summary:** what it does and which stack it's for, in two or three lines.
2. **Why use it:** the problem it solves, plus rough costs (time, tokens, your time) before
   and after.
3. **How it works:** the parts, how they connect, and the commands.
4. **Setup checklist:** dependencies, pinned versions, scripts, config and `.gitignore`.
5. **Starter code:** every file, in full, ready to copy. Use comments to explain what each part
   does and why.
6. **Agent rule:** the exact text to paste into `AGENTS.md`, and why each line is there.
7. **Acceptance test:** scenarios that prove the setup works, including one where an agent
   uses it without being told to.
8. **Gotchas:** the things that broke and how they were fixed.
9. **What it does not cover:** limits, and notes for other stacks.

[screenshot-checks.md](screenshot-checks.md) is the reference example.

## Updating a playbook

When a project improves the setup, copy the fix back here and add the lesson to Gotchas. If a
change would break existing installs, give the steps to migrate.
