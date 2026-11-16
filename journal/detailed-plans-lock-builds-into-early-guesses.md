# Detailed plans lock builds into early guesses

- Seen: 2026-11-07, while-we-wait. A full implementation plan, with exact interfaces, files and
  test cycles, named `x.ts` and `x.native.ts` as separate modules. Metro resolves `./x` to the
  `.native` file, so the clash only showed up at build time.
- Seen: 2026-11-15, while-we-wait. The owner stopped a writing-plans stage plan for the website
  rebuild: a plan written at the start ties the build to early guesses and leaves the agent no
  room to adapt.
- Seen: 2026-11-16, while-we-wait. The owner asked to replace plan-writing skills for feature
  work in general.
- What happened: plan skills such as superpowers writing-plans fix files, signatures and test
  code before the code has taught the agent anything. The agent then either follows a stale
  route or re-plans, and the owner reviews detail that goes out of date.
- Tried: running the website rebuild from a short stage outline, a few bullets per stage, with a
  full design doc behind it → mostly worked. Ten stages took about 1.5 days, and each change of
  route took one line. But the owner "Look" checkpoints were passed with no record of them, and
  a bullet holding two outcomes was ticked while one of them was still owed.
- Tried: a rolling-wave plan skill (`.claude/skills/rolling-wave-plan/` in while-we-wait) → not
  tried on a build yet. It has an Intent section, and stages that go rough → next → detailed at
  the start of each stage. It also has Stop and Look gates, a Log of route changes, and one
  checkable outcome per bullet.
- Status: open
