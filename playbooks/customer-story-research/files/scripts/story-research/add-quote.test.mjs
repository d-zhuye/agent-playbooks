import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addQuote } from './add-quote.mjs';
import { pageKey, validateRun } from './stories.mjs';

const execFileP = promisify(execFile);
const CLI = join(dirname(fileURLToPath(import.meta.url)), 'add-quote.mjs');
const T = 'https://forum.example/t/1';
const PAGE = 'We drove for nine hours. Honestly the phones stay in the bag, we just play the alphabet game until we scream.';

function run() {
  return {
    run: { date: '2026-10-29', target: 8 },
    stories: [
      {
        id: 's001', thread: T, platform: 'forum.example', posted: null, found: '2026-10-29', type: 'plea',
        speaker: 'poster', related: [], situation: 'long drive', group: 'family', excess: false,
        quotes: [{ id: 'q1', text: 'we drove for nine hours', url: T, check: 'checked' },
          { id: 'q3', text: 'until we scream', url: T, check: 'checked' }],
        trigger: null, job: null, forces: null, fit: null,
      },
      {
        id: 's002', thread: T, platform: 'forum.example', posted: null, found: '2026-10-29', type: 'plea',
        speaker: 'commenter-1', related: [], situation: 'long drive', group: 'family', excess: true,
        quotes: [{ id: 'q1', text: 'we drove for nine hours', url: T, check: 'checked' }],
        trigger: null, job: null, forces: null, fit: null,
      },
    ],
  };
}

const readPage = (url) => (url === T ? PAGE : null);

test('addQuote appends a checked quote with the story\'s next id, marked as added by the audit', () => {
  const { data, id } = addQuote(run(), 's001', T, 'the phones stay in the bag', readPage);
  assert.equal(id, 'q4');
  assert.deepEqual(data.stories[0].quotes.at(-1), { id: 'q4', text: 'the phones stay in the bag', url: T, check: 'checked', added: 'audit' });
  assert.deepEqual(data.stories[0].quotes.slice(0, 2).map((q) => q.id), ['q1', 'q3'], 'other ids unchanged');
  assert.deepEqual(validateRun(data, 'checked'), []);
});

test('addQuote refuses quotes that are not on the captured page, joined, too short or already there', () => {
  const cases = [
    ['s001', T, 'the phones stay in the car', /not in the captured page/],
    ['s001', T, 'phones stay ... we just play', /ellipsis/],
    ['s001', T, 'phones', /fewer than 3 words/],
    ['s001', 'https://forum.example/t/2', 'the phones stay in the bag', /no capture/],
    ['s001', T, 'We drove for nine hours', /already has this quote as q1/],
    ['s002', T, 'the phones stay in the bag', /excess story/],
    ['s404', T, 'the phones stay in the bag', /not a story/],
    ['s001', 'forum.example/t/1', 'the phones stay in the bag', /not a full URL/],
  ];
  for (const [id, url, text, error] of cases) assert.throws(() => addQuote(run(), id, url, text, readPage), error, text);
});

test('add-quote CLI checks against pages/ and writes stories.json', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'add-quote-'));
  try {
    await mkdir(join(dir, 'pages'));
    await writeFile(join(dir, 'pages', `${pageKey(T)}.txt`), `Source: ${T}\n\n${PAGE}\n`);
    await writeFile(join(dir, 'stories.json'), JSON.stringify(run()));
    const { stdout } = await execFileP(process.execPath, [CLI, dir, 's001', T, 'the phones stay in the bag']);
    assert.match(stdout, /s001\/q4 added/);
    const data = JSON.parse(await readFile(join(dir, 'stories.json'), 'utf8'));
    assert.equal(data.stories[0].quotes.at(-1).added, 'audit');
    await assert.rejects(execFileP(process.execPath, [CLI, dir, 's001', T, 'not on the page at all']), (err) => {
      assert.equal(err.code, 1);
      assert.match(err.stderr, /not in the captured page/);
      return true;
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
