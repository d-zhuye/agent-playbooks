# Project specialists

Specialists that only one project needs live here, so the phone book stays the one place to look
for every specialist, general or not. Each project gets a folder named after its folder on disk:
`projects/<project>/`.

## What goes here

- **New specialists** no other project would call: stand-ins for the project's audience (its
  main buyer, a teenager, a grandparent), or an editor for its own kind of content (a trivia
  editor for a quiz app, a menu editor for a restaurant site).
- **Additions to a general specialist:** what the typography specialist, say, needs to know only
  in this project: which docs hold its type rules, the mistakes this project keeps making, the
  calls it has already made. An addition doesn't repeat the general brief; it builds on it.
- **Character sheets:** one character's persona and rules, read by the character writer, the
  humor writer, the narrative designer, and the illustration and motion specialists. The general
  briefs hold no character details, so they live here.

Project details are allowed here, unlike in the rest of the phone book: app names, screens,
characters, docs. Point at the project's files instead of copying their rules or values, because
the project's docs change and copies go stale.

## A project folder

```text
projects/<project>/
  index.md                 the project's specialists, in the same one-line format as the main index
  <specialist>.md          a new specialist's brief, from ../../template.md
  <area>-<specialist>.md   an addition to a general brief, such as design-typography.md
  <character>.md           a character sheet: persona and rules
```

Projects so far: [While We Wait](while-we-wait/index.md).

The project's index has two lists:

- **Its own specialists,** linked to their briefs.
- **Additions,** each linked to the general brief it builds on and to the addition.

It can also list the general specialists the project calls most, with links into the main index,
so an agent in that project knows where to start.

## Writing an addition

Start it with the general brief it builds on, then add only what's specific:

```md
# Typography specialist: <project> addition

Read the general brief first: [Typography specialist](../../design/typography.md).

## Read in this project
<the docs that hold this area's rules, as paths>

## Decisions already made
<what the project decided and where it's recorded, so you can tell a choice from an oversight.
You can still disagree; see how-specialists-work.md>

## Mistakes this project makes
<ones seen here before>
```

## Calling a project specialist

The same prompt as in the main index. For an addition, the specialist reads
`how-specialists-work.md`, then the general brief, then the addition. For a new specialist, it
reads the shared rules, then the project brief.
