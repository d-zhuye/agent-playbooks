#!/usr/bin/env node
// A compact view of a run's stories, for the agents that read them: the lead, force raters and
// the auditor. It leaves fit out unless asked, so the lead can write the findings before seeing
// anything drawn from the profile.
//
//   node scripts/story-research/digest.mjs <run-dir> [ids…] [--with-fit]   story views
//   node scripts/story-research/digest.mjs <run-dir> --ids                  retained ids
//   node scripts/story-research/digest.mjs <run-dir> --pick [N]             N retained ids at random;
//                                                                           without N, the audit's size
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { FORCES } from './stories.mjs';

export function retainedIds(data) {
  return data.stories.filter((s) => !s.excess).map((s) => s.id);
}

// Fisher–Yates, so every retained story is equally likely to be picked.
export function pickIds(data, n, random = Math.random) {
  const ids = retainedIds(data);
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, n);
}

// The spot-check audit reads 5 stories or a tenth of the retained ones, whichever is more: five
// can't show a problem that affects one story in five with any confidence in a large run.
export function auditSize(data) {
  const n = retainedIds(data).length;
  return Math.min(n, Math.max(5, Math.ceil(n / 10)));
}

function storyView(s, withFit) {
  const head = [s.id, s.type, s.author ? `${s.speaker} (${s.author})` : s.speaker, s.platform, s.posted ?? 'date not shown'];
  if (s.words) head.push(`about ${s.words} words`);
  const lines = [head.join(' · ')];
  lines.push(`situation: ${s.situation || 'not given'} · group: ${s.group || 'not given'}`);
  if (s.trigger || s.job) lines.push(`trigger: ${s.trigger ?? 'not shown'} · job: ${s.job ?? 'not written'}`);
  lines.push(`thread: ${s.thread}`);
  for (const q of s.quotes) {
    // A quote's own page is shown only when it isn't the thread (a follow-up post, say).
    lines.push(`${q.id} [${q.check}] "${q.text}"${q.url === s.thread ? '' : ` (${q.url})`}${q.note ? ` — note: ${q.note}` : ''}`);
  }
  if (!s.forces) {
    lines.push('forces: not rated yet');
  } else {
    for (const f of FORCES) {
      const force = s.forces[f];
      lines.push(force ? `${f} (${force.strength}): ${force.summary} [${force.quotes.join(', ')}]` : `${f}: not in the story`);
    }
  }
  if (withFit && s.fit) {
    const scores = s.fit.parts.map((p) => (p.score === null ? '–' : String(p.score))).join(' · ');
    lines.push(`fit: ${s.fit.total} from ${s.fit.shown} parts (${s.fit.confidence}): ${scores}`);
    s.fit.parts.forEach((p, i) => lines.push(`  part ${i + 1}: ${p.reason}`));
  }
  return lines.join('\n');
}

// The named stories, or every retained story, as plain text.
export function digest(data, ids = null, { withFit = false } = {}) {
  const retained = new Map(data.stories.filter((s) => !s.excess).map((s) => [s.id, s]));
  const chosen = ids ?? [...retained.keys()];
  return chosen.map((id) => {
    const s = retained.get(id);
    if (!s) throw new Error(`${id} is not a retained story`);
    return storyView(s, withFit);
  }).join('\n\n');
}

async function main(args) {
  const [runDir, ...rest] = args;
  if (!runDir) throw new Error('usage: node scripts/story-research/digest.mjs <run-dir> [ids…] [--with-fit] | --ids | --pick [N]');
  const data = JSON.parse(await readFile(join(runDir, 'stories.json'), 'utf8'));
  if (rest[0] === '--ids') {
    console.log(retainedIds(data).join(' '));
  } else if (rest[0] === '--pick') {
    const n = rest[1] === undefined ? auditSize(data) : Number(rest[1]);
    if (!Number.isInteger(n) || n < 1) throw new Error('--pick takes a whole number, e.g. --pick 5, or none for the audit size');
    console.log(pickIds(data, n).join(' '));
  } else {
    const withFit = rest.includes('--with-fit');
    const ids = rest.filter((a) => a !== '--with-fit');
    console.log(digest(data, ids.length > 0 ? ids : null, { withFit }));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
