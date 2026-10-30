# Customer story research (jobs to be done from public stories)

Agents search the web for people telling, in their own words, the story of a struggle a product
solves. Each story stands in for a customer interview nobody ran. Every quote is checked against
its page and every story is analyzed with the Jobs to Be Done four forces. The findings are
written from the stories alone, then compared with the project's ideal-user profile. A fresh
agent spot-checks the evidence, and the run ends in a report and a filterable page. For any product with an audience that talks about its problems online;
the scripts are dependency-free Node.

**Status: unproven.** The owner asked for this playbook directly; it was not promoted by a review
from a journal entry. It has run on one project so far: two independent trial runs and a
composite of them, from which this version was revised. Its hypothesis, that public stories carry
enough signal to stand in for interviews, holds only once runs on other projects show their
owners things they didn't know and would act on. Until three projects have left notes, every run
keeps a run log (see the skill).

**Adopt it when** you need to decide who to aim a product at, which words to use in a listing or
landing page, what to build or write next, or why people hesitate to pay, and nobody has talked
to customers yet. After launch, talk to real users and read your own reviews and support mail
first; this playbook doesn't cover them.

---

## 1. Why use it

Without it, an agent asked "who should we aim this at?" answers from the product's own words or
from generic advice, and a team searching by hand finds the people who already agree with it.
Quotes get paraphrased on the way into notes and then into store copy, and nobody can trace a
claim back to who said it.

With it, every claim in the report links to the stories behind it, every quote under Words to
use was found word for word on its page by a script, and four guards push against confirming
what the team already believes:

1. At least half the searches describe the struggle without the product's solution words.
2. The agents that plan, find and rate stories and write the findings never see the ideal-user
   profile or the score, and the planner learns about the product only from a brief that doesn't
   say who it's for.
3. Finders bring counter-stories: people who dropped something similar or see no problem.
4. A fresh agent writes the findings from the stories alone. Only then does the lead open the
   profile and compare: where the stories agree with it, where they differ, and people we might
   be wrong about (a strong push but a low fit).

The profile is kept as the hypothesis the run tests, not the lens it searches through. Without
one, nothing in the report could show the team it was wrong.

It is a failure, even if it runs, when it only confirms what the project believes, when a quote
is invented or misquoted (worst of all in store or web copy), when it profiles individuals
instead of situations, or when it leans on one platform.

Figures come from two trial runs on one project (a party-games app) with an earlier version of
this playbook, one led by Claude Code and one by Codex, and from a composite that pooled them.
Treat them as rough:

| | Claude trial | Codex trial | Composite |
|---|---|---|---|
| Counted stories (target) | 45 (35) | 40 (30) | 88 (65), pooled, no new search |
| Finders | 7, then 1 in a second wave | 8, three at a time | none |
| Subagent tokens | 1.39M, about 31k a story | not reported by its harness | 750k |
| Finders' share of tokens | 72% | – | – |
| Working time | about 38 min | about 36 min (approximate) | about 20 min |

At the Claude trial's rate, a default run of 60 stories needs about 1.9M subagent tokens, more
than the 1–1.5M first estimated, and 40–60 minutes (estimated, not measured). The findings
writer adds about 110k, and each audited story about 14k. The human writes the profile once (about
15–30 minutes, estimated) and reads the report (about 15 minutes).
TODO(review): replace with figures from notes.

**Who does what**

- **Scripts:** `fetch-text.mjs` captures one public page's raw text. `check.mjs` merges finds,
  refetches every quote's page and drops quotes it can't find, and caps any platform at a fifth
  of the target; with `--local` a finder checks its own file offline. `analysis.mjs` merges the
  force ratings, and with `--fit` the fit scores. `digest.mjs` prints a compact view of the
  stories, without fit unless asked. `build-report.mjs` checks every claim's citations and builds
  `report.md` and `page.html` from one set of data; with `--check-findings` it checks the findings
  before the profile is read. `add-quote.mjs` adds a passage the audit found, without
  renumbering. `preflight.mjs` checks that no file the blind agents load mentions the profile or
  restates it in other words. The scripts also print `LINT` warnings for guessed genders and
  sentence-long situation labels.
- **Agents:** a planning agent maps situations, phrases and sources; one finder per 5 stories
  gathers them; force raters, fit scorers, a findings writer and an auditor each work from a
  short brief; the lead runs the scripts, then compares the findings with the profile.
- **Human:** writes and owns the ideal-user profile and the product brief, reads the report and
  decides what to act on.

---

## 2. How it works

### Terms

- **Story:** one person's account of the struggle, from one thread: the post, its edits and
  updates, every reply the original poster made to commenters, and any follow-up post the poster
  linked. A commenter's own experience is a separate story from the same thread.
- **Speaker:** `poster` or `commenter-N`, numbered per thread in the order the run found them,
  not by their place on the page. On a page of reviews there is no poster, and each reviewer is a
  commenter.
- **Author:** the name or username the page shows for the storyteller, exactly as shown, or null.
  With the thread link, it lets a human find the post again.
- **Story type:** `switch` (they tried something new: all four forces can show), `plea` (asking
  for help: mostly push and habit), `review` (a product review of an alternative: a short switch
  story) or `counter` (dropped something similar, happy as they are, or sees no problem).
- **Quote:** one unbroken passage of at least three words in the storyteller's own words, with
  the page it came from. Never pieces joined with "...". It carries a note when it's about a
  different moment, place or person than the story's situation. Its length isn't capped.
- **Quote check:** `checked` (found on its page as whole words, ignoring case, spacing and quote
  marks), `not-found` (dropped), or `unrechecked` (the page couldn't be fetched again: kept and
  marked, counted in the forces, never used under Words to use).
- **Counted story:** a retained story with at least one checked quote. Run size is counted
  stories.
- **Excess story:** one a platform supplied beyond its cap; kept in `stories.json`, left out of
  the report.
- **Forces:** push (what made the present hard to bear), pull (what drew them to something new),
  anxiety (what worried them about it), habit (what kept them where they were). Each is a summary,
  a strength (`weak`, `clear` or `strong`) and the quotes that show it, or null: "not in the story".
- **Fit:** five parts scored 0, 1 or 2 against the profile's criteria, or null when the story
  doesn't show that part (0 means it shows the opposite). Total and parts shown are kept, with a
  confidence: `thin` when under 4 parts are shown or the story is one post or review under 150
  words (the finder records a rough word count), otherwise `solid`.
- **Struggle-first search:** a search without the product's solution words.
- **People we might be wrong about:** retained stories with a strong push, at least 4 fit parts
  shown and a fit total of 4 or less.
- **Product brief:** two or three plain sentences on what the product does and how it's used,
  without who it's for or the problem it should solve best. It is all the planner learns about
  the product.

### The run

```
0. Preflight   preflight.mjs <profile> --brief product-brief.md     stop if it fails
                 └ write LEAD in the run folder; stop if one is already there
1. Plan        fresh agent + plan-brief.md, reads the product brief → run.json, plan.md
2. Find        one fresh finder per 5 stories + finder-brief.md, in parallel
                 └ captures pages with fetch-text.mjs → pages/; checks its file with
                   check.mjs --local; writes finds/f<n>.json
3. Check       check.mjs <run>   → stories.json
                 └ SHORT or SOLUTION-LED → a fresh planner adds second-wave slices,
                   one more find wave, then check again (CAPPED alone needs none)
4. Rate        force raters (blind) and fit scorers, all at once, batches of ~20
                 → forces/b<n>.json, fit/b<n>.json
                 └ analysis.mjs <run>   merges forces only; fit stays out
5. Findings    fresh auditor + audit-brief.md on 5 stories or a tenth → audit.json
                 ‖ fresh findings writer + findings-brief.md, from the stories alone
                   → findings.json, checked with build-report.mjs --check-findings;
                   the lead copies it to findings-before-compare.json
6. Compare     audit fixes in forces/ and fit/; add-quote.mjs for passages the audit found;
               a fresh review of any rule the audit found broken more than once
                 └ analysis.mjs <run> --fit
                 └ the lead opens the profile and adds the comparison to findings.json
                 └ build-report.mjs <run>   → report.md, page.html
7. Publish     page.html as a private page, or its file path
8. Clean up    delete LEAD; keep pages/ (git-ignored); hand back a summary
```

Without subagents, one agent runs steps 1 to 5 (through the findings) before ever opening the
profile, and the report says blindness was by order only.

**Blind means blind to the profile and the score, not to the product.** Subagents load the
project's agent instructions automatically, so finders know what the product is. The profile
stays out of anything that loads automatically and out of the blind agents' briefs; preflight
checks the first, and the briefs list exactly what each agent may read. Running finders as
separate processes in an empty folder was considered and rejected as too heavy for what it adds.

The product description is the other way in. In the trial, the planner read a design doc that
stated the team's thesis (the problem is thinking up the next game, for people physically
together), and its plan opened by restating it: the profile's first three criteria, in other
words. The planner now reads only a neutral product brief, and preflight fails a brief that
echoes a criterion.

**The profile is read last.** A fresh findings writer writes the five findings from the stories,
never seeing the profile, the fit scores or the audit. The lead can't do this blind: in both
trials it had filled in the profile during setup. Then the lead merges fit and writes a
comparison: where the stories agree with the profile, where they differ, and who it may be wrong
about. The findings
stay as written; disagreements go in the comparison. The report's header says which way round
they were written.

### Files

In each project, under `docs/research/stories/`:

| File | What it holds |
|---|---|
| `ideal-user.md` | The profile and its five fit criteria with anchors. Human-edited. |
| `product-brief.md` | What the product does, in two or three sentences, without who it's for. Human-edited. |
| `sources-log.md` | What each platform yielded and what blocked agents, across runs |
| `<date>/run.json` | Date, product line, target, solution words |
| `<date>/plan.md` | Situation map, phrases in both voices, sources, one slice per finder |
| `<date>/finds/f<n>.json` | Each finder's stories, every search it ran, blocks, new phrases and situations |
| `<date>/LEAD` | Written at step 0, deleted at step 8: one lead per run folder |
| `<date>/pages/` | Captured page text: each page as the run read it, kept so a story can be traced to its source. Git-ignored |
| `<date>/stories.json` | Merged, checked, capped stories, then their forces and fit |
| `<date>/forces/`, `fit/` | The raters' and scorers' batch files |
| `<date>/audit.json` | The spot-check audit |
| `<date>/findings.json` | The findings writer's themes and findings, then the lead's comparison and notes, citing stories and quotes |
| `<date>/findings-before-compare.json` | The findings as the writer left them, before the comparison |
| `<date>/report.md`, `page.html` | The report, and the same content as a page |
| `<date>/run-log.md` | Steps, time, tokens, problems; while the playbook is young |

### Data formats

`finds/<finder>.json`:

```json
{ "finder": "f1",
  "queries": ["every search actually run"],
  "stories": [ { "thread": "thread or review page URL", "posted": "YYYY-MM-DD or null",
                 "type": "switch|plea|review|counter", "speaker": "poster|commenter-N",
                 "author": "name the page shows, or null", "words": 120,
                 "situation": "...", "group": "...",
                 "quotes": [ { "text": "...", "url": "page the quote was copied from",
                               "note": "optional: about another moment" } ] } ],
  "blocked": [ { "url": "...", "reason": "..." } ],
  "newPhrases": ["..."], "newSituations": ["..."], "notes": ["ran dry: ...", "venue tips"] }
```

`stories.json`, written by `check.mjs` and extended by `analysis.mjs`:

```json
{ "run": { "date": "...", "product": "...", "target": 60, "solutionWords": [], "searches": 0,
           "struggleShare": 0.6, "short": false, "blocked": [], "newPhrases": [], "newSituations": [],
           "finderNotes": [],
           "audit": { "checked": 0, "notFound": 0, "unrechecked": 0, "droppedStories": 0 } },
  "stories": [ { "id": "s001", "thread": "...", "platform": "forum.example", "posted": null, "found": "YYYY-MM-DD",
                 "type": "plea", "speaker": "poster", "author": "...", "words": 120,
                 "related": ["s002"], "situation": "...", "group": "...",
                 "excess": false,
                 "quotes": [ { "id": "q1", "text": "...", "url": "...", "check": "checked" },
                             { "id": "q2", "text": "...", "url": "...", "note": "...", "check": "checked", "added": "audit" } ],
                 "trigger": null, "job": null, "forces": null, "fit": null } ] }
```

After analysis, `forces` is `{push, pull, anxiety, habit}`, each null or
`{summary, strength, quotes: ["q1"]}`, and `fit` is
`{parts: [{score, reason}] ×5, total, shown, confidence}`. `run.audit` counts the quote check;
the spot-check audit is `audit.json`:
`{ "s003": {attribution: ok|wrong, context: ok|misleading, forces: supported|overstated|understated, fit: supported|unsupported, note, addQuotes?: [{text, url, shows}]} }`.
`findings.json` is described in the skill: the forces themes and five findings written before the
profile is read, then `fitParts`, `compare` (`agrees`, `differs`), `wrongAbout` and notes, with
`writtenBeforeProfile` saying which way round it was done.

### Rules the scripts apply

- **Quote match:** both sides are folded (Unicode NFKC, lower case, soft hyphens and zero-width
  characters removed, curly quotes and dashes to plain, the ellipsis character to "...", emoji
  removed, whitespace collapsed). The quote must then appear with no word going on directly
  before or after it, so "a car" never matches inside "a carpet", nor "we can" inside "we
  can't". A quote with "..." or under three words never matches. `check.mjs` prints a
  `NOT-FOUND` line for each page with missing quotes, so a wall served at check time can be told
  from a misquote.
- **One thread, many URL forms:** `www.`, `m.`, `old.`, `new.`, `np.` and `amp.` prefixes,
  `http`, a trailing slash, the `#fragment` and `utm_*`, `fbclid` and `gclid` parameters don't
  make a different page. Posters of one thread merge into one story; commenters merge only when
  they share a quote, because each finder numbers commenters on its own.
- **Platform cap:** at most `ceil(target × 0.2)` retained stories per platform; the ones with
  the most checked quotes stay. A site's other names (`redd.it`, regional Amazon stores, the App
  Store's review feed host) count as one platform, and each shared blog host (Substack,
  Blogspot, WordPress.com, Medium, Tumblr) is one platform.
- **Page capture:** an honest User-Agent (`story-research/1 (reads one public page)`), 20 s
  timeout, 5 MB limit; HTML, RSS or Atom feeds, plain text and JSON only; under 5 words means a
  script-only shell.
- **Blindness preflight:** fails if the profile's five criteria or its example story aren't
  filled in, or if `CLAUDE.md`, `CLAUDE.local.md`, `.claude/CLAUDE.md`, `AGENTS.md`, the
  `CLAUDE.md`, `CLAUDE.local.md` and `AGENTS.md` of every parent folder, `~/.claude/CLAUDE.md`,
  `~/.codex/AGENTS.md`, the extra files given, anything they `@import`, or any `.md` file they
  name in prose (looked for beside the naming file first) names the profile file or repeats one
  of its fit criteria. Every file agents load, the product brief included, also fails when any
  sentence holds two thirds of a criterion's content words, which catches a criterion said in
  other words. A file another document only mentions gets the exact checks.
- **Two merges:** `analysis.mjs` merges the force ratings and keeps fit out of `stories.json`, so
  the lead's findings can't lean on it; `analysis.mjs --fit` merges both for the report.
- **Finder check:** `check.mjs --local <run> <finds file>` checks one finder's quotes against its
  own captures, offline, with the same matching as the run's check.
- **Lint:** `check.mjs`, `analysis.mjs` and `build-report.mjs` print `LINT` lines for situation
  labels over 8 words and he/she words in summaries, reasons and audit notes. They are warnings
  for the lead to fix in the file they name. Names aren't linted: authors are kept on purpose.
- **Audit size:** `digest.mjs --pick` with no number picks 5 stories or a tenth of the retained
  ones, whichever is more.
- **Adding a quote after rating:** `add-quote.mjs` checks one passage against the auditor's
  capture with the same matching and appends it with the story's next quote id, marked
  `"added": "audit"`, without touching the other ids. The report lists these in its run notes.
- **Findings check:** `build-report.mjs --check-findings` checks findings.json against the rated
  stories before fit is merged, and writes nothing. `fitParts` may stay empty until step 6.
- **Report:** Words to use and forces themes accept only checked quotes, and print the quote
  record's own text, never a finding's rewording, with its speaker and author. Every claim must cite retained stories; a
  forces theme only stories that show that force; people we might be wrong about only stories
  that show at least 4 fit parts. Section 4, "Compared with the profile", holds where the stories
  agree with it, where they differ, and people we might be wrong about.

### Pooling runs

Two runs with different planners can cover different ground: the two trials, from one brief and
one playbook, found no thread in common. To pool them into one study, as the composite did:

1. Copy each run's finds files into one new run folder, renamed per run (`af1…`, `bf1…`), and
   change each file's `finder` to match: the merge treats one finder's `commenter-2` as one
   person, and every run numbers its finders f1, f2…. Copy each run's `pages/` too, so raters
   can read context.
2. Set the target to the sum of the runs' targets, so the platform cap scales.
3. Run the check, then rate every story again with one set of fresh raters and scorers against
   one profile: the runs' own ratings may come from different scales.
4. Keep a map from each new story id to its run and original id, so the report can say where each
   came from.
5. Carry on from step 5 as usual.

---

## 3. Setup checklist

1. **Node 20 or later** (built-in `fetch`, `node:test`; tested on Node 24). No packages.
2. **Copy the files** in this playbook's `files/` folder into the project root, at the same paths
   (section 4). From the playbooks repo:

   ```sh
   cp -r playbooks/customer-story-research/files/scripts <project root>/
   cp -r playbooks/customer-story-research/files/.claude <project root>/
   cp -rn playbooks/customer-story-research/files/docs <project root>/
   ```

   `-n` never overwrites a profile, brief or sources log the project already has (recent GNU `cp`
   warns that `-n` is non-portable; the copy still works). When updating
   an install, keep the filled Project inputs in `SKILL.md`. The tests never touch the network.
3. **Fill the skill's inputs:** the `TODO(project):` lines in `.claude/skills/story-research/SKILL.md`:
   the product brief's path, the solution words, the purchase, the profile path and the language.
4. **Fill in `docs/research/stories/ideal-user.md`.** A human fills in the profile: who they are, who isn't a fit (with any age or ability floor),
   five fit criteria, one of them measuring need, each with what 0, 1 and 2 look like in a story,
   and one short made-up example story, scored. Never paste the profile or its criteria into
   `AGENTS.md`, `CLAUDE.md`, any file those tell agents to read, or agent memory.
5. **Write the product brief:** two or three plain sentences on what the product does and how
   people use it. Leave out who it's for, why it exists and the problem you think it solves best;
   don't paste the design doc's pitch. "A phone app of party games; one person reads each prompt
   aloud" is a brief, and so is "A web app that turns photos of receipts into expense claims".
   "For parents who run out of ideas on long drives" and "for freelancers who hate paperwork"
   are hypotheses, and the run exists to test them.
6. **Ignore captured pages** in `.gitignore`: `docs/research/stories/*/pages/`. They are copies
   of other people's pages, kept after the run so a story can be traced to its source, and don't
   belong in git.
7. **If the repo is public, keep run folders out of git entirely:** add
   `docs/research/stories/*/` to `.gitignore`. Run folders hold real people's quotes and the
   names they post under. The profile, the brief and the sources log can stay.
8. **Paste the agent rule** into `AGENTS.md` (section 5).
9. **Let agents run the scripts.** Finders run `fetch-text.mjs` for every page and `check.mjs
   --local` once; raters, the findings writer and the auditor run `digest.mjs`; the findings
   writer runs `build-report.mjs --check-findings`. If your agent asks permission per
   command, allow `node scripts/story-research/*` for the project.
10. **Run the acceptance test** (section 6).

---

## 4. Starter code

Every file is in [`files/`](files/), at the path it takes in the project, ready to copy. Comments
in each explain what it does and why. `stories.mjs` holds the shared rules (quote matching, URL
forms, the cap, validation), so every script checks the same way. Tests sit beside the scripts.

| Path | What it is |
|---|---|
| `scripts/story-research/stories.mjs` | Shared rules: quote matching, URL forms, platforms, the cap, validation, lint |
| `scripts/story-research/fetch-text.mjs` | Captures one public page's raw text into `pages/` |
| `scripts/story-research/check.mjs` | Merges finds, refetches every quote's page, caps platforms; `--local` for one finder's file |
| `scripts/story-research/analysis.mjs` | Merges force ratings, and with `--fit` the fit scores |
| `scripts/story-research/digest.mjs` | A compact view of the stories; `--ids`, `--pick`, `--with-fit` |
| `scripts/story-research/add-quote.mjs` | Adds one passage the audit found, without renumbering |
| `scripts/story-research/build-report.mjs` | Builds `report.md` and `page.html`; `--check-findings` for step 5 |
| `scripts/story-research/page-template.html`, `page-filter.mjs` | The page and its story filter |
| `scripts/story-research/preflight.mjs` | The blindness check |
| `scripts/story-research/*.test.mjs` | Tests: `node --test scripts/story-research/*.test.mjs`, from a local server, never the network |
| `.claude/skills/story-research/SKILL.md` | The lead's procedure |
| `.claude/skills/story-research/*-brief.md` | The six briefs: plan, finder, forces, fit, findings, audit. Only the fit and audit briefs mention the profile |
| `docs/research/stories/ideal-user.md`, `product-brief.md` | Templates for a human to fill in |
| `docs/research/stories/sources-log.md` | The sources log, with the refusals known so far |

**Changing the playbook:** edit the files here, then run the tests in place:
`cd playbooks/customer-story-research/files && node --test scripts/story-research/*.test.mjs`.
Two template tests skip once the templates are filled, so in a project they report as skipped.

---

## 5. Agent rule

Paste into `AGENTS.md`:

```md
- For customer or user research, jobs to be done, why people would or wouldn't switch to this
  product, or who to aim it at, follow `.claude/skills/story-research/SKILL.md`. Runs go in
  `docs/research/stories/<date>/`. They propose; only a human changes the product, a listing or
  the profile they score against.
```

Why each part is there:

- **The trigger words** make agents without skill auto-loading (Codex, others) find the procedure,
  and match how people ask ("who should we aim this at?", "why would people switch?").
- **The run folder** keeps every run dated and comparable with the next.
- **"Only a human changes"** because the report's suggestions are hypotheses from public stories,
  not decisions.
- **What it leaves out:** the rule never names the profile file. `AGENTS.md` loads into every
  agent, finders included, and preflight would fail.

---

## 6. Acceptance test

1. **The suite passes.** `node --test scripts/story-research/*.test.mjs` passes every test,
   without the network.
2. **Preflight passes, and catches leaks.** `node scripts/story-research/preflight.mjs
   docs/research/stories/ideal-user.md --brief docs/research/stories/product-brief.md` prints
   `Preflight passed`. Add a line naming the profile file to `AGENTS.md` and run it again: it
   exits 1 and names `AGENTS.md`. Remove the line. Add a sentence to the brief that restates one
   of the fit criteria in other words: it exits 1 and names that criterion. Remove it.
3. **The check runs on a hand-made finds file.** Make `docs/research/stories/test/` with a
   `run.json` (`{"date": "<today>", "product": "test", "target": 8, "solutionWords": ["app"]}`).
   Capture any public page with `node scripts/story-research/fetch-text.mjs <url>
   docs/research/stories/test`, copy one sentence from the text file into `finds/f1.json` as a
   poster story's quote (with that URL), and add a quote that isn't on the page. Run
   `node scripts/story-research/check.mjs docs/research/stories/test`: it prints a summary with
   `1 checked` and `1 not found`, a `NOT-FOUND 1/2` line for the page, `SHORT 1/8`, and
   `SOLUTION-LED 0.00` (the hand-made file logs no searches). Delete the folder.
4. **Unprompted use.** In a fresh session, ask "who should we aim this at?" without naming the
   skill. The agent follows the skill, starting with preflight, rather than answering from the
   product docs.

---

## 7. Gotchas

From a first trial (8 stories, two finders), two fuller trial runs led by Claude Code and Codex
(2026-10-29) and a composite that pooled them (2026-10-30), all on one party-games app. The fixes
are already in the starter code.

- **Names are kept on purpose.** The first trial's auditor wrote usernames into its notes, and the
  briefs then forbade names. The owner later chose to keep each story's author as the page shows
  it: the posts are public, and the name makes a story easy to find again. Speakers stay
  `poster` or `commenter-N`, and nobody is looked up.
- **Gender guesses.** The force rater wrote "she" and "he" for storytellers who never said; the
  auditor caught it in two of five stories. The briefs now say "they" unless the story says.
- **"One short post" was too vague.** The fit scorer rated an 85-word review as solid
  confidence. Thin now means under 4 parts shown, or one post or review under 150 words.
- **Situations written as sentences.** Finders described each situation in a full sentence, so
  the report's "Situations covered" line ran to a paragraph and the situation filter matched
  nothing useful. Finders now use short labels from the plan's situation map.
- **A child's review.** One app-store review was written by a child. Such stories stay: they can
  show what children want, and they count like any other story.
- **The planner rounded the cap down.** It read "a fifth of 8" as 1 per platform; the cap is 2.
  The plan brief now says "rounded up (12 of 60, 2 of 8)".
- **Audit fixes and reruns.** A fix made in `stories.json` is undone when `analysis.mjs` merges
  the batch files again, and rerunning `check.mjs` after rating renumbers quotes. Audit fixes now
  go in `forces/` and `fit/`, and `check.mjs` never reruns after step 4.
- **Fit waited on forces for nothing.** Fit scorers don't need the force ratings; they now run
  alongside the force raters.
- **The web search tool refuses some domains.** Claude Code's web search refused reddit.com and
  one large parenting forum outright. The guard against leaning on Reddit is partly enforced by
  the tool; plan for other venues.
- **Many forums refuse an honest script.** Of 32 platforms the finders logged, 19 refused or hid
  their text: 403 from travel, cruise, RV, teacher and several parenting forums and from a
  marketplace. Blogs, local parents' sites, theme-park and grandparents' forums, app-store and
  book reviews worked. Finders log refusals and move on, and the sources log carries them to the
  next run.
- **Script-loaded text.** Video comments and some review sites load their text by script, so a
  capture holds none of it. One retailer shows only review excerpts unless signed in, and one
  forum served page 1 for every later page of a thread.
- **Finders are the cost.** The two finders used 56% of subagent tokens and 82% of cache reads:
  103 searches for 13 stories, 14 of 38 captures refused, 10 ad-hoc quote checks, and a context
  that grew with every search (127k tokens a turn on average for one finder). Finders now carry
  about 5 stories each, move on after about 5 dry searches in a situation, skip sites the
  sources log marks as refusing, and check their file once with `check.mjs --local`. Raters read
  a digest instead of whole pages, and the findings are written while the audit runs.
- **The product description carried the hypothesis.** The trial's planner read a design doc that
  stated the team's thesis, and its plan opened by restating it: three of the profile's five
  criteria, in other words, reached the blind agents anyway. The planner now reads only a neutral
  product brief, and preflight fails a brief that echoes a criterion.
- **The profile shaped the findings.** The first trial's lead read the profile before writing "who
  to aim at first", so that finding leaned toward it. The lead then wrote the findings first, but
  in both later trials it had filled in the profile itself during setup, so it was blind by order
  only. A fresh findings writer now writes them, and the lead keeps a copy as written.
- **Fixes by hand after the audit.** The lead removed names, fixed guessed genders and found every
  situation label too long, one at a time. The scripts print `LINT` lines for labels and genders;
  on the trial's data they flagged every label and 22 gender guesses, more than the audit caught.
  The gender lint can't tell the storyteller from a child or parent the quotes name, so the lead
  still reads each line.
- **Two-part anchors were scored on silence.** An independent audit of all 13 trial stories, by a
  fresh agent against the live pages, found every quote word for word, correctly attributed and
  not misleading. But four of 13 fit scores gave "talks together and avoids screens" a 2 when the
  story never mentioned screens, while two others gave the same silence a 1. The fit brief now
  says silence is not evidence, and the profile template asks for anchors that name one thing a
  story can show.
- **A force the finder didn't quote can't be rated.** One author's worries about screens were on
  the page, but the finder hadn't collected that passage, so the anxiety force stayed empty.
  Finders now gather what people think of the alternatives they didn't choose. It happened again
  in three stories across the later runs, so the auditor now lists the passage and the lead adds
  it with `add-quote.mjs`.
- **Contractions fooled the word check.** A review of the starter code found "we can" matched
  inside "we can't", inverting the quote. A word now continues through an apostrophe followed by
  a letter.
- **Text ran into opening tags.** "…that drive<div>Signed" became "driveSigned", so a genuine
  quote failed the check. Opening block tags now break lines too.
- **The lead wrote second-wave slices.** The lead may know the profile, so a fresh planning agent
  now writes them from the check's numbers alone.
- **Preflight missed files named in prose.** An instruction file saying "Read
  docs/design/design.md" loads that file into every agent, but only `@imports` were followed.
  Preflight now follows `.md` files named in prose, takes the product file, and fails on an
  unfilled profile.
- **A personal blog's domain is often a name.** The sources log is committed, so personal blogs
  and newsletters are listed by kind, and the log never records fit, since the next blind
  planner reads it.
- **The spot-check sample caught the pattern late.** The run's own audit of 5 stories found one of
  the four silence-scored parts; the full audit found all four. Five stories is enough to catch a
  wrong quote, which is the audit's main job, but not every scoring habit. The composite's audit
  of 10 found context or force problems in 4. The audit now reads 5 stories or a tenth, whichever
  is more, and a mistake it finds more than once gets a fresh review across every batch; Codex's
  own review of one flagged fit score found 18 more.
- **The findings check wanted the profile's labels.** The composite's blind findings writer left
  `fitParts` empty, and the check accepted only five labels. Empty now passes until step 6, and
  `--check-findings` checks the file before fit is merged.
- **Preflight missed what parent folders load.** The Claude trial's install sat inside the
  project. The parent `CLAUDE.md` said "Read and follow `AGENTS.md`", and preflight read the
  install's `AGENTS.md` instead, and never read parent `CLAUDE.md` files at all. Loaded files got
  only the exact-wording check, so `design.md`, which says who the app is for in other words,
  passed in both runs. Preflight now reads parent folders, looks for a named file beside the file
  that names it first, and gives every loaded file the looser check. A first version also flagged
  documents `design.md` only mentions, which agents don't load; those get the exact checks only.
- **A planner filtered out story types.** Codex's plan told finders to treat asking threads as
  leads, which left 1 plea and 2 reviews in 40 stories and almost no evidence on why people
  hesitate to pay. The plan brief now keeps every story type and asks each slice for reviews of
  something paid.
- **Quotes read out of their moment.** The composite's audit found an evening complaint read as
  part of a hospital wait, and someone else's children read as the poster's own. Finders now note
  a quote about a different moment, place or person, and raters rate it for that moment. Quote
  length isn't capped: the owner chose to keep long passages for the nuance of a person's job.
- **Attitude anchors.** Codex's anchor for one criterion ("a mixed preference about screen-based
  activities") needed 19 of 40 scores corrected. The template now asks for anchors that are
  things that happen in a story.
- **The profile measured resemblance, not need.** In the composite, 6 of the 9 best-fitting
  stories came from people happy as they were, and many strong-push stories were about children
  too young to play. The template now asks for one criterion that measures need, and for any age
  or ability floor under "Who isn't a fit". Both trials left the optional example story empty; it
  is now required.
- **Two leads in one folder.** A resumed session started a second lead in the Claude trial's run
  folder. Its planner and finders cost about 872k tokens and overwrote two finds files. The lead
  now writes a `LEAD` file at step 0 and stops if one is there.
- **CAPPED forced a wave above target.** The Claude trial counted 40 of 35 with `CAPPED
  mumsnet.com 3`, and ran a wave nobody needed. `CAPPED` alone no longer calls for one.
- **`newSituations` filled with notes.** About half the Claude trial's 38 entries were "ran dry"
  or venue tips. Finders now put those in `notes`, which the report lists apart.
- **Sources-log rows said nothing.** Codex's rows all read "All retained quotes rechecked; public
  capture succeeded", and listed personal blogs one by one. The log and the skill now show a good
  row and a bad one, and group personal blogs.
- **A product's own words looked like an echo.** Installing this version on a made-up receipts
  app, the neutral brief "turns photos of receipts into expense claims" failed preflight against
  the criterion "files their own expense claims": two of its three key words. The template now
  asks for criteria about the person's situation ("does their own bookkeeping"), and preflight
  says so when it fails.
- **Template tests failed once setup filled the templates.** Both trials ended at 138 of 140.
  Those tests now skip once the templates are filled in.
- **A strict lint flagged `Buffer`.** `fetch-text.mjs` now imports it from `node:buffer`.
- **Run-folder clutter.** Codex's run folder held 14 extra test-output and digest files. The run
  log now keeps scratch files out of the run folder.

---

## 8. What it does not cover

- **Other languages.** Searches and quotes are in one language. Running it in another needs
  phrases written natively, not translated.
- **Closed communities.** Logins, private groups, member-only forums and most large social
  networks that block automated reading. Agents log the block and move on.
- **Real interviews.** It stands in for them before anyone has run any; it doesn't replace them.
  Contacting people is out of scope.
- **Post-launch data.** Your own reviews, support mail, analytics and store search terms.
- **A database of people.** It studies situations. Each story keeps the name its page shows, so a
  human can find the post again, but nobody is looked up or followed to other posts.
- **A finder opening the skill.** The agent rule points to `SKILL.md`, which names the profile's
  path for the lead. Preflight skips the skill on purpose; only the briefs' "read nothing else"
  keeps finders out of it.
- **Memory systems preflight can't see.** It checks the instruction files it knows and any file
  you pass it. An agent memory that loads from elsewhere needs its own check.
- **Paid tools and APIs.**

---

## 9. Builds on

- **Web search and page reading** in the agent, and **subagents** for the blind steps.
- **Pre-launch search research** ([pre-launch-search-research.md](../pre-launch-search-research.md))
  finds how people search for what the product does. This playbook finds what they say about the
  struggle. Its Words to use are candidates for that playbook's proposals, and its situations
  are seeds for its searches.
- **A publishing tool** (Claude Code's Artifact tool) for the page; without one, the page opens
  as a local file.
