---
name: story-research
description: Use when asked to research customers or users, jobs to be done, why people would or wouldn't switch to this product, or who to aim it at, from stories people share online.
---

# Customer story research

Find stories people tell online, in their own words, about the struggles this product addresses.
Each story stands in for a customer interview nobody ran. Check every quote against its page, rate
each story's four forces (push, pull, anxiety, habit), write the findings from the stories alone,
and only then compare them with the project's ideal-user profile. Spot-check the evidence and
build a report and a page. The run feeds five uses: who to aim at first, words to use, what to
build or write next, purchase hesitations, and where to find early users. You propose; a human
decides. Never contact anyone, and never change the product, a listing or the profile yourself.

The research fails if it only confirms what the project already believes, if a quote is invented
or misquoted, if it profiles individuals, or if it leans on one platform. The guards under Rules
exist for the first; the scripts exist for the rest.

## Project inputs

- Product brief: TODO(project): `docs/research/stories/product-brief.md`, two or three plain
  sentences on what the product does and how it's used, written for this skill. Leave out why it
  exists, who it's for and the problem it's meant to solve best: that is the hypothesis this
  research tests. Preflight fails a brief that echoes the profile.
- Solution words: TODO(project): words for the product's kind of solution that struggle-first
  searches leave out, e.g. "app", "game", "tool".
- The purchase hesitations are about: TODO(project): e.g. "the one-time paid upgrade", or "none
  yet".
- The ideal-user profile: TODO(project): `docs/research/stories/ideal-user.md`
- Language: TODO(project): English.

## Budget

Defaults for one run. The person starting the run can ask for more or fewer stories.

- About 60 counted stories (retained, with at least one checked quote). Finders gather about a
  third more, about 80, to allow for drops.
- One finder per 5 stories gathered (16 for a default run), all in parallel. A finder's context
  grows with every search, and finders are where a run's tokens go, so small slices cost less.
- At most two find waves.
- Force raters and fit scorers: batches of about 20 stories.
- A spot-check audit of 5 stories or a tenth of the counted stories, whichever is more.
- No platform supplies more than a fifth of the target, rounded up (12 of 60). `check.mjs`
  enforces it.

## Steps

Work in `docs/research/stories/<YYYY-MM-DD>/` (the run folder) from the project root. The scripts
are in `scripts/story-research/`, the briefs beside this file.

Planning, finding, force rating and writing the findings go to **fresh subagents**: new agents that
start with no copy of this conversation (in Claude Code, the Agent tool with a general-purpose
agent, never a fork).
Each prompt holds only what the step says: the brief to follow, the run folder, and its slice or
story ids. Put nothing else in those prompts: no words from the profile, no hint of who the product
is for, no findings of your own. Don't open the profile, the `fit/` files or `audit.json` yourself
until step 6.

`LINT` lines from the scripts are warnings: a guessed gender or a sentence-long situation label.
Fix the finds or batch file each one names, then rerun the script.

0. **Preflight and lock.** Run `node scripts/story-research/preflight.mjs <profile path> --brief
   docs/research/stories/product-brief.md`, adding any memory file your agent loads
   automatically (e.g. a `MEMORY.md` index) at the end. It follows the files those import or
   name. If it fails, stop and tell the human what it says: a file names the profile or restates
   a criterion, or the profile or its example story isn't filled in. When a project document the
   agents load says who the product is for, the human decides: take it out of what agents load
   for the run, or run anyway and say so in `notes.other`. Then create the run folder and write a
   `LEAD` file in it: the time, and which agent and session is leading. If the folder already
   holds a `LEAD` file, stop and ask the human: another lead may be running there.
1. **Plan.** Dispatch a fresh planning agent: "Read `.claude/skills/story-research/plan-brief.md`
   and follow it. Run folder: <path>. Date: <date>. Target: <n>. Finders: <n>." followed by the
   project inputs above except the profile. It writes `run.json` and `plan.md`: the situation map,
   phrases in both voices (at least half struggle-first), the sources, and one slice per finder.
2. **Find.** Dispatch the finders in parallel, each fresh: "Read
   `.claude/skills/story-research/finder-brief.md` and follow it. Run folder: <path>. You are
   f<n>; your slice is `### f<n>` in plan.md. Stop at about 5 stories." Each captures pages into
   `pages/`, checks its quotes with `check.mjs --local` and writes `finds/f<n>.json`.
3. **Check.** Run `node scripts/story-research/check.mjs <run folder>`. It merges every finds
   file, refetches each quote's page, drops quotes it can't find, caps platforms and writes
   `stories.json`. Look at each `NOT-FOUND` line: every quote missing on a page usually means a
   wall served at check time; a few means misquotes. If it prints `SHORT` or `SOLUTION-LED`, run
   one more find wave. `CAPPED` alone needs no wave: the cap already keeps the excess out of the
   count, so a run it leaves short prints `SHORT` too. Ask for one finder per 5 stories of the
   shortfall plus a third (at least one), or two when only `SOLUTION-LED` printed. The second
   wave's slices come from a fresh planning agent, never from you: "Read
   `.claude/skills/story-research/plan-brief.md` and follow its Second wave section. Run folder:
   <path>. Finders: <n>, starting at f<next>." followed by the check's own lines (counted and
   target, the `CAPPED` platforms, the struggle-first share) and the `newSituations` and
   `finderNotes` lists from stories.json, and nothing else. Dispatch those finders as in step 2,
   then run `check.mjs` again. After the second wave, carry on whatever it prints; the report
   says when a run is short.
4. **Rate.** List the retained ids with `node scripts/story-research/digest.mjs <run folder> --ids`
   and cut them into batches. Dispatch, all at once, a fresh force rater and a fit scorer for each
   batch: "Read `.claude/skills/story-research/forces-brief.md` and follow it. Run folder: <path>.
   Stories: <ids>. Write forces/b<n>.json." and "Read `.claude/skills/story-research/fit-brief.md`
   and follow it. Run folder: <path>. Profile: <profile path>. Stories: <ids>. Write
   fit/b<n>.json." When the force raters are done, run
   `node scripts/story-research/analysis.mjs <run folder>`. It merges the forces only; fit stays
   out of stories.json until step 6. If it lists problems, send the batch back to its agent with
   the problem lines and run it again. Never rerun check.mjs after this step: it rebuilds
   stories.json from the finds and renumbers quotes.
5. **Findings, before the profile.** Pick the audit's stories with
   `node scripts/story-research/digest.mjs <run folder> --pick` (5, or a tenth of the stories when
   that is more) and dispatch a fresh auditor: "Read `.claude/skills/story-research/audit-brief.md`
   and follow it. Run folder: <path>. Profile: <profile path>. Stories: <ids>. Write audit.json."
   At the same time, dispatch a fresh findings writer: "Read
   `.claude/skills/story-research/findings-brief.md` and follow it. Run folder: <path>. The
   purchase: <the purchase from the project inputs>." It writes
   `findings.json` (format below): the forces themes and the five findings, from the stories
   alone, and checks it with `build-report.mjs <run folder> --check-findings`. You may have read
   the profile while setting up the run; the findings go to an agent that never has, so
   `"writtenBeforeProfile": true` holds whoever installed it. When the writer is done, copy
   `findings.json` to `findings-before-compare.json`, unchanged: the record of the findings as
   written blind.
6. **Compare with the profile.** When the audit is back, make its fixes in the batch files, so
   `analysis.mjs` keeps them: correct unsupported ratings in `forces/` and `fit/`; to drop a
   wrong or misleading quote, delete it from stories.json and from every force in `forces/` that
   cites it (a force left without quotes becomes null). Where the auditor saw a force or fit part
   on the page that no quote shows, it lists the passage under `addQuotes`: add each with
   `node scripts/story-research/add-quote.mjs <run folder> <story id> <url> "<exact words>"`,
   which checks it against the auditor's capture and prints the new quote id, then cite that id in
   the story's entry in `forces/` or `fit/`. When the audit finds one mistake in more than one
   story, or a rule the raters or scorers read wrongly, dispatch a fresh agent with that step's
   brief to review that one rule across every batch: "Read
   `.claude/skills/story-research/<forces-brief.md or fit-brief.md>` and follow it. Run folder:
   <path>. (Fit only: Profile: <profile path>.) The audit found: <its note>. Review every story in
   `forces/` (or `fit/`) for this one rule only, fix the batch files in place, and reply with the
   stories you changed." Never send the review back to the agents that made the mistake. Then run
   `node scripts/story-research/analysis.mjs <run folder> --fit`, which merges forces and fit.
   Now open the profile and read the stories with their fit
   (`node scripts/story-research/digest.mjs <run folder> --with-fit`), and add to findings.json:
   `fitParts`, `compare` (where the stories agree with the profile and where they differ),
   `wrongAbout` and `profileChanges`. Leave the five findings as the writer wrote them; where the
   profile disagrees with one, say so under `compare.differs`. Change a finding only where the
   audit removed its evidence, and say so in `notes.other`. Run
   `node scripts/story-research/build-report.mjs <run folder>`; it refuses findings that cite a
   missing story or put an unchecked quote under Words to use or a forces theme. Fix and rerun
   until it writes `report.md` and `page.html`. Then update
   `docs/research/stories/sources-log.md`: one row per platform with what it yielded this run
   and what blocked you. Say what a venue gives the next run: "Shows App Store reviews in full
   text where the App Store page doesn't" helps the next planner; "All retained quotes
   rechecked" doesn't. Group personal blogs and newsletters into one "Personal blogs" row, so the
   log stays readable. Write yield and access only, never fit or anything from the profile: the
   next run's blind planner and finders read this log.
7. **Publish.** Publish `page.html` as a private page with your publishing tool (Claude Code's
   Artifact tool), and give the link. Without one, give the file's path.
8. **Clean up and hand back.** Delete the `LEAD` file. Keep `pages/`: it holds each page as the
   run read it, so a human can go back to a story's source even after the page changes or
   disappears. It stays out of git. Give a short summary: counted stories against the target,
   platforms, one line per finding, what the comparison with the profile found, the audit
   result, the struggle-first share, the page link, the time and tokens from the run log, and
   anything that failed.

**Without subagents**, one agent runs steps 1 to 5 in order, following each brief itself: plan,
find, check, rate the forces and write the findings, all before opening the profile, and skips
the snapshot. Then it
scores fit, audits five stories and writes the comparison. Say in `notes.other` that blindness
was by order only.

### findings.json

```json
{ "writtenBeforeProfile": true,
  "forces": { "push": [ { "theme": "...", "stories": ["s001"], "quotes": ["s001/q2"] } ], "pull": [], "anxiety": [], "habit": [] },
  "findings": { "aim": [ { "text": "...", "stories": ["s001"] } ],
                "words": [ { "quote": "s001/q2", "note": "where to use it" } ],
                "build": [], "hesitations": [], "where": [] },
  "fitParts": ["five short labels for the profile's criteria, in order"],
  "compare": { "agrees": [ { "text": "...", "stories": ["s002"] } ], "differs": [] },
  "wrongAbout": [ { "text": "...", "stories": ["s004"] } ],
  "notes": { "sources": [], "blocked": [], "newSituations": [], "profileChanges": [], "other": [] } }
```

Written in step 5 by the findings writer, from the stories alone (its brief repeats these):

- **forces:** the main themes under each force across all stories, each with the stories that
  show it and one to three representative checked quotes.
- **aim** (who to aim at first): the groups and situations where the push is strongest and
  people have already tried or paid for something.
- **words** (words to use): people's own words for the struggle and what they wanted, for store
  listings and web pages, with where each could go. Checked quotes only; the report prints the
  quote's exact text, never a rewording.
- **build** (what to build or write next): situations, features and content people are missing.
- **hesitations** (purchase hesitations): what makes people hesitate to pay for the purchase
  above, or anything like it.
- **where** (where to find early users): the venues where the strongest-push stories turned up.

Written in step 6, with the profile open:

- **fitParts:** short labels for the profile's five criteria, for the story cards. Empty until
  then.
- **compare:** where the findings agree with the profile, and where they differ: groups it leaves
  out, criteria the stories don't bear out, situations it doesn't name.
- **wrongAbout:** your notes on the stories the report lists as people we might be wrong about
  (strong push, low fit): what the profile may be missing.
- **notes:** sources that worked or didn't, blocks, new situations, suggested profile changes
  (proposals only; a human edits the profile), and anything else.

Every claim cites the stories behind it. Say when a claim rests on one or two stories.

## Run log while the playbook is young

Until the playbook's notes list three projects, also write `run-log.md` in the run folder: each
step with its start time and duration, each subagent's tokens (from its completion notice, or
"not reported" when your harness doesn't give them), what worked, what didn't, what you changed
and why. Keep it short. Keep the run folder to the files the playbook names; put test output,
extra digests and scratch files somewhere else. Its lessons go into the playbook
note and, if they're fixes, into the playbook. If a subagent stops on a usage limit, resume it
rather than starting a new one: its work so far is kept.

## Rules

- **Access:** public pages only, one page at a time, no bulk scraping. Allowed: the agent's own web
  search and page reading; fetching a single public page's raw text directly; feeds or APIs a
  site publishes for public reading. Not allowed: logins or signed-in browsers, closed groups,
  disguising requests, solving captchas, archive copies used to get round a block, undocumented
  endpoints. A refusal is logged and the finder moves on.
- **Quotes are word for word** from the captured text in `pages/*.txt`, never from a tool that
  summarizes or answers questions about a page. A quote is one unbroken passage of three or more
  words, never pieces joined with "..." or "…", and records the page it came from.
- **One story is one thread:** the post, its edits and updates, every reply the original poster
  made to commenters, and any link the poster gave to their own follow-up post. Never the
  poster's profile or other posts.
- **A commenter's own experience is a separate story** from the same thread. On a page of reviews
  each reviewer is a commenter.
- **Record who said it.** Each story keeps its author: the name or username the page shows for
  the storyteller, exactly as shown, or null when it shows none. With the thread link, it lets a
  human find the post again. Speakers stay `poster` or `commenter-N`. Study situations, not
  people: never look anyone up or follow them to other posts.
- **Never save the profile or its criteria to agent memory**, and never copy them into a file
  agents load automatically or into the product brief.
- **Prefer stories from the last five years,** and record every story's date.
- **The guards** against confirming what we already believe:
  1. At least half of each run's searches describe the struggle or situation without the
     solution words. `check.mjs` measures the searches actually run.
  2. The planning agent, finders, force raters and findings writer never see the profile or the
     score, and the planner learns about the product only from a brief that doesn't say who it's
     for.
  3. Finders bring counter-stories: people who tried something similar and dropped it, are happy
     with what they do now, or don't see a problem.
  4. A fresh agent writes the findings from the stories before anyone compares them with the
     profile; then you compare. The report says where the stories and the profile agree, where
     they differ, and who it may be wrong about: strong push, low fit.
- **Profile changes are proposed only,** in the findings' notes.
- If a script's output looks wrong mid-run, stop and show it with a small example. Fix the script
  in the playbook first, then rerun from the step that uses it.
