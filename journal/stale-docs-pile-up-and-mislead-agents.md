# Stale docs pile up and mislead agents

- Seen: 2026-11-12, while-we-wait
- What happened: After seven weeks the repo held about 44,000 lines of markdown. Most was dated
  working paper: 42 implementation plans, 28 specs and about 30 reviews, plus a 1,300-line design
  doc loaded every session. Agents searching the repo found finished plans and old rules and could
  treat them as current. Living docs had drifted too: the README said eight games (nine), a module
  README said a round is discarded on leaving the app (it pauses), and two glossaries disagreed.
- Tried: Agreed the rule with the owner before touching anything → worked. The questions that
  mattered: what wins when a doc and the code disagree (code and tests), what happens to dated
  records (delete; git keeps them), and whether to delete or archive (delete by default, a
  `docs-historic/` "museum" with a README saying no rule comes from it for the few worth keeping).
  The owner's first prompt missed the dated records, which were most of the bloat: ask about them.
- Tried: Sorted by kind, not file by file → worked. Plans for shipped work: delete all. Reviews:
  delete once applied; before deleting, grep each for "Status", "Still open", "needs a phone" and
  move open items to the living checklist or ledger (one deleted review held the only list of
  outstanding device checks). Proposals marked "not applied": check the data for their IDs, then
  ask the owner. Specs: museum, because ADRs cite them. ADRs: keep, add a Status line saying what
  replaced them. Research and store-research runs: keep as dated evidence. Notes that code comments
  cite (tuning simulations, performance captures): keep in place.
- Tried: Listed every inbound link before deleting (`git grep` for the folder paths across docs,
  code comments, scripts, skills, asset READMEs) → worked; about 60 pointers needed rewriting, 25 in
  the design doc. Point living docs at the living doc, and only records (ADRs) at the museum. Finish
  with a script that resolves every relative link, anchor and backticked path in the living docs.
- Tried: `sed` with `#` as delimiter on text containing `#anchor` → broke a line and wrote a stray
  file. Use a Python `str.replace` with an assert on the match count for doc edits.
- Tried: `git mv` of a folder into the museum, then expecting it tracked → one subfolder ended up
  untracked. Run `git status` and `git ls-files` on the destination after bulk moves. Also check
  what ignores `docs/` by name (`.easignore`, lint ignores) and add the new folder.
- Tried: Split the design doc instead of only cutting it → worked. A core file keeps what every
  change needs (status, glossary, draw/lifecycle rules, voice, purchases); per-area detail (one
  game's round, per-screen presentation, characters, the purchase screen, guides) moved to sibling
  files reached from a "read it when you touch…" table. Always-loaded words fell 56%; total words
  only 14%, because the content was current. The real cuts were dated narration ("on <date> the
  owner selected…", "replaced…", "since…"), milestones, directory trees and anything restating code
  or config. Rewrite in the present tense; never invent a fact to fill a table cell; spot-check
  documented numbers against the code's constants.
- Tried: Added two rules to AGENTS.md so it doesn't recur → untested. "The code and its tests are
  the truth; a doc that disagrees is stale: fix or delete it in the same change." and "Plans, specs
  and reviews are working papers: when the work ships, put what lasts in the design doc or an ADR
  and delete them." Also folded a second glossary into the design doc and deleted an out-of-repo
  copy of a project skill that had drifted and still told agents to write review files.
- Tried: Left store text, content guidelines and research unreviewed, and said so → owner deferred
  them. Don't rewrite owner-pasted text in a cleanup; flag it.
- Related: `playbooks/docs-without-copies.md` covers docs that copy strings and counts. It was installed here and did not stop this: dated plans, specs and reviews are a different source of staleness.
- Status: worked once
