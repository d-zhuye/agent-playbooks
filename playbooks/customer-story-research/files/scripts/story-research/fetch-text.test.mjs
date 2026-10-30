import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { htmlToText, jsonToText, fetchText } from './fetch-text.mjs';
import { pageKey, quoteMatches } from './stories.mjs';

const execFileP = promisify(execFile);
const CLI = join(dirname(fileURLToPath(import.meta.url)), 'fetch-text.mjs');

const ENTITY_HTML = '<html><head><title>Trip</title><style>p { color: red }</style></head><body>'
  + '<p>Tom &amp; me&#8217;re <b>done</b></p><script>x()</script><!-- c -->'
  + '<p>Second line of the page here</p></body></html>';
const REVIEW = 'Bought this for a long drive with two kids and it kept them busy for most of the way there.';
const WALL = 'Sign in to continue reading this discussion. Create a free account or log in with your existing '
  + 'details to see all replies and join the conversation with other members of our community today.';

let server;
let base;
let lastAgent;

function send(res, type, body, status = 200) {
  res.writeHead(status, { 'content-type': type });
  res.end(body);
}

const routes = {
  '/html': (req, res) => send(res, 'text/html; charset=utf-8', ENTITY_HTML),
  '/review': (req, res) => send(res, 'text/html', `<p>${REVIEW}</p>`),
  '/redirect': (req, res) => { res.writeHead(302, { location: '/html' }); res.end(); },
  '/forbidden': (req, res) => send(res, 'text/html', '<p>Forbidden: you may not read this page</p>', 403),
  '/shell': (req, res) => send(res, 'text/html', '<html><body><div id="root"></div>'
    + '<noscript>You need to enable JavaScript to run this app.</noscript><script src="/app.js"></script></body></html>'),
  '/pdf': (req, res) => send(res, 'application/pdf', '%PDF-1.4 a document with plenty of words in it'),
  '/hang': () => {},
  '/big': (req, res) => {
    // Chunked, with no content-length, so only the streaming limit can stop it.
    res.writeHead(200, { 'content-type': 'text/html' });
    for (let i = 0; i < 10; i += 1) res.write('word '.repeat(100));
    res.end();
  },
  '/agent': (req, res) => {
    lastAgent = req.headers['user-agent'];
    send(res, 'text/plain', 'a plain page with enough words in it');
  },
  '/wall': (req, res) => send(res, 'text/html', `<p>${WALL}</p>`),
  '/json': (req, res) => send(res, 'application/json; charset=utf-8',
    '{"feed":{"entry":[{"content":{"label":"Great for car rides with the whole family"}}]}}'),
  '/feed': (req, res) => send(res, 'application/rss+xml', '<?xml version="1.0"?><rss><channel><item>'
    + '<title>Review</title><description><![CDATA[<p>We played it the whole way &amp; loved it</p>]]></description>'
    + '</item></channel></rss>'),
};

before(async () => {
  server = http.createServer((req, res) => (routes[req.url] ?? ((q, r) => send(r, 'text/plain', 'not found', 404)))(req, res));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.closeAllConnections();
  server.close();
});

test('htmlToText drops script, style and comments, keeps paragraphs, decodes entities', () => {
  const text = htmlToText(ENTITY_HTML);
  assert.ok(text.includes('Tom & me’re done'), text);
  assert.ok(!text.includes('x()'), text);
  assert.ok(!text.includes('color'), text);
  assert.ok(!text.includes(' c '), text);
  assert.match(text, /done\n+Second line/);
});

test('htmlToText decodes typographic named entities', () => {
  assert.equal(htmlToText('<p>it&rsquo;s &ldquo;fine&rdquo; &mdash; really&hellip;&nbsp;ok</p>'),
    'it’s “fine” — really… ok');
});

test('htmlToText breaks lines at opening block tags too', () => {
  // Final review: "…drive<div>Mum of three" ran together, so a real quote failed the check.
  const text = htmlToText('<div>We were so bored on that drive<div class="sig">Signed off</div></div><p>tips<blockquote>more</blockquote></p>');
  assert.ok(quoteMatches('we were so bored on that drive', text), text);
  assert.match(text, /tips\nmore/);
});

test('htmlToText decodes Latin-1 named entities, keeping their case', () => {
  assert.equal(htmlToText('<p>caf&eacute; &Eacute;cole na&iuml;ve &euro;5 &copy; inter&shy;national</p>'),
    'café École naïve €5 © inter­national');
});

test('jsonToText collects every string value', () => {
  const text = jsonToText('{"feed":{"entry":[{"content":{"label":"Great for car rides"}},{"n":3,"t":"Second one"}]}}');
  assert.ok(text.includes('Great for car rides'), text);
  assert.ok(text.includes('Second one'), text);
  assert.ok(!text.includes('label'), text);
});

test('jsonToText turns HTML inside a value into text', () => {
  const text = jsonToText('{"items":[{"body":"<p>We&#39;re done &amp; dusted</p>"}]}');
  assert.ok(text.includes("We're done & dusted"), text);
});

test('fetchText returns page text for HTML', async () => {
  const r = await fetchText(`${base}/html`);
  assert.equal(r.ok, true);
  assert.ok(r.text.includes('Tom & me’re done'));
});

test('fetchText returns text for JSON', async () => {
  const r = await fetchText(`${base}/json`);
  assert.equal(r.ok, true);
  assert.ok(r.text.includes('Great for car rides'));
});

test('fetchText reads a published feed', async () => {
  // The access rules allow feeds a site publishes; RSS and Atom are XML.
  const r = await fetchText(`${base}/feed`);
  assert.equal(r.ok, true, r.reason);
  assert.ok(quoteMatches('we played it the whole way & loved it', r.text), r.text);
});

test('fetchText keeps a short real review', async () => {
  const r = await fetchText(`${base}/review`);
  assert.equal(r.ok, true);
  assert.ok(r.text.includes('kept them busy'));
});

test('fetchText follows a redirect', async () => {
  const r = await fetchText(`${base}/redirect`);
  assert.equal(r.ok, true);
  assert.ok(r.text.includes('Second line'));
});

test('fetchText reports http-403', async () => {
  assert.deepEqual(await fetchText(`${base}/forbidden`), { ok: false, reason: 'http-403' });
});

test('fetchText reports little-text for an empty shell', async () => {
  assert.deepEqual(await fetchText(`${base}/shell`), { ok: false, reason: 'little-text' });
});

test('fetchText reports unsupported-type for a PDF', async () => {
  assert.deepEqual(await fetchText(`${base}/pdf`), { ok: false, reason: 'unsupported-type' });
});

test('fetchText reports timeout', async () => {
  assert.deepEqual(await fetchText(`${base}/hang`, { timeoutMs: 200 }), { ok: false, reason: 'timeout' });
});

test('fetchText reports too-large', async () => {
  assert.deepEqual(await fetchText(`${base}/big`, { maxBytes: 1000 }), { ok: false, reason: 'too-large' });
});

test('fetchText reports a refused connection', async () => {
  const r = await fetchText('http://127.0.0.1:1/');
  assert.equal(r.ok, false);
  assert.match(r.reason, /^network/);
});

test('fetchText sends an honest User-Agent', async () => {
  await fetchText(`${base}/agent`);
  assert.equal(lastAgent, 'story-research/1 (reads one public page)');
});

test('a curly-quoted quote matches captured entity text', () => {
  assert.ok(quoteMatches('Tom & me’re done', htmlToText(ENTITY_HTML)));
  assert.ok(quoteMatches('Tom & me\'re done', htmlToText(ENTITY_HTML)));
});

test('a long access wall captures, but the story quote does not match it', async () => {
  const r = await fetchText(`${base}/wall`);
  assert.equal(r.ok, true);
  assert.ok(!quoteMatches('kept them busy for most of the way', r.text));
});

test('CLI writes pages/<pageKey>.txt and exits 2 with FAILED on a 403', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'fetch-text-'));
  try {
    const url = `${base}/html`;
    const { stdout } = await execFileP(process.execPath, [CLI, url, dir]);
    const file = join(dir, 'pages', `${pageKey(url)}.txt`);
    assert.equal(stdout.trim(), file);
    const saved = await readFile(file, 'utf8');
    assert.ok(saved.startsWith(`Source: ${url}\n`), saved);
    assert.ok(saved.includes('Tom & me’re done'), saved);

    await assert.rejects(execFileP(process.execPath, [CLI, `${base}/forbidden`, dir]), (err) => {
      assert.equal(err.code, 2);
      assert.equal(err.stdout.trim(), 'FAILED http-403');
      return true;
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
