import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { preflight } from './preflight.mjs';

const execFileP = promisify(execFile);
const CLI = join(dirname(fileURLToPath(import.meta.url)), 'preflight.mjs');
const PROFILE_PATH = 'docs/research/stories/ideal-user.md';
const PROFILE = `# Ideal user

## Who they are

Someone who waits with a group.

## Fit criteria

1. **Physically together as a group.**
   - 0: alone
   - 1: online together
   - 2: in the same place
2. Stuck with time to fill
   - 0: busy
   - 1: a few minutes
   - 2: an hour or more
3. Has kids
   - 0: no
   - 1: sometimes
   - 2: yes
4. Plans what the group does
   - 0: never
   - 1: sometimes
   - 2: always
5. Has tried something already
   - 0: no
   - 1: looked
   - 2: bought

## Example story

A parent on a six-hour drive posts that the kids fought from the first hour: 2, 2, 2, 1, not shown.
`;

function project(files) {
  const root = mkdtempSync(join(tmpdir(), 'preflight-'));
  for (const [path, text] of Object.entries({ [PROFILE_PATH]: PROFILE, ...files })) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

function withProject(files, fn) {
  const root = project(files);
  try {
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('preflight flags CLAUDE.md or AGENTS.md naming the profile file', () => {
  withProject({ 'AGENTS.md': 'The profile is in docs/research/stories/ideal-user.md.\n', 'CLAUDE.md': 'Read AGENTS.md.\n' }, (root) => {
    const problems = preflight(root, join(root, PROFILE_PATH));
    assert.equal(problems.length, 1, JSON.stringify(problems));
    assert.match(problems[0], /^AGENTS\.md: /);
  });
  withProject({ '.claude/CLAUDE.md': 'See the ideal-user notes.\n' }, (root) => {
    const problems = preflight(root, join(root, PROFILE_PATH));
    assert.equal(problems.length, 1, JSON.stringify(problems));
    assert.match(problems[0], /^\.claude\/CLAUDE\.md: /);
  });
});

test('preflight follows @imports one level and flags a criterion line copied from the profile', () => {
  withProject({ 'CLAUDE.md': 'Context: @docs/notes.md\n', 'docs/notes.md': 'Our users are physically together as a group, usually.\n' }, (root) => {
    const problems = preflight(root, join(root, PROFILE_PATH));
    assert.equal(problems.length, 1, JSON.stringify(problems));
    assert.match(problems[0], /^docs\/notes\.md \(imported by CLAUDE\.md\): repeats fit criterion "physically together as a group"/);
  });
});

test('preflight follows deeper imports and survives an import loop', () => {
  withProject({
    'CLAUDE.md': '@a.md\n',
    'a.md': 'See @b.md and an email like someone@example.com\n',
    'b.md': 'Loop back to @a.md. Stuck with time to fill is our motto.\n',
  }, (root) => {
    const problems = preflight(root, join(root, PROFILE_PATH));
    assert.equal(problems.length, 1, JSON.stringify(problems));
    assert.match(problems[0], /^b\.md/);
  });
});

test('preflight checks extra files, such as user-level instructions', () => {
  withProject({ 'home/.claude/CLAUDE.md': 'Always read ideal-user.md first.\n' }, (root) => {
    const extra = join(root, 'home/.claude/CLAUDE.md');
    const problems = preflight(root, join(root, PROFILE_PATH), [extra, join(root, 'missing.md')]);
    assert.equal(problems.length, 1, JSON.stringify(problems));
    assert.match(problems[0], /^home\/\.claude\/CLAUDE\.md: names the profile/);
  });
  const outside = mkdtempSync(join(tmpdir(), 'preflight-outside-'));
  try {
    writeFileSync(join(outside, 'AGENTS.md'), 'Fit criteria: stuck with time to fill.\n');
    withProject({}, (root) => {
      const problems = preflight(root, join(root, PROFILE_PATH), [join(outside, 'AGENTS.md')]);
      assert.equal(problems.length, 1, JSON.stringify(problems));
      assert.ok(problems[0].startsWith(join(outside, 'AGENTS.md')), problems[0]);
    });
  } finally {
    rmSync(outside, { recursive: true, force: true });
  }
});

test('preflight ignores criteria shorter than three words', () => {
  withProject({ 'AGENTS.md': 'Most of our users has kids, we think.\n' }, (root) => {
    assert.deepEqual(preflight(root, join(root, PROFILE_PATH)), []);
  });
});

test('preflight fails while the profile is unfilled', () => {
  // Final review: the template, every criterion still TODO, passed preflight.
  const unfilled = PROFILE.replace('5. Has tried something already', '5. TODO(project): fifth criterion');
  withProject({ [PROFILE_PATH]: unfilled }, (root) => {
    const problems = preflight(root, join(root, PROFILE_PATH));
    assert.equal(problems.length, 1, JSON.stringify(problems));
    assert.match(problems[0], /fit criteria aren't filled in yet \(4 of 5\)/);
  });
});

test('preflight follows files the instructions name in prose', () => {
  // Final review: "Read and follow AGENTS.md and docs/design/design.md" loads design.md for every
  // agent, but only @imports were followed.
  withProject({
    'CLAUDE.md': 'Read and follow AGENTS.md and docs/design/design.md.\n',
    'AGENTS.md': 'For customer research, follow `.claude/skills/story-research/SKILL.md`.\n',
    'docs/design/design.md': 'For groups stuck with time to fill.\n',
    // The skill itself names the profile for the lead; agents don't load it automatically.
    '.claude/skills/story-research/SKILL.md': 'Profile: docs/research/stories/ideal-user.md\n',
  }, (root) => {
    const problems = preflight(root, join(root, PROFILE_PATH));
    assert.equal(problems.length, 1, JSON.stringify(problems));
    assert.match(problems[0], /^docs\/design\/design\.md \(named in CLAUDE\.md\): repeats fit criterion "stuck with time to fill"/);
  });
});

test('preflight still flags the skill when an instruction file imports it', () => {
  withProject({
    'CLAUDE.md': '@.claude/skills/story-research/SKILL.md\n',
    '.claude/skills/story-research/SKILL.md': 'Profile: docs/research/stories/ideal-user.md\n',
  }, (root) => {
    const problems = preflight(root, join(root, PROFILE_PATH));
    assert.equal(problems.length, 1, JSON.stringify(problems));
    assert.match(problems[0], /^\.claude\/skills\/story-research\/SKILL\.md \(imported by CLAUDE\.md\)/);
  });
});

test('preflight fails when the product brief echoes a fit criterion', () => {
  // The trial's product file said "for people who are physically together with time to kill":
  // criterion 1 in other words, which the blind planner then built its plan around.
  withProject({ 'docs/brief.md': 'An offline app for people who are physically together with time to kill.\n' }, (root) => {
    const problems = preflight(root, join(root, PROFILE_PATH), [], { brief: join(root, 'docs/brief.md') });
    assert.equal(problems.length, 1, JSON.stringify(problems));
    assert.match(problems[0], /^docs\/brief\.md: the product brief echoes fit criterion "physically together as a group"/);
  });
});

test('preflight passes a neutral product brief', () => {
  withProject({ 'docs/brief.md': 'A phone app with ten party games.\nOne person reads each prompt aloud and passes the phone round.\n' }, (root) => {
    assert.deepEqual(preflight(root, join(root, PROFILE_PATH), [], { brief: join(root, 'docs/brief.md') }), []);
    assert.match(preflight(root, join(root, PROFILE_PATH), [], { brief: join(root, 'nope.md') })[0], /product brief not found/);
  });
});

test('preflight reads instruction files in parent folders and resolves named files from the naming file first', () => {
  // Trial: the parent CLAUDE.md said "Read and follow AGENTS.md"; preflight followed the install
  // folder's AGENTS.md instead of the parent's, and never read the parent CLAUDE.md at all.
  const top = mkdtempSync(join(tmpdir(), 'preflight-parent-'));
  try {
    const root = join(top, 'install');
    mkdirSync(dirname(join(root, PROFILE_PATH)), { recursive: true });
    writeFileSync(join(root, PROFILE_PATH), PROFILE);
    writeFileSync(join(top, 'CLAUDE.md'), 'Read and follow notes.md.\n');
    writeFileSync(join(top, 'notes.md'), 'Remember: stuck with time to fill.\n');
    writeFileSync(join(root, 'notes.md'), 'Use plain words.\n');
    let problems = preflight(root, join(root, PROFILE_PATH));
    assert.equal(problems.length, 1, JSON.stringify(problems));
    assert.ok(problems[0].startsWith(`${join(top, 'notes.md')} (named in ${join(top, 'CLAUDE.md')})`), problems[0]);
    // A parent folder's AGENTS.md is read directly.
    writeFileSync(join(top, 'notes.md'), 'Use plain words.\n');
    writeFileSync(join(top, 'AGENTS.md'), 'See ideal-user.md.\n');
    problems = preflight(root, join(root, PROFILE_PATH));
    assert.equal(problems.length, 1, JSON.stringify(problems));
    assert.ok(problems[0].startsWith(`${join(top, 'AGENTS.md')}: names the profile`), problems[0]);
  } finally {
    rmSync(top, { recursive: true, force: true });
  }
});

test('preflight flags any loaded file that restates a criterion in other words', () => {
  // Both trial runs: design.md said "for people who are physically together with time to kill"
  // and passed, because only the product brief got the looser check.
  withProject({
    'CLAUDE.md': 'Read docs/design/design.md.\n',
    'docs/design/design.md': 'Ten games for people who are physically together with time to kill. See docs/listing.md.\n',
    // Only mentioned by another document, not loaded: exact checks only.
    'docs/listing.md': 'Party games for groups who are stuck waiting with time to fill up.\n',
  }, (root) => {
    const problems = preflight(root, join(root, PROFILE_PATH));
    assert.equal(problems.length, 1, JSON.stringify(problems));
    assert.match(problems[0], /^docs\/design\/design\.md \(named in CLAUDE\.md\): echoes fit criterion "physically together as a group" in other words/);
  });
});

test('preflight fails while the profile has no scored example story', () => {
  const noExample = PROFILE.slice(0, PROFILE.indexOf('## Example story'));
  const todo = `${noExample}## Example story\n\nTODO(project): one short made-up story, scored.\n`;
  for (const text of [noExample, todo]) {
    withProject({ [PROFILE_PATH]: text }, (root) => {
      const problems = preflight(root, join(root, PROFILE_PATH));
      assert.equal(problems.length, 1, JSON.stringify(problems));
      assert.match(problems[0], /example story isn't filled in/);
    });
  }
});

test('preflight passes a clean project', () => {
  withProject({ 'CLAUDE.md': 'Run npm test. @docs/notes.md\n', 'AGENTS.md': 'Use plain words.\n', 'docs/notes.md': 'General notes about the code.\n' }, (root) => {
    assert.deepEqual(preflight(root, join(root, PROFILE_PATH)), []);
  });
});

test('preflight fails when the profile is missing', () => {
  withProject({}, (root) => {
    const problems = preflight(root, join(root, 'docs/research/stories/nope.md'));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /not found/);
  });
});

test('preflight CLI exits 1 listing files, and passes a clean project', async () => {
  // An empty HOME, so the machine's own user-level files don't change the result.
  const home = mkdtempSync(join(tmpdir(), 'preflight-home-'));
  const env = { ...process.env, HOME: home };
  const dirty = project({ 'AGENTS.md': 'Profile: ideal-user.md\n' });
  const clean = project({ 'AGENTS.md': 'Use plain words.\n' });
  try {
    await assert.rejects(execFileP(process.execPath, [CLI, PROFILE_PATH], { cwd: dirty, env }), (err) => {
      assert.equal(err.code, 1);
      assert.match(err.stdout + err.stderr, /AGENTS\.md/);
      return true;
    });
    const { stdout } = await execFileP(process.execPath, [CLI, PROFILE_PATH], { cwd: clean, env });
    assert.match(stdout, /Preflight passed/);
    // An unfilled profile gets its own message, not the leak advice.
    writeFileSync(join(clean, PROFILE_PATH), PROFILE.replace(/^5\. .+$/m, '5. TODO(project): fifth'));
    await assert.rejects(execFileP(process.execPath, [CLI, PROFILE_PATH], { cwd: clean, env }), (err) => {
      assert.match(err.stderr, /aren't filled in yet/);
      assert.ok(!err.stderr.includes('finders would see'), err.stderr);
      return true;
    });
    writeFileSync(join(clean, PROFILE_PATH), PROFILE);
    // Files named after the profile path are checked too (a memory index, say).
    writeFileSync(join(home, 'MEMORY.md'), '- Fit: physically together as a group\n');
    await assert.rejects(execFileP(process.execPath, [CLI, PROFILE_PATH, join(home, 'MEMORY.md')], { cwd: clean, env }));
    // The product brief is checked for echoes with --brief.
    writeFileSync(join(clean, 'brief.md'), 'For people who are physically together with time to kill.\n');
    await assert.rejects(execFileP(process.execPath, [CLI, PROFILE_PATH, '--brief', 'brief.md'], { cwd: clean, env }), (err) => {
      assert.match(err.stderr, /brief\.md: the product brief echoes fit criterion/);
      return true;
    });
    writeFileSync(join(clean, 'brief.md'), 'A phone app with ten party games.\n');
    assert.match((await execFileP(process.execPath, [CLI, PROFILE_PATH, '--brief', 'brief.md'], { cwd: clean, env })).stdout, /Preflight passed/);
  } finally {
    for (const dir of [home, dirty, clean]) rmSync(dir, { recursive: true, force: true });
  }
});
