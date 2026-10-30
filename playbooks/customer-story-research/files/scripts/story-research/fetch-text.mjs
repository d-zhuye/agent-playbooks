#!/usr/bin/env node
// Capture one public page's raw text, so quotes are copied from what the page says rather than
// from a tool that summarizes it. Finders run it once per page before quoting:
//
//   node scripts/story-research/fetch-text.mjs <url> <run-dir>
//
// It writes <run-dir>/pages/<pageKey>.txt and prints the path. On failure it prints
// "FAILED <reason>" and exits 2; the finder logs the block and moves on. check.mjs uses
// fetchText to refetch every quote's page. One page per call, with an honest User-Agent: no
// logins, no disguise, no retries round a refusal.
import { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { pageKey } from './stories.mjs';

export const USER_AGENT = 'story-research/1 (reads one public page)';
// Fewer words than this means a JavaScript-only shell, not a page. Short real content, such as a
// 20-word review, stays; access walls are caught later, when the quote check finds no quote there.
const MIN_WORDS = 5;

// Named entities: the Latin-1 set (code points 160 to 255, in order) plus the ones HTML text and
// blogs use most. Names are case-sensitive (&eacute; is é, &Eacute; is É). Left encoded, a finder
// would retype them and the quote would print as "caf&eacute;".
const LATIN1 = ('nbsp iexcl cent pound curren yen brvbar sect uml copy ordf laquo not shy reg macr deg plusmn '
  + 'sup2 sup3 acute micro para middot cedil sup1 ordm raquo frac14 frac12 frac34 iquest Agrave Aacute Acirc '
  + 'Atilde Auml Aring AElig Ccedil Egrave Eacute Ecirc Euml Igrave Iacute Icirc Iuml ETH Ntilde Ograve Oacute '
  + 'Ocirc Otilde Ouml times Oslash Ugrave Uacute Ucirc Uuml Yacute THORN szlig agrave aacute acirc atilde auml '
  + 'aring aelig ccedil egrave eacute ecirc euml igrave iacute icirc iuml eth ntilde ograve oacute ocirc otilde '
  + 'ouml divide oslash ugrave uacute ucirc uuml yacute thorn yuml').split(' ');
const ENTITIES = {
  ...Object.fromEntries(LATIN1.map((name, i) => [name, String.fromCodePoint(160 + i)])),
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', sbquo: '‚', bdquo: '„', ndash: '–', mdash: '—',
  hellip: '…', euro: '€', trade: '™', bull: '•', lsaquo: '‹', rsaquo: '›', prime: '′', Prime: '″',
};

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (whole, name) => {
    if (name[0] === '#') {
      const code = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[name] ?? ENTITIES[name.toLowerCase()] ?? whole;
  });
}

const BLOCK = 'p|div|li|ul|ol|h[1-6]|tr|td|th|table|blockquote|pre|section|article|header|footer|aside|nav|main|dd|dt|dl|figcaption|title|form|item|entry|description|summary|content';

// HTML (and RSS or Atom XML) to readable text: unwraps CDATA, drops scripts, styles, fallback
// notices and comments, turns block tags (opening and closing) and <br> into line breaks, strips
// the remaining tags and decodes entities.
export function htmlToText(html) {
  const text = String(html)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(new RegExp(`</?(${BLOCK})\\b[^>]*>`, 'gi'), '\n')
    .replace(/<(br|hr)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  return decodeEntities(text)
    .split('\n')
    .map((line) => line.replace(/[ \t \r]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

// A feed or API response to text: every string value, one per line. Values holding HTML (the
// Stack Exchange API returns post bodies as HTML) go through htmlToText first.
export function jsonToText(body) {
  const out = [];
  const walk = (value) => {
    if (typeof value === 'string') {
      const text = /<[a-z!/][^>]*>|&(#\d+|#x[0-9a-f]+|[a-z]+);/i.test(value) ? htmlToText(value) : value.trim();
      if (text) out.push(text);
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(walk);
    }
  };
  walk(JSON.parse(body));
  return out.join('\n');
}

function kindOf(contentType) {
  const type = (contentType ?? '').split(';')[0].trim().toLowerCase();
  // RSS and Atom feeds are XML; the access rules allow feeds a site publishes for reading.
  if (['text/html', 'application/xhtml+xml', 'application/rss+xml', 'application/atom+xml', 'application/xml', 'text/xml'].includes(type)) return 'html';
  if (type === 'application/json' || type.endsWith('+json')) return 'json';
  if (type === 'text/plain') return 'text';
  return null;
}

function decoderFor(contentType) {
  const charset = /charset=["']?([\w-]+)/i.exec(contentType ?? '')?.[1];
  try {
    return new TextDecoder(charset ?? 'utf-8');
  } catch {
    return new TextDecoder('utf-8');
  }
}

// Read the body as a stream and stop as soon as it passes maxBytes.
async function readLimited(body, maxBytes) {
  const reader = body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxBytes) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

// Fetch one public page and return its text, or why not:
// http-<status>, timeout, too-large, unsupported-type, bad-json, little-text, network-<code>.
export async function fetchText(url, { timeoutMs = 20000, maxBytes = 5_000_000 } = {}) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml,application/json,text/plain;q=0.9' },
    });
    if (!res.ok) {
      await res.body?.cancel().catch(() => {});
      return { ok: false, reason: `http-${res.status}` };
    }
    const contentType = res.headers.get('content-type');
    const kind = kindOf(contentType);
    if (!kind) {
      await res.body?.cancel().catch(() => {});
      return { ok: false, reason: 'unsupported-type' };
    }
    const bytes = await readLimited(res.body, maxBytes);
    if (!bytes) return { ok: false, reason: 'too-large' };
    const raw = decoderFor(contentType).decode(bytes);
    let text;
    if (kind === 'json') {
      try {
        text = jsonToText(raw);
      } catch {
        return { ok: false, reason: 'bad-json' };
      }
    } else {
      text = kind === 'html' ? htmlToText(raw) : raw.replace(/\r\n?/g, '\n').trim();
    }
    const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
    if (words < MIN_WORDS) return { ok: false, reason: 'little-text' };
    return { ok: true, text };
  } catch (err) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') return { ok: false, reason: 'timeout' };
    const code = err?.cause?.code ?? err?.code;
    return { ok: false, reason: code ? `network-${code}` : 'network-error' };
  }
}

async function main([url, runDir]) {
  if (!url || !runDir) {
    console.error('usage: node scripts/story-research/fetch-text.mjs <url> <run-dir>');
    process.exit(1);
  }
  const result = await fetchText(url);
  if (!result.ok) {
    console.log(`FAILED ${result.reason}`);
    process.exit(2);
  }
  const dir = join(runDir, 'pages');
  await mkdir(dir, { recursive: true });
  const file = join(dir, `${pageKey(url)}.txt`);
  // The first line names the page, so later passes can find a quote's context by URL.
  await writeFile(file, `Source: ${url}\n\n${result.text}\n`);
  console.log(file);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(process.argv.slice(2));
}
