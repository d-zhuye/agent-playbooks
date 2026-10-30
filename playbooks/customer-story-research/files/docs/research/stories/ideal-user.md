# Ideal user

A human edits this file. Story-research runs only suggest changes, in their report's run notes.
Keep it out of AGENTS.md, CLAUDE.md, agent memory and anything else agents load automatically:
the agents that plan, find and rate stories and write the findings must never see it. Only the fit
scorers, the auditor and the lead's comparison read it.

## Who they are

TODO(project): two or three sentences: the person in the situation the product serves, what they
already do about it, and what wears them out.

## Who isn't a fit

TODO(project): who looks similar but wants something else, and any floor of age or ability: who is
too young, too old or otherwise unable to use the product, however strong their struggle.

## Fit criteria

Five parts, each scored 0, 1 or 2 from what the story shows. A part the story doesn't show is
**not shown** (`null`), never 0: 0 means the story shows the opposite. Confidence is recorded
separately: thin when fewer than 4 parts are shown, or when the story rests on a single post or
review under 150 words of the storyteller's own text; otherwise solid.

- **One criterion measures need:** what they do now is failing them (they complain about it, have
  tried and dropped things, or ask for help). Without it, people happy as they are can score
  highest, and the profile describes who resembles the user rather than who needs the product.
- **Each criterion is one thing,** written as a short phrase a scorer can check against a story,
  about the person and their situation rather than the product's own words. Preflight fails when
  a criterion shares most of its key words with the product brief: "files their own expense
  claims" against a brief about turning receipts into expense claims. Say it as the situation
  instead: "does their own bookkeeping".
- **Each anchor is something that happens in a story, not an attitude or a degree.** "Cancelled
  the tool after a month" or "paid for a fix themselves" can be scored; "mixed feelings about
  tools" or "tentative interest" can't, and scorers will disagree on it.
- **Each anchor names one thing a story can show:** an anchor that needs two things ("tried an
  app and paid for it") gets scored on whichever one the story happens to mention.

1. TODO(project): first criterion
   - 0: TODO(project): what the opposite looks like in a story
   - 1: TODO(project): partly shown, or mixed
   - 2: TODO(project): clearly shown
2. TODO(project): second criterion
   - 0: TODO(project): the opposite
   - 1: TODO(project): partly
   - 2: TODO(project): clearly
3. TODO(project): third criterion
   - 0: TODO(project): the opposite
   - 1: TODO(project): partly
   - 2: TODO(project): clearly
4. TODO(project): fourth criterion
   - 0: TODO(project): the opposite
   - 1: TODO(project): partly
   - 2: TODO(project): clearly
5. TODO(project): fifth criterion
   - 0: TODO(project): the opposite
   - 1: TODO(project): partly
   - 2: TODO(project): clearly

## Example story

TODO(project): one short made-up story, scored against the five parts with a reason for each, so
the scorers calibrate. Never a real person's words. Preflight fails until it's written.
