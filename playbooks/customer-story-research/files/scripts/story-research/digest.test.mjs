import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { retainedIds, pickIds, auditSize, digest } from './digest.mjs';

const execFileP = promisify(execFile);
const CLI = join(dirname(fileURLToPath(import.meta.url)), 'digest.mjs');

function story(id, over = {}) {
  const url = `https://forum.example/t/${id}`;
  return {
    id, thread: url, platform: 'forum.example', posted: '2025-03-01', found: '2026-10-29', type: 'plea',
    speaker: 'poster', related: [], situation: 'long drive', group: 'family of four', excess: false,
    quotes: [
      { id: 'q1', text: 'the kids were bored stiff', url, check: 'checked' },
      { id: 'q2', text: 'update: we tried the cards', url: 'https://forum.example/t/99', check: 'unrechecked' },
    ],
    trigger: 'the night before', job: 'When we drive, I want games, so I can relax.',
    forces: { push: { summary: 'Bored kids', strength: 'strong', quotes: ['q1'] }, pull: null, anxiety: null, habit: null },
    fit: { parts: [{ score: 2, reason: 'together in the car' }, { score: null, reason: 'not shown' }, { score: 1, reason: 'x' }, { score: 1, reason: 'y' }, { score: 0, reason: 'z' }], total: 4, shown: 4, confidence: 'solid' },
    ...over,
  };
}

const DATA = {
  run: { date: '2026-10-29', target: 8 },
  stories: [story('s001'), story('s002'), story('s003', { excess: true }), story('s004', { forces: null, fit: null })],
};

test('retainedIds lists stories that are not excess', () => {
  assert.deepEqual(retainedIds(DATA), ['s001', 's002', 's004']);
});

test('pickIds picks distinct retained ids at random', () => {
  const picks = pickIds(DATA, 2, () => 0);
  assert.equal(picks.length, 2);
  assert.equal(new Set(picks).size, 2);
  assert.ok(picks.every((id) => ['s001', 's002', 's004'].includes(id)));
  assert.deepEqual(pickIds(DATA, 9).sort(), ['s001', 's002', 's004']);
});

test('digest shows situation, quotes with their checks and forces, but not fit', () => {
  const text = digest(DATA, ['s001']);
  assert.match(text, /^s001 · plea · poster · forum\.example · 2025-03-01$/m);
  assert.match(text, /situation: long drive · group: family of four/);
  assert.match(text, /q1 \[checked\] "the kids were bored stiff"/);
  assert.match(text, /q2 \[unrechecked\] "update: we tried the cards" \(https:\/\/forum\.example\/t\/99\)/);
  assert.match(text, /push \(strong\): Bored kids \[q1\]/);
  assert.ok(!/fit/i.test(text), text);
});

test('digest shows the author, the word count and quote notes when the finder gave them', () => {
  const data = structuredClone(DATA);
  Object.assign(data.stories[0], { author: 'mum_of_3', words: 240 });
  data.stories[0].quotes[0].note = 'about the drive home';
  const text = digest(data, ['s001']);
  assert.match(text, /^s001 · plea · poster \(mum_of_3\) · forum\.example · 2025-03-01 · about 240 words$/m);
  assert.match(text, /q1 \[checked\] "the kids were bored stiff" — note: about the drive home/);
});

test('auditSize is 5 stories or a tenth of the retained ones, whichever is more', () => {
  const many = (n) => ({ stories: Array.from({ length: n }, (_, i) => ({ id: `s${i}`, excess: false })) });
  assert.equal(auditSize(many(3)), 3);
  assert.equal(auditSize(many(45)), 5);
  assert.equal(auditSize(many(88)), 9);
});

test('digest adds fit only when asked', () => {
  const text = digest(DATA, ['s001'], { withFit: true });
  assert.match(text, /fit: 4 from 4 parts \(solid\): 2 · – · 1 · 1 · 0/);
});

test('digest of all retained stories leaves out excess ones', () => {
  const text = digest(DATA);
  assert.ok(text.includes('s001') && text.includes('s004') && !text.includes('s003'));
  assert.match(text, /s004[\s\S]*forces: not rated yet/);
});

test('digest refuses an id that is not a retained story', () => {
  assert.throws(() => digest(DATA, ['s003']), /s003 is not a retained story/);
});

test('digest CLI prints ids, a random pick and story views', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'digest-'));
  try {
    await writeFile(join(dir, 'stories.json'), JSON.stringify(DATA));
    assert.equal((await execFileP(process.execPath, [CLI, dir, '--ids'])).stdout.trim(), 's001 s002 s004');
    assert.equal((await execFileP(process.execPath, [CLI, dir, '--pick', '2'])).stdout.trim().split(' ').length, 2);
    assert.equal((await execFileP(process.execPath, [CLI, dir, '--pick'])).stdout.trim().split(' ').length, 3);
    const { stdout } = await execFileP(process.execPath, [CLI, dir, 's002']);
    assert.ok(stdout.includes('s002 · plea') && !stdout.includes('s001'));
    assert.ok((await execFileP(process.execPath, [CLI, dir, 's002', '--with-fit'])).stdout.includes('fit: 4 from 4 parts'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
