# Adding to the playbooks

This repo is a journal of what worked and what didn't across projects, so agents don't have to
learn the same lessons again. It has three kinds of files:

| Kind | Where | What it is | Bar to add |
|---|---|---|---|
| Journal entry | `journal/<slug>.md` | A short note on a problem that keeps coming back, and what was tried | The problem recurred or persisted |
| Note | `notes/<playbook>.md` | One line on how a playbook went in a project | You used (or skipped) a playbook |
| Playbook | `<name>.md` | A written-up setup another agent can install | Promoted by a review (see [REVIEWING.md](REVIEWING.md)) |

Keep adding easy. Reviews do the sorting: they promote, merge, rewrite and delete.

## Adding a journal entry

Add one when a problem has come up more than once, or won't go away. A single odd case isn't
worth one yet. Failures count: "we tried X and it made things worse" saves the next agent from
trying X.

1. **Search first:** `grep -ril '<keyword>' journal/ *.md`. If an entry or playbook already covers
   the problem, add a `Seen` line or a note to it instead of starting a new one.
2. **Create `journal/<slug>.md`,** named after the problem in kebab-case
   (`agents-rerun-full-suite.md`). Use this template; leave out lines you don't know yet:

   ```md
   # <The problem, in a few words>

   - Seen: <YYYY-MM-DD>, <project>
   - What happened: <the recurring problem and what it cost>
   - Tried: <what was done> → <worked / didn't / partly, and why>
   - Status: open | worked once | worked in several projects
   ```

3. **Each time it recurs,** add another `Seen` line and any new `Tried` lines to the same entry.
4. **Commit:** `Journal: <slug>`.

## Leaving a note on a playbook

Whenever a project uses, changes or decides against a playbook, add one line to
`notes/<playbook name>.md` (create the file if it doesn't exist). The format is in
[notes/README.md](notes/README.md). Commit it: `Note: <playbook>: <project>`.

## Writing a playbook

Usually a review promotes a journal entry that has worked in more than one project. You can also
write one directly when a setup clearly earns it. A playbook is one Markdown file that another
agent will follow to install a working setup in a new project, without seeing the project the
setup came from. Write it for that agent.

1. **Name the file** after what the setup does, in kebab-case: `screenshot-checks.md`, not
   `playwright.md` or `while-we-wait-tests.md`.
2. **Write it using the sections below.** Leave out any section that doesn't apply, and keep
   the order of the rest.
3. **Remove project specifics.** That covers app names, screen names, people and private URLs.
   Use generic names, and mark the parts the reader must change with `TODO(project):`.
4. **Check it by following it** if you can: install it in a scratch project using only the
   playbook and run its acceptance test. If you can't, say so in the summary; the first notes
   from real use will show where it needs fixing.
5. **Add one line to [README.md](README.md):** the link, what the setup does, and which
   project types it's for. Keep entries in alphabetical order. If it came from a journal entry,
   delete that entry.
6. **Commit and push:** `Add <name> playbook`, or `Update <name> playbook: <what changed>`.

### Sections

1. **Title and summary:** what it does and which stack it's for, in two or three lines.
2. **Why use it:** the problem it solves, plus rough costs (time, tokens, your time) before
   and after. Say how many projects the figures come from.
3. **How it works:** the parts, how they connect, and the commands.
4. **Setup checklist:** dependencies, pinned versions, scripts, config and `.gitignore`.
5. **Starter code:** every file, in full, ready to copy. Use comments to explain what each part
   does and why.
6. **Agent rule:** the exact text to paste into `AGENTS.md`, and why each line is there.
7. **Acceptance test:** scenarios that prove the setup works, including one where an agent
   uses it without being told to.
8. **Gotchas:** the things that broke and how they were fixed.
9. **What it does not cover:** limits, and notes for other stacks.
10. **Builds on** (optional): existing tools or skills it relies on or overlaps with, and what
    this playbook adds.

[screenshot-checks.md](screenshot-checks.md) is the reference example.

## Updating a playbook

Small fixes (a wrong command, a broken version pin) can go in right away: fix it, add the lesson
to Gotchas, and leave a note. Bigger changes to how a playbook works wait for a review, so one
project's experience doesn't redesign it. If a change would break existing installs, give the
steps to migrate.
