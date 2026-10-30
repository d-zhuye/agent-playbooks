import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeAnalysis } from './analysis.mjs';
import { validateRun } from './stories.mjs';

const execFileP = promisify(execFile);
const CLI = join(dirname(fileURLToPath(import.meta.url)), 'analysis.mjs');

function checkedStory(id, excess = false) {
  return {
    id, thread: `https://forum.example/t/${id}`, platform: 'forum.example', posted: null, found: '2026-10-29',
    type: 'plea', speaker: 'poster', related: [], situation: 'long drive', group: 'family', excess,
    quotes: [{ id: 'q1', text: 'the kids were bored stiff', url: `https://forum.example/t/${id}`, check: 'checked' }],
    trigger: null, job: null, forces: null, fit: null,
  };
}

function checkedRun(ids, excessIds = []) {
  return {
    run: { date: '2026-10-29', product: 'A card game', target: 8, solutionWords: ['game'] },
    stories: ids.map((id) => checkedStory(id, excessIds.includes(id))),
  };
}

const FORCES = {
  forces: { push: { summary: 'Bored kids', strength: 'strong', quotes: ['q1'] }, pull: null, anxiety: null, habit: null },
  trigger: 'an hour into the drive',
  job: 'When the drive drags, I want everyone busy together, so I can drive in peace.',
};

function fitOf(scores) {
  return { parts: scores.map((score) => ({ score, reason: score === null ? 'not shown' : 'shown in the post' })), confidence: 'thin' };
}

test('mergeAnalysis adds forces, trigger, job and fit, computing total and shown', () => {
  const { data, missing } = mergeAnalysis(checkedRun(['s001']), [{ s001: FORCES }], [{ s001: fitOf([2, null, 1, 2, null]) }]);
  const s = data.stories[0];
  assert.deepEqual(s.forces, FORCES.forces);
  assert.equal(s.trigger, FORCES.trigger);
  assert.equal(s.job, FORCES.job);
  assert.equal(s.fit.total, 5);
  assert.equal(s.fit.shown, 3);
  assert.equal(s.fit.confidence, 'thin');
  assert.deepEqual(missing, { forces: [], fit: [] });
  assert.deepEqual(validateRun(data, 'final'), []);
});

test('mergeAnalysis lists ids missing forces or fit, ignoring excess stories', () => {
  const { missing } = mergeAnalysis(checkedRun(['s001', 's002', 's003'], ['s003']), [{ s001: FORCES }], [{ s002: fitOf([1, 1, 1, 1, 1]) }]);
  assert.deepEqual(missing, { forces: ['s002'], fit: ['s001'] });
});

test('mergeAnalysis reports ids that are not in the run', () => {
  const { unknown } = mergeAnalysis(checkedRun(['s001']), [{ s001: FORCES, s404: FORCES }], [{ s001: fitOf([1, 1, 1, 1, 1]) }]);
  assert.deepEqual(unknown, ['s404']);
});

async function runDir(data, forces, fit) {
  const dir = await mkdtemp(join(tmpdir(), 'analysis-'));
  await mkdir(join(dir, 'forces'));
  await mkdir(join(dir, 'fit'));
  await writeFile(join(dir, 'stories.json'), JSON.stringify(data));
  await writeFile(join(dir, 'forces', 'b1.json'), JSON.stringify(forces));
  await writeFile(join(dir, 'fit', 'b1.json'), JSON.stringify(fit));
  return dir;
}

test('analysis CLI exits 1 while any retained story lacks forces', async () => {
  const dir = await runDir(checkedRun(['s001', 's002']), { s001: FORCES }, {});
  try {
    await assert.rejects(execFileP(process.execPath, [CLI, dir]), (err) => {
      assert.equal(err.code, 1);
      assert.match(err.stderr, /s002: no forces yet/);
      return true;
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('analysis CLI without --fit leaves fit out, even when fit files exist', async () => {
  // The findings are written from forces alone, before anything drawn from the profile.
  const shy = { ...FORCES, forces: { ...FORCES.forces, push: { ...FORCES.forces.push, summary: 'She was worn out' } } };
  const dir = await runDir(checkedRun(['s001']), { s001: shy }, { s001: fitOf([1, 1, 1, 1, 1]) });
  try {
    const { stdout } = await execFileP(process.execPath, [CLI, dir]);
    const data = JSON.parse(await readFile(join(dir, 'stories.json'), 'utf8'));
    assert.equal(data.stories[0].fit, null);
    assert.deepEqual(validateRun(data, 'rated'), []);
    assert.match(stdout, /fit not merged/);
    assert.match(stdout, /LINT s001: forces\.push\.summary says "She"/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('analysis CLI --fit exits 1 while any retained story lacks fit', async () => {
  const dir = await runDir(checkedRun(['s001', 's002']), { s001: FORCES, s002: FORCES }, { s001: fitOf([1, 1, 1, 1, 1]) });
  try {
    await assert.rejects(execFileP(process.execPath, [CLI, dir, '--fit']), (err) => {
      assert.equal(err.code, 1);
      assert.match(err.stderr, /s002.*fit/);
      return true;
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('analysis CLI exits 1 when a force cites a quote id the story lacks', async () => {
  const bad = { ...FORCES, forces: { ...FORCES.forces, push: { ...FORCES.forces.push, quotes: ['q7'] } } };
  const dir = await runDir(checkedRun(['s001']), { s001: bad }, { s001: fitOf([1, 1, 1, 1, 1]) });
  try {
    await assert.rejects(execFileP(process.execPath, [CLI, dir]), (err) => {
      assert.equal(err.code, 1);
      assert.match(err.stderr, /s001: forces\.push\.quotes cites q7/);
      return true;
    });
    // Nothing is written while there are problems, so stories.json stays at its last valid phase.
    assert.equal(JSON.parse(await readFile(join(dir, 'stories.json'), 'utf8')).stories[0].forces, null);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('analysis CLI writes stories.json that passes the final check', async () => {
  const dir = await runDir(checkedRun(['s001', 's002'], ['s002']), { s001: FORCES }, { s001: fitOf([2, 2, null, 1, 0]) });
  try {
    const { stdout } = await execFileP(process.execPath, [CLI, dir, '--fit']);
    const data = JSON.parse(await readFile(join(dir, 'stories.json'), 'utf8'));
    assert.deepEqual(validateRun(data, 'final'), []);
    assert.equal(data.stories[0].fit.total, 5);
    assert.match(stdout, /1 stories analyzed/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
