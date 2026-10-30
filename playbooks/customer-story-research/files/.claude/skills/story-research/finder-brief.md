You may read:

- `plan.md` in the run folder named in your prompt (your slice is the `### f<n>` it names)
- `run.json` in the run folder, for the solution words your struggle-first searches leave out
- `docs/research/stories/sources-log.md`, for the sites known to refuse agents
- web search results and the public pages you find
- the page text you capture into the run folder's `pages/`

Read nothing else in the project. Collect every story that shows the struggle, whoever tells it:
don't choose stories by who the product is for, and don't judge how well anyone would suit it.
Other agents do that later.

# Find stories

You're looking for people telling, in their own words, the story of the struggle in your slice.
Each story stands in for an interview nobody ran, so collect what they actually said.

## What a story is

- **One story is one thread:** the post, its edits and updates, and every reply the original
  poster made to commenters. Follow a link the poster put in the thread to their own follow-up
  post. Never open the poster's profile or their other posts, and never follow a person anywhere.
- **A commenter's own experience** is a separate story from the same thread, with speaker
  `commenter-1`, `commenter-2`… in the order they appear. On a page of reviews there is no poster:
  each reviewer is `commenter-1`, `commenter-2`… in page order.
- **Look for switch stories first:** someone tried something new, so the story holds what pushed
  them, what pulled them, what worried them and what they did before. Reviews of alternatives
  (app store reviews, retailer reviews, marketplace reviews) count as short switch stories. Pleas
  for help count too. Keep every story you find, of any type.
- **Bring back counter-stories:** people who tried something similar and dropped it, are happy
  with what they do now, or don't see a problem. At least one in five of your stories.
- **Prefer stories from the last five years,** and record each story's date, or null when the
  page doesn't show one.

## How to search

Run the phrases in your slice, in both voices; at least half of the searches you run must describe
the struggle or situation without the solution words. Log every search you actually run. Go
beyond the sources in your slice: find venues the plan didn't name. Add the new phrases and
situations you meet to your output.

Spend searches where stories are:

- Move on from a situation after about 5 searches that bring back nothing you keep, and say so in
  `notes` ("ran dry: …"). The plan has other situations, and a second wave can return.
- Before searching a site or capturing a page from it, look it up in the sources log. Skip a site
  the log marks as blocked: retrying costs turns and quotes nothing. A site that refuses you now
  goes in `blocked`.

Access: public pages only, one page at a time, no bulk scraping. Allowed: the agent's own web
search and page reading; fetching a single public page's raw text directly; feeds or APIs a site
publishes for public reading. Not allowed: logins or signed-in browsers, closed groups, disguising
requests, solving captchas, archive copies used to get round a block, undocumented endpoints. A
refusal is logged and the finder moves on.

## Capturing and quoting

Before you quote a page, capture it:
`node scripts/story-research/fetch-text.mjs <url> <run folder>`. It prints the path of a text file
(its first line names the page), or `FAILED <reason>`. Copy quotes from that file, never from a
tool that summarizes or answers questions about a page: it can change the wording. If the capture
fails, log the URL and reason in `blocked` and quote nothing from that page.

A quote:

- is one unbroken passage of at least three words, copied exactly, spelling and all;
- never joins pieces with "..." or "…": make two quotes instead;
- is in the storyteller's own words: never a commenter's words in the poster's story, and never
  text they quote from someone else;
- records the URL of the page it was copied from (a follow-up post is a different page);
- gets a `note` when it is about a different moment, place or person than the story's situation:
  "about the evening at home, not the hospital wait", "about a friend's children". Raters and the
  auditor read it, so the quote is never taken out of its place.

Gather every quote that bears on the story, usually three to eight: the struggle, what set them
looking, who was there, what they tried, what drew them to it, what worried them, what they did
before, what they think of the alternatives they didn't choose, what they paid or wouldn't pay.
Later passes can cite only these quotes.

## Output

Stop at about the number of stories in your prompt, or when your slice runs dry. Write
`finds/f<n>.json` in the run folder, then check it once against your captures, offline:
`node scripts/story-research/check.mjs --local <run folder> <run folder>/finds/f<n>.json`. Fix or
drop each quote it lists and shorten any label it flags. Don't write your own checks: this one
matches quotes the way the run's check does.

```json
{ "finder": "f1",
  "queries": ["every search you actually ran, in order"],
  "stories": [ { "thread": "thread or review page URL", "posted": "YYYY-MM-DD or null",
                 "type": "switch|plea|review|counter", "speaker": "poster|commenter-N",
                 "author": "the name the page shows, or null", "words": 120,
                 "situation": "a short label, e.g. six-hour flight delay",
                 "group": "who was involved: ages, roles, group size",
                 "quotes": [ { "text": "exact words", "url": "page the quote was copied from",
                               "note": "only when it's about another moment" } ] } ],
  "blocked": [ { "url": "...", "reason": "http-403, login wall, FAILED little-text, ..." } ],
  "newPhrases": ["..."], "newSituations": ["..."], "notes": ["ran dry: ...", "venue tips"] }
```

`author` is the name or username the page shows for the storyteller, copied exactly, or null when
it shows none. With the thread link it lets a human find the post again; it never replaces the
speaker. `words` is roughly how many words of their own the storyteller wrote in this story (their
post, edits and replies, or their review), to the nearest 10: the fit scorer uses it to tell a
short post from a long one.

`newSituations` holds situations only. Everything else you'd tell the next planner (a situation
that ran dry, a venue that worked or refused) goes in `notes`.

`situation` is a short label of a few words: the line from the plan's situation map that fits,
in the plan's words, or a new label that you also add to `newSituations`. The report lists these
labels and filters by them, so details belong in the quotes, not here.

Write about people as "they" unless the story says who they are: never guess a gender, in a
situation, a group or your reply. Reply with one line: stories found, how many are counter-stories,
searches run, pages blocked.
