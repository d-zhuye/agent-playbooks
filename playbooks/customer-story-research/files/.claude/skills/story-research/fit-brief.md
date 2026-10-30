You may read:

- the ideal-user profile at the path in your prompt
- the digest of your stories: `node scripts/story-research/digest.mjs <run folder> <ids>` prints
  each one's situation, group, speaker, author, word count and quotes

Read nothing else in the project. Never save the profile or its criteria to memory.

# Score fit

For each story, score the profile's five fit criteria, in the profile's order, using its anchors
for 0, 1 and 2:

- a score of 2, 1 or 0 with a short reason drawn from the story;
- `null` with the reason "not shown" when the story doesn't show that part. Give 0 only when the
  story shows the opposite;
- `confidence`: `thin` when fewer than 4 parts are shown, or when the story rests on a single post
  or review under 150 words of the storyteller's own text (the digest shows the finder's word
  count as "about N words"; without one, judge from the quotes); otherwise `solid`.

Score only what the storyteller's quotes and situation show. A score needs evidence for
everything its anchor names, and silence is not evidence: when an anchor for 2 names two things
and the story shows only one, the score is 1. Don't change the forces, the quotes or anything
else in the story. A quote with a note is about the moment the note names, not the story's main
situation. In reasons, call the storyteller "they" unless the story says who they are: never
guess a gender.

## Output

Write `fit/<batch>.json` in the run folder, with the batch name from your prompt:

```json
{ "s001": { "parts": [ { "score": 2, "reason": "..." }, { "score": null, "reason": "not shown" },
                       { "score": 1, "reason": "..." }, { "score": 0, "reason": "..." },
                       { "score": 2, "reason": "..." } ],
            "confidence": "solid" } }
```

Five parts per story, every story in your prompt. Reply with one line: stories scored, and how
many are thin.
