# Character animations on one Skia canvas

Moving a generated vector character from one native view per part to a single Skia canvas, and
what the canvas then made possible: soft shadows, colour runs, clips and motion smears.

- Seen: 2026-11-09, while-we-wait. The Corner Card Slinger (191 animated parts, about 400 vector
  shapes) on the Expansion screen. Home's monsters and the title lime were still on the old
  renderers when this was written.
- Stack: Expo 57, React Native 0.86 (Fabric), Reanimated 4.5, `@shopify/react-native-skia` 2.6.2
  (which bundles `canvaskit-wasm`, so the same drawing code runs in Node). The rig, timelines and
  state machine are the ones in [Generate character animations](../generate-character-animations/README.md);
  only the renderer changed.
- Status: worked once. The owner saw the first conversion on a phone and said it "looks great".
  The later light and motion pass is checked in Node and in web screenshots only: its frame rate
  and feel on a phone, and whether the detached hand is gone for good, were not confirmed when
  this was written.

Read the older folder's README first for how the rig is made. This entry is about **drawing it**.

## Why move

With one native view per part, the same class of bug kept coming back: a part left behind
(a hand detached when the screen was opened a second time), a part hidden (a face that
disappeared, with no way to reproduce it). Each had been "fixed" several times. The cause was
never found in the old renderer, and that is the point: a part that is not a view cannot be left
behind or hidden by the view system. The owner asked whether to switch before asking for the
fixes; the repeated fixes were the reason to say yes.

## The short version, for the next agent

1. **Keep everything above the renderer.** The rig, the evaluator and the state machine did not
   change. One function turns the scene's channel values into every part's frame (matrix and
   opacity) and returns the *same array* when nothing changed, so the canvas redraws only when it
   must.
2. **Compile once, replay each frame.** Flatten the layer tree into steps (open a part, open a
   fixed group, draw a picture, close). Record each run of still shapes once as an `SkPicture` in
   artboard units. Each frame, replay the steps into a new picture with `save` or `saveLayer`
   (for a fading group) and `concat`, inside `useDerivedValue`, and show it with one
   `<Canvas><Picture/></Canvas>`. One shared value carries all the frames. React renders the
   canvas once.
3. **Pass the Skia API in; import only types.** The drawing module takes `skia` as an argument and
   uses Skia's enums as numbers. So it runs on the phone, runs in Node on CanvasKit for tests, and
   never loads in the web bundle (a `.web.tsx` stub returns nothing; the web preview draws SVG
   markup instead).
4. **Test with real pixels in Node.** Load CanvasKit through Skia's own web wrapper
   (`JsiSkApi(CanvasKit)`), draw the plan, and compare with the rig drawn the plain way: every
   node in turn, straight from channel values, no parts or plan. Zero differing pixels for every
   clip at several points, and through a few thousand simulated frames with taps. Dispose images
   and surfaces after reading pixels, or `readPixels` starts returning null in a long run.
5. **Look at it.** Write a small script that renders named clips at named frames to a PNG, with a
   crop and a scale. Every art decision below was made from those renders, not from the numbers.

## Traps, each of which cost time

- **A canvas clips; views do not.** The character drew up to 34 units outside his own box (the
  table's edge, the sign's legs) and nobody had noticed. Give the canvas a margin on every side
  and shift the drawing by it. A test draws every clip and fails if anything reaches the margin's
  edge, and also fails if he stops spilling, so the margin can be removed then.
- **Pictures are skipped by their bounds, and the default bounds start at the origin.**
  `beginRecording()` with no argument uses (0, 0, 2000000, 2000000), on the phone and in
  CanvasKit. A part's shapes sit on every side of its origin. When the group's origin lay past the
  canvas's right or bottom edge, the whole picture was skipped, whatever it drew. Found only
  because a cropped test render lost his head. Record still pictures with bounds on every side of
  the origin. The per-frame picture starts at the canvas corner, so its default is fine.
- **The old renderer's bugs come along.** The layer compiler pushed a node's own drawing only
  `if (node.d)`, so nodes that draw a bundled image (the card symbols) had never been drawn on a
  phone. The pixel test against the plain drawing found it on the first run.
- **Do not tear the character down when the app is "inactive".** iOS reports `inactive` for a
  purchase sheet, Control Center or a notification pull. The old code treated that as Reduce
  Motion and rebuilt him. Keep two signals: Reduce Motion picks the still presentation; not being
  in front only stops the frame callback, and he carries on from where he stopped.
- **A native module needs a new development build.** Nothing here can be seen on a phone until
  the owner makes one. Say so early.
- **Work where the owner can watch.** The first attempt started in a git worktree without a
  go-ahead and was stopped. The owner wanted a branch in the main checkout to follow along.

## What the canvas then made possible

Added as optional properties on rig nodes, so the generator stays the source:

- **A fill's `blur`** (a mask filter that follows the canvas's scale) for soft shadows.
- **A fill's `to`** (a linear gradient from the fill's colour to another).
- **A node's `clip`** (a path that everything the node draws stays inside). This is what makes a
  shadow usable: the hat's shadow is clipped to the head's outline, a hand's to the tablecloth.
- **A part's `smear`** (drawn only on the canvas): moving faster than a threshold, it trails a
  few fading copies back along its path.

How they were used, and what was learnt:

- **One rule kept the style.** Forms stay flat-filled with an ink line; only cast and contact
  shadows are soft. Softening the forms themselves would have left the character looking unlike
  the app's other drawings.
- **A shadow that follows another part** is a second node driven by the same channels (a channel
  can list several nodes), placed inside the surface it falls on, under that surface's clip. Its
  opacity is a channel computed from the pose: how far the hat has lifted, how high the hand is.
  Name that channel so the generator eases it; ours treats names ending `.opacity` as cuts.
- **The patchy shading the owner disliked was traced paint.** Two dark crescents at the brim's
  ends became one lip along the whole lower edge, built from the edge's own sampled curve with a
  width that swells at the ends and runs out at the tips.
- **Smears need the scene before, and the time between.** The tick hands the canvas the previous
  frames and how many sixtieths of a second passed; speed is the move divided by that, so a
  120 Hz screen gets the same trail. Shift only the copy's position, not its turn or scale. Cap
  the trail's length, treat a very large move as a jump and not a smear, give each copy's
  `saveLayer` a small bounds box, and when the scene stops changing, redraw once without the
  trail or the last one stays on screen.
- **The web preview can match.** `clipPath`, `feGaussianBlur` and `linearGradient` are plain SVG,
  and react-native-svg's `SvgXml` accepts them. So the web screenshots record the new shading and
  review it for free. Give the blur's filter a generous region or it is cut off.

## Not done, or not known

- Frame rate on a phone when six cards smear at once (18 small offscreen layers in the worst
  frame). Unmeasured.
- The cause of the detached hand in the old renderer. If it returns on the canvas, it is in the
  animation data or the state machine, not the renderer.
- The other characters. Home's monsters share a scene and a clock, so their conversion also has
  to change a test that expects them to be torn down in the background.

## Where the code is (while-we-wait)

- `src/ui/monsterDrawing.ts`: the plan, the painter, the per-frame drawing and the smear.
- `src/ui/MonsterCanvas.tsx` and `MonsterCanvas.web.tsx`: the canvas, and the web stub.
- `src/ui/homeMonsterParts.ts` (`resolveScene`) and `src/ui/homeMonsterLayers.ts`: frames and layers.
- `test/skia.ts` and `src/ui/monsterDrawing.test.ts`: CanvasKit in Node and the pixel tests.
- `scripts/monsters/dealer.py`: the shadows, gradients and smear boxes, at the hat and the table.
- `docs/design/mockups/expansion-corner-card-slinger/README.md`: the art notes for each pass.

- Seen: 2026-11-10, while-we-wait. The title lime still used animated SVG groups after Pete moved to one canvas; its foreground signal also replaced the moving character while inactive.
- Tried: 2026-11-10, while-we-wait. Reused MonsterCanvas and compiled scene frames for moving and held poses, separated Reduce Motion from foreground pausing, and redrew only the title’s front artwork. Real Skia matched every clip and a tapped simulation, canvas-edge checks passed, and the full web check stayed clean after 15 predicted header approvals; phone feel remains unverified.
