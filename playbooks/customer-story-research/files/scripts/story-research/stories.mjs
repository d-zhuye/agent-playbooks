// Shared rules for the story-research scripts: how quotes match a page, how URLs and platforms
// are named, and what a valid stories.json looks like. Every script imports these, so the quote
// check, the platform cap and the report can never disagree.
import { createHash } from 'node:crypto';

export const STORY_TYPES = ['switch', 'plea', 'review', 'counter'];
export const FORCES = ['push', 'pull', 'anxiety', 'habit'];
export const STRENGTHS = ['weak', 'clear', 'strong'];
export const CHECKS = ['pending', 'checked', 'not-found', 'unrechecked'];
export const CONFIDENCES = ['thin', 'solid'];
// No platform supplies more than this share of the target, rounded up (12 of 60, 2 of 8).
export const PLATFORM_CAP = 0.2;
export const MIN_QUOTE_WORDS = 3;
export const FIT_PARTS = 5;

const SPEAKER = /^(poster|commenter-\d+)$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
// A word continues through a letter, a digit, or an apostrophe followed by a letter or digit, so
// "can" stops short of "can't" and "kid" of "kid's", but "kids" ends before "kids' idea".
const WORD_GOES_ON_BEFORE = /(?:[\p{L}\p{N}]|[\p{L}\p{N}]')$/u;
const WORD_GOES_ON_AFTER = /^(?:[\p{L}\p{N}]|'[\p{L}\p{N}])/u;

// Fold the typography that differs between a page and a quote copied from it without changing a
// word: Unicode forms, case, invisible characters (soft hyphens and zero-width marks, which split
// words without showing), curly quotes, dashes, the ellipsis character, emoji (which agents
// sometimes drop or mangle when copying) and runs of whitespace.
export function normalize(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[­​-‍⁠﻿]/g, '')
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Regional_Indicator}︎️]/gu, ' ')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[–—―‐]/g, '-')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCount(normalized) {
  return normalized.split(' ').filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

// Why a quote can't be used, or null. A quote is one unbroken passage of at least three words:
// pieces joined with an ellipsis could say something the storyteller never said.
export function quoteProblem(text) {
  const q = normalize(text);
  if (q.includes('...')) return 'contains an ellipsis';
  if (wordCount(q) < MIN_QUOTE_WORDS) return `has fewer than ${MIN_QUOTE_WORDS} words`;
  return null;
}

// True when the quote appears in the page as whole words: the words don't go on directly before
// or after it, so "a car" never matches inside "a carpet", nor "we can" inside "we can't".
export function quoteMatches(quote, pageText) {
  if (quoteProblem(quote)) return false;
  const q = normalize(quote);
  const page = normalize(pageText);
  for (let i = page.indexOf(q); i !== -1; i = page.indexOf(q, i + 1)) {
    const before = page.slice(Math.max(0, i - 3), i);
    const after = page.slice(i + q.length, i + q.length + 3);
    if (!WORD_GOES_ON_BEFORE.test(before) && !WORD_GOES_ON_AFTER.test(after)) return true;
  }
  return false;
}

// One prefix rule for both platform names and canonical URLs, so www., m., old., new., np. and
// amp. forms of a site count as one platform and one page.
function bareHost(u) {
  return u.hostname.toLowerCase().replace(/^(www|m|old|new|np|amp)\./, '');
}

// Other names for one platform, so the cap counts them together.
const PLATFORM_ALIASES = { 'redd.it': 'reddit.com', 'itunes.apple.com': 'apps.apple.com' };
// Blog hosts where each subdomain is one person's site: one platform for the cap, and the
// subdomain (often the person's name) never becomes a platform name.
const SHARED_HOSTS = ['substack.com', 'blogspot.com', 'wordpress.com', 'medium.com', 'tumblr.com'];

export function platformOf(url) {
  const host = bareHost(new URL(url));
  if (PLATFORM_ALIASES[host]) return PLATFORM_ALIASES[host];
  if (/^amazon\.[a-z.]+$/.test(host)) return 'amazon.com';
  return SHARED_HOSTS.find((h) => host.endsWith(`.${h}`)) ?? host;
}

// The form two finders' links to the same page share: https, no prefix, no fragment, no tracking
// parameters, no trailing slash. Only used as a key; pages are fetched at the URL the finder gave.
export function canonicalUrl(url) {
  const u = new URL(url);
  u.protocol = 'https:';
  u.hostname = bareHost(u);
  u.hash = '';
  const tracking = [...u.searchParams.keys()].filter((k) => /^utm_/i.test(k) || k === 'fbclid' || k === 'gclid');
  for (const k of tracking) u.searchParams.delete(k);
  if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, '');
  return u.toString();
}

// File name for a captured page: pages/<pageKey>.txt.
export function pageKey(url) {
  return createHash('sha1').update(canonicalUrl(url)).digest('hex').slice(0, 12);
}

// The most stories one platform may supply. The small subtraction keeps 0.2 × 60 from rounding
// up to 13 through floating-point error.
export function capCount(target) {
  return Math.ceil(target * PLATFORM_CAP - 1e-9);
}

// Only web links: the page turns these into <a href>, so a javascript: or data: URL must never
// get through.
function isUrl(value) {
  try {
    return typeof value === 'string' && ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function forcesErrors(forces, quoteIds) {
  if (typeof forces !== 'object' || Array.isArray(forces)) return ['forces must be an object'];
  const errors = [];
  for (const key of Object.keys(forces)) {
    if (!FORCES.includes(key)) errors.push(`forces.${key} is not one of ${FORCES.join(', ')}`);
  }
  for (const f of FORCES) {
    if (!(f in forces)) {
      errors.push(`forces.${f} is missing (use null for "not in the story")`);
      continue;
    }
    const force = forces[f];
    if (force === null) continue;
    if (typeof force.summary !== 'string' || !force.summary.trim()) errors.push(`forces.${f}.summary is missing`);
    if (!STRENGTHS.includes(force.strength)) {
      errors.push(`forces.${f}.strength '${force.strength}' is not one of ${STRENGTHS.join(', ')}`);
    }
    if (!Array.isArray(force.quotes) || force.quotes.length === 0) {
      errors.push(`forces.${f}.quotes is empty: back the force with a quote or set it to null`);
    } else {
      for (const id of force.quotes) {
        if (!quoteIds.has(id)) errors.push(`forces.${f}.quotes cites ${id}, which the story does not have`);
      }
    }
  }
  return errors;
}

function fitErrors(fit) {
  if (typeof fit !== 'object' || Array.isArray(fit)) return ['fit must be an object'];
  const parts = Array.isArray(fit.parts) ? fit.parts : [];
  if (parts.length !== FIT_PARTS) return [`fit.parts must have ${FIT_PARTS} entries, has ${parts.length}`];
  const errors = [];
  parts.forEach((p, i) => {
    if (![0, 1, 2, null].includes(p?.score)) errors.push(`fit.parts[${i}].score must be 0, 1, 2 or null, is ${p?.score}`);
    if (typeof p?.reason !== 'string' || !p.reason.trim()) errors.push(`fit.parts[${i}].reason is missing`);
  });
  // Totals are only meaningful once every score is valid; a bad score is reported once, above.
  if (errors.length === 0) {
    const scores = parts.map((p) => p.score).filter((s) => s !== null);
    const sum = scores.reduce((a, b) => a + b, 0);
    if (fit.total !== sum) errors.push(`fit.total is ${fit.total}, but the parts add up to ${sum}`);
    if (fit.shown !== scores.length) errors.push(`fit.shown is ${fit.shown}, but ${scores.length} parts are shown`);
  }
  if (!CONFIDENCES.includes(fit.confidence)) errors.push(`fit.confidence '${fit.confidence}' is not one of ${CONFIDENCES.join(', ')}`);
  return errors;
}

function storyErrors(s, ids, phase) {
  const errors = [];
  if (!/^s\d{3,}$/.test(s.id ?? '')) errors.push('id must look like s001');
  if (!isUrl(s.thread)) errors.push('thread is missing or not a URL');
  if (typeof s.platform !== 'string' || !s.platform) errors.push('platform is missing');
  if (s.posted !== null && !DATE.test(s.posted ?? '')) errors.push('posted must be YYYY-MM-DD or null');
  if (!DATE.test(s.found ?? '')) errors.push('found must be YYYY-MM-DD');
  if (!STORY_TYPES.includes(s.type)) errors.push(`type '${s.type}' is not one of ${STORY_TYPES.join(', ')}`);
  if (!SPEAKER.test(s.speaker ?? '')) errors.push(`speaker '${s.speaker}' must be poster or commenter-N (the name goes in author)`);
  if (s.author != null && typeof s.author !== 'string') errors.push('author must be text or null');
  if (s.words != null && !(Number.isInteger(s.words) && s.words > 0)) errors.push('words must be a positive whole number or null');
  if (typeof s.excess !== 'boolean') errors.push('excess must be true or false');
  for (const r of Array.isArray(s.related) ? s.related : []) {
    if (!ids.has(r) || r === s.id) errors.push(`related id ${r} is not another story in this run`);
  }

  const quotes = Array.isArray(s.quotes) ? s.quotes : [];
  if (quotes.length === 0) errors.push('quotes is empty');
  const quoteIds = new Set();
  for (const q of quotes) {
    if (!/^q\d+$/.test(q.id ?? '') || quoteIds.has(q.id)) errors.push(`quote id ${q.id} must be unique and look like q1`);
    quoteIds.add(q.id);
    const problem = quoteProblem(q.text);
    if (problem) errors.push(`quote ${q.id} text ${problem}`);
    if (!isUrl(q.url)) errors.push(`quote ${q.id} url is missing or not a URL`);
    if (q.note != null && typeof q.note !== 'string') errors.push(`quote ${q.id} note must be text`);
    if (q.added != null && q.added !== 'audit') errors.push(`quote ${q.id} added must be "audit" or left out`);
    // Not-found quotes are dropped by check.mjs, and pending means the check never ran.
    if (!['checked', 'unrechecked'].includes(q.check)) errors.push(`quote ${q.id} check '${q.check}' must be checked or unrechecked`);
  }

  // Analysis fields: forces are required from the rated phase on, fit in the final phase, and both
  // are checked whenever present.
  if (s.excess) return errors;
  if (s.forces != null) errors.push(...forcesErrors(s.forces, quoteIds));
  else if (phase === 'rated' || phase === 'final') errors.push('forces are missing');
  if (s.fit != null) errors.push(...fitErrors(s.fit));
  else if (phase === 'final') errors.push('fit is missing');
  for (const key of ['trigger', 'job']) {
    if (s[key] != null && typeof s[key] !== 'string') errors.push(`${key} must be text or null`);
  }
  return errors;
}

// Every problem in a run's data, each naming the story and field. phase 'checked' is the output
// of check.mjs (no analysis yet); 'rated' needs forces on every retained story (the lead writes
// the findings from these, before fit is merged); 'final' needs forces and fit.
export function validateRun(data, phase) {
  const errors = [];
  const run = data?.run ?? {};
  if (!DATE.test(run.date ?? '')) errors.push('run.date must be YYYY-MM-DD');
  if (!(Number.isInteger(run.target) && run.target > 0)) errors.push('run.target must be a positive whole number');
  const stories = Array.isArray(data?.stories) ? data.stories : [];
  const ids = new Set();
  for (const s of stories) {
    if (ids.has(s.id)) errors.push(`${s.id}: id is used twice`);
    ids.add(s.id);
  }
  for (const s of stories) errors.push(...storyErrors(s, ids, phase).map((e) => `${s.id}: ${e}`));
  return errors;
}

// ---- Lint: warnings, not errors, for things the trial had to fix by hand ----
// Names aren't linted: each story keeps its author's name so a human can find the post again.

const GENDERED = /\b(he|she|him|her|his|hers|himself|herself)\b/i;
const MAX_SITUATION_WORDS = 8;

function lintText(where, field, text) {
  if (typeof text !== 'string' || !text) return [];
  const gendered = GENDERED.exec(text);
  return gendered ? [`${where}: ${field} says "${gendered[0]}"; write "they" unless the story says who they are`] : [];
}

// The text agents write about retained stories: situation labels, summaries and reasons.
export function lintRun(data) {
  const warnings = [];
  for (const s of data?.stories ?? []) {
    if (s.excess) continue;
    const words = String(s.situation ?? '').split(/\s+/).filter(Boolean).length;
    if (words > MAX_SITUATION_WORDS) {
      warnings.push(`${s.id}: situation has ${words} words; use a short label from the situation map`);
    }
    const fields = [['situation', s.situation], ['group', s.group], ['trigger', s.trigger], ['job', s.job]];
    for (const [f, force] of Object.entries(s.forces ?? {})) if (force) fields.push([`forces.${f}.summary`, force.summary]);
    (s.fit?.parts ?? []).forEach((p, i) => fields.push([`fit.parts[${i}].reason`, p?.reason]));
    for (const [field, text] of fields) warnings.push(...lintText(s.id, field, text));
  }
  return warnings;
}

export function lintAudit(audit) {
  return Object.entries(audit ?? {}).flatMap(([id, a]) => lintText(`audit ${id}`, 'note', a?.note));
}
