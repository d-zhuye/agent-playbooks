# An animated character's drawing re-rendered on unrelated state, and every tap waited for it

- Seen: 2026-11-07, while-we-wait. The day after the Home monsters' layered renderer landed.
- Stack: Expo Router (native stack), React 19.2, React Native 0.86 (Fabric), Reanimated 4.5.1,
  react-native-svg 15, zustand store.
- Status: fixed and tested in Jest; not yet checked on the phone.

## The problem

The owner said the app felt less responsive: a short lag between tapping a game card on Home and
the About This Game sheet appearing, and between "Next question" and the next card during a game.
The animation itself looked smooth. The performance work on the animation (frame captures, parts
published per tick, frozen versus live) had timed the animation, never tap response, so it missed this.

## Diagnosis

1. **Read the recent history.** All the lag-related changes were the Home monsters (added the day
   before, made into native layers that day). The tap path (buttons, sounds, music, store) hadn't
   changed in weeks. The one game-logic change, Trivia reveal, touched only a schema check.
2. **Read how the drawing and its parents render.** Home stays mounted under every pushed screen
   (no `freezeOnBlur`/`enableFreeze`). `HomeScreen` subscribed to the whole game snapshot, which
   changes on every card. Pausing was React state (`focused` from `useFocusEffect`, a `visible`
   prop for scroll and picker). Nothing between Home and the drawing was memoized.
3. **Count the drawing.** A throwaway Jest probe walked the compiled layers: 158 part views,
   65 fixed views, 152 separate `<Svg>` pictures and 774 SVG elements, about 1,300 host
   elements (the older single-SVG tree had about 587 nodes).
4. **Time a re-render.** A throwaway Jest test re-rendered the parent 30 times. In a temporary
   git worktree it also ran on older commits: 74 ms before the performance branch, 85 ms with
   changed-part publishing, 118 ms with native layers, about 0 before the monsters existed.
   Jest milliseconds are a proxy, not phone time, but the ratios and the order of size were enough.
5. **Read the library source for anything else on the JS thread.** Reanimated 4.5.1's static flag
   `FORCE_REACT_RENDER_FOR_SETTLED_ANIMATIONS` (on by default) runs a 500 ms `setInterval` that
   calls `setState` on every animated component whose props stopped changing. With 158 parts that
   start and stop, that is a steady trickle of React renders while the character is on screen.
   A secondary suspect only; left open.

Root cause: the drawing's structure never changes after mount, yet it sat under components that
re-render for unrelated reasons (game state, focus, scroll, picker), so each tap that changed any of
those rebuilt the whole drawing on the thread that handles taps.

## The proposal, and what was done

The rule that was missing: **React builds an animated character's drawing once; after mount only
shared values change it.**

1. `React.memo` on the layer renderer (`MonsterLayers`). Every prop was already constant (a
   module-level layer list, frames created once, a fixed scale). Re-render in the same probe: 118 ms → 1 ms.
2. A test that rebuilding fails: spy on a function called for every shape during render
   (`paintProps`), then rerender, pause, hide and refocus, and expect zero calls. Before the fix it
   counted 1,355.
3. Home selects only what it shows (current game id, and `drawCount > 0` as a boolean, not the
   count). A Routing test wraps Home in `<Profiler>` and expects zero renders while play draws
   cards; before the fix it rendered once per card.
4. Rejected for now: app-wide `freezeOnBlur` (changes every screen; Home shows behind a
   half-height form sheet), replacing the renderer with Skia (the renderer wasn't the problem),
   tuning the settled-props timer (measure after the fix first).

## What worked well

- Starting from `git log` and the symptom's timing. Two of two symptoms involved Home being
  re-rendered, which pointed at what stayed mounted underneath.
- Throwaway Jest probes for both counting and timing, and a temporary worktree to run the same
  probe on older commits. It turned "seems excessive" into numbers across three renderer versions
  in a few minutes, with no device.
- Reading the animation library's source (`PropsRegistryGarbageCollector.ts`, the static flags)
  instead of guessing at its behaviour.
- Testing behaviour, not structure: "shapes built during render" and "Profiler commits" fail for
  any cause of re-rendering, not just a removed `memo`.
- Explaining the result to the owner in plain words, and the memo as a one-line change, before
  doing a large redesign.

## What didn't

- An existing test faked Reanimated's settled-props hand-back by re-rendering the parent. The memo
  broke the fake, not the app. The fix was to make the fake match the library: a `setState` inside
  each animated view (`_syncStylePropsBackToReact`). Fakes built on "the parent re-renders" quietly
  depend on the very waste you later remove.
- The earlier performance passes measured frame cadence and update counts only. Each step made
  the drawing larger, and the re-render cost grew unseen (74 → 85 → 118 ms).

## Mistakes to avoid

- **Don't put a large, static drawing under components with frequently changing state.** Memoize
  it at its root, give it only stable props, and test that it renders once.
- **Don't drive pause/resume through props or state that reach the drawing.** If you must, make
  sure the drawing's root is memoized; better, toggle the frame callback without rendering.
- **Don't subscribe a screen that stays mounted under others to a whole store snapshot.** Select
  primitives it shows, and derive booleans in the selector (`drawCount > 0`, not `drawCount`).
- **Don't assume covered screens are idle.** Native stacks keep them mounted and rendering unless
  frozen.
- **Don't let a performance review measure only the animation.** Add tap-to-response on the
  screen that hosts the character, and on screens pushed above it.
- **Don't trust a layout change because frame timing improved.** More native views or SVG roots
  can cut per-frame cost and raise per-render cost at the same time; time a parent re-render too.
- **Check what the animation library does with idle values** (here, settled props handed back to
  React on a timer) before multiplying animated components.
