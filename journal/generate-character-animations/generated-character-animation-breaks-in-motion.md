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

## Into the app: one source, checked frame by frame

- Seen: 2026-11-06, while-we-wait, putting iteration 6 into the app (Reanimated + react-native-svg, no Rive runtime).

- Tried, and worked:
  - **Grill the integration before building.** A short round of numbered questions with recommended answers settled scope, renderer, taps, lifecycle, Reduce Motion and grain. Check facts behind a question before asking it: one of mine wrongly said the walk came from the right edge; reading the preview frames first would have caught it.
  - **Export, don't re-author.** A standard-library script turns the generated `.rml` into JSON (paths, every key, the tap layer's rules read from its transitions). The app evaluates that JSON. A hash test fails when the source changes without a re-export.
  - **Port the runtime's mixing rules from its source, then prove them.** Rive applies the outgoing state at full mix until a transition ends and never blends switch (Solo) keys, so a greeting holds its last pose, then hands back. Reading the runtime source settled this; a guess would have smoothed it. The later pear repair deliberately replaces that outgoing-hold rule with a fading hand-back; see the repair reflection below.
  - **Parity script against the real renderer.** Render the app's frames (resvg) and Rive's frames (CLI, from a temporary copy with app-skipped features removed) for the same scenarios, and diff pixels with a limit. It matched to ~0.02%, located a one-frame blend residual, and found that the CLI's `pointer click` itself advances 3 frames.

- Mistakes to avoid:
  - **Chasing a sub-perceptual residual too long.** Five easing/offset variants for a 1–2% difference over nine frames. Bound such searches; document the residual and give its frames a looser, explicit limit.
  - **Forgetting that approved screenshots feed previews.** Approving the new Home screenshots doubled the monster in the Rive preview that used them as a backdrop. Give previews their own frozen backdrop.
  - **Not checking the machine first.** "Record it on the iOS simulator" was agreed on a Linux machine. Check what the environment can run before agreeing to a verification step.

- Status: worked once (one character, one app).

## Second character, straight to SVG + Reanimated (no Rive)

- Seen: 2026-11-06, while-we-wait, the sky-blue pear. Traced and animated by Python scripts directly into the app's JSON, evaluated by the same TypeScript state machine as the first character. The user reviews on a phone dev build; I review frames rendered headlessly from the app's own evaluator (resvg, outside the repo).

- Tried, and worked:
  - **Skip the intermediate tool once one character is proven.** No exporter, no parity check, no runtime-semantics port. What gets reviewed is exactly what ships.
  - **Fill outline + stroke underlay.** Each part is one traced fill outline; its ink is the same path stroked at twice the line width, drawn before all fills in its group. Simpler than per-part ink masks, keeps line weight in every pose, and parts in one group merge into one silhouette. Arms: an open line (shoulder end open) under their own fill.
  - **Prove a refactor pixel-identical.** Generalising the evaluator from one character to several was checked by rendering the committed engine and the new one at 24 moments and comparing markup strings: identical.
  - **Fit the new character to the old one's beats.** It reacts to the first character; the first stays untouched, so its verified export needs no rework.

- Mistakes to avoid:
  - **Carrying an old prototype's role into a question.** I proposed the pear as the phone-bringer from the right because the old cast did that; the user wanted a bored second arrival from the left, as a later study (`study_7`) had settled. Ask what the character's role is, and which iteration is current, before detailing timing.
  - **Reusing a gait across body types.** The first character's swing amplitude on short legs under big feet drove toes below the ground. Scale steps to the leg (more, shorter steps), keep swing feet level, and look at the passing frames.
  - **Tracing defects that only show zoomed:** staircase points left spikes on stroked outlines (smooth the crack loop before simplifying), a hidden leg extension left a slit that the stroke drew as a hairline (morphological close), and paper enclosed between legs was filled as ink. All three were invisible at Home size and obvious at 4x.

- Status: worked once (second character); not yet seen on a device by me (Linux, no simulator).

## Third character: a child that walks in with the first

- Seen: 2026-11-06, while-we-wait, the lime child. Same method as the pear; the brief changed twice during the grilling.

- Tried, and worked:
  - **Judge cast fit from a lineup on the real background, at real size, before tracing.** Crop each reference sheet's front view, scale by the height rules, paste onto the app's screenshot colour, and look at it at phone size. It showed that a new adult design read as a teddy bear and that the row had no child; the user swapped it for an existing approved child. A redesign before tracing costs one image; after, a re-trace and re-rig.
  - **Let a companion start overlapping its partner.** The child "walks in with" the adult, whose first frame is already at the drawing's left edge; a child trailing behind would have popped in at the clip edge. It starts level with the adult on the near side, takes quicker steps, and falls back to its place. The first character stayed untouched.
  - **Set line weight in screen units, not sheet units.** Each sheet draws its character at its own size; the child's sheet line, scaled down to its cast height, would have been about 35% thinner than the adults'. Its stroke is set from the cast's on-screen line.
  - **Shared helpers moved out of the second character's script, proven by identical output** before any re-timing.

- Mistakes to avoid:
  - **Thresholds tuned on one outline broke on another.** A 4-connected distance makes diagonal lines thicker than straight ones, so the spiky outline's valleys counted as interior ink and were filled. Widen the outline band, then sort interior ink by blob size: big blobs are features (eyes, mouth, creases), small ones are the outline turning in.
  - **A cut-out part left its line behind.** Flooding the arm's fill left the crease's ink in the body; the stroke turned the sliver into a blob when the arm rose. Grow the cut-out over its line, then open (erode, dilate) the body in that zone.
  - **A finished greeting's hold can hide a key story beat.** A late tap's held last pose covered the child's notice for ~10 frames; keep hand-backs short for characters whose beats others react to.

- Status: worked a third time (one app). Not yet seen on a device by me.

## Repairing the pear after the cast changed

- Seen: 2026-11-06, while-we-wait, review and repair of the sky-blue pear after the child, teen and queue sign were added. Product change: `c16ad8b`.

- Tried, and worked:
  - **Re-establish the current scene before applying an old review.** The pear now entered last, stood left of the child, and reacted on a longer shared clock. Rendering that baseline invalidated the old absolute timing targets and pear/adult collision finding. Preserve the latest approved placement and story beats; repair defects against that version.
  - **Review the app's evaluator at two scales.** Full-resolution PNG crops established contour and boundary defects; Home-size composites established title clearance and whether acting read. The rocking and opening chuckle were visible, so they did not need arbitrary amplification. A reusable `scripts/monsters/render.ts` command replaced one-off rendering setup, and worked with the existing Playwright dependency.
  - **Repair artificial cuts rather than disguising them with poses.** The side foot's truncated toe and closed ankle cuts produced a heel spike and doubled line. Retaining the toe curve and inking only the external shin/foot contours removed those artifacts. Inspect both planted and passing feet. Changing the entrance to clear the title also required fewer, slower steps; moving the start coordinate alone would have produced tiny shuffles.
  - **Check the full gesture path and exact view boundaries.** The held wave cleared the new child, but its raising/lowering arc crossed the child's crest; waving outward fixed the whole path. Match width and centre at the side/three-quarter/front swaps, and reserve viewport headroom at the hop's actual peak.
  - **Use failing behavioral tests plus a fresh review.** Tests caught missing fade-out and stage interruptions blocked by blend-in. A fresh reviewer then found return → repeat tap → phone interruption still snapping. A bounded per-channel values/weights snapshot preserved both contributing greetings without overriding channels they did not own. Pear and adult-mope regressions failed before the fix; the reviewer also checked repeated interruptions and disjoint channel sets.
  - **Make regeneration inputs complete.** The pear now records the reference PNG, trace script and tracing helpers as well as rig inputs. Repeated trace/rig generation was byte-identical. The rig-only `--check` still checks against the cached trace; source-hash tests detect changes to its upstream inputs.

- Tried, and did not work well:
  - **The first transition fix preserved only one outgoing greeting.** It passed ordinary fade and single-interruption tests, but discarded a residual greeting when a newly tapped greeting was interrupted. A state label such as Ready was not evidence that the rendered blend was continuous.
  - **I initially treated a clear held wave as a clear gesture.** Intermediate angles exposed a new collision with the child. Endpoint review was insufficient even after updating the cast layout.
  - **Sharing dependencies by symlinking `node_modules` broke the worktree preview.** NativeWind styles disappeared across unrelated screens. A local dependency copy restored them. Running the broad screenshot suite before checking one Home screen wasted a full run on an environment problem.
  - **Ad hoc evidence batches accumulated.** Large contact sheets and overlapping render batches were slower to navigate than a small before/after set indexed by finding and frame. Build the reusable renderer early, retain source frames, and assemble one final animation once the source stabilizes.
  - **Repeated full layout runs were expensive diagnostics for unrelated flakes.** One run caught guide-letter rendering drift; another caught Get to Know You's JS-animated typing dots. I inspected the diffs and kept those baselines unchanged. The final full run passed, but that did not prove the intermittent capture issue fixed; see [guide screenshot text rendering drift](../guide-screenshot-text-rendering-drift.md).

- Mistakes to avoid:
  - **Do not apply historical frame numbers or neighbour assumptions mechanically.** Read current code and render the current cast first; distinguish obsolete findings from surviving defects.
  - **Do not confuse runtime parity with design acceptance.** The earlier full-weight outgoing hold was a deliberate Rive-parity rule, not proof of a broken port. Replacing it with a fading app hand-back was a behavior choice to remove the visible snap; document that distinction instead of rewriting the history.
  - **Do not stop at one tap per stage.** Exercise entry, active greeting, fade-out, repeat tap during fade-out, and a stage change immediately afterward. Check the pose at interruption time and through the return, including channels absent from one greeting.
  - **Do not approve widespread screenshot differences to clear a failed check.** Missing styles were an environment fault; the stale Home baselines omitted an already-added teen and sign. Diagnose those separately, inspect each expected update, and leave unrelated baselines alone.
  - **Do not turn a scoped repair into repeated broad verification.** Use related tests and focused renders while editing, a small visual probe after changing the worktree setup, then the required quick and full layout checks. When a full run finds an unrelated issue, investigate that screen before another full run.
  - **Do not claim native animation quality from Chromium or a GIF.** These checks establish geometry, timing and evaluator behavior. They do not establish iOS/Android rendering parity, touch feel or frame pacing.

- Status: committed as `c16ad8b`; typecheck, lint, 249 changed tests and the final 333-check web run passed. Pre-commit checks remained enabled. This is evidence from one app; native device feel remains unverified.

## Pear and coral finishing pass

- Seen: 2026-11-06, while-we-wait, walking leg cutouts tapered to a point and separated from the coral body; raised traced hands showed downward thumbs.
- Tried: repaired the per-view torso anchor and full-width hidden leg overlap, kept the stance grounded by moving bounce into the torso, and turned palms along the arm axis with a round forearm underneath. Evaluator-rendered transition frames caught the initial edge-on arm collapse; a central tube preserved volume. Native device feel remains for the user to review.


## Performance review and implementation handoff

- Seen: 2026-11-06, while-we-wait, a Home animation assembled without a performance baseline or an explicit understanding of the rendering workload.
- Tried: traced the actual evaluator and SVG update path, recorded operation counts and isolated Node/V8 timings, checked a constant-channel omission with an exact replay, and wrote a measurement-first implementation handoff. Code-proven redundant work is separate from hypotheses about native impact; the owner has an iPhone 13 Pro and no Mac/Instruments.
- Evidence: [full performance case study](home-monster-performance/README.md), including the review, raw measurements, reproducible probe, implementation plan and supporting design.
- Status: review and plan complete; native device measurements and production optimization remain pending. This is context for a future playbook, not a validated performance recipe.
