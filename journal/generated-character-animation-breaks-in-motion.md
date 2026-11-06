# Agent-made character animations stray from the reference art and come apart in motion

- Seen: 2026-11-05 to 2026-11-06, while-we-wait.
  - The work: a Rive prototype of the Home-screen monsters (`experiments/home-monster`). First a story with four monsters, then the purple adult redrawn from the guide illustrations. One long session: 5 GIF iterations of the adult and 2 context compactions.
  - Stack: Rive CLI 1.9 (RML written by Python scripts). It has to carry over to react-native-reanimated + react-native-svg.

- What happened: the user found most defects by watching GIFs, and each one cost a round trip.
  - The first redesigned cast, built from measured ellipses and rectangles, was rejected: "nothing like the illustrations".
  - The motion read as frantic ("on crack").
  - A melodramatic forward bend read as "flopping forward" and was reverted.
  - The walk read as a sideways waddle.
  - The same root cause took three rounds of user reports: the body "slightly disconnects", then "black marks and disconnected arms" when arms went up.

- Tried, and worked:
  - **Trace the reference art, don't redraw it.**
    - Crop each view from the reference PNG.
    - Assign pixels to parts by flood fill.
    - Trace their edges (pixel-crack tracing; marching squares breaks on saddle points) and smooth them.
    - Emit one SVG per view. Each part gets a fill on top of an ink layer the size of the fill plus its outline.
    - Draw hairline strokes in each layer's own colour, so anti-aliasing doesn't open seams.
    - The user approved it within two iterations. Measured shapes never got close.
  - **One character at a time** until its look and rig are approved, then reuse the method for the rest.
  - **Generate, don't hand-edit.**
    - A script turns rig, poses and timelines into the Rive file.
    - A pose is a dict of values. A table of channels maps each value to the properties of one or more objects.
    - A fix to one function reaches every timeline, and each iteration is a quick regenerate.
  - **Limit features to ones the target runtime has.**
    - Allowed: group transforms about explicit pivots, cubic and elastic keys, Solo variants, state-machine layers, grain clipped per part.
    - Not allowed: bones, blend modes, feathering, scripts.
  - **Walk in profile, with planted feet.** Root x and leg rotation are linear. The hips dip by L·(1−cos A) at each footfall; each stride is 2L·sin A. The swing foot lifts at the passing pose. This replaced the waddle.
  - **Hidden overlap at every joint.** Each moving part continues under the body, and the body keeps a complete outline underneath it. Joints then stay closed at any angle.
  - **Headless frame review.**
    - One `--commands` process renders many frames at 2x.
    - Check contact sheets, then zoomed and upscaled crops of joints.
    - This found every defect the user found, but only when it was actually done.
  - **Iteration hygiene the user asked for and valued:**
    - each version saved as `<name>_<n>`, never overwritten (`mv -n`, failures renamed `*.broken.*`);
    - GIFs sent to the user's phone;
    - GIFs built with PIL and one shared palette (ImageMagick's cache produced blank frames past ~370 frames).

- Tried, and failed. Avoid these:
  - **Redrawing reference art from estimated measurements.** It is a full wasted iteration and costs the user's trust. Trace from the start.
  - **Reusing parts cut from a single still pose.**
    - A part cut from a still drawing only looks right in that pose. The traced arm had an open shoulder end and ragged ink where the body hid it, and both showed as soon as the arm moved in front of the body.
    - It was patched three times: invented hidden lines, a duplicate arm drawn in front, and finally clean drawings.
    - The final fix: a closed smoothed shape for the hanging arm, and a separate in-front drawing whose outline is open at the shoulder and runs into the body outline.
    - Build each moving part as a complete, clean shape for every pose it will take, before animating.
  - **Sending GIFs after checking only the key poses.**
    - Defects lived in transitions. A "hold" keyframe switches at the end of its segment, so the in-front arm appeared only after the swing finished. Until then the arm vanished into the body and only its crease line floated around as black dashes.
    - Before sending, step through every transition frame by frame at 2x, plus the extreme poses (arms up, full squash, turns).
  - **Reading "skip checks while iterating" as "skip looking".** The user waived test suites, not visual review.
  - **Defaulting to fast, bouncy timing.** An ambient loop that is always on screen needs slow, calm motion. Ask about the mood, or start calmer than feels natural.
  - **Exaggerated full-body poses made by rotating rigid parts.** They look unnatural. Small weight shifts with facial expression read better (a sigh, a mope).

- For a future playbook: trace → rig with hidden overlap → frame-by-frame zoomed review of transitions → GIF to the user, plus a fresh-session review brief.
  - Keep decisions and constraints in a file in the project. This session relied on compaction summaries to carry them.

- Status: worked once (one character approved so far; three remain).
