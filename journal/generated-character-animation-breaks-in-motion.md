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
  - **Walk in profile, with planted feet.** Root x and leg rotation are linear. The hips dip by L·(1−cos A) at each footfall; each stride is 2L·sin A. The swing foot lifts at the passing pose. This replaced the waddle. Iteration 6 below refines this contact model; linear leg rotation still allowed sliding.
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
    - The final fix: a closed smoothed shape for the hanging arm, and a separate in-front drawing whose outline is open at the shoulder and runs into the body outline. This was the iteration 5 fix; iteration 6 below replaces the drawing handoff with one continuous contour.
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

## Iteration 6: finishing and checking the motion

- Seen: 2026-11-05, while-we-wait, purple adult iteration 6. The user asked for a finishing pass after a separate frame review. This builds on the history above; it is still one character in one project.

- Tried, and worked:
  - **Keep one arm contour through the whole swing.** The earlier two-drawing repair still jumped when the hanging arm handed off to the in-front arm. A single clean, open-shoulder contour, with matching fill/ink transforms and a small continuous shoulder adjustment, removed that handoff and its floating crease marks. Tune the hand to reach the cheek/chin in the actual rendered pose. This supersedes the two-arm recommendation above for this rig; hidden overlap still matters.
  - **Preserve traced likeness, clean the geometry that must move.** Smooth body, antenna and leg contours followed the traced silhouette while removing ragged hidden edges. Two apparent antenna specks were actually forehead scraps inside the happy-eye trace. Inspect the source subpaths of the visible mark before patching a nearby body part.
  - **Solve contact before adding bounce.** Linear root travel plus linear leg rotation still slid. Use the stance angle implied by the planted ankle's world position, compensate hip height, and counter-rotate the foot to keep its sole level. Lift and curl the passing foot so two horizontal soles do not stack. This refines the earlier walk recipe. Open the stance before the turn; give three-quarter view time to read and match width/centre across views.
  - **Treat view switches as exact timeline boundaries.** An interpolated foot transform reset for one frame at the discrete view change. Explicit held keys kept the outgoing transforms until the incoming view owned them. Verify boundary frames themselves, not just the poses on either side.
  - **Make interruption rules explicit.** A late mope tap suppressed the phone reveal. Stage changes now cancel incompatible greetings; Still and Replay also cancel an active greeting. Compare native renders with an uninterrupted run, check the loop boundary and a full repeated cycle, and prove a greeting was active before testing its cancellation. `adult_checks.py` retains these checks; `capture_adult.py` derives recording length from the rig.
  - **Use a fresh review with a narrow brief.** The reviewer found no important visual issues but correctly identified missing coverage for active-greeting → Still/Replay. Those cases were added and passed before hand-back. Visual sampling and automated comparisons complemented each other; neither proved everything alone.

- Mistakes I made, and should avoid:
  - **I reported eye flicker from a reduced contact sheet.** Enlarged native lens crops showed a consistently happy eye; measuring the isolated eye ink confirmed it. The defect was my reading of the thumbnail, not expression ownership. Correct the report before changing working code. Contact sheets locate suspicious frames; original pixels establish the finding.
  - **I initially weighted the GIF palette by the whole screenshot.** The tiny Home character received too few colours and looked badly posterized although the native PNG was clean. A shared palette is necessary but insufficient: give character crops enough histogram weight. Compare the encoded GIF with native frames at matching times, at both study and phone size, before treating encoding damage as a rig defect.
  - **I left some interaction cases until late.** Static Still and ordinary Replay checks do not cover interrupting a greeting, and one waiting tap does not cover both greeting branches. List the state/interaction cases before polishing geometry; exercise each branch and boundary deliberately. Verify pointer coordinates with a visible response rather than assuming viewport scaling applies.
  - **I made the review more expensive to navigate than needed.** Many overlapping capture batches and large contact-sheet dumps accumulated. Keep one small evidence index of frame ranges, findings and decisions; retain native frames and re-encode them when only the palette changes. Review one diagnosed issue at a time, then do one full recording after the source stabilizes. Temporary scratch notes helped this session but are not a durable project handoff.

- Next-run order: preserve the reference and target-runtime constraints → render a baseline → verify suspected defects in enlarged native pixels → define interaction/boundary checks → repair complete moving contours and contact mechanics → inspect dense transitions → compare encoded output at both sizes → fresh review → versioned GIF. Keep failed experiments isolated and preserve unrelated user work.

- Status: worked once. Iteration 6 was delivered for user review; native compilation and behavioral checks passed. This is not evidence of user approval or validation across characters/projects.
