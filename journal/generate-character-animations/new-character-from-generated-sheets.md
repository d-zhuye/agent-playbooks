# Building a new character from AI-generated reference sheets

- Seen: 2026-11-08, while-we-wait. The Corner Card Slinger, a four-armed card dealer for the
  Expansion screen: the seventh character, and the first whose art came from sheets the owner
  generated from my prompts (concept → reference sheet → construction sheet), not from existing
  game illustrations.
- Stack: Python 3 + Pillow tracing (`scripts/monsters/tracing.py`, `trace_dealer.py`), rig and clips
  in `dealer.py`, played by a small TypeScript machine (`src/ui/expansionDealer.ts`) on the shared
  native-layer renderer (`MonsterLayers.tsx`, `homeMonsterLayers.ts`).
- Status: worked once, up to an approved still with arms. Arm motion, the study GIF and the device
  check were still to come when this was written.

Read the folder's [README](README.md) first: tracing, hidden overlap, poses-not-frames and the
testing rules all still apply. This entry adds what is different when **you write the prompts that
make the reference art**, and the rig traps this character hit.

## If you're starting a new character: do this, in order

1. **Get the character's role and mood settled before any art.** A grilling round (numbered
   questions, each with a recommended answer) settled role, personality, what the dialogue is, what
   "interacts" means (greet, taps, react to a button), and scope, in three rounds. Write it into a
   spec the owner approves.
2. **Ask for three concept directions, one prompt each, and let the owner generate and pick.**
   Give each the same composition (the character in its scene plus three expression heads) so they
   compare like for like. The owner picked the least casino-like one for reasons I hadn't weighed.
   Their reasons go in the spec.
3. **Reference sheet prompt: the format of the existing packs**, a 4×3 grid of turnaround,
   expressions and moves, with the chosen concept attached as the identity input. List every
   anatomy invariant in capitals (EXACTLY FOUR ARMS, which socket each attaches to) and every
   colour that must match across parts.
4. **Audit the sheet against the animation before planning anything** (see the traps below for what
   to look for). Write the audit into the art folder's README.
5. **Ask for a construction sheet, which the reference sheet can't replace.** Prompt it for:
   - a parts row: the body with a blank face, the hat, its underside, the head top with the hat off,
     and one upper-arm and one forearm piece, **each with a small dot at its pivot**;
   - a large library of hands (here eight gloves), all with the same cuff;
   - the trick poses no other sheet shows.

   The pivot dots trace as holes in their region: read them as the joints. A 40 px hand on a
   reference sheet is untraceable; a 150 px hand in a library traces cleanly.
6. **Build what doesn't need the missing art while the owner generates it.** Here the logic, the
   component, the screen layout and its tests were built on clips carried by the body, face, hat and
   cards alone. The arms then joined the same clips. Nothing was traced twice. Only the art waited.
7. **Before asking for the look approval, prove the rig can reach the key poses.** Solve two or
   three of the hardest poses with the IK and render them. The first arms couldn't reach the hat
   that a tap trick lifts.
8. **Show the owner a phone-size screenshot of the real screen, not a contact sheet.** The web
   preview at iPhone 15 and SE sizes caught a layout problem (the table floating above an empty gap)
   that no rig render would.

## Traps, each with its symptom, cause and fix

| Symptom | Cause | Fix |
|---|---|---|
| Garters came out pink though the prompt said lavender | Generators drift on secondary colours | **Sample pixels; never judge colour by eye.** Remap while tracing. In the next prompt name **one hex for every part that must match** (garters, hat band, card backs): the construction sheet then came back with one lavender |
| An expression cell's features landed above the face | Fitting each cell by the body's box; a hand holding cards covered the body | Fit cells by something no hand covers (here the hat's box), then **centre every expression on its own eye pair** at the Front face's eyes |
| One cell's brow ran into the head outline and its mouth into the cards | Generated cells aren't equally clean | Take each feature set from the cleanest cell showing it. The sly face came from a different cell than the one captioned for it |
| An antenna merged into the hat | Reclassified every dark-but-coloured pixel as fill so the brim's shade and buttons wouldn't count as ink; the anti-aliased fringe between the two parts did too | Reclassify only **solid blobs** of dark colour (erode then dilate the mask); thin fringes stay ink |
| A thick black wedge beside the head | **Two nodes with one id.** The body's fill was keyed like its pivot group, so the pivot's channels (y = 20) moved the fill too | **Add a test that every rig node id is unique, before anything else.** It caught a second clash (each glove and its own fill) the same day. Diagnose by recolouring the ink red and the fill green and rendering; then render the one path alone |
| A sleek outline bulged and folded on long straight sides | The app draws a Catmull-Rom curve through the points; sparse points on a straight side overshoot | Keep evenly spaced points (every ~14 units) on straight runs; simplify curves, not lines |
| A hidden part (head top under a hat) wasn't on the main view | It's hidden there | Build it from geometry tangent to the traced sides, with proportions measured in the cell that shows it (here the hat-lift move) |
| Stripes and gingham would trace as noise | Dozens of small regions; the renderer has no clip paths | **Generate pattern fills in Python, clipped to the traced outline** (Sutherland-Hodgman: the box is convex, the subject needn't be). Fewer, wider stripes read at phone size |
| Mirrored right arms landed in the wrong place | A node's matrix scales, then turns (`R(rot)·S`). With `scaleX: -1` at the root, the root's rotation runs the other way | Solve the arm in the mirrored frame, then **negate only the root's rotation**; the joints below don't change |
| Lower hands near their shoulders folded the elbows out past the view | A limb pointing at the viewer has its full length in a 2D rig | **Foreshorten it**: a shorter forearm for arms that come onto the table (0.55×). Raised arms that must reach the hat got a longer one (1.25×), as the reference draws them, rubber-hose style. Bake these per arm; don't stretch per pose |
| The data file reached 504 KB against an estimate under 300 | Four arms each carrying eight gloves, every outline stored twice (ink and fill), at full trace detail | Simplify small parts harder (a 40-point glove needs far fewer points), and drop shapes the creases already draw. It came to 358 KB with no visible change at 3×. **Budget data size when you add per-limb variants** |
| `resolvePartFrame is not a function`, only in the UI tests | Reanimated's Babel plugin captures what a worklet calls where the worklet is defined | Define a worklet after the worklets it calls. Pure logic tests don't run the plugin, so they pass |
| A logic test failed to import a `.webp` | The node test project can't load images | Check data against the source lists (`gameIds` → doodle kinds) instead of importing the artwork |

## Patterns worth copying

- **One arm, three layers, one chain of joints.** Forearm, sleeve, glove, each with its own root, the
  same shoulder and elbow rotations driven by one channel entry listing several nodes. The sleeve
  covers the forearm's top, and the glove can cross in front of the sleeve. A glove Solo holds
  every hand shape.
- **Author poses as "this glove's palm (or the card it holds) here, at this angle".** A two-joint IK
  turns that into rotations with the elbow bent away from the body. Its forward twin says where a
  held card lands, so cards stay in hands through any pose. The trace stores each glove's palm, the
  angle it was drawn at, and any held card's centre and angle.
- **Fix the drawing's scale at the first size it is given**, and absorb later resizes with an outer
  transform. A test spying on the painter (`paintProps`) proves a rerender, a pause, a button press
  and a resize rebuild nothing. A mutation (scale follows size) makes it fail.
- **Bitmaps inside a vector rig:** an `image` node in a picture draws a bundled symbol in paint order.
  SVG markup can't reach bundled assets, so the web preview shows what lies beneath.
- **Refactor the shared renderer only with a before/after hash** of every other character's compiled
  layers. It came out identical.

## What I'd do differently

- Put the unique-id test and a data-size check in the first commit of the rig, not after the first
  confusing render.
- Name hex colours in the very first reference-sheet prompt, not the second sheet's.
- Ask for the construction sheet in the same breath as the reference sheet. Hands were always going
  to need it, and it gated most of the rig.

- Seen: 2026-11-08, while-we-wait, dealer refinement after the approved still. The owner reported lumpy torso sides, implausible arm/hand motion, expression size drift and unnatural cards. Source inspection found the vest mask included occluding sleeves/gloves, expression fits used different scales, right gloves reused left-world directions, and cards vanished without a completed transfer.
- Tried: restored an independent vest contour and fixed facial landmarks; used equal physical limb lengths with projected elbow swivels and table-contact compensation; authored explicit release/catch/gather events and queued decorative reactions at secured poses. Committed in segments and produced study_3.gif. Outcome pending owner motion review and all checks, explicitly deferred by the owner; this is not a verified success.

- Seen: 2026-11-08, while-we-wait. The owner authorized the agent to generate a replacement construction pack: canonical anatomy, parts/assembly, mirrored hand contacts, facial expressions and motion construction.
- Tried: generated one canonical sheet with the built-in image tool, used it as a reference for subsequent pages, split motion into three readable pages, and requested a targeted hat-removal/lean head correction. Saved seven native PNGs and exact prompts in five commits. The pack is explicitly a visual draft: independently generated drawings are not a dimensionally registered vector master, so reuse one canonical body/head during the later vector rebuild. Owner approval remains pending; automated checks and commit hooks were deferred at the owner's request.
