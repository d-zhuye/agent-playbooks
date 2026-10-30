import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateFindings, wrongAbout, renderMarkdown, renderPage } from './build-report.mjs';
import { filterStories } from './page-filter.mjs';

const execFileP = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, 'build-report.mjs');
const TEMPLATE = await readFile(join(HERE, 'page-template.html'), 'utf8');
const FILTER = await readFile(join(HERE, 'page-filter.mjs'), 'utf8');

function fitOf(scores, confidence = 'solid') {
  const shown = scores.filter((s) => s !== null);
  return {
    parts: scores.map((score) => ({ score, reason: score === null ? 'not shown' : 'shown in the post' })),
    total: shown.reduce((a, b) => a + b, 0), shown: shown.length, confidence,
  };
}

function story(id, over = {}) {
  const url = `https://forum.example/t/${id}`;
  return {
    id, thread: url, platform: 'forum.example', posted: '2025-03-01', found: '2026-10-29',
    type: 'plea', speaker: 'poster', related: [], situation: 'long drive', group: 'family of four', excess: false,
    quotes: [
      { id: 'q1', text: 'the kids were bored stiff', url, check: 'checked' },
      { id: 'q2', text: 'we play the alphabet game until we scream', url, check: 'unrechecked' },
    ],
    trigger: 'the night before the trip',
    job: 'When a drive drags, I want everyone playing together, so I can keep the peace.',
    forces: {
      push: { summary: 'Bored kids', strength: 'strong', quotes: ['q1'] },
      pull: null,
      anxiety: null,
      habit: { summary: 'They already play the alphabet game', strength: 'clear', quotes: ['q2'] },
    },
    fit: fitOf([2, 2, 1, 1, null]),
    ...over,
  };
}

function stories() {
  return [
    story('s001'),
    story('s002', { platform: 'blog.example', situation: 'airport delay', type: 'switch' }),
    story('s003', { situation: 'waiting room', fit: fitOf([1, 0, 1, 1, null], 'thin') }),
    story('s004', { excess: true, situation: 'excess only situation' }),
  ];
}

const RUN = {
  date: '2026-10-29', product: 'A card game', target: 3, solutionWords: ['game'], searches: 10, struggleShare: 0.6,
  short: false, blocked: [{ url: 'https://blocked.example/x', reason: 'http-403' }], newPhrases: ['saved our sanity'],
  newSituations: ['ferry crossing'], audit: { checked: 4, notFound: 1, unrechecked: 1, droppedStories: 0 },
};

function findings() {
  return {
    forces: { push: [{ theme: 'Kids get bored early', stories: ['s001', 's002'], quotes: ['s001/q1'] }], pull: [], anxiety: [], habit: [] },
    findings: {
      aim: [{ text: 'Parents on long drives', stories: ['s001'] }],
      words: [{ quote: 's001/q1', note: 'store subtitle' }],
      build: [{ text: 'Games for waiting rooms', stories: ['s003'] }],
      hesitations: [],
      where: [{ text: 'Parenting forums', stories: ['s002'] }],
    },
    writtenBeforeProfile: true,
    compare: {
      agrees: [{ text: 'Parents on long drives match the profile', stories: ['s001'] }],
      differs: [{ text: 'Airport delays came from people the profile leaves out', stories: ['s002'] }],
    },
    wrongAbout: [{ text: 'Waiting-room parents score low but push hard', stories: ['s003'] }],
    notes: { sources: ['forum.example answered well'], blocked: [], newSituations: [], profileChanges: ['Consider waiting rooms'] },
  };
}

const AUDIT = {
  s001: { attribution: 'ok', context: 'ok', forces: 'supported', fit: 'supported', note: 'all fine' },
  s003: { attribution: 'ok', context: 'ok', forces: 'overstated', fit: 'supported', note: 'push is clear, not strong' },
};

test('validateFindings accepts findings that cite retained stories and checked quotes', () => {
  assert.deepEqual(validateFindings(findings(), stories()), []);
});

test('validateFindings rejects unknown or excess story ids and missing quote refs', () => {
  const f = findings();
  f.findings.aim[0].stories = ['s999'];
  f.findings.where[0].stories = ['s004'];
  f.forces.push[0].quotes = ['s001/q9'];
  const errors = validateFindings(f, stories());
  assert.equal(errors.length, 3, JSON.stringify(errors));
  assert.ok(errors.some((e) => e.includes('s999')));
  assert.ok(errors.some((e) => e.includes('s004')));
  assert.ok(errors.some((e) => e.includes('s001/q9')));
});

test('validateFindings rejects an unchecked quote in Words to use or in a forces theme', () => {
  const f = findings();
  f.findings.words[0].quote = 's001/q2';
  f.forces.push[0].quotes = ['s002/q2'];
  const errors = validateFindings(f, stories());
  assert.equal(errors.length, 2, JSON.stringify(errors));
  assert.ok(errors.every((e) => e.includes('is not a checked quote')));
});

test('validateFindings rejects a theme citing a story that lacks that force', () => {
  // Final review: a push theme could cite a story whose push is null.
  const f = findings();
  f.forces.pull = [{ theme: 'Ready-made prompts', stories: ['s001'], quotes: [] }];
  const errors = validateFindings(f, stories());
  assert.equal(errors.length, 1, JSON.stringify(errors));
  assert.match(errors[0], /forces\.pull\[0\]: s001 does not show pull/);
});

test('validateFindings keeps people we might be wrong about to stories showing 4 fit parts', () => {
  // The spec: only stories that show at least four parts can be listed there.
  const list = stories();
  list[2].fit = fitOf([1, null, null, 1, null]);
  const errors = validateFindings(findings(), list);
  assert.equal(errors.length, 1, JSON.stringify(errors));
  assert.match(errors[0], /wrongAbout\[0\]: s003 shows 2 fit parts/);
});

test('validateFindings checks the comparison with the profile', () => {
  const f = findings();
  f.compare.differs[0].stories = ['s999'];
  f.writtenBeforeProfile = 'yes';
  const errors = validateFindings(f, stories());
  assert.equal(errors.length, 2, JSON.stringify(errors));
  assert.ok(errors.some((e) => e.startsWith('compare.differs[0]') && e.includes('s999')));
  assert.ok(errors.some((e) => e.includes('writtenBeforeProfile')));
});

test('the header says whether the findings were written before the profile was read', () => {
  const md = renderMarkdown(RUN, stories(), findings(), AUDIT);
  assert.match(md.slice(0, md.indexOf('## Forces')), /Findings: written before the profile was read/);
  const html = renderPage(RUN, stories(), findings(), AUDIT, TEMPLATE, FILTER);
  assert.ok(html.slice(0, html.indexOf('id="forces"')).includes('written before the profile was read'));
  const f = findings();
  delete f.writtenBeforeProfile;
  assert.ok(!renderMarkdown(RUN, stories(), f, AUDIT).includes('Findings: written'));
});

test('validateFindings rejects a claim with no stories behind it', () => {
  const f = findings();
  f.findings.build[0].stories = [];
  assert.equal(validateFindings(f, stories()).length, 1);
});

test('Words to use renders the quote record’s text, never other wording', () => {
  const f = findings();
  f.findings.words = [{ quote: 's001/q1', note: 'rewritten wording', text: 'the kids were climbing the walls' }];
  for (const out of [renderMarkdown(RUN, stories(), f, AUDIT), renderPage(RUN, stories(), f, AUDIT, TEMPLATE, FILTER)]) {
    const words = out.slice(out.indexOf('Words to use'), out.indexOf('What to build or write next'));
    assert.ok(words.includes('the kids were bored stiff'), words);
    assert.ok(words.includes('rewritten wording'), words);
    assert.ok(!words.includes('climbing the walls'), words);
  }
});

test('wrongAbout needs strong Push, fit total 4 or less and at least 4 parts shown', () => {
  const list = [
    story('s001', { fit: fitOf([1, 1, 1, 1, null]) }),
    story('s002', { fit: fitOf([1, 1, 1, 2, null]) }),
    story('s003', { fit: fitOf([0, 0, null, null, null]) }),
    story('s004', { fit: fitOf([0, 0, 0, 0, 0]), forces: { ...story('x').forces, push: { summary: 'x', strength: 'clear', quotes: ['q1'] } } }),
    story('s005', { fit: fitOf([0, 0, 0, 0, 0]), excess: true }),
    story('s006', { fit: fitOf([0, 0, 0, 0, 0]), forces: { ...story('x').forces, push: null } }),
  ];
  assert.deepEqual(wrongAbout(list).map((s) => s.id), ['s001']);
});

test('renderMarkdown header gives date, counted of target, platforms, situations covered and struggle-first share', () => {
  const md = renderMarkdown(RUN, stories(), findings(), AUDIT);
  const header = md.slice(0, md.indexOf('## Forces'));
  assert.ok(header.includes('2026-10-29'), header);
  assert.match(header, /Counted stories: 3 of 3/);
  assert.match(header, /Platforms \(2\): forum\.example \(2\), blog\.example \(1\)/);
  assert.match(header, /Situations covered \(3\): airport delay, long drive, waiting room/);
  assert.match(header, /Struggle-first searches: 60% of 10/);
  assert.ok(!header.includes('excess only situation'), header);
});

test('renderMarkdown marks a short run as incomplete at the top', () => {
  const md = renderMarkdown({ ...RUN, target: 8, short: true }, stories(), findings(), AUDIT);
  assert.match(md.slice(0, md.indexOf('## Forces')), /Incomplete: 3 of 8 counted stories/);
  assert.ok(!renderMarkdown(RUN, stories(), findings(), AUDIT).includes('Incomplete'));
});

const SECTION_ORDER = ['## Forces', '## Who to aim at first', '## Words to use', '## What to build or write next',
  '## Purchase hesitations', '## Where to find early users', '## Compared with the profile', '### Where the stories agree',
  '### Where they differ', '### People we might be wrong about', '## Stories', '## Run notes'];

test('renderMarkdown sections come in the forces-first order', () => {
  const md = renderMarkdown(RUN, stories(), findings(), AUDIT);
  const at = SECTION_ORDER.map((h) => md.indexOf(`\n${h}\n`));
  assert.ok(at.every((i) => i > 0), JSON.stringify(at));
  assert.deepEqual([...at].sort((a, b) => a - b), at);
});

test('validateFindings accepts fitParts left empty until the profile is read', () => {
  // The step-5 findings writer never sees the profile, so it can't fill the labels.
  const draft = { ...findings(), fitParts: [], compare: { agrees: [], differs: [] }, wrongAbout: [] };
  assert.deepEqual(validateFindings(draft, stories()), []);
  assert.ok(validateFindings({ ...draft, fitParts: ['one', 'two'] }, stories()).some((e) => e.includes('fitParts')));
});

test('the report names each quote\'s author next to its speaker, and lists finder notes', () => {
  const list = stories();
  list[0].author = 'mum_of_3';
  const run = { ...RUN, finderNotes: ['ran dry: ferry queues'] };
  const md = renderMarkdown(run, list, findings(), AUDIT);
  assert.ok(md.includes('(s001/q1, poster (mum_of_3))'), 'words to use');
  assert.match(md, /\| \[s001\]\([^)]+\) \| Plea for help \| poster \(mum_of_3\) \|/);
  assert.ok(md.includes('ran dry: ferry queues'));
  const html = renderPage(run, list, findings(), AUDIT, TEMPLATE, FILTER);
  assert.ok(html.includes('s001/q1 · poster (mum_of_3)'));
  assert.equal(dataOf(html).json.stories[0].author, 'mum_of_3');
});

test('build-report --check-findings validates the step-5 findings before fit is merged', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'report-'));
  try {
    const rated = stories().map((st) => ({ ...st, fit: null }));
    await writeFile(join(dir, 'stories.json'), JSON.stringify({ run: RUN, stories: rated }));
    const draft = { ...findings(), fitParts: [], compare: { agrees: [], differs: [] }, wrongAbout: [] };
    await writeFile(join(dir, 'findings.json'), JSON.stringify(draft));
    const { stdout } = await execFileP(process.execPath, [CLI, dir, '--check-findings']);
    assert.match(stdout, /findings\.json passes/);
    await assert.rejects(readFile(join(dir, 'report.md')));
    await writeFile(join(dir, 'findings.json'), JSON.stringify({ ...draft, findings: { ...draft.findings, aim: [{ text: 'x', stories: ['s404'] }] } }));
    await assert.rejects(execFileP(process.execPath, [CLI, dir, '--check-findings']), (err) => {
      assert.match(err.stderr, /s404 is not a story in this run/);
      return true;
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('renderMarkdown lists stories and leaves out excess ones', () => {
  const md = renderMarkdown(RUN, stories(), findings(), AUDIT);
  const index = md.slice(md.indexOf('## Stories'), md.indexOf('## Run notes'));
  for (const id of ['s001', 's002', 's003']) assert.ok(index.includes(id), id);
  assert.ok(!index.includes('s004'));
  assert.match(md, /Kept out by the platform cap: 1 story/);
});

test('run notes include the audit results or say the run was not audited', () => {
  const notes = (md) => md.slice(md.indexOf('## Run notes'));
  const audited = notes(renderMarkdown(RUN, stories(), findings(), AUDIT));
  assert.match(audited, /Spot-check audit of 2 stories/);
  assert.ok(audited.includes('push is clear, not strong'));
  assert.ok(audited.includes('Consider waiting rooms'));
  assert.ok(audited.includes('https://blocked.example/x (http-403)'));
  assert.ok(audited.includes('ferry crossing'));
  assert.match(notes(renderMarkdown(RUN, stories(), findings(), null)), /This run was not audited/);
});

const PAGE_ORDER = ['id="forces"', 'id="aim"', 'id="words"', 'id="build"', 'id="hesitations"', 'id="where"',
  'id="compare"', 'id="wrong-about"', 'id="stories"', 'id="run-notes"'];

function dataOf(html) {
  const open = html.indexOf('<script id="story-data" type="application/json">');
  const start = html.indexOf('>', open) + 1;
  const end = html.indexOf('</script>', start);
  return { start, end, json: JSON.parse(html.slice(start, end)) };
}

test('renderPage keeps the same order and leaves out excess stories', () => {
  const html = renderPage(RUN, stories(), findings(), AUDIT, TEMPLATE, FILTER);
  const at = PAGE_ORDER.map((h) => html.indexOf(h));
  assert.ok(at.every((i) => i > 0), JSON.stringify(at));
  assert.deepEqual([...at].sort((a, b) => a - b), at);
  assert.deepEqual(dataOf(html).json.stories.map((s) => s.id), ['s001', 's002', 's003']);
  assert.ok(!html.includes('<!--STORY-DATA-->') && !html.includes('/*PAGE-FILTER*/'));
  assert.ok(html.includes('function filterStories') && !html.includes('export function'));
});

test('renderPage drops related links to stories kept out of the report', () => {
  const list = stories();
  list[0].related = ['s002', 's004'];
  const html = renderPage(RUN, list, findings(), AUDIT, TEMPLATE, FILTER);
  assert.deepEqual(dataOf(html).json.stories[0].related, ['s002']);
});

test('renderPage escapes markup in quotes', () => {
  const evil = 'we said </script><img src=x onerror=alert(1)> and $& then';
  const list = stories();
  list[0].quotes[0].text = evil;
  const html = renderPage(RUN, list, findings(), AUDIT, TEMPLATE, FILTER);
  const { json } = dataOf(html);
  assert.equal(json.stories[0].quotes[0].text, evil);
  assert.ok(!html.includes('<img src=x'), 'the quote became markup');
  assert.ok(html.includes('&lt;/script&gt;&lt;img src=x onerror=alert(1)&gt; and $&amp; then'), 'the quote was not shown as text');
});

test('renderPage meets the page contract', () => {
  const html = renderPage(RUN, stories(), findings(), AUDIT, TEMPLATE, FILTER);
  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '';
  const words = title.trim().split(/\s+/).length;
  assert.ok(words >= 2 && words <= 4, `title "${title}"`);
  assert.ok(html.includes(':root'));
  assert.ok(html.includes('prefers-color-scheme: dark'));
  assert.ok(html.includes(':root:not([data-theme="light"])'));
  assert.ok(html.includes(':root[data-theme="dark"]'));
  assert.match(html, /body\s*\{[^}]*background:/);
  assert.ok(!/\ssrc=["']?(https?:)?\/\//i.test(html), 'external src');
  assert.ok(!/<link[^>]+stylesheet/i.test(html), 'external stylesheet');
  assert.ok(!/@import|url\(\s*["']?https?:/i.test(html), 'external CSS resource');
  assert.ok(html.includes('<a href="https://forum.example/t/s001"'), 'source links are allowed');
});

test('filterStories combines filters and treats unset as all', () => {
  const list = stories().filter((s) => !s.excess);
  list[2].forces = { ...list[2].forces, habit: null };
  const ids = (f) => filterStories(list, f).map((s) => s.id);
  assert.deepEqual(ids({}), ['s001', 's002', 's003']);
  assert.deepEqual(ids({ situation: '', type: null, platform: undefined, forces: [] }), ['s001', 's002', 's003']);
  assert.deepEqual(ids({ situation: 'AIRPORT' }), ['s002']);
  assert.deepEqual(ids({ type: 'plea', platform: 'forum.example' }), ['s001', 's003']);
  assert.deepEqual(ids({ confidence: 'thin' }), ['s003']);
  assert.deepEqual(ids({ minFit: 4 }), ['s001', 's002']);
  assert.deepEqual(ids({ maxFit: '3' }), ['s003']);
  assert.deepEqual(ids({ forces: ['push', 'habit'] }), ['s001', 's002']);
  const unfitted = [...list, { ...list[0], id: 's009', fit: null }];
  assert.deepEqual(filterStories(unfitted, {}).length, 4);
  assert.deepEqual(filterStories(unfitted, { minFit: 0 }).map((s) => s.id), ['s001', 's002', 's003']);
});

test('page with zero stories still builds and says no stories were found', () => {
  const empty = { forces: { push: [], pull: [], anxiety: [], habit: [] }, findings: { aim: [], words: [], build: [], hesitations: [], where: [] }, wrongAbout: [], notes: {} };
  const run = { ...RUN, short: true, audit: { checked: 0, notFound: 0, unrechecked: 0, droppedStories: 0 } };
  assert.deepEqual(validateFindings(empty, []), []);
  const html = renderPage(run, [], empty, null, TEMPLATE, FILTER);
  assert.ok(html.includes('No stories were found'));
  assert.deepEqual(dataOf(html).json.stories, []);
  assert.ok(renderMarkdown(run, [], empty, null).includes('No stories were found'));
});

test('build-report CLI writes report.md and page.html, and refuses invalid findings', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'report-'));
  try {
    await writeFile(join(dir, 'stories.json'), JSON.stringify({ run: RUN, stories: stories() }));
    await writeFile(join(dir, 'findings.json'), JSON.stringify(findings()));
    const { stdout } = await execFileP(process.execPath, [CLI, dir]);
    assert.match(stdout, /report\.md/);
    assert.match(await readFile(join(dir, 'report.md'), 'utf8'), /This run was not audited/);

    // A guessed gender in the audit notes is flagged; the report still builds.
    await writeFile(join(dir, 'audit.json'), JSON.stringify({ s001: { ...AUDIT.s001, note: 'All quotes are the poster’s; she stands by them.' } }));
    const linted = await execFileP(process.execPath, [CLI, dir]);
    assert.match(linted.stdout, /LINT audit s001: note says "she"/);
    await rm(join(dir, 'audit.json'));
    assert.ok((await readFile(join(dir, 'page.html'), 'utf8')).includes('id="story-data"'));

    const bad = findings();
    bad.findings.words[0].quote = 's001/q2';
    await writeFile(join(dir, 'findings.json'), JSON.stringify(bad));
    await assert.rejects(execFileP(process.execPath, [CLI, dir]), (err) => {
      assert.equal(err.code, 1);
      assert.match(err.stderr, /is not a checked quote/);
      return true;
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
