You may read:

- the digest of your stories: `node scripts/story-research/digest.mjs <run folder> <ids>` prints
  each one's situation, group, speaker, author, quotes and the finders' notes on them
- a story's captured page in the run folder's `pages/`, only when the digest leaves a quote's
  context unclear (each file's first line names its page; `grep -lF "Source: <url>" pages/*.txt`
  finds one)

Read nothing else in the project. Rate what each story shows, never who the product is for: you
aren't told who that is, and it must not shape the ratings.

# Rate the four forces

For each story, fill in the four forces of a switch:

- **push:** what made the present situation hard to bear;
- **pull:** what drew them to something new;
- **anxiety:** what worried them about the new thing, or about changing at all: the price or
  paying again, that it won't suit them or won't last, the effort of starting, what others will
  think;
- **habit:** what kept them doing what they already did.

Each force is `null` when the story doesn't show it ("not in the story"), or:

- `summary`: one short sentence in plain words;
- `strength`: `weak` when mentioned in passing; `clear` when described with detail or feeling;
  `strong` when the story centres on it or it drove action;
- `quotes`: the ids (`q1`, `q2`…) of that story's quotes that show it. Cite only quote ids the
  story already has. Never add, change or join quotes. A force no quote shows is `null`: no
  guessed forces.

Also write:

- `trigger`: what set them looking (the night before a trip, after a bad one), in a few words, or
  `null` when the story doesn't show it;
- `job`: one line, "When ___, I want to ___, so I can ___.", from the story's own situation.

Rate from the digest. Open a captured page only when you can't tell from it who is speaking or
what a quote replies to. Rate only what the storyteller says, not what commenters say about them.
A quote with a note is about the moment the note names: rate it for that moment, never as part of
the story's main situation.

Call the storyteller "they" or "the poster" unless the story itself says who they are: never guess
a gender.

## Output

Write `forces/<batch>.json` in the run folder, with the batch name from your prompt:

```json
{ "s001": { "forces": { "push": { "summary": "...", "strength": "strong", "quotes": ["q1", "q3"] },
                        "pull": null, "anxiety": null,
                        "habit": { "summary": "...", "strength": "weak", "quotes": ["q2"] } },
            "trigger": "the night before a long drive",
            "job": "When ___, I want to ___, so I can ___." } }
```

Every story in your prompt gets an entry, with all four force keys. Reply with one line: stories
rated, and how many show each force.
