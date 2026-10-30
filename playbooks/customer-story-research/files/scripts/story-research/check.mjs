#!/usr/bin/env node
// Merge every finder's stories, refetch each quote's page and confirm the quote is there, then
// cap any platform that supplies too many stories. Safe to rerun after a second find wave:
//
//   node scripts/story-research/check.mjs <run-dir>
//
// Reads run.json and finds/*.json and writes stories.json. Prints a summary and, when they
// apply: CAPPED <platform> <excess>, NOT-FOUND <n>/<m> <page>, SHORT <counted>/<target>,
// SOLUTION-LED <share>, and LINT warnings.
//
// A finder checks its own file before handing back, offline, against the pages it captured:
//
//   node scripts/story-research/check.mjs --local <run-dir> <finds-file>
import { readFileSync } from 'node:fs';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { canonicalUrl, platformOf, normalize, quoteMatches, quoteProblem, capCount, validateRun, pageKey, lintRun } from './stories.mjs';
import { fetchText } from './fetch-text.mjs';

function speakerKind(speaker) {
  if (speaker === 'poster') return 'poster';
  if (/^commenter-\d+$/.test(speaker ?? '')) return 'commenter';
  // Anything else (a username, say) is kept as given so validation refuses it.
  return 'invalid';
}

// One story per person per thread. Posters of one thread are one story whatever URL form each
// finder used. Commenters' numbers are local to each finder, so two commenters are one person
// only when they share a quote; a page of reviews has no poster, and its reviewers are commenters.
// A finder's own label always means the same person within its file.
// A finder's URL must be a full web address; anything else stops the merge with a message that
// names the finder and story to fix.
function requireUrl(value, what) {
  try {
    if (['http:', 'https:'].includes(new URL(value).protocol)) return;
  } catch {
    // fall through
  }
  throw new Error(`${what} "${value}" is not a full URL (it needs https://)`);
}

export function mergeFinds(finds, found) {
  const merged = [];
  for (const f of finds) {
    for (const [n, st] of (f.stories ?? []).entries()) {
      const at = `${f.finder} story ${n + 1}`;
      requireUrl(st.thread, `${at}: thread`);
      for (const q of st.quotes ?? []) if (q.url) requireUrl(q.url, `${at}: quote url`);
      const threadKey = canonicalUrl(st.thread);
      const kind = speakerKind(st.speaker);
      const alias = `${f.finder}|${st.speaker}`;
      const quotes = (st.quotes ?? []).map((q) => ({ text: q.text, url: q.url || st.thread, ...(q.note ? { note: q.note } : {}) }));
      const norms = quotes.map((q) => normalize(q.text));
      let m = merged.find((x) => x.threadKey === threadKey && (
        x.aliases.has(alias)
        || (kind === 'poster' && x.kind === 'poster')
        || (kind === 'commenter' && x.kind === 'commenter' && norms.some((n) => x.seen.has(n)))));
      if (!m) {
        m = { threadKey, kind, aliases: new Set(), seen: new Set(), quotes: [], first: st, posted: null, situation: '', group: '', author: null, words: null };
        merged.push(m);
      }
      m.aliases.add(alias);
      m.posted ??= st.posted ?? null;
      m.situation ||= st.situation ?? '';
      m.group ||= st.group ?? '';
      m.author ??= st.author ?? null;
      m.words ??= st.words ?? null;
      quotes.forEach((q, i) => {
        if (m.seen.has(norms[i])) return;
        m.seen.add(norms[i]);
        m.quotes.push(q);
      });
    }
  }

  const commenters = new Map();
  const stories = merged.map((m, i) => {
    let speaker = m.first.speaker;
    if (m.kind === 'commenter') {
      const n = (commenters.get(m.threadKey) ?? 0) + 1;
      commenters.set(m.threadKey, n);
      speaker = `commenter-${n}`;
    }
    return {
      id: `s${String(i + 1).padStart(3, '0')}`,
      thread: m.first.thread,
      platform: platformOf(m.first.thread),
      posted: m.posted,
      found,
      type: m.first.type,
      speaker,
      author: m.author,
      words: m.words,
      related: [],
      situation: m.situation,
      group: m.group,
      excess: false,
      quotes: m.quotes.map((q, j) => ({ id: `q${j + 1}`, text: q.text, url: q.url, ...(q.note ? { note: q.note } : {}), check: 'pending' })),
      trigger: null,
      job: null,
      forces: null,
      fit: null,
    };
  });
  stories.forEach((s, i) => {
    s.related = stories.filter((o, j) => j !== i && merged[j].threadKey === merged[i].threadKey).map((o) => o.id);
  });

  const all = (key) => finds.flatMap((f) => f[key] ?? []);
  const extras = {
    queries: all('queries'),
    blocked: all('blocked'),
    newPhrases: [...new Set(all('newPhrases'))],
    newSituations: [...new Set(all('newSituations'))],
    notes: [...new Set(all('notes'))],
  };
  return { stories, extras };
}

// Mark each quote against its own page's text: checked, not found (dropped) or, when the page
// couldn't be fetched (null), unrechecked. A story left with no quotes is dropped. `missing`
// lists each page with quotes not found, so a login wall can be told apart from a misquote.
export function applyChecks(stories, pageTexts) {
  const audit = { checked: 0, notFound: 0, unrechecked: 0, droppedStories: 0 };
  const perPage = new Map();
  const kept = [];
  for (const s of stories) {
    const quotes = [];
    for (const q of s.quotes) {
      const key = canonicalUrl(q.url);
      const page = perPage.get(key) ?? { url: q.url, notFound: 0, total: 0 };
      perPage.set(key, page);
      page.total += 1;
      const text = pageTexts.get(key);
      if (text == null) {
        audit.unrechecked += 1;
        quotes.push({ ...q, check: 'unrechecked' });
      } else if (quoteMatches(q.text, text)) {
        audit.checked += 1;
        quotes.push({ ...q, check: 'checked' });
      } else {
        audit.notFound += 1;
        page.notFound += 1;
      }
    }
    if (quotes.length > 0) kept.push({ ...s, quotes });
    else audit.droppedStories += 1;
  }
  const ids = new Set(kept.map((s) => s.id));
  for (const s of kept) s.related = s.related.filter((r) => ids.has(r));
  return { stories: kept, audit, missing: [...perPage.values()].filter((p) => p.notFound > 0) };
}

const checkedCount = (s) => s.quotes.filter((q) => q.check === 'checked').length;

// No platform supplies more than capCount(target) stories. The rest stay in stories.json marked
// excess, kept out of the report; the best-evidenced stories (most checked quotes) are retained.
export function applyCap(stories, target) {
  const cap = capCount(target);
  const byPlatform = new Map();
  for (const s of stories) byPlatform.set(s.platform, [...(byPlatform.get(s.platform) ?? []), s]);
  const excess = new Set();
  for (const list of byPlatform.values()) {
    if (list.length <= cap) continue;
    const ranked = [...list].sort((a, b) => checkedCount(b) - checkedCount(a) || b.quotes.length - a.quotes.length);
    for (const s of ranked.slice(cap)) excess.add(s.id);
  }
  return stories.map((s) => ({ ...s, excess: excess.has(s.id) }));
}

function solutionPattern(word) {
  const w = normalize(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const forms = [`${w}(?:s|es)?`];
  if (w.endsWith('y')) forms.push(`${w.slice(0, -1)}ies`);
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${forms.join('|')})(?![\\p{L}\\p{N}])`, 'u');
}

// Share of the searches actually run that describe the struggle without the product's solution
// words ("game" also catches "games", not "gamer"). Guard 1 wants at least half.
export function struggleShare(queries, solutionWords) {
  if (queries.length === 0) return 0;
  const patterns = solutionWords.map(solutionPattern);
  const free = queries.filter((q) => !patterns.some((p) => p.test(normalize(q))));
  return free.length / queries.length;
}

// Counted stories are retained (not excess) and hold at least one checked quote.
export function summarize(stories, target) {
  const retained = stories.filter((s) => !s.excess);
  const counted = retained.filter((s) => checkedCount(s) > 0).length;
  const perPlatform = new Map();
  for (const s of retained) perPlatform.set(s.platform, (perPlatform.get(s.platform) ?? 0) + 1);
  const platforms = [...perPlatform]
    .map(([platform, n]) => ({ platform, retained: n }))
    .sort((a, b) => b.retained - a.retained || a.platform.localeCompare(b.platform));
  return { retained: retained.length, counted, excess: stories.length - retained.length, short: counted < target, platforms };
}

function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (err) {
    throw new Error(`${path}: ${err.message}`);
  }
}

async function main([runDir]) {
  if (!runDir) {
    console.error('usage: node scripts/story-research/check.mjs <run-dir>');
    process.exit(1);
  }
  const run = await readJson(join(runDir, 'run.json'));
  const names = (await readdir(join(runDir, 'finds')).catch(() => {
    throw new Error(`no finds/ folder in ${runDir}: run the finders first`);
  }))
    .filter((n) => n.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  const finds = [];
  for (const n of names) finds.push(await readJson(join(runDir, 'finds', n)));
  const { stories: merged, extras } = mergeFinds(finds, localDate());

  // Each page once, in sequence, at the first URL a finder gave for it.
  const urls = new Map();
  for (const s of merged) for (const q of s.quotes) if (!urls.has(canonicalUrl(q.url))) urls.set(canonicalUrl(q.url), q.url);
  const texts = new Map();
  const blocked = [...extras.blocked];
  for (const [key, url] of urls) {
    const r = await fetchText(url);
    texts.set(key, r.ok ? r.text : null);
    if (!r.ok) blocked.push({ url, reason: r.reason });
  }

  const checked = applyChecks(merged, texts);
  const stories = applyCap(checked.stories, run.target);
  const sum = summarize(stories, run.target);
  const share = struggleShare(extras.queries, run.solutionWords ?? []);
  const data = {
    run: {
      ...run,
      searches: extras.queries.length,
      struggleShare: share,
      short: sum.short,
      blocked,
      newPhrases: extras.newPhrases,
      newSituations: extras.newSituations,
      finderNotes: extras.notes,
      audit: checked.audit,
    },
    stories,
  };
  const errors = validateRun(data, 'checked');
  if (errors.length > 0) {
    console.error('stories.json was not written. Fix these in the finds files and run again:');
    const threads = new Map(stories.map((s) => [s.id, s.thread]));
    for (const e of errors) console.error(`- ${e} (${threads.get(e.split(':')[0]) ?? 'run'})`);
    process.exit(1);
  }
  await writeFile(join(runDir, 'stories.json'), `${JSON.stringify(data, null, 2)}\n`);

  const a = checked.audit;
  console.log(`Stories: ${sum.retained} retained, ${sum.counted} counted (target ${run.target}), ${sum.excess} excess, ${a.droppedStories} dropped`);
  console.log(`Quotes: ${a.checked} checked, ${a.notFound} not found (dropped), ${a.unrechecked} couldn't recheck`);
  console.log(`Pages: ${urls.size} fetched, ${blocked.length - extras.blocked.length} failed`);
  console.log(`Struggle-first searches: ${Math.round(share * 100)}% of ${extras.queries.length}`);
  console.log(`Platforms: ${sum.platforms.map((p) => `${p.platform} ${p.retained}`).join(', ') || 'none'}`);
  const excessBy = new Map();
  for (const s of stories.filter((x) => x.excess)) excessBy.set(s.platform, (excessBy.get(s.platform) ?? 0) + 1);
  for (const [platform, n] of excessBy) console.log(`CAPPED ${platform} ${n}`);
  // A page where every quote is missing is usually a wall served at check time; a few missing
  // means misquotes. Either way the lead looks before carrying on.
  for (const p of checked.missing) console.log(`NOT-FOUND ${p.notFound}/${p.total} ${p.url}`);
  if (sum.short) console.log(`SHORT ${sum.counted}/${run.target}`);
  if (share < 0.5) console.log(`SOLUTION-LED ${share.toFixed(2)}`);
  for (const w of lintRun(data)) console.log(`LINT ${w}`);
}

const MAX_SITUATION_WORDS = 8;

// One finder's quotes against the pages it captured, without the network. readPage(url) returns
// the captured text or null. The same checks the merge applies, caught before hand-back.
export function checkLocal(find, readPage) {
  const problems = [];
  let total = 0;
  let found = 0;
  for (const [n, st] of (find.stories ?? []).entries()) {
    const words = String(st.situation ?? '').split(/\s+/).filter(Boolean).length;
    if (words > MAX_SITUATION_WORDS) {
      problems.push(`${find.finder} story ${n + 1}: situation has ${words} words; use a short label from the situation map`);
    }
    for (const [j, q] of (st.quotes ?? []).entries()) {
      total += 1;
      const at = `${find.finder} story ${n + 1} quote ${j + 1}`;
      const problem = quoteProblem(q.text);
      if (problem) {
        problems.push(`${at}: ${problem}`);
        continue;
      }
      const url = q.url || st.thread;
      const text = readPage(url);
      if (text == null) problems.push(`${at}: no capture of ${url}; capture it with fetch-text.mjs before quoting`);
      else if (quoteMatches(q.text, text)) found += 1;
      else problems.push(`${at}: not in the captured page: "${String(q.text).slice(0, 60)}"`);
    }
  }
  return { found, total, problems };
}

async function mainLocal(runDir, findsFile) {
  if (!runDir || !findsFile) throw new Error('usage: node scripts/story-research/check.mjs --local <run-dir> <finds-file>');
  const find = await readJson(findsFile);
  const readPage = (url) => {
    try {
      return readFileSync(join(runDir, 'pages', `${pageKey(url)}.txt`), 'utf8');
    } catch {
      return null;
    }
  };
  const { found, total, problems } = checkLocal(find, readPage);
  for (const p of problems) console.log(p);
  console.log(`${find.finder}: ${found} of ${total} quotes found in your captures`);
  if (problems.length > 0) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    if (args[0] === '--local') await mainLocal(args[1], args[2]);
    else await main(args);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
