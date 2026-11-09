# Two-segment arms that look detached, fold behind the sleeve, or jump between frames

- Seen: 2026-11-08, while-we-wait. The Corner Card Slinger (four arms, sleeved upper arms, bare
  forearms, big gloves). The owner called the arms "the biggest hurdle": forearms looked detached
  and showed behind the upper arm, worst in the waterfall shuffle.
- Stack: Python rig generator (`scripts/monsters/dealer.py`) baked to JSON; a transform-only
  renderer (nodes animate x, y, rotation, scaleX/Y, opacity, solo; paths are static; paint order is
  node order). Same constraints as the rest of this folder.
- Status: worked once. Every test and a fresh whole-branch review pass; the owner's look approval
  and device check were still pending when this was written.

Read the folder's [README](../README.md) and [the sheets entry](new-character-from-generated-sheets.md)
first. This entry is about **limbs that bend**, and it applies to any cut-out character with a
sleeve, cuff or other clothing boundary near a joint.

## The short version, for the next agent

1. **Measure before you theorise, and measure the clip the owner means.** I diagnosed Cascade; the
   "card waterfall" was the Shuffle (the spec's idle). A second agent (Codex) had it right. Ask, or
   grep the spec for the owner's words, before rendering anything.
2. **Write a report script first** that walks every frame of every clip and prints, per arm: elbow
   bend, wrist distance from the shoulder at keys, frame-to-frame **jolt**, foreshortening, and how
   much of the forearm a later layer covers. Mine (`scripts/monsters/dealer_arm_report.py`) turned
   every "looks wrong" into a number and a frame, and it found the real cause, which no screenshot did.
3. **Build the joint so it can't show a seam at any angle:**
   - **One pivot, round on both sides.** The upper part ends in a half-disc centred on the pivot,
     and the lower part's top corners lie on that same circle. A narrow cap on a wide shaft shows
     its corners past the cuff on every bend over ~30°.
   - **Separate the anatomical joint from the clothing boundary.** The sleeve ends a little above
     the elbow; a short stretch of bare upper arm leaves the opening and rounds the elbow.
   - **Paint order: sleeve body → arm root → the opening's front lip → forearm.** The lip hides only
     the root inside the sleeve. Under the lip, a forearm bent past ~120° split the garter with a
     notch; in front of everything, a bent arm reads as a forearm curling forward, never one tucked
     behind its sleeve. (A forearm-behind layer is only needed if a hand goes behind the body.)
   - **Cut anything at the opening parallel to the opening.** Traced cuffs are slanted; a level cut
     let the root's outline show under the high side.
   - **Strokes are doubled and centred**: a line extends half its width past its edge. Keep every
     hidden edge at least one line-width inside whatever hides it, and stop open strokes a
     line-width short of a cut, or their round caps leave ticks.
4. **Find out whether the bad frames are keys or in-betweens before touching poses.** Here every key
   was fine; all the 180° folds and elbow flips were in-betweens, because the hand's contact point
   moved in a straight line that passed through the shoulder.

## Motion between keys: what failed and what worked

| Tried | Result |
|---|---|
| Hand-space in-betweens (lerp the contact point, solve IK per frame) | Hand passed within 18 units of the shoulder (= forearm − upper arm): arm folded flat, forearm vanished, elbow flipped: 31–46 unit jumps |
| Joint-space in-betweens (lerp the two keys' joint angles) | **Failed.** A hand below and above the shoulder bends opposite ways seen from the front, so the short path folds through 180° and the long path swings the arm out straight, off the view |
| Bowing the hand path sideways around the shoulder | **Failed.** Pushing the hand out along the elbow's lean leaves the elbow no side to choose: a one-frame flip |
| Elbow side recomputed from the hand direction each frame (the original swivel) | Swivelled through depth whenever a hand crossed shoulder level: the upper arm pointed at the player and the sleeve all but vanished (×0.02–0.27) |
| **Elbow lean interpolated between the keys' own solves** (a `toward` hint for IK) | Worked: the elbow's path is authored by the keys, as Codex recommended |
| **A hand passing near its shoulder passes in front of it** (bow the path toward the viewer in z, peak at the nearest point, zero at keys) | Worked: the arm's line points at the viewer, the elbow stays out at full length, and the forearm visibly crosses back to the hand |
| Depth push as a safety net (a hand nearer than the 145° fold allows comes forward) | Worked; never fold flat |
| **Never solve a dead-straight arm** (soft reach limit saturating at 97% of full stretch) | Worked: near full stretch the elbow's offset changes without bound, so a hand coming back in kicked the elbow out within a frame |

A topological fact worth knowing up front: **a flat two-segment arm cannot change bend direction
without passing through straight (a wide sweep) or folded flat.** Only depth gives a compact third
way. Plan the in-betweens around it.

## Traps the tests caught

- **A speed limit flags fast but smooth moves.** Measure **jolt** (change of per-frame movement):
  eased moves stayed under 7 units/frame², real jumps measured 26–85. On baked data sampled every
  3 frames and played linearly, allow ~3× (I used 12), and **bake every frame where a joint turns
  fast** (> 0.3 rad between samples), or curved swings lurch at each sample.
- **The bake's angle unwrapping** keeps each rotation within ±180° of the previous sample; a joint
  that turns further between samples plays the wrong way round.
- **Soft limits must be applied once.** Easing between two achieved (already limited) wrists and
  limiting again jumped at the keys; ease the achieved wrists and invert the limit to get the request.
- **Glove changes:** ease the wrist, not the contact point, and slide held cards between the two
  grips, including cards a clip places from its own callbacks (the fan), not just the keys' cards.
- **Gate what viewers see, not just the wrist.** A fresh reviewer found two pops my wrist-only tests
  couldn't see: an elbow moving while its hand held still, and a fan of cards jumping at a glove
  swap. Test every glove, elbow and visible card, per clip and through the app's machine (a long
  untapped run reaches the idle beats taps never do).
- **A test between two identical keys can't fail.** Put contact tests on the frames that move.
- **A held hand must never be bowed or re-solved differently from its key.** Return zero offset
  when the two keys' wrists coincide.

## Working with the owner

- Two independent diagnoses (mine and Codex's) merged into one plan were better than either: Codex
  had the right clip and the "author the elbow path" idea; mine had the measurements and the
  paint-order and joint-geometry fixes. When asked to merge diagnoses, list agreements,
  disagreements and how each was resolved, in the plan.
- The owner committed an arm-construction reference sheet mid-plan. Its layer note ("Sleeve body →
  Arm → Front lip") outranked my plan text; record such switches as rulings.
- Render-calibrate every threshold (a forearm at ×0.29 still read as attached; ×0.08 put the glove on
  the shoulder) and put the numbers in the code comments.
- Evidence: while-we-wait `docs/superpowers/plans/2026-11-08-dealer-arm-construction.md` (plan plus
  execution notes), `docs/design/mockups/expansion-corner-card-slinger/README.md` ("Arm construction
  pass"), studies 5–7 in `experiments/expansion-dealer/build/iterations/` (git-ignored).
