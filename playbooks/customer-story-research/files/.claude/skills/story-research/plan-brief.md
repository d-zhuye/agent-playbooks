You may read:

- the product brief, `docs/research/stories/product-brief.md`: what the product does
- the other product inputs in your prompt: the solution words, the purchase and the language
- `docs/research/stories/sources-log.md`
- `plan.md` in the run folder, only when your prompt asks for a second wave

Read nothing else in the project. Don't choose situations or sources by who the product is for:
map everyone who lives with the struggle, including people who would never buy anything.

# Plan a story-research run

Finders will search the web for people telling, in their own words, the stories of the struggles
this product could address. They see only your plan, so make it complete. Write two files in the
run folder named in your prompt.

The product brief says what the product does, not who it's for. Work out from it every struggle
it might ease, for anyone, and map them broadly: the brief doesn't tell you which matters most,
and finding that out is the point of the run.

## 1. The situation map

Brainstorm broadly; never stop at the obvious situations. Vary five dimensions and combine them,
picking values that fit the struggles the brief suggests:

- **Where and when it happens:** at home, at work, on the move, in a shop, a clinic, a venue or
  online; a daily routine, a deadline, a season, a one-off event.
- **Who is involved:** alone or with others; ages, roles, family, friends, colleagues, customers,
  strangers; who decides and who pays.
- **How often and how long:** once, now and then, every day; minutes, hours, months.
- **What limits them:** time, money, skills, tools, rules, connection, attention, other people.
- **How they feel:** frustrated, anxious, bored, overwhelmed, embarrassed, tired.

Write at least 20 situations, one line each, from the ordinary to the unusual. Include some where
the struggle is mild or missing, for counter-stories.

## 2. Search phrases in both voices

- **Sharing:** past tense, first person: "what worked for us", "finally switched to", "never
  again", "I gave up on", "update:"; in reviews, "we bought this for", "stopped using it after".
- **Asking:** present tense: "how do you deal with", "any tips for", "what do you use for",
  "dreading", "help!".

Combine them with the situations. Mark each phrase S when it describes the struggle or situation
without the solution words, or L when it uses them. At least half must be S. Add phrases for
counter-stories: people who tried something similar and dropped it, are happy with what they do
now, or don't see a problem. Add a few about paying for alternatives (the purchase in your
prompt), such as reviews that mention the price.

**Keep every story type.** Switch stories, pleas for help, reviews and counter-stories all count
as stories. Never tell finders to skip a type, or to treat one only as a lead to other stories:
pleas carry most of the push, and reviews of paid alternatives most of what makes people hesitate
to pay.

## 3. Sources

Cover many kinds of venue: parenting, travel, hobby and professional forums; Q&A sites; personal
blogs and their comment sections; first-person essays; product reviews of alternatives (app store
reviews, retailer reviews, marketplace reviews); video comments and transcripts; smaller social
networks. These are examples, never the limit: name specific venues, and tell finders to look
beyond them. Start from the sources log: favor what yielded, skip what blocked, and say why. No
platform may supply more than a fifth of the target, rounded up (12 of 60, 2 of 8), so spread
widely and never lean on one big platform.

## 4. Slices

Cut the plan into one slice per 5 stories gathered: as many slices as your prompt gives finders.
Small slices keep each finder's work short. Each slice has:

- 2–3 situations, overlapping other slices as little as possible;
- 6–10 phrases in both voices, at least half of them S;
- 3–4 sources of different kinds, none the sources log marks as blocked;
- where its situations have them, a source of reviews of something paid (app store, retailer or
  marketplace reviews);
- a counter-story angle.

## Second wave

When your prompt asks for a second wave, `plan.md` and `run.json` already exist: you may also read
`plan.md`. Don't change anything in it. Append a `## Second wave` section with one `### f<n>` slice
per new finder, numbered from the one your prompt gives, and aim them at what the check reported:

- enough stories to cover the shortfall, plus a third;
- sources on platforms that aren't capped, and new venues the first wave didn't try;
- the new situations finders reported, and their notes (skip what ran dry);
- struggle-first phrases only.

Reply with one line: the slices added and what each aims at.

## Output

`run.json`:

```json
{ "date": "YYYY-MM-DD", "product": "one line on what the product does", "target": 60,
  "solutionWords": ["app", "game"] }
```

`date` and `target` come from your prompt; `solutionWords` are the solution words.

`plan.md`, with these sections: `## Situation map`, `## Phrases` (each line marked S or L),
`## Sources`, and `## Slices` with one `### f1`, `### f2`… per finder. Reply with one line: the
number of situations, phrases (and the S share) and sources.
