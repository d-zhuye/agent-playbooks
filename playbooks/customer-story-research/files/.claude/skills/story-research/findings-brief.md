You may read:

- the digest of the run's stories: `node scripts/story-research/digest.mjs <run folder>` prints
  every retained story's situation, group, speaker, author, quotes and rated forces
- `stories.json` and `run.json` in the run folder named in your prompt, for the counts, platforms
  and searches
- the purchase named in your prompt

Read nothing else in the project: not the `fit/` files, `audit.json` or the skill's other files.
Write what the stories show, not who the product is for: you aren't told who that is, and the
findings are compared with the team's own view only after you finish.

# Write the findings

Each story stands in for a customer interview nobody ran, and its four forces are already rated:
push (what made the present hard to bear), pull (what drew them to something new), anxiety (what
worried them about it) and habit (what kept them where they were). From these stories alone, write
what a human needs to decide five things: who to aim at first, which words to use, what to build or
write next, why people hesitate to pay, and where to find early users. Say what the stories show,
including what the team may not want to hear.

## What to write

- **forces:** the main themes under each force across all stories, each with the stories that
  show it and one to three representative checked quotes (`"s001/q2"`). A theme cites only
  stories that show that force.
- **aim** (who to aim at first): the groups and situations where the push is strongest and
  people have already tried or paid for something.
- **words** (words to use): people's own words for the struggle and what they wanted, for store
  listings and web pages, with where each could go. Checked quotes only; the report prints the
  quote's exact text, never a rewording.
- **build** (what to build or write next): situations, features and content people are missing.
- **hesitations** (purchase hesitations): what makes people hesitate to pay for the purchase
  named in your prompt, or anything like it.
- **where** (where to find early users): the venues where the strongest-push stories turned up.

Every claim cites the stories behind it; cite every story that bears on it. Say when a claim
rests on one or two stories, once, in the claim itself. Write each claim so someone could act on
it. Write about people as "they" unless the story says who they are: never guess a gender.

Check the file with `node scripts/story-research/build-report.mjs <run folder> --check-findings`.
Fix each line it lists and run it again until it passes.

## Output

Write `findings.json` in the run folder. Leave `fitParts`, `compare`, `wrongAbout` and
`notes.profileChanges` empty: they are written later, with the profile.

```json
{ "writtenBeforeProfile": true,
  "forces": { "push": [ { "theme": "...", "stories": ["s001"], "quotes": ["s001/q2"] } ], "pull": [], "anxiety": [], "habit": [] },
  "findings": { "aim": [ { "text": "...", "stories": ["s001"] } ],
                "words": [ { "quote": "s001/q2", "note": "where to use it" } ],
                "build": [], "hesitations": [], "where": [] },
  "fitParts": [],
  "compare": { "agrees": [], "differs": [] },
  "wrongAbout": [],
  "notes": { "sources": [], "blocked": [], "newSituations": [], "profileChanges": [], "other": [] } }
```

`notes.sources` holds what the platforms yielded, `notes.other` anything else a reader should
know. Reply with one line: themes per force, claims per finding, and how many retained stories you
cited.
