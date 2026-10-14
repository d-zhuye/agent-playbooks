# Open-items ledgers instead of review documents

Replace the pile of dated review, audit and batch-report documents agents write with one short
ledger per area: what is still open, plus lasting decisions. Evidence (source links, sign-offs)
moves into a checked file keyed by stable ID, next to the thing it backs. It works for any
project where agents review or change the same areas repeatedly: content libraries, codebases,
docs, research notes.

**Adopt it when** agents are told to "read the previous reviews first", and that reading keeps
growing.

---

## 1. Why use it

Each review document is useful the day it's written. After that it mostly repeats what the data,
the code or git history already say. The next agent still has to read all of it to find the few
items that are still open.

In the project this came from, one area had 23 review files (about 11,500 lines). Agents read all
of them before every change and wrote a new 500–2,000-line review per batch. Most of it was
already elsewhere:

| What the reviews held | Where it already lived |
|---|---|
| The applied changes, copied out in full | The data files themselves |
| "Rejected: duplicate of X" tables | The duplicate checker, rerun on demand |
| Counts and mixes | A validation command |
| What changed and when | git log |
| **Source links for facts** | **Nowhere else**: moved to an evidence file |
| **Open items and lasting decisions** | **Nowhere else**: moved to the ledger |

| | Before | After |
|---|---|---|
| Read before changing one area | ~11,500 lines | ~50–100 lines |
| Written per change | 500–2,000 lines | 0–10 lines |
| Over time | Grows with every batch | Stays small: items are deleted once resolved |

## 2. How it works

```
docs/ledgers/<area>.md   one per area: Open items, Decisions; about a screen each
<evidence file>          stable ID → links or sign-offs, checked in CI, never shipped
git log                  what changed and why (descriptive commit messages)
the branch diff          the proposal itself, in place of a proposal document
```

The agent workflow becomes:

1. **Orient:** read the area's ledger, not old reviews.
2. **Propose:** make the change on a branch. The diff is the proposal, and a summary goes in chat.
3. **Hand off:** top findings, what was rejected and why, the verification actually run.
4. **Apply** what the human approves, revert the rest, then update the ledger: delete what was
   resolved, add only what stays open.

## 3. Setup checklist

1. Create `docs/ledgers/` with one file per area, from the template in section 4.
2. Pick an evidence file only if the work cites external sources (facts, licenses, measurements).
   Key it by the stable ID of the thing it backs, and add the check in section 4.
3. Migrate the existing reviews (section 4, "Migration").
4. Point every instruction that says "read previous reviews" or "write a review to …" (AGENTS.md,
   skills, contributing guides) at the ledger instead, using the rule in section 5.
5. Delete the migrated reviews in one commit; git keeps them. Keep any review that other docs
   still depend on for something other than findings (a release checklist, for example).

## 4. Starter code

### Ledger template: `docs/ledgers/<area>.md`

```md
# <Area> ledger

What is still open for <area>, and lasting calls the checklist can't enforce. Delete an item
once it's resolved; add one when a change leaves something open. Rules that apply everywhere
are in TODO(project): <path to the standard or checklist>.

## Open

- **<Kind of item, e.g. "Answers to tighten">.** `<id>`: what is wrong and what would settle it.
- **Owner decision: <question>.** The options, in one line.
- **To watch in use.** What to observe, naming IDs.

## Decisions

- <A lasting call, with its reason, that a checklist can't enforce.>
```

Rules for the content: name stable IDs, not line numbers; one line per item where possible; no
history ("on 10-12 we…"), since git has it.

### Evidence check (Node example)

```js
// scripts/check-evidence.mjs: every evidence entry must point at something that still exists.
import { readFileSync } from 'node:fs';

// TODO(project): return the set of live IDs (prompt IDs, module names, record keys…).
function liveIds() {
  return new Set(JSON.parse(readFileSync('data/items.json', 'utf8')).map((item) => item.id));
}

const evidence = JSON.parse(readFileSync('data/evidence.json', 'utf8')); // { "<id>": ["https://…"] }
const live = liveIds();
const problems = [];
for (const [id, links] of Object.entries(evidence)) {
  if (!live.has(id)) problems.push(`${id} has evidence but no live item; move it with the item or remove it`);
  if (!Array.isArray(links) || links.length === 0) problems.push(`${id} has an empty list`);
  if (new Set(links).size !== links.length) problems.push(`${id} lists a link twice`);
  for (const link of links) if (!/^https?:\/\//.test(link)) problems.push(`${id}: ${link} is not a web address`);
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`Evidence is valid for ${Object.keys(evidence).length} items.`);
```

Run it in the pre-commit hook and in CI. Keep the evidence file out of anything you ship, and
out of any hash or version derived from shipped data (see Gotchas).

### Migration

1. **Extract the evidence with a throwaway script** (keep it out of the repo). For each link in
   each review, pair it with the ID on the same line or bullet, then in the same section, then
   through any numbering table the review used ("Source 4" → the ID under that heading). Search
   reviews recursively: batch reviews often sit in subfolders.
2. **Resolve what didn't match by hand.** Drop links that backed method rather than a specific
   item, links for candidates that were never added, and links for items since removed.
   Spot-check about 25 random matches against their items.
3. **Collect open items** from every "still needed", "remaining", "playtest" and "follow-up"
   section. Check each against the current state before carrying it over: many are already
   done, and some flagged "errors" are wrong.
4. **Collect lasting decisions**, including **accepted exceptions** ("these two look alike but
   both stay"). If a tool keeps flagging something a review accepted, the acceptance must
   survive the migration, in the ledger or in the tool's allowlist.
5. **Fix every link** into the deleted reviews. Leave dated plans and historical records as they
   are.

## 5. Agent rule

Paste into `AGENTS.md` (and into any skill that reviews or changes an area):

```md
- Before reviewing or changing an area, read its ledger in docs/ledgers/<area>.md; don't read old
  reviews (they're in git history). Don't write review documents: propose by making the change
  on a branch, and summarize findings, rejections and verification in the hand-off message.
- When done, update the ledger: delete what the change resolved; add only what stays open
  (an unconfirmed claim, a question for the owner, something to watch) or a lasting decision.
  Keep each ledger to about a screen. Record evidence links in TODO(project): <evidence file>.
```

Why each line is there:

- **"Don't read old reviews"**: otherwise agents go looking in git history "to be thorough".
- **"Propose by making the change on a branch"**: a proposal that lives only in chat is lost if
  the session resets mid-batch; a branch survives.
- **"Delete what the change resolved"**: without it, the ledger becomes a small review pile.
- **"About a screen"**: an outgrown ledger means items need resolving, not recording.

## 6. Acceptance test

1. **Orientation is short.** Ask an agent to review one area. It reads the ledger and the area's
   files, and doesn't open old reviews or search git history for them.
2. **No review file appears.** The agent's changes are on a branch, with a hand-off summary in
   chat and no new file under `docs/reviews/`.
3. **The ledger shrinks.** After a change that resolves an open item, that item is gone from the
   ledger.
4. **Evidence follows its item.** Remove an item that has evidence: the evidence check fails
   until its entry is removed too.
5. **Decisions hold.** Propose something the ledger's Decisions rule out: the agent declines and
   cites the decision.

## 7. Gotchas

- **Evidence inside shipped data ships, and changes its version.** The first plan put a `source`
  field on each item. The items were bundled into the app and hashed into a content version, so
  every link fix would have shipped and bumped that version. A separate file keyed by ID avoids
  both.
- **The first migration pass missed a subfolder.** About 170 links sat in a batch folder the
  top-level glob never read. Glob recursively and compare the link count with
  `grep -rc https docs/reviews`.
- **An accepted exception was lost.** A review had accepted two near-duplicate pairs ("they differ
  in what to look for, so both stay"). The migration carried open items, not acceptances, so the
  duplicate checker would flag them again. Migrate acceptances explicitly (step 4).
- **A flagged error was wrong.** One review called an answer incorrect; checking showed it was
  right. Re-verify open items before carrying them over.
- **Many "still needed" items were already done.** Of about 30 such sections, most were
  boilerplate ("human review remains") or since resolved. Put a project-wide caveat in one place
  (the standard's intro), not in every ledger.
- **Some reviews weren't findings.** A release-readiness review held build steps that release
  docs linked to. Keep those; migrate only reviews whose value was findings.

## 8. What it does not cover

- Formal audits that must be kept as signed, dated records (compliance, security sign-offs).
  Keep those as documents; this replaces working reviews only.
- Choosing what to review. This changes where the results live, not the review standard.
- Projects with an issue tracker the team actually uses: there, Open items can be issues, and
  the ledger keeps only Decisions.
