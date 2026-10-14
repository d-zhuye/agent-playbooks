# Docs without copies

Let the code be the source of truth: docs record intent and constraints, and point to the file or
command that holds the current value. They never copy user-facing strings or counts. This is a
rule plus a one-time audit, for any project with design docs, READMEs or specs that agents keep
up to date.

**Adopt it when** a rule like "update docs that quote any string you change" exists, or docs carry
tables of counts that someone updates by hand.

---

## 1. Why use it

A copied string or count is correct the day it's written, then drifts. Every change to the code
creates a doc chore, agents spend tokens finding and fixing quotes, and the copies still go
stale. In the project this came from:

- A README count table's Total said 4,441 while its own rows added to 4,598.
- Release docs carried counts that had been wrong three submissions running.
- A README named a button "Take one back"; the code said "Undo".
- A design doc quoted about 40 on-screen strings that agents had to keep in sync by hand.

After the change, a copy edit is a one-file change, and nothing in the docs can be stale because
nothing is copied.

## 2. How it works

| Instead of… | Docs say… | The value lives in… |
|---|---|---|
| A quoted button label or message | what it means or does, plus the file | the source file |
| A count table | "run `<command>`" | a command that prints it |
| A changelog paragraph ("added 268…") | nothing | git log |
| A copied config value | the reason for it | the config file |

Some quotes stay, because there the words *are* the decision:

- voice and style examples ("say *Next*, not *Proceed*")
- legally or contractually required phrases
- text pasted into an external system (app-store listings, reviewer notes): keep the wording,
  and use placeholders for anything a command can fill in at paste time
- tester checklists that tell a person what to look for on screen (accept they may drift)

## 3. Setup checklist

1. **Add a count command** if docs carry counts: a script that prints them, wired into an existing
   validation command where possible. `TODO(project):` the command name.
2. **Audit each doc** (section 4, "Audit").
3. **Replace the rule**: remove any "update docs that quote a string" instruction and paste the
   agent rule (section 5).
4. **Fix links into removed sections**: grep for `#<anchor>` before renaming or deleting a heading.

## 4. Starter code

### Audit procedure

For each doc (design docs, READMEs, specs, contributor guides):

1. **List quoted strings:** `grep -nE '"[^"]{8,}"|“[^”]{8,}”' <doc>`.
2. **Classify each one:**
   - grep the source for it. If the code has it, it's a **copy**.
   - If it's a voice example, required wording or externally pasted text, it's **design**.
   - If the code has a *different* string, it's **drift**: fix the doc, and check whether the doc
     or the code was right.
3. **Rewrite each copy** as intent plus pointer:
   - Before: `Its heading is "You’ve finished this stack!", followed by "You’ve played …".`
   - After: `Its heading says the stack is finished, followed by a sentence naming what was played
     (copy in src/components/FinishedStackScreen.tsx).`
4. **Remove count tables and changelogs.** Keep any *rule* buried in them, for example "each
   subject needs at least 36 free items per age", as a short bullet.
5. **Grep code comments** for doc paths and check each one exists (`grep -rnoE 'docs/[^ )]+\.md'
   src | …`). Dead references accumulate where nobody looks.

### Count command (Node example)

```js
// Add to an existing validate script so counts print wherever validation runs.
// TODO(project): replace with your own grouping.
const counts = {};
for (const item of items) {
  const row = (counts[item.group] ??= { free: 0, paid: 0 });
  row[item.tier] += 1;
}
console.table(Object.fromEntries(Object.entries(counts).map(([group, c]) => [group, { ...c, total: c.free + c.paid }])));
```

### Placeholders for externally pasted text

```text
Every game is free to play; the Expansion adds {added} cards across all {games} games.
```

Next to the block: "Fill `{added}` and `{games}` from `npm run <count command>` when pasting."

## 5. Agent rule

Paste into `AGENTS.md`:

```md
- The code is the source of truth for user-facing copy and for counts: docs record intent and point
  to the file (or `TODO(project): <count command>`) instead of copying them. Changing a string
  needs no doc edit unless its intent changes. Only text pasted into external systems
  (TODO(project): e.g. docs/release/) is copied, with placeholders for counts.
```

Why each part is there:

- **"Source of truth"** settles conflicts: when a doc and the code disagree, the code wins.
- **"Point to the file"** stops agents deleting a quote without leaving a way to find the string.
- **"Unless its intent changes"** keeps docs edits for real design changes.
- **The external-text exception** stops an agent stripping wording a reviewer or store needs
  verbatim.

## 6. Acceptance test

1. **A copy change touches one file.** Ask an agent to reword one button label. It edits the
   source (and its tests) and no doc.
2. **An intent change still updates the doc.** Ask for a behavior change that a doc describes. The
   agent updates the description, without quoting the new strings.
3. **Counts come from the command.** Ask "how many items are in each group?" The agent runs the
   count command instead of reading a doc.
4. **No stale copies remain.** The audit grep finds only design quotes, external text and tester
   checklists.

## 7. Gotchas

- **Deleting quotes loses intent if nothing replaces them.** Always write what the text means or
  does, plus the file.
- **Not every quote is a copy.** Voice examples and control names used only to say what a control
  does ("tap **Done**") are fine; drift there is cheap and harmless.
- **The count command didn't exist yet.** The proposal assumed validation printed per-group
  counts; it only printed a total. Check before telling docs to point at a command.
- **Headings are anchors.** Renaming "Current library" broke a link to `#current-library` in the
  same file. Grep for the anchor before renaming.
- **Comments cite docs that never existed.** Five code comments pointed to `docs/design/voice.md`
  and a proposal file that was never written. Keep the reasoning inline, or point to a real
  section.
- **Parallel agents started from an old commit.** The agent doing this audit worked on a checkout
  18 commits behind, and "verified" that newer files didn't exist. Check the base commit before
  trusting an audit (see [delegated work in worktrees](delegated-work-in-worktrees.md)).

## 8. What it does not cover

- Generated API docs (they are produced from code already).
- Translations: copy in translation files is still copy, and docs should point there too.
- Docs whose purpose is a frozen record (release notes for a shipped version, dated plans).
