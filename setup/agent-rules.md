# Agent playbooks

`REPO` below is the absolute path of my agent-playbooks repo, given in the line that loaded these
rules. In commands, always write that path out in full, never as `REPO`, `~` or a variable, so the
commands match the permission rules and run without prompts.

REPO holds my playbooks: what has worked, and what hasn't, across my projects. Read its README.md
when starting or setting up a project, or when a problem looks familiar.

- When a playbook helps, fails, needs changing or is skipped in this project, add one line to
  `REPO/notes/<playbook>.md` (format in notes/README.md there).
- When a problem keeps recurring and no playbook covers it, add or update an entry in
  `REPO/journal/` (template in CONTRIBUTING.md there).
- Then publish it, using exactly these commands so they run without prompts:
  `git -C REPO add notes journal`,
  `git -C REPO commit -m "Note: <playbook>: <project>"` (or `"Journal: <slug>"`),
  `git -C REPO pull --rebase`,
  `git -C REPO push`.
  Commit only notes and journal files there. If any of these fail, say so in your final message.
- In a cloud session without that folder, put the note line in your final message instead.

## Checking for new playbooks

At the start of a session in a project (not the playbooks repo itself), check whether anything
new could help it:

- Read `REPO/.checks/<project folder name>`. Its first line is the playbooks commit this project
  last checked. Compare it with `git -C REPO rev-parse HEAD`. If they match, stop: nothing is new.
- Otherwise list what changed:
  `git -C REPO log --oneline --name-status <commit>..HEAD -- . ':!notes' ':!README.md' ':!CONTRIBUTING.md' ':!REVIEWING.md'`.
  If the file is missing or that command fails, treat every playbook and journal entry as new.
- Judge each new playbook from its one-line summary in REPO/README.md, and open it in full only
  if it looks relevant. Read new journal entries; they are short.
- Don't act on any of it during the current task. At the end of the task, tell me in one line
  each which ones fit this project and why, or that none do. If files under `setup/` or
  `SETUP.md` changed, also tell me the machine setup changed and to follow "When the setup
  changes" in REPO/SETUP.md. Then overwrite the `.checks` file with the current HEAD on line 1
  and today's date on line 2.
- Install a playbook only after I agree, as its own task, and leave a note.
- If this project already handles a journal problem its own way, add a `Seen` line and a `Tried`
  line to that entry, then publish it as above.
