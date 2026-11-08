# Generate character animations

How to make, repair and speed up 2D vector character animations from reference art, condensed
from everything in this folder. Read this page. Open the evidence files at the bottom only to
check a specific claim.

- Seen: 2026-11-05 to 2026-11-07, while-we-wait. Five characters (purple adult, sky-blue pear,
  lime child, coral teen, title lime) and a traced queue sign, plus two performance passes.
- Stack: Python 3 + Pillow for tracing and rig generation; React Native with Reanimated 4.5.1 and
  react-native-svg for the app; resvg/Playwright for headless frames; Rive CLI 1.9 for the first
  character only.
- Status: worked repeatedly in one project. The first character was approved by the owner. The
  owner reports the performance work made Home "significantly less laggy" (by eye, dev build).
  Native feel of the later characters, a preview-build capture and a periodic stall are still
  open. Not yet tried in a second project or on another stack.

## Where to start

- **In while-we-wait:** the pipeline exists. `scripts/monsters/README.md` is the how-to and the
  source of truth for commands and files. Build each new character on the shared layered renderer
  (`src/ui/MonsterLayers.tsx`, `homeMonsterLayers.ts`, `publishPartFrames`), with its tests on the
  frame harness (`test/controlledFrames.ts`). Copying another character's component brings its
  old costs and bugs with it, as the title lime showed.
- **In another project:** the method below transfers; the code doesn't exist outside
  while-we-wait yet. Adapt `scripts/monsters/tracing.py` and `rig.py`, and rebuild the evaluator,
  renderer, frame harness and parity replay for your runtime. Read your runtime's source for its
  mixing and idle-update rules before relying on them.

## Settle these before drawing anything

Ask in numbered questions, each with a recommended answer, and check the facts behind a question
before asking it (read the latest preview frames, the current code, the machine's capabilities).

1. **Role and current iteration.** Who the character is, where it enters, what it reacts to, and
   which study or iteration is current. Old prototypes carry outdated roles.
2. **Mood.** An ambient loop that is always on screen needs slow, calm motion. Start calmer than
   feels natural.
3. **Cast fit.** Paste each reference's front view, scaled by the height rules, onto the real
   background at real phone size. Redesigning before tracing costs one image; after, a re-trace
   and re-rig.
4. **Target runtime limits.** Use only what the shipping runtime does: group transforms about
   explicit pivots, cubic/elastic/held keys, Solo-style variants, layered state machines, per-part
   clipping. Leave out bones, blend modes, feathering and scripts.
5. **States and interactions.** List every state, tap branch, interruption and boundary (loop end,
   view switch, stage change) now. These become the checks in step 6 below.
6. **Performance choices.** A layer that never stands still means no frame is ever free; squash
   and stretch and a large on-screen size raise picture memory. These are fine choices; state the
   cost when you propose them.
7. **Verification.** What this machine can run (simulator? decoder for screen recordings?) and
   what only the owner's device can show.

## Making a character, in order

1. **Trace the reference; redrawing from measurements always failed.** Crop each view, classify
   pixels into ink/fill/paper, flood-fill parts, trace pixel-crack outlines (marching squares
   breaks on saddle points), smooth the crack loop *before* simplifying, emit SVG paths.
   Done when every view matches its reference at 4x zoom with no spikes, slits or filled gaps.
2. **Ink as a stroke underlay.** Each part is one fill outline; its line is the same path stroked
   at twice the line width, drawn before all fills in its group, so touching parts merge into one
   silhouette. Set the line width in screen units so it matches the rest of the cast on screen,
   not the reference sheet's line.
3. **Build every moving part as a complete shape for every pose it will take.** Hidden overlap at
   each joint: the part continues under the body, and the body keeps a full smooth outline beneath
   it. An arm is one continuous contour, open at the shoulder, through the whole swing. Parts cut
   from one still pose break as soon as they move.
4. **Generate everything from scripts.** A pose is a dict of values; a channel table maps values
   to rig properties; timelines are poses at frames. A fix to one function reaches every timeline,
   and each iteration is a quick regenerate. Record every input (reference PNG, trace script,
   helpers, rig) and keep a hash/freshness test that fails when an input changes without a
   regenerate.
5. **Solve contact before adding bounce.** Walk in profile with planted feet: solve the stance
   shin angle from the planted ankle's world position, compensate hip height, counter-rotate feet
   to keep soles level, lift and curl the passing foot. Scale steps to the leg (short legs take
   more, shorter steps). Put bounce in the torso, not the stance.
6. **Write the interaction and boundary checks** from the list above: entry, active greeting,
   fade-out, repeat tap during fade-out, stage change right after, loop boundary, a full repeated
   cycle, each view switch. Prove a greeting is actually active before testing its interruption.
   Hand-backs fade out using a per-channel snapshot of every contributing greeting, including
   channels one greeting doesn't own. Keep hand-backs short for characters whose beats others
   react to.
7. **Review frames headlessly, at two scales.** Render from the app's own evaluator. Step through
   every transition frame by frame at 2x, plus the extremes (arms up, full squash, turns, hop
   peak) and the exact frames of each view switch. Full-size crops establish contour defects;
   phone-size composites establish whether the acting reads. Check whole gesture paths for
   collisions with neighbours, not just the held pose. Done when you would bet the owner finds
   nothing new.
8. **Get a fresh review with a narrow brief.** A separate session with a short list of what to
   check. It found missed interruption cases twice.
9. **Send a versioned preview.** Save each version as `<name>_<n>` and never overwrite it. Build
   GIFs with PIL and one shared palette that gives the character crop enough weight. Compare the
   GIF with native frames at the same times, at study and phone size, before blaming the rig.

One character at a time until its look and rig are approved, then reuse the method for the rest.
Once one character is proven in the app, generate the next straight into the app's data format:
no intermediate tool, no exporter, no parity port.

## Repairing an existing character

1. Read the current code and render the current cast first. Old reviews carry frame numbers,
   neighbours and placements the cast has since outgrown; keep the latest approved placement and
   story beats, and repair against that.
2. Confirm each suspected defect in enlarged native pixels; a reduced contact sheet only shows
   where to look. Inspect the source subpaths of a visible mark before patching a nearby part.
3. Fix the geometry (restore cut curves, ink only external contours, close hidden slits) rather
   than hiding the defect with a pose.
4. Write a failing test for each behavioural defect, fix it, then do steps 7 to 9 above.

## Optimizing performance

1. **Read how the character draws and steps** (renderer, frame callback, what it publishes).
   Often this names the problem in minutes.
2. **Probe the workload** with a small deterministic script that runs the real state machine and
   counts channels, parts, parts changed per frame, and frames with no change. Rerun it on any
   commit before trusting an older review.
3. **Capture frozen versus live on the device** before optimizing anything: the same native tree,
   once still and once moving. It splits mounting cost from per-frame cost and your code from the
   renderer, with no native profiler. On while-we-wait, JS took under 1 ms a frame; the cost was
   react-native-svg redrawing the whole drawing when any part moved.
4. **Fix the real cost.** For vector characters on React Native, the fix was a layered renderer:
   one zero-sized view per animated part moving pictures drawn once, with SVG markup kept for
   still poses and the web. Publish only parts that changed. Pause while out of sight (scrolled
   away, covered including by native modals, backgrounded); on return, catch up time (bounded for
   characters without a story) and publish the caught-up pose before the first visible frame.
5. **Prove parity before any device run.** A replay compares every path's paint order and
   position (within 1e-9) against the reference SVG rules, across every clip's start/middle/end,
   live moments, fractional frames, interruptions and hidden-to-visible switches. Then break the
   code on purpose and watch it fail.
6. **One change per device build** when a regression is possible, on Release/preview builds only.
   Give the owner a gated in-app capture tool, a short run sheet and one copyable JSON per session.
7. **Audit every animated character** for the same costs once one is fixed. Fix them in the
   shared renderer so one fix lands on all.

## Testing rules

- Mutation-check every new test: break the guarded code and watch it fail. A test that passed
  before its feature existed proves nothing until then.
- Use a faithful frame-callback harness. Reanimated's stock Jest mock returns a fresh, reset
  `useSharedValue` every render and stubs `useFrameCallback` as never running, which hides
  re-registration and pause/resume bugs.
- When you change update patterns, check what the framework does once values stop changing.
  Reanimated 4.5.1 hands settled props back to React as `matrix`, which react-native-svg's `G`
  ignored; still parts snapped to their mount pose.
- Time through the framework's deferred phase: Reanimated runs prop updaters in a microtask after
  `.set()`.
- Prove a refactor identical by rendering old and new at many moments and comparing output
  exactly, before any behaviour change.
- `x.ts` and `x.native.ts` resolve to the same import on iOS; give them different names.

## Traps, and what to do instead

| Trap | Do instead |
|---|---|
| Sending a preview after checking only key poses | Step through every transition; defects live there |
| Reading "skip checks while iterating" as "skip looking" | The owner waives test suites, never visual review |
| Exaggerated full-body poses from rotating rigid parts | Small weight shifts plus facial expression |
| Reusing a gait or thresholds tuned on another body | Rescale to the new legs and outline; look at passing frames |
| Chasing a sub-perceptual residual | Bound the search; document it with a looser, explicit limit |
| Treating a state label (Ready) as proof the blend is continuous | Check the rendered pose through the interruption |
| Claiming FPS, CPU or battery gains from update counts or battery % | Report workload cuts and device timing separately |
| Agreeing to a verification step the machine can't run | Check the environment first |
| Approving widespread screenshot diffs to clear a failed check | Diagnose environment faults (e.g. symlinked `node_modules`) separately |
| Repeated full suite runs for a scoped change | Related tests and focused renders while editing; full run once at the end |
| Claiming native quality from Chromium or a GIF | Those prove geometry and timing; touch feel and pacing need the device |

## Working habits

- Keep decisions and constraints in a file in the project, not in compaction summaries.
- Keep one small evidence index (finding, frame range, decision). Keep native frames and
  re-encode when only the palette changes. Build a reusable renderer early instead of
  accumulating ad hoc contact sheets.
- Review one diagnosed issue at a time; do one full recording after the source stabilizes.
- Name failed experiments `*.broken.*`, keep them out of the way, and leave other sessions'
  uncommitted work alone.
- Give approved screenshots used as preview backdrops their own frozen copy.
- Say what you didn't measure, in the project's review doc.

## Evidence

- [Generation and repair journal](generated-character-animation-breaks-in-motion.md): every
  iteration of the six characters, in order, with what failed.
- [Performance journey](home-monster-performance-journey/README.md) and
  [title lime report](home-monster-performance-journey/title-lime-report.md): the performance
  work as the implementing session saw it, and its reuse on a second character.
- [Re-renders delayed taps](animated-character-rerenders-delay-taps.md): the drawing rebuilt on
  every unrelated Home render, so taps lagged; diagnosis, the memo fix and its tests.
- [Performance case study](home-monster-performance/README.md): review, raw measurements, probe,
  design, plan and device results.
