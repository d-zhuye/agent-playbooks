# Fixing a flawed traced prop (a hat) without redesigning it

- Seen: 2026-11-09, while-we-wait. The Corner Card Slinger's fedora. The owner flagged three flaws:
  the brim fit his head "like a trapezoid", the shading looked "as if a kid colored it in", and in
  the hat trick the crown came loose from the tipped brim.
- Stack: the same Python rig generator and transform-only renderer as the [arms entry](arms-that-stay-attached.md).
  The hat is traced polygons smoothed as Catmull-Rom loops, plus a separate "underside" view (an
  ellipse ring) that the trick switches to.
- Status: worked once. Tests, web screenshot check and owner's request done; device check pending.

## What happened

1. **I redesigned instead of fixing, and the owner rejected it.** I rebuilt the hat as a
   constructed fedora (a parametric brim, a Bézier crown, cel shading). It fixed every flaw and
   looked "tacky". The owner liked the traced design, and only the fit and the shadows were wrong.
   Two rounds of tuning were wasted. **Lesson: when the owner names flaws in approved art, change
   only the flawed points and keep the traced shapes, proportions and colours. If you think a
   redesign is needed, show the narrow option first and ask.**
2. **The narrow fix took a handful of points:**
   - *Fit.* Each traced brim end dropped into a flap whose inner edge ran down the side of the head.
     I replaced only that run of outline points (from where the brim meets the head to the tip) with
     one cubic, starting along the incoming edge's direction. Starting at the corner where the flap
     began left a visible kink. The tips stayed put, so a glove that grips the brim needed no changes.
   - *Shading.* The traced shade blobs came from soft painted shading. I replaced them with one
     crescent per brim end, built on the **sampled smooth curve the renderer draws** (not the raw
     points), tapering to zero at both ends. A fill kept inside its own part never thins that part's
     line: the visible line is the outer half of the doubled stroke, which lies outside the part.
   - *Detached crown in the tipped view.* The view reused the worn crown and band at their worn
     position. Their foot slanted 25° against the level ring, so a gap opened at one end. A pure drop
     can't fix that if the band's corner-to-corner height exceeds the ring's. Small turns sank the
     crown out of sight. **A full turn, so the band's foot lies along the ring, seated a line-width
     inside its far edge**, read as a whole tipped hat. I also left out the traced piece that was
     really the worn brim's turned-up back (traced as crown because it was the same colour).
3. **Check what's behind the prop.** After the turn, the crown covered an antenna ball except for
   its outline, and a black crescent stayed visible through a second-long hold. Shifting the seat a
   few units let the ball show cleanly.

## For the next agent

- Render the frames first (rest and every view of the prop) at 4x crops, and compare them with the
  reference sheet before touching anything. The flaws were obvious at 4x and invisible in the code.
- Change traced art by **replacing runs of points between named anchors** in the generator, not by
  editing the trace output, so re-running the tracer keeps the fix.
- Make the tests check the property, not the old path strings: "the tipped band is the worn band
  rigidly moved (all pairwise distances kept) with its foot's corners inside the ring", and "no brim
  point hangs more than N units below the line between its tips". Confirm that both fail on the old
  art (here 3.77 > 1 and 16.3 > 8).
