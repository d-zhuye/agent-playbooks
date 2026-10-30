import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeFinds, applyChecks, applyCap, struggleShare, summarize, checkLocal } from './check.mjs';
import { canonicalUrl, pageKey, validateRun } from './stories.mjs';

const execFileP = promisify(execFile);
const CLI = join(dirname(fileURLToPath(import.meta.url)), 'check.mjs');
const FOUND = '2026-10-29';

function find(finder, stories, extra = {}) {
  return { finder, queries: [], stories, blocked: [], newPhrases: [], newSituations: [], ...extra };
}

function story(thread, speaker, quotes, extra = {}) {
  return {
    thread, posted: null, type: 'plea', speaker, situation: 'long drive', group: 'two adults, two kids',
    quotes: quotes.map((q) => (typeof q === 'string' ? { text: q, url: thread } : q)),
    ...extra,
  };
}

const T = 'https://forum.example/t/1';

test('mergeFinds numbers stories s001… and quotes q1… in order', () => {
  const { stories } = mergeFinds([find('f1', [
    story(T, 'poster', ['the kids were bored stiff', 'we tried every game we knew']),
    story('https://blog.example/post', 'poster', ['never again on a long drive'], { posted: '2024-05-01', type: 'switch' }),
  ])], FOUND);
  assert.deepEqual(stories.map((s) => s.id), ['s001', 's002']);
  assert.deepEqual(stories[0].quotes.map((q) => q.id), ['q1', 'q2']);
  assert.deepEqual(stories[1].quotes.map((q) => q.id), ['q1']);
  const s = stories[1];
  assert.equal(s.platform, 'blog.example');
  assert.equal(s.found, FOUND);
  assert.equal(s.posted, '2024-05-01');
  assert.equal(s.type, 'switch');
  assert.equal(s.excess, false);
  assert.deepEqual([s.trigger, s.job, s.forces, s.fit], [null, null, null, null]);
  assert.equal(s.quotes[0].check, 'pending');
});

test('mergeFinds joins poster stories from one thread under two URL forms', () => {
  const a = 'https://www.x.com/t/1?utm_source=a';
  const b = 'https://x.com/t/1#c5';
  const { stories } = mergeFinds([
    find('f1', [story(a, 'poster', ['We’re done with screens for good', 'the drive took nine hours'])]),
    find('f2', [story(b, 'poster', ["we're done with screens for good", 'my son asked for cards'])]),
  ], FOUND);
  assert.equal(stories.length, 1);
  assert.deepEqual(stories[0].quotes.map((q) => q.text),
    ['We’re done with screens for good', 'the drive took nine hours', 'my son asked for cards']);
});

test('mergeFinds joins commenter stories only when they share a quote, and renumbers commenters per thread', () => {
  const { stories } = mergeFinds([
    find('f1', [
      story(T, 'commenter-1', ['we play the alphabet game', 'it works for an hour']),
      story(T, 'commenter-2', ['my kids hate car games']),
    ]),
    find('f2', [
      story(T, 'commenter-3', ['We play the alphabet game', 'then everyone naps']),
      story(T, 'commenter-1', ['audiobooks saved our trip']),
    ]),
  ], FOUND);
  assert.equal(stories.length, 3);
  assert.deepEqual(stories.map((s) => s.speaker), ['commenter-1', 'commenter-2', 'commenter-3']);
  assert.deepEqual(stories[0].quotes.map((q) => q.text),
    ['we play the alphabet game', 'it works for an hour', 'then everyone naps']);
  assert.deepEqual(stories[2].quotes.map((q) => q.text), ['audiobooks saved our trip']);
});

test('mergeFinds keeps one finder\'s stories with the same speaker label together', () => {
  const { stories } = mergeFinds([find('f1', [
    story(T, 'commenter-1', ['we play the alphabet game']),
    story(T, 'commenter-1', ['it works for an hour']),
  ])], FOUND);
  assert.equal(stories.length, 1);
  assert.equal(stories[0].quotes.length, 2);
});

test('mergeFinds links stories from the same thread through related', () => {
  const { stories } = mergeFinds([find('f1', [
    story(T, 'poster', ['how do you all survive this']),
    story(T, 'commenter-1', ['we play the alphabet game']),
    story('https://other.example/a', 'poster', ['a different story entirely']),
  ])], FOUND);
  assert.deepEqual(stories[0].related, ['s002']);
  assert.deepEqual(stories[1].related, ['s001']);
  assert.deepEqual(stories[2].related, []);
});

test('mergeFinds falls back to the thread when a quote has no url', () => {
  const { stories } = mergeFinds([find('f1', [story(T, 'poster', [{ text: 'the kids were bored stiff' }])])], FOUND);
  assert.equal(stories[0].quotes[0].url, T);
});

test('mergeFinds returns queries, blocked, newPhrases and newSituations from every finder in extras', () => {
  const { extras } = mergeFinds([
    find('f1', [], { queries: ['a', 'b'], blocked: [{ url: 'https://x.com', reason: 'http-403' }], newPhrases: ['p1'], newSituations: ['s1'] }),
    find('f2', [], { queries: ['c'], newPhrases: ['p1', 'p2'], newSituations: ['s2'] }),
  ], FOUND);
  assert.deepEqual(extras.queries, ['a', 'b', 'c']);
  assert.deepEqual(extras.blocked, [{ url: 'https://x.com', reason: 'http-403' }]);
  assert.deepEqual(extras.newPhrases, ['p1', 'p2']);
  assert.deepEqual(extras.newSituations, ['s1', 's2']);
});

test('mergeFinds keeps each story\'s author and word count and each quote\'s note', () => {
  const { stories } = mergeFinds([
    find('f1', [story(T, 'poster', [{ text: 'the kids were bored stiff', url: T, note: 'about the drive home' }],
      { author: 'mum_of_3', words: 240 })]),
    find('f2', [story(T, 'poster', ['we tried every game we knew'])]),
    find('f3', [story('https://blog.example/post', 'poster', ['never again on a long drive'])]),
  ], FOUND);
  assert.equal(stories.length, 2);
  assert.equal(stories[0].author, 'mum_of_3');
  assert.equal(stories[0].words, 240);
  assert.equal(stories[0].quotes[0].note, 'about the drive home');
  assert.ok(!('note' in stories[0].quotes[1]), 'no empty note');
  assert.deepEqual([stories[1].author, stories[1].words], [null, null]);
});

test('mergeFinds returns each finder\'s notes, apart from new situations', () => {
  const { extras } = mergeFinds([
    find('f1', [], { newSituations: ['ferry crossings'], notes: ['ran dry: theme-park queues'] }),
    find('f2', [], { notes: ['ran dry: theme-park queues', 'cruise forums refuse scripts'] }),
  ], FOUND);
  assert.deepEqual(extras.newSituations, ['ferry crossings']);
  assert.deepEqual(extras.notes, ['ran dry: theme-park queues', 'cruise forums refuse scripts']);
});

test('mergeFinds names the finder and story when a URL has no scheme', () => {
  assert.throws(() => mergeFinds([find('f2', [story(T, 'poster', ['the kids were bored stiff']), story('reddit.com/r/x/1', 'poster', ['a b c d'])])], FOUND),
    /f2 story 2: thread "reddit\.com\/r\/x\/1" is not a full URL/);
  assert.throws(() => mergeFinds([find('f1', [story(T, 'poster', [{ text: 'the kids were bored stiff', url: 'forum.example/t/9' }])])], FOUND),
    /f1 story 1: quote url "forum\.example\/t\/9" is not a full URL/);
});

test('checkLocal checks a finds file against its own captures, offline', () => {
  const captured = { [T]: 'Honestly the kids were bored stiff by noon.' };
  const f = find('f3', [
    story(T, 'poster', ['the kids were bored stiff', 'words that are not on the page', 'so bored']),
    story('https://forum.example/t/2', 'poster', ['a page nobody captured'], { situation: 'a very long situation label that goes on far too long' }),
  ]);
  const result = checkLocal(f, (url) => captured[url] ?? null);
  assert.equal(result.found, 1);
  assert.equal(result.total, 4);
  assert.deepEqual(result.problems, [
    'f3 story 1 quote 2: not in the captured page: "words that are not on the page"',
    'f3 story 1 quote 3: has fewer than 3 words',
    'f3 story 2: situation has 11 words; use a short label from the situation map',
    'f3 story 2 quote 1: no capture of https://forum.example/t/2; capture it with fetch-text.mjs before quoting',
  ]);
});

test('check CLI --local checks one finds file without the network', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'local-'));
  try {
    await mkdir(join(dir, 'pages'), { recursive: true });
    await mkdir(join(dir, 'finds'));
    await writeFile(join(dir, 'pages', `${pageKey(T)}.txt`), `Source: ${T}\n\nHonestly the kids were bored stiff by noon.\n`);
    await writeFile(join(dir, 'finds', 'f1.json'), JSON.stringify(find('f1', [story(T, 'poster', ['the kids were bored stiff'])])));
    const ok = await execFileP(process.execPath, [CLI, '--local', dir, join(dir, 'finds', 'f1.json')]);
    assert.match(ok.stdout, /f1: 1 of 1 quotes found in your captures/);
    await writeFile(join(dir, 'finds', 'f2.json'), JSON.stringify(find('f2', [story(T, 'poster', ['not what the page says at all'])])));
    await assert.rejects(execFileP(process.execPath, [CLI, '--local', dir, join(dir, 'finds', 'f2.json')]), (err) => {
      assert.equal(err.code, 1);
      assert.match(err.stdout, /f2 story 1 quote 1: not in the captured page/);
      return true;
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

function pages(entries) {
  return new Map(entries.map(([url, text]) => [canonicalUrl(url), text]));
}

test('applyChecks marks checked, drops not-found, marks unrechecked when the page is null, and counts each', () => {
  const B = 'https://blocked.example/t/2';
  const { stories } = mergeFinds([find('f1', [
    story(T, 'poster', ['the kids were bored stiff', 'words that are not on the page']),
    story(B, 'poster', ['a page we could not reach']),
  ])], FOUND);
  const result = applyChecks(stories, pages([[T, 'Honestly the kids were bored stiff by noon.'], [B, null]]));
  assert.deepEqual(result.stories[0].quotes.map((q) => [q.id, q.check]), [['q1', 'checked']]);
  assert.deepEqual(result.stories[1].quotes.map((q) => [q.id, q.check]), [['q1', 'unrechecked']]);
  assert.deepEqual(result.audit, { checked: 1, notFound: 1, unrechecked: 1, droppedStories: 0 });
});

test('applyChecks lists each page whose quotes were not found', () => {
  // Final review: a login wall at check time dropped every quote on a page with only a total shown.
  const W = 'https://wall.example/t/3';
  const { stories } = mergeFinds([find('f1', [
    story(T, 'poster', ['the kids were bored stiff', 'words that are not on the page']),
    story(W, 'poster', ['real words from the thread', 'more real words here']),
  ])], FOUND);
  const result = applyChecks(stories, pages([[T, 'the kids were bored stiff'], [W, 'Please log in to continue reading']]));
  assert.deepEqual(result.missing, [{ url: T, notFound: 1, total: 2 }, { url: W, notFound: 2, total: 2 }]);
});

test('applyChecks checks each quote against its own page', () => {
  const FOLLOW = 'https://forum.example/t/9';
  const make = (url2) => mergeFinds([find('f1', [story(T, 'poster', [
    'the kids were bored stiff',
    { text: 'update: the cards worked brilliantly', url: url2 },
  ])])], FOUND).stories;
  const texts = pages([[T, 'the kids were bored stiff'], [FOLLOW, 'Update: the cards worked brilliantly!']]);
  const right = applyChecks(make(FOLLOW), texts);
  assert.deepEqual(right.stories[0].quotes.map((q) => q.check), ['checked', 'checked']);
  const wrong = applyChecks(make(T), texts);
  assert.deepEqual(wrong.stories[0].quotes.map((q) => q.check), ['checked']);
});

test('applyChecks drops a story left with no quotes and counts it', () => {
  const { stories } = mergeFinds([find('f1', [
    story(T, 'poster', ['the kids were bored stiff']),
    story(T, 'commenter-1', ['nothing like this is on the page']),
  ])], FOUND);
  const result = applyChecks(stories, pages([[T, 'the kids were bored stiff']]));
  assert.deepEqual(result.stories.map((s) => s.id), ['s001']);
  assert.deepEqual(result.stories[0].related, []);
  assert.equal(result.audit.droppedStories, 1);
  assert.equal(result.audit.notFound, 1);
});

function checkedStory(id, platform, checked) {
  const quotes = Array.from({ length: checked }, (_, i) => ({ id: `q${i + 1}`, text: `quote number ${i} here`, url: `https://${platform}/${id}`, check: 'checked' }));
  return { id, thread: `https://${platform}/${id}`, platform, quotes, excess: false };
}

test('applyCap marks stories beyond capCount(target) per platform as excess, keeping the most checked quotes', () => {
  const stories = [
    checkedStory('s001', 'big.example', 3),
    checkedStory('s002', 'big.example', 1),
    checkedStory('s003', 'big.example', 2),
    checkedStory('s004', 'small.example', 1),
  ];
  const capped = applyCap(stories, 8);
  assert.deepEqual(capped.map((s) => [s.id, s.excess]), [['s001', false], ['s002', true], ['s003', false], ['s004', false]]);
});

test('struggleShare counts queries without solution words, plurals included', () => {
  assert.equal(struggleShare(['road trip games', 'kids bored in car', 'apps for waiting', 'awkward silence at dinner'], ['game', 'app']), 0.5);
  assert.equal(struggleShare(['card game ideas', 'cards for a long wait', 'best activities'], ['card game', 'activity']), 1 / 3);
  assert.equal(struggleShare(['gamer dads on planes'], ['game']), 1);
  assert.equal(struggleShare([], ['game']), 0);
});

test('summarize counts retained stories with a checked quote and flags short', () => {
  const stories = [
    checkedStory('s001', 'a.example', 2),
    { ...checkedStory('s002', 'a.example', 1), excess: true },
    { ...checkedStory('s003', 'b.example', 1), quotes: [{ id: 'q1', text: 'x y z', url: 'https://b.example', check: 'unrechecked' }] },
  ];
  assert.deepEqual(summarize(stories, 2), {
    retained: 2, counted: 1, excess: 1, short: true,
    platforms: [{ platform: 'a.example', retained: 1 }, { platform: 'b.example', retained: 1 }],
  });
  assert.equal(summarize(stories, 1).short, false);
});

test('CLI end to end against a local server', async () => {
  const body = {
    '/a': 'We drove nine hours and the kids were bored stiff before lunch.',
    '/b': 'Update: the card game kept everyone talking until the border.',
    '/c': 'A page that says something else entirely, about gardening.',
  };
  const server = http.createServer((req, res) => {
    if (req.url === '/forbidden') { res.writeHead(403, { 'content-type': 'text/html' }); res.end('no'); return; }
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(`<p>${body[req.url] ?? 'missing page with several words'}</p>`);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const dir = await mkdtemp(join(tmpdir(), 'check-'));
  try {
    await mkdir(join(dir, 'finds'));
    await writeFile(join(dir, 'run.json'), JSON.stringify({ date: FOUND, product: 'A card game', target: 8, solutionWords: ['game', 'app'] }));
    await writeFile(join(dir, 'finds', 'f1.json'), JSON.stringify(find('f1', [
      story(`${base}/a`, 'poster', ['the kids were bored stiff']),
      story(`${base}/b`, 'poster', ['the card game kept everyone talking'], { type: 'switch', situation: 'a long drive to the border with three kids and a dog in the back' }),
      story(`${base}/c`, 'poster', ['we gave up on screens entirely']),
    ], { queries: ['road trip games', 'apps for kids'], newSituations: ['ferry crossings'] })));
    await writeFile(join(dir, 'finds', 'f2.json'), JSON.stringify(find('f2', [
      story(`${base}/forbidden`, 'poster', ['nobody can check this one']),
    ], { queries: ['bored kids in the car'] })));

    const { stdout } = await execFileP(process.execPath, [CLI, dir]);
    const data = JSON.parse(await readFile(join(dir, 'stories.json'), 'utf8'));
    assert.deepEqual(validateRun(data, 'checked'), []);
    assert.equal(data.stories.length, 3);
    assert.deepEqual(data.run.blocked, [{ url: `${base}/forbidden`, reason: 'http-403' }]);
    assert.deepEqual(data.run.audit, { checked: 2, notFound: 1, unrechecked: 1, droppedStories: 1 });
    assert.equal(data.run.struggleShare, 1 / 3);
    assert.equal(data.run.short, true);
    assert.deepEqual(data.run.newSituations, ['ferry crossings']);
    // All three stories come from one host: the cap of 2 makes the unrechecked one excess.
    assert.deepEqual(data.stories.map((s) => s.excess), [false, false, true]);
    assert.match(stdout, /CAPPED 127\.0\.0\.1 1/);
    assert.match(stdout, /SHORT 2\/8/);
    assert.match(stdout, /SOLUTION-LED 0\.33/);
    assert.ok(stdout.includes(`NOT-FOUND 1/1 ${base}/c`), stdout);
    assert.match(stdout, /LINT s002: situation has 15 words/);

    // A finds file with a bad URL gets a plain message, not a stack trace.
    await writeFile(join(dir, 'finds', 'f3.json'), JSON.stringify(find('f3', [story('reddit.com/r/x/1', 'poster', ['a b c d'])])));
    await assert.rejects(execFileP(process.execPath, [CLI, dir]), (err) => {
      assert.equal(err.code, 1);
      assert.match(err.stderr, /f3 story 1: thread "reddit\.com\/r\/x\/1" is not a full URL/);
      assert.ok(!/\n\s+at /.test(err.stderr), err.stderr);
      return true;
    });
  } finally {
    server.closeAllConnections();
    server.close();
    await rm(dir, { recursive: true, force: true });
  }
});
