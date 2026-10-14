# Notes from projects

One file per playbook (`notes/<playbook name>.md`, matching the playbook's file name). Every
time a project uses, changes or decides against a playbook, add one line at the end:

```md
- <YYYY-MM-DD> · <project> · <worked | didn't | changed | skipped> · <one sentence: what happened>
```

- **worked:** installed or followed it, and it did what it says.
- **didn't:** it failed, or the problem came back anyway. Say how.
- **changed:** it worked only after a change. Say what the change was.
- **skipped:** decided not to use it. Say why (it didn't fit, too heavy, a tool already covered it).

Reviews add their own line when they finish, so everything below the last review line is new:

```md
- <YYYY-MM-DD> · REVIEW · <what changed in the playbook, or "no change">
```

Don't edit or delete other lines; the repo-wide review trims old ones.
