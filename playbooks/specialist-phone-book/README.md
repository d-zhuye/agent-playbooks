# Specialist phone book

A phone book of specialists (designers, writers, engineers, psychologists, storytellers, user
advocates, policy and research people, and more) that you or an agent call by name for a spot-check, a review, a critique, a question or a
recommendation, instead of writing a role from scratch each time. A scannable index lists every
specialist with one line on what they catch. A full brief per specialist gives them a point of
view, what they must see, what to look at first, the mistakes common in their field, and the
facts to check. Specialists give an independent view: they flag where they disagree with the
project's decisions and leave the call to the owner. Specialists only one project needs live in
that project's folder under `projects/`. It's read in place from this repo, by any agent tool
that can read files and start subagents.

**Status: unproven.** The owner asked for this playbook directly; it was not promoted from a
journal entry. Every specialist in the index has a full brief, and one project has a folder under
`projects/`. No specialist has been called on a real task yet, so there are no cost figures, and
the agent rule (section 4) isn't installed yet.

**Adopt it when** you'd otherwise write "review this as a designer" or a role spec by hand, or
when you want to see what kinds of expertise you could bring to a task.

---

## 1. Why use it

Without it, each task needs its own role spec, which takes your time, or gets a generic "review
this", which gets generic feedback. Every agent reviews from the same middle seat: it catches
the obvious and misses what a specialist would. Roles made up on the spot vary in quality and
are lost when the task ends.

With it, you name a specialist (or an agent picks one) and they arrive ready. They know their
point of view, the checks that find most problems in their field, the mistakes non-specialists
miss, which facts to check instead of recall, and how to report. A brief improved in one project
is improved for every project.

The idea is already proven in a narrower form. The
[App Store screenshot review](../app-store-screenshot-review.md) playbook runs 14 fixed roles,
and its first real review added a 15th. This playbook makes those kinds of roles reusable for
any task.

It is a failure, even if it runs, when:

- a brief adds nothing over the bare title ("typography specialist"),
- specialists soften good advice to fit the project's decisions, or overrule a decision without
  asking the owner,
- specialists judge what they couldn't see, such as a color review from code alone,
- out-of-date facts are stated as current,
- specialists blur into one voice,
- or the index grows too long to scan.

## 2. How it works

| File | What it is |
|---|---|
| [index.md](index.md) | The phone book: every specialist in one line, grouped by area, plus how to call one |
| [how-specialists-work.md](how-specialists-work.md) | The rules every specialist follows: get what you need to see or say you can't, give an independent view and flag disagreements, check facts that change, stay in your seat, the report shape |
| [template.md](template.md) | The shape of a brief, for writing new ones |
| `<area>/<specialist>.md` | One brief per specialist, written in the second person so it can be handed over as is |
| [projects/](projects/README.md) | One folder per project, for specialists only it needs and project additions to general briefs |

It serves two readers at two depths. The index is for scanning: you, looking for who to call, or
an agent picking specialists for a task. The brief is for doing the work: the specialist reads
the shared rules, then their brief, then the task.

Calling one is in [index.md](index.md#how-to-call-a-specialist): pick the fewest specialists who
cover the task, start one subagent each with a short prompt that points at the two files, and
merge their reports. For a quick spot-check, an agent can take the role itself instead.

Most areas start with a generalist for a broad pass; the specialists below it go deep. Each
specialist names who to hand off to when a problem is outside their seat.

**Why it isn't copied into projects.** Other folder playbooks ship `files/` to copy into each
project. This one is read where it lives, so there is one copy, and an improvement reaches every
project at once. The cost is that a cloud session without this repo can't use it.

## 3. Setup checklist

- [ ] This repo is cloned on the machine (see [SETUP.md](../../SETUP.md)). Nothing is installed
      in projects.
- [ ] Optional, per project: create `projects/<project>/` for specialists only that project
      needs (stand-ins for its audience, an editor for its own kind of content) and project
      additions to general briefs. [projects/README.md](projects/README.md) says how.

## 4. Agent rule

Proposed text for `setup/agent-rules.md`. It isn't added yet: that file loads into every session
on the machine, so it waits until the prototype has been used on real tasks.

```md
## Specialist phone book

`REPO/playbooks/specialist-phone-book/index.md` lists specialists (designers, editors,
engineers, reviewers and more) with ready briefs. When I ask for a specialist, a review, a
critique or expert input, pick the specialists from it and call them as it says, instead of
writing roles from scratch. When I haven't named anyone, say which ones you picked and why.
```

- **The path** lets every project find it without a copy.
- **"When I ask for…"** keeps subagents to requests that call for them: each one costs about as
  much as a separate review.
- **"Say which ones you picked and why"** lets the owner correct a poor pick before the work is
  done.

## 5. Acceptance test

1. **Named call.** Ask an agent: "Ask the typography specialist to review <a screen>." It opens
   the index, starts a subagent with the shared rules and the brief, and the report has the set
   shape and cites the project's design guide. Run a bare "review the typography" prompt side by
   side: the specialist should catch at least one thing the bare prompt misses.
2. **Unnamed call** (rule installed). Ask: "Review this screen before I ship it." The agent picks
   two or three specialists from the index without being told it exists, and says why.
3. **Missing brief.** Call a specialist added to the index without a brief. The agent uses its index line plus the
   shared rules, and says the brief is missing.
4. **Outside the seat.** The typography specialist notices a contrast problem and hands it to the
   color and contrast specialist instead of reviewing it.
5. **Facts that change.** The privacy specialist cites current sources with dates, not memory.
6. **Can't see.** Call the color and contrast specialist with only the code and no way to view
   images. Its report opens by saying it couldn't see the screens, proposes a workaround (such
   as the project's screenshot command), and labels anything it judged from code as unverified.
7. **Disagreement.** Call a specialist on something the project decided against their advice,
   such as a type size its design guide sets below their minimum. The report keeps the
   recommendation, names the decision and where it's recorded, states the strength ("strong
   disagreement" when it is), and asks the owner to decide, instead of quietly deferring.
8. **Two advocates, one screen.** Call the trust advocate and the respect advocate on the same
   paywall. The trust advocate should report on what was promised and when the catch appeared;
   the respect advocate on how often and when it asks. If their findings overlap heavily, the
   briefs have blurred.
9. **Notes per specialist.** After a call with two specialists, the caller adds two note lines
   in the shape under "Growing it", and copies in any brief feedback from the reports.

## 6. Gotchas

Expected, not yet seen in use:

- **One session playing several specialists may blur them.** The screenshot review playbook
  flagged this risk. The default is one subagent per specialist; taking a role yourself is for
  quick spot-checks.
- **Briefs can drift generic.** The test for every line is whether a non-specialist would miss
  it. Cut lines any reviewer would write anyway.
- **Specialists can't always see.** A subagent without an image viewer can't judge a screenshot,
  and code alone doesn't show how a screen looks. The caller should gather what each brief's
  "What you need to see" asks for before calling. The shared rules tell a specialist to say when
  it's missing and propose a workaround.
- **Feeling-based specialists can blur into "make it nicer".** The advocates in "How it feels to
  the user" each judge one sentence a user would say, and their mistake lists name different
  moments. Call the user advocate first, and only the advocates it says are at risk.
- **Cost grows with the number of specialists.** Three specialists cost about three reviews.
  Call the fewest who cover the task.

## 7. What it does not cover

- Real professional advice. The legal and privacy specialists find gaps and say when a lawyer is
  needed; they don't replace one. The same goes for a security audit.
- Cloud sessions without this repo.
- Claude Code agent definitions (`.claude/agents/`). Specialists called very often could also
  become agents later. Doing that for all of them would load every description into every
  session.

## 8. Growing it

- **Writing a missing brief:** copy [template.md](template.md), keep it under about 80 lines with
  no project specifics, link the name in the index, and leave a note.
- **Adding a specialist:** add a line to the right area of the index. Reviews merge, rename and
  cut entries, so adding stays easy.
- **A specialist only one project needs:** put it in `projects/<project>/`, following
  [projects/README.md](projects/README.md). If a second project wants it, move it into the main
  index without the project details.
- **Notes:** after a use, add one line per specialist called to
  `notes/specialist-phone-book.md`. The first three fields are the usual note fields, so the
  sweep counts them as it counts any note; the last two make each line countable per specialist:

  ```md
  - <YYYY-MM-DD> · <project> · <worked | didn't | changed> · <Specialist> · <caught | missed | noise | couldn't see>: <one sentence>
  ```

  - **caught:** found something the caller wouldn't have, and the owner acted on it.
  - **missed:** something in its seat turned up later, from another specialist, a user or a
    store review. Add this line when it turns up, even weeks after the call.
  - **noise:** its findings were generic, wrong or rejected. Say which.
  - **couldn't see:** it lacked what its brief needs, and the workaround didn't help.

  Copy the specialist's brief feedback into the sentence when it gave some.

### Reviewing briefs

The monthly sweep reviews this playbook as a whole once it has 5 new note lines. Within it,
each brief is judged on its own notes, with these rules in place of the repo's pattern rule,
because one brief among many would rarely collect three notes on the same issue:

- **Edit a brief** after 2 notes on the same issue with it, or after 1 `missed` note whose miss
  belongs in its "Mistakes you catch" or "What you look at first". Brief feedback from the
  specialist counts as a note.
- **Let a change settle:** after editing a brief, wait for 2 new notes on it before changing it
  again.
- **A miss or noise in one project only** (its audience, its own content) goes into that
  project's addition under `projects/`, not the general brief.
- **At the repo review,** before trimming notes, count each specialist's calls and outcomes, and
  keep those counts in the SUMMARY line. Flag specialists never called in two repo reviews for
  merging into a neighbor; ask the owner before cutting any.

## 9. Builds on

- [App Store screenshot review](../app-store-screenshot-review.md): role passes kept separate,
  then merged into one plan. This playbook takes its report shape (findings, keep, what to change
  first) and makes the roles reusable.
- Subagents in Claude Code, Codex, or any agent tool that can start one with a prompt.
