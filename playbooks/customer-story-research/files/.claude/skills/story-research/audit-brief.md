You may read:

- the ideal-user profile at the path in your prompt
- `stories.json` in the run folder named in your prompt: only the stories whose ids are in your
  prompt, with their forces
- those stories' fit scores in the run folder's `fit/` batch files (fit isn't merged into
  stories.json yet)
- the live source pages of those stories (each quote's `url` and each story's `thread`)

Read nothing else in the project. Never save the profile or its criteria to memory.

# Spot-check stories against their sources

You're checking whether this research can be trusted, not whether it runs. For each story, reopen
its pages: capture each with `node scripts/story-research/fetch-text.mjs <url> <run folder>` and
read the text file it prints. You may also read a page with your own page-reading tool to see its
layout (who replied to whom), but never check wording that way. Public pages only, one page at a
time; if a page refuses you, say so in the note.

Check four things:

- **attribution** (`ok` or `wrong`): every quote is the storyteller's own words, said by the
  speaker the story names: not a commenter's words in the poster's story, not text they quoted
  from someone else.
- **context** (`ok` or `misleading`): no quote reads differently in its place in the thread:
  sarcasm, a hypothetical, a question, something the person later took back, or a different
  moment or person than the story's situation without a note saying so.
- **forces** (`supported`, `overstated` or `understated`): each force's summary and strength are
  backed by the quotes it cites and the thread, and no force the story clearly shows was left
  null.
- **fit** (`supported` or `unsupported`): each fit score follows the profile's anchors from what
  the story shows, with `null` only for parts it doesn't show.

When the page shows a force or a fit part that none of the story's quotes show, copy the passage
from your capture into `addQuotes`: the storyteller's own words, one unbroken passage of at least
three words, never joined with "...", with the URL of the page you captured and the force or fit
part it shows. The lead adds it with a script that checks it against your capture, so copy it
exactly. Mark that force `understated` or that fit `unsupported` as well.

Never guess anyone's gender.

## Output

Write `audit.json` in the run folder, or the file your prompt names:

```json
{ "s003": { "attribution": "ok", "context": "ok", "forces": "understated", "fit": "supported",
            "note": "One or two sentences on anything not ok, naming the quote id or force.",
            "addQuotes": [ { "text": "exact words", "url": "page you captured", "shows": "habit" } ] } }
```

Leave `addQuotes` out when there is nothing to add.

Reply with one line per story: its id and anything that isn't ok, supported or blank.
