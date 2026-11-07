# Report: optimizing a second character with the first one's system

- Seen: 2026-11-07, while-we-wait. The character is the "title lime" beside the heading on the
  Who's playing screen (branch `home-monster-performance`, commits `628381e` and `e56fa74`).
- Who wrote this: the Claude Code session that did the work, right after the Home monster work
  this folder's [README](README.md) describes.
- Status: done and tested; not yet seen or measured on a phone.
- Read this if you are asked to create, refine or optimize a character animation. Read the README
  first for why each step exists. This report shows the steps applied to a new character, start
  to finish, with what changed when they had to fit it.

## The short version

The owner asked whether the lime had been optimized. It hadn't: it had every cost Home had before
its fix. Reusing Home's renderer, tests and visibility rules took about an hour, against days
for Home. The work that transferred unchanged was the probe, the parity replay, the layer
compiler, the frame harness and the mutation checks. Three things needed adapting:
- the compiler assumed Home's timeline shape;
- the screen had its own idea of "out of sight";
- the lime has no story, so catching up had to be bounded.

## What I did, in order (reuse this order)

1. **Read the character's code before measuring anything.** The lime still drew the way Home
   used to:
   - one shared array of every channel value was published each frame;
   - all 30 animated SVG groups read that array, so all 30 woke every frame;
   - the whole drawing was redrawn every frame.

   Ten minutes of reading identified the problem class. On Home it took a full investigation.
2. **Probe the workload.** I wrote a throwaway script that runs the real state machine for 60
   seconds, including a three-tap chain, and counts what changes each frame:

   | Measure | Lime |
   | --- | --- |
   | Channels / nodes / paths / animated parts | 53 / 140 / 75 / 30 |
   | Channels changed per frame (mean) | 14.5 |
   | Parts that actually change per frame (mean) | 3.6 (6.1 while knocked out) |
   | Frames where nothing changes | 0 of 3,600 |

   Two conclusions came straight out of it:
   - Publishing only changed parts would cut part wake-ups by about 88%.
   - That alone would not stop the redraw, because some part moves every frame. The lime's
     "living layer" breathes constantly, a design choice made earlier for character.

   So the renderer change was needed, not just the publishing change.
3. **Skip the device capture, and say so.** On Home, a frozen-versus-live capture had already
   shown that whole-drawing SVG redraw was the dominant cost on this phone, and that the layered
   renderer fixed it. The lime used the same renderer and the same kind of drawing, only smaller.
   I relied on that evidence rather than asking the owner for another capture round, and recorded
   that the lime is unmeasured. If the character had used a different renderer, I would have
   measured first.
4. **Generalize, don't copy.** Home's layer code accepted only Home's monster type, because it
   sized pictures by reading Home's timelines (story, loop, still, greetings). I changed it to take
   any rig plus a plain description of its timelines:
   - `compileHomeParts(rigs: Drawable[])`;
   - `compileLayers(rigs, parts, timelines: Timelines[])`, with
     `Timelines = { defaults, tracks }`;
   - `homeTimelines(runtime)` for Home, and `{ defaults, tracks: clips }` for the lime;
   - one shared worklet, `publishPartFrames(parts, frames, scene)`.

   Home's tests passed unchanged after the refactor, before any lime code was written. One
   renderer means a future fix lands on every character.
5. **Run the parity replay first, before the component.** The replay draws every path both ways:
   through the compiled layers, and by the original SVG rules (opacity hides a subtree, a Solo
   shows one child). It expects the same paths in the same order at the same place, within 1e-9.
   For the lime I covered:
   - every clip at its first, middle and last frame, which includes the held poses;
   - the live machine at seven moments: hello, breathing, idles, and each tap stage;
   - each moment advanced by a fractional 0.37 frame, so blends are mid-way.

   It also checks that every point of every still path falls inside its picture's box. It passed
   first time, so I broke the code on purpose:
   - ignoring Solo selection failed it;
   - dropping a part's scale failed it.
6. **Write the component tests before the component.** I ported Home's tests to the lime, using
   the faithful frame-callback harness (`test/controlledFrames.ts`):
   - one view per part (30);
   - fewer than 30 part publications on a frame;
   - a tap still reaches the machine;
   - stops while out of sight, and publishes the caught-up pose before the next frame;
   - one frame-callback registration across rerenders.

   The registration test failed against the old lime. That was a real, pre-existing bug: the
   inline callback re-registered on every render. Porting the tests found a bug that nobody had
   reported.
7. **Work out where this screen actually hides the character.** This step should not be copied
   from the last character. On Home, the picker covers Home while it stays mounted underneath.
   For the lime:
   - the picker is a modal mounted per opening;
   - onboarding unmounts when it moves on to Home;
   - the display link already stops in the background.

   That left one case, scrolling on short phones. The screen now tracks the header's top with
   `onLayout` and the scroll offset (`scrollEventThrottle={16}`). It passes `visible={false}` once
   the offset passes the art's bottom.
8. **Settle the hidden-time policy from the owner's earlier answer, then bound it.** For Home the
   owner had said the story should keep going while unseen, so the world feels alive. I applied
   that to the lime instead of asking again. The lime has no story, only random idles and a tap
   reaction, so replaying a long absence frame by frame would be wasted work.
   `catchUpLime(rt, state, frames, random)` plays out at most `TIMING.catchUpMax` = 1,200 frames
   (20 s), six at a time. That is enough to finish any reaction: a knocked-out lime has got back
   up. Anything longer is skipped, because by then it is breathing and nobody could tell. Its
   tests:
   - a short absence equals stepping the same frames;
   - a long absence while knocked out ends breathing or idling, at stage 0;
   - a day away calls `random` at most 200 times;
   - no time returns the same state.

   Removing the cap failed one test, and cutting it to 300 frames failed another.
9. **Fit the view box the way SVG did.** The old `Svg` used the default
   `preserveAspectRatio` (xMidYMid meet). The layered root therefore takes
   `scale = min(width / view.width, height / view.height)` and is centred. Here the aspect
   ratios matched, but a renderer swap must not silently change fitting.
10. **Record and publish:**
    - the design doc gained the lime's out-of-sight rule;
    - the performance review gained a lime section, which says the lime is unmeasured;
    - two commits: the shared renderer, then the lime;
    - other sessions' uncommitted files were left alone.

## Results

- **Parts:** 30 part views, published only when they change, plus 6 fixed views. The 30 groups
  that woke every frame are gone.
- **Pictures:** 26, each drawn once. On a 390-pt phone at 3x they take about 2.9 MB, which is
  more than Home's whole cast (about 2 MB). The lime is drawn larger, and its squash and stretch
  makes the compiler draw pictures at up to twice the resolution.
- **Checks:** typecheck and lint clean; 528 UI and flow tests pass; every new test was
  mutation-checked (7 deliberate breaks, all caught).
- **Not done:**
  - no phone capture and no owner check yet;
  - the web screenshot check was skipped, because the web shows the unchanged still pose;
  - the old SVG binding renderer (`MonsterParts.tsx`) now draws nothing but is kept until the
    owner has seen the lime.

## Lessons for whoever animates the next character

- **Audit every animated character, not just the one reported.** The lime had been built from
  Home's original pattern a day before Home was fixed, and inherited all of its costs. Search for
  every user of the old renderer and frame loop before calling an optimization done.
- **Build characters on the shared renderer from the start.** If the lime had been created with
  the layered renderer, this work would not have existed. When creating a character, use the
  current shared pipeline (parts, layers, `publishPartFrames`, visibility prop). Don't copy
  another character's component.
- **Design choices have a performance price, so decide them knowingly.**
  - A "never stands still" breathing layer means no frame is ever free. Changed-only publishing
    then helps only partly, and a renderer that moves pre-drawn pictures becomes required.
  - Squash and stretch raises picture memory, up to four times for pictures drawn at twice the
    resolution.
  - A large on-screen size raises it again.

  These are all fine choices. State their cost when you propose them.
- **The probe pays for itself immediately.** A throwaway script of under 40 lines, running the
  real machine, separated "fewer updates" from "no redraw" before any code was written. Keep one
  per character, or one generic probe that takes any rig.
- **Port the tests along with the renderer.** The harness tests are what found the
  re-registration bug. A character without the visibility, registration and publication tests has
  not adopted the system, even if it uses the renderer.
- **Carry owner decisions forward, and adapt them.** "Keep time while hidden" transferred as a
  principle. The bounded catch-up was the adaptation for a character without a story. Ask again
  only when the principle doesn't decide the case.
- **Say what you didn't measure.** Leaning on another character's device evidence was a
  judgement call. It's written down in the review, so the owner knows a capture is still owed.

## Reusable checklist: adopting the system for a character

1. Find how it draws and steps (renderer, frame callback, what it publishes).
2. Probe: channels, parts, mean parts changed per frame, frames with no change.
3. Make sure the shared compilers accept it (`Drawable` plus `Timelines`); refactor if needed,
   and keep the existing characters' tests green.
4. Parity replay: every clip (start, middle, end), live moments, fractional frames, box
   containment. Then two deliberate breaks.
5. Component tests with the frame harness: part views, changed-only publication, taps, one
   registration, pause and catch-up.
6. Map the character's real out-of-sight cases on its own screen, and wire a `visible` prop.
7. Choose the hidden-time policy (keep or skip) from the owner's principle, and bound the
   catch-up.
8. Match the old renderer's fitting and placement.
9. Record decisions, numbers and what remains unmeasured. Commit the renderer generalization
   apart from the character.
10. Ask the owner for a by-eye check, then a preview-build capture. Only then remove the old
    renderer.
