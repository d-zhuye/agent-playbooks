#!/usr/bin/env node
// Turn a finished run into report.md and page.html from one set of data, in the same order: run
// header, forces, the five findings, people we might be wrong about, stories, run notes.
//
//   node scripts/story-research/build-report.mjs <run-dir>
//   node scripts/story-research/build-report.mjs <run-dir> --check-findings
//
// Reads stories.json, findings.json and, if it exists, audit.json. Refuses (exit 1) when the run
// fails the final check, when a finding cites a story or quote that isn't in the report, or when
// an unchecked quote sits where only checked quotes may go (Words to use, forces themes).
// --check-findings checks findings.json against the rated stories, before fit is merged, and
// writes nothing: the findings writer runs it at step 5.
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateRun, lintRun, lintAudit, FORCES } from './stories.mjs';

export const FORCE_TITLES = {
  push: 'Push of the situation',
  pull: 'Pull of the new solution',
  anxiety: 'Anxiety of the new solution',
  habit: 'Habit of the present',
};
const FORCE_HINTS = {
  push: 'What made the present hard to bear',
  pull: 'What drew them to something new',
  anxiety: 'What worried them about the new thing',
  habit: 'What kept them doing what they did',
};
export const FINDING_TITLES = {
  aim: 'Who to aim at first',
  words: 'Words to use',
  build: 'What to build or write next',
  hesitations: 'Purchase hesitations',
  where: 'Where to find early users',
};
const CLAIM_KEYS = ['aim', 'build', 'hesitations', 'where'];
const TYPE_LABELS = { switch: 'Switch story', plea: 'Plea for help', review: 'Product review', counter: 'Counter-story' };

const retainedOf = (stories) => stories.filter((s) => !s.excess);
const hasChecked = (s) => s.quotes.some((q) => q.check === 'checked');
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
// Who said it: the speaker label, and the name the page shows when the finder recorded it, so a
// reader can find the post again.
const who = (s) => (s.author ? `${s.speaker} (${s.author})` : s.speaker);

// A quote reference is "s001/q2". Only retained stories can be cited.
function findQuote(stories, ref) {
  const [sid, qid] = String(ref).split('/');
  const story = stories.find((s) => s.id === sid && !s.excess);
  const quote = story?.quotes.find((q) => q.id === qid);
  return quote ? { story, quote } : null;
}

export function validateFindings(findings, stories) {
  const errors = [];
  const ids = new Set(stories.map((s) => s.id));
  const retained = new Set(retainedOf(stories).map((s) => s.id));
  const byId = new Map(stories.map((s) => [s.id, s]));
  const checkStory = (at, id) => {
    if (retained.has(id)) return;
    errors.push(`${at}: ${id} is ${ids.has(id) ? 'an excess story, kept out of the report' : 'not a story in this run'}`);
  };
  const checkQuote = (at, ref) => {
    const hit = findQuote(stories, ref);
    if (!hit) errors.push(`${at}: ${ref} is not a quote in the report`);
    // Only quotes the check found on the live page may stand for what people say.
    else if (hit.quote.check !== 'checked') errors.push(`${at}: ${ref} is not a checked quote`);
  };
  const checkClaims = (where, list) => (list ?? []).forEach((c, i) => {
    const at = `${where}[${i}]`;
    if (typeof c.text !== 'string' || !c.text.trim()) errors.push(`${at}: text is missing`);
    if (!Array.isArray(c.stories) || c.stories.length === 0) errors.push(`${at}: cites no stories`);
    else c.stories.forEach((id) => checkStory(at, id));
  });

  for (const f of FORCES) {
    (findings.forces?.[f] ?? []).forEach((t, i) => {
      const at = `forces.${f}[${i}]`;
      if (typeof t.theme !== 'string' || !t.theme.trim()) errors.push(`${at}: theme is missing`);
      if (!Array.isArray(t.stories) || t.stories.length === 0) errors.push(`${at}: cites no stories`);
      else {
        t.stories.forEach((id) => {
          checkStory(at, id);
          // A theme's story count means "stories showing this force".
          if (retained.has(id) && !byId.get(id).forces?.[f]) errors.push(`${at}: ${id} does not show ${f}`);
        });
      }
      (t.quotes ?? []).forEach((ref) => checkQuote(at, ref));
    });
  }
  for (const key of CLAIM_KEYS) checkClaims(`findings.${key}`, findings.findings?.[key]);
  (findings.findings?.words ?? []).forEach((w, i) => checkQuote(`findings.words[${i}]`, w.quote));
  checkClaims('wrongAbout', findings.wrongAbout);
  checkClaims('compare.agrees', findings.compare?.agrees);
  checkClaims('compare.differs', findings.compare?.differs);
  if (findings.writtenBeforeProfile !== undefined && typeof findings.writtenBeforeProfile !== 'boolean') {
    errors.push('writtenBeforeProfile must be true or false');
  }
  // Only stories that show at least four fit parts can be listed as people we might be wrong about.
  (findings.wrongAbout ?? []).forEach((c, i) => (c.stories ?? []).forEach((id) => {
    const shown = byId.get(id)?.fit?.shown ?? 0;
    if (retained.has(id) && shown < 4) {
      errors.push(`wrongAbout[${i}]: ${id} shows ${shown} fit parts; people we might be wrong about need at least 4`);
    }
  }));
  // Empty until step 6: the findings writer never sees the profile the labels come from.
  const fitParts = findings.fitParts ?? [];
  if (!(Array.isArray(fitParts) && [0, 5].includes(fitParts.length))) {
    errors.push('fitParts must list the five fit criteria in the profile\'s order');
  }
  return errors;
}

// People we might be wrong about: a strong Push, but a low fit from a story that shows enough of
// the profile (at least 4 of 5 parts) for the low score to mean something.
export function wrongAbout(stories) {
  return retainedOf(stories).filter((s) => s.forces?.push?.strength === 'strong'
    && s.fit && s.fit.shown >= 4 && s.fit.total <= 4);
}

function facts(run, stories) {
  const retained = retainedOf(stories);
  const counted = retained.filter(hasChecked).length;
  const perPlatform = new Map();
  for (const s of retained) perPlatform.set(s.platform, (perPlatform.get(s.platform) ?? 0) + 1);
  return {
    retained,
    counted,
    short: counted < run.target,
    platforms: [...perPlatform].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    situations: [...new Set(retained.map((s) => s.situation).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    share: Math.round((run.struggleShare ?? 0) * 100),
    searches: run.searches ?? 0,
  };
}

function forceStats(retained, force) {
  const by = { strong: 0, clear: 0, weak: 0 };
  for (const s of retained) {
    const f = s.forces?.[force];
    if (f && f.strength in by) by[f.strength] += 1;
  }
  return { total: by.strong + by.clear + by.weak, ...by };
}

function tally(entries, field) {
  const counts = new Map();
  for (const [, a] of entries) counts.set(a[field], (counts.get(a[field]) ?? 0) + 1);
  return [...counts].map(([value, n]) => `${value} ${n}`).join(', ');
}

// The run notes, shared by both outputs: each a label with a sentence, a list, or both.
function runNotes(run, stories, findings, audit) {
  const notes = findings.notes ?? {};
  const a = run.audit ?? {};
  const excess = stories.filter((s) => s.excess);
  const excessBy = new Map();
  for (const s of excess) excessBy.set(s.platform, (excessBy.get(s.platform) ?? 0) + 1);
  const auditEntries = audit ? Object.entries(audit) : [];
  const share = Math.round((run.struggleShare ?? 0) * 100);
  const out = [
    { label: 'Searches', text: `${run.searches ?? 0} logged; ${share}% struggle-first (at least half should be).` },
    {
      label: 'Quote check',
      text: `${a.checked ?? 0} checked, ${a.notFound ?? 0} not found and dropped, ${a.unrechecked ?? 0} couldn't recheck; `
        + `${plural(a.droppedStories ?? 0, 'story', 'stories')} dropped with no quote left.`,
    },
    {
      label: 'Platform cap',
      text: excess.length
        ? `Kept out by the platform cap: ${plural(excess.length, 'story', 'stories')} (${[...excessBy].map(([p, n]) => `${p} ${n}`).join(', ')}).`
        : 'No platform went over its cap.',
    },
    audit
      ? {
        label: 'Spot-check audit',
        text: `Spot-check audit of ${plural(auditEntries.length, 'story', 'stories')}: attribution ${tally(auditEntries, 'attribution')}; `
          + `context ${tally(auditEntries, 'context')}; forces ${tally(auditEntries, 'forces')}; fit ${tally(auditEntries, 'fit')}.`,
        items: auditEntries.map(([id, x]) => `${id}: attribution ${x.attribution}, context ${x.context}, forces ${x.forces}, fit ${x.fit}${x.note ? `. ${x.note}` : ''}`),
      }
      : { label: 'Spot-check audit', text: 'This run was not audited.' },
    {
      label: 'Quotes added by the audit',
      items: retainedOf(stories).flatMap((s) => s.quotes.filter((q) => q.added === 'audit').map((q) => `${s.id}/${q.id}: "${q.text}"`)),
    },
    { label: 'Blocked or refused', items: [...(run.blocked ?? []).map((b) => `${b.url} (${b.reason})`), ...(notes.blocked ?? [])] },
    { label: 'New situations', items: [...new Set([...(run.newSituations ?? []), ...(notes.newSituations ?? [])])] },
    { label: 'New phrases', items: run.newPhrases ?? [] },
    { label: 'Finder notes', items: run.finderNotes ?? [] },
    { label: 'Sources', items: notes.sources ?? [] },
    { label: 'Suggested profile changes', items: notes.profileChanges ?? [] },
  ];
  if (notes.other?.length) out.push({ label: 'Other notes', items: notes.other });
  return out;
}

// ---- Markdown ----

const mdText = (t) => String(t ?? '').replace(/\s+/g, ' ').replace(/</g, '&lt;').trim();
const mdCell = (t) => mdText(t).replace(/\|/g, '\\|');

export function renderMarkdown(run, stories, findings, audit) {
  const f = facts(run, stories);
  const L = [`# Customer stories, ${run.date}`, ''];
  if (run.product) L.push(`Product: ${mdText(run.product)}`, '');
  if (f.short) {
    L.push(`**Incomplete: ${f.counted} of ${run.target} counted stories.** The run ended short of its target, so every count below is smaller than planned.`, '');
  }
  if (f.retained.length === 0) L.push('No stories were found.', '');
  L.push(
    `- Counted stories: ${f.counted} of ${run.target} (retained stories with at least one checked quote)`,
    `- Platforms (${f.platforms.length}): ${f.platforms.map(([p, n]) => `${p} (${n})`).join(', ') || 'none'}`,
    `- Situations covered (${f.situations.length}): ${f.situations.map(mdText).join(', ') || 'none'}`,
    `- Struggle-first searches: ${f.share}% of ${f.searches}`,
  );
  if (typeof findings.writtenBeforeProfile === 'boolean') L.push(`- Findings: ${methodText(findings)}`);
  L.push('');

  L.push('## Forces', '', `Push and pull move people toward something new; anxiety and habit hold them back. Counts are stories showing each force, of ${f.retained.length}.`, '');
  for (const force of FORCES) {
    const st = forceStats(f.retained, force);
    L.push(`### ${FORCE_TITLES[force]}: ${st.total} of ${f.retained.length} stories (strong ${st.strong}, clear ${st.clear}, weak ${st.weak})`, '');
    const themes = findings.forces?.[force] ?? [];
    if (themes.length === 0) L.push('No themes.');
    for (const t of themes) {
      L.push(`- **${mdText(t.theme)}** (${plural(t.stories.length, 'story', 'stories')}: ${t.stories.join(', ')})`);
      for (const ref of t.quotes ?? []) {
        const hit = findQuote(stories, ref);
        if (hit) L.push(`  - "${mdText(hit.quote.text)}" (${ref}, ${mdText(who(hit.story))})`);
      }
    }
    L.push('');
  }

  for (const [key, title] of Object.entries(FINDING_TITLES)) {
    L.push(`## ${title}`, '');
    const list = findings.findings?.[key] ?? [];
    if (list.length === 0) L.push('None this run.');
    for (const item of list) {
      if (key === 'words') {
        // The wording always comes from the quote record, never from the finding.
        const hit = findQuote(stories, item.quote);
        if (hit) L.push(`- "${mdText(hit.quote.text)}" (${item.quote}, ${mdText(who(hit.story))})${item.note ? `. ${mdText(item.note)}` : ''}`);
      } else {
        L.push(`- ${mdText(item.text)} (${item.stories.join(', ')})`);
      }
    }
    L.push('');
  }

  L.push('## Compared with the profile', '', COMPARE_LEDE, '');
  for (const [key, title] of [['agrees', 'Where the stories agree'], ['differs', 'Where they differ']]) {
    L.push(`### ${title}`, '');
    const list = findings.compare?.[key] ?? [];
    if (list.length === 0) L.push('None noted.');
    for (const c of list) L.push(`- ${mdText(c.text)} (${c.stories.join(', ')})`);
    L.push('');
  }
  L.push('### People we might be wrong about', '', WRONG_LEDE, '');
  const wrong = wrongAbout(stories);
  if (wrong.length === 0) L.push('None this run.');
  for (const s of wrong) {
    L.push(`- ${s.id}: ${mdText(s.situation)}. Push: ${mdText(s.forces.push.summary)}. Fit ${s.fit.total} from ${s.fit.shown} parts, ${s.fit.confidence}.`);
  }
  if (findings.wrongAbout?.length) {
    L.push('', "The lead's notes:", '');
    for (const c of findings.wrongAbout) L.push(`- ${mdText(c.text)} (${c.stories.join(', ')})`);
  }
  L.push('');

  L.push('## Stories', '');
  if (f.retained.length === 0) {
    L.push('No stories were found.');
  } else {
    L.push('| Story | Type | Who | Situation | Platform | Posted | Fit | Confidence | Forces |', '|---|---|---|---|---|---|---|---|---|');
    for (const s of f.retained) {
      const fit = s.fit ? `${s.fit.total} (${s.fit.shown} shown)` : '';
      L.push(`| [${s.id}](${s.thread}) | ${TYPE_LABELS[s.type] ?? s.type} | ${mdCell(who(s))} | ${mdCell(s.situation)} | ${s.platform} | ${s.posted ?? ''} | ${fit} | ${s.fit?.confidence ?? ''} | ${FORCES.filter((x) => s.forces?.[x]).join(', ')} |`);
    }
  }
  L.push('');

  L.push('## Run notes', '');
  for (const n of runNotes(run, stories, findings, audit)) {
    const lead = n.text ?? (n.items?.length ? '' : 'None.');
    L.push(`- **${n.label}:** ${mdText(lead)}`.trimEnd());
    for (const item of n.items ?? []) L.push(`  - ${mdText(item)}`);
  }
  return `${L.join('\n')}\n`;
}

// ---- Page ----

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const storyLinks = (ids) => ids.map((id) => `<a href="#${esc(id)}">${esc(id)}</a>`).join(' ');
const sourceLink = (url, text) => (/^https?:\/\//i.test(url ?? '')
  ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`
  : '');
const quoteHtml = (hit, ref) => `<blockquote>“${esc(hit.quote.text)}”<cite>${esc(ref)} · ${esc(who(hit.story))}</cite></blockquote>`;

// The comparison comes after the findings and is the only part written with the profile in view.
const COMPARE_LEDE = 'How the stories read against the ideal-user profile: where they agree, where they differ, and who it may be missing.';
const WRONG_LEDE = 'Stories with a strong push but a fit of 4 or less from at least 4 shown parts: people the profile may be missing.';
const methodText = (findings) => (findings.writtenBeforeProfile
  ? 'written before the profile was read'
  : 'written with the profile in view');

function headerHtml(run, f, findings) {
  return `<header class="run" id="top">
<p class="eyebrow">Customer story research</p>
<h1>Customer stories, <time datetime="${esc(run.date)}">${esc(run.date)}</time></h1>
${run.product ? `<p class="product">${esc(run.product)}</p>` : ''}
${f.short ? `<p class="incomplete" role="note"><strong>Incomplete: ${f.counted} of ${esc(run.target)} counted stories.</strong> The run ended short of its target, so every count below is smaller than planned.</p>` : ''}
${f.retained.length === 0 ? '<p class="empty">No stories were found.</p>' : ''}
<dl class="facts">
<div><dt>Counted stories</dt><dd>${f.counted} of ${esc(run.target)}</dd></div>
<div><dt>Platforms</dt><dd>${f.platforms.length}</dd></div>
<div><dt>Situations covered</dt><dd>${f.situations.length}</dd></div>
<div><dt>Struggle-first searches</dt><dd>${f.share}% of ${f.searches}</dd></div>
</dl>
${typeof findings.writtenBeforeProfile === 'boolean' ? `<p class="product">Findings: ${methodText(findings)}.</p>` : ''}
<details class="spread"><summary>Platforms and situations</summary>
<p><strong>Platforms:</strong> ${esc(f.platforms.map(([p, n]) => `${p} (${n})`).join(', ') || 'none')}</p>
<p><strong>Situations:</strong> ${esc(f.situations.join(' · ') || 'none')}</p>
</details>
</header>`;
}

function forceCard(force, f, stories, findings) {
  const st = forceStats(f.retained, force);
  const of = f.retained.length;
  // Bar segments are drawn to one scale: the full track is every retained story.
  const seg = (k) => (st[k] ? `<span class="seg ${k}" style="width:${((100 * st[k]) / of).toFixed(2)}%"></span>` : '');
  const themes = findings.forces?.[force] ?? [];
  const themeList = themes.length === 0
    ? '<p class="none">No themes.</p>'
    : `<ul class="themes">${themes.map((t) => `<li><p class="theme">${esc(t.theme)}<span class="n">${plural(t.stories.length, 'story', 'stories')}</span></p>${
      (t.quotes ?? []).map((ref) => { const hit = findQuote(stories, ref); return hit ? quoteHtml(hit, ref) : ''; }).join('')
    }<p class="refs">${storyLinks(t.stories)}</p></li>`).join('')}</ul>`;
  return `<article class="force" id="force-${force}">
<h3>${FORCE_TITLES[force]}</h3>
<p class="hint">${FORCE_HINTS[force]}</p>
<p class="count"><span class="num">${st.total}</span> of ${of} stories</p>
<div class="bar" role="img" aria-label="strong ${st.strong}, clear ${st.clear}, weak ${st.weak}, of ${of} stories">${seg('strong')}${seg('clear')}${seg('weak')}</div>
<p class="legend">strong ${st.strong} · clear ${st.clear} · weak ${st.weak}</p>
${themeList}
</article>`;
}

function forcesHtml(f, stories, findings) {
  return `<section id="forces" aria-labelledby="forces-h">
<h2 id="forces-h">Forces</h2>
<p class="lede">Push and pull move people toward something new; anxiety and habit hold them back. Each bar is all ${f.retained.length} stories, shaded by how strongly each one shows the force.</p>
<div class="board">
<div class="side toward"><p class="side-label">Toward a change</p>${forceCard('push', f, stories, findings)}${forceCard('pull', f, stories, findings)}</div>
<div class="side against"><p class="side-label">Against a change</p>${forceCard('anxiety', f, stories, findings)}${forceCard('habit', f, stories, findings)}</div>
</div>
</section>`;
}

function findingsHtml(stories, findings) {
  const sections = Object.entries(FINDING_TITLES).map(([key, title]) => {
    const list = findings.findings?.[key] ?? [];
    let body;
    if (list.length === 0) {
      body = '<p class="none">None this run.</p>';
    } else if (key === 'words') {
      // The wording always comes from the quote record, never from the finding.
      body = `<p class="lede">Checked quotes only, word for word.</p><ul class="words">${list.map((w) => {
        const hit = findQuote(stories, w.quote);
        if (!hit) return '';
        return `<li><blockquote>“${esc(hit.quote.text)}”</blockquote>${w.note ? `<p class="note">${esc(w.note)}</p>` : ''}`
          + `<p class="refs"><a href="#${esc(hit.story.id)}">${esc(w.quote)}</a> · ${esc(who(hit.story))} · ${sourceLink(hit.quote.url, 'source')}</p></li>`;
      }).join('')}</ul>`;
    } else {
      body = `<ul>${list.map((c) => `<li>${esc(c.text)}<span class="refs">${storyLinks(c.stories)}</span></li>`).join('')}</ul>`;
    }
    return `<section id="${key}" class="finding" aria-labelledby="${key}-h"><h2 id="${key}-h">${title}</h2>${body}</section>`;
  });
  return `<div class="findings">${sections.join('\n')}</div>`;
}

function compareHtml(stories, findings) {
  const claims = (list) => (list?.length
    ? `<ul class="wrong">${list.map((c) => `<li>${esc(c.text)} <span class="refs">${storyLinks(c.stories)}</span></li>`).join('')}</ul>`
    : '<p class="none">None noted.</p>');
  const wrong = wrongAbout(stories);
  const computed = wrong.length === 0
    ? '<p class="none">None this run.</p>'
    : `<ul class="wrong">${wrong.map((s) => `<li><a href="#${esc(s.id)}">${esc(s.id)}</a> ${esc(s.situation)}. Push: ${esc(s.forces.push.summary)}. Fit ${s.fit.total} from ${s.fit.shown} parts, ${esc(s.fit.confidence)}.</li>`).join('')}</ul>`;
  const lead = findings.wrongAbout?.length ? `<h4>The lead's notes</h4>${claims(findings.wrongAbout)}` : '';
  return `<section id="compare" aria-labelledby="compare-h">
<h2 id="compare-h">Compared with the profile</h2>
<p class="lede">${esc(COMPARE_LEDE)}</p>
<section aria-labelledby="agree-h"><h3 id="agree-h">Where the stories agree</h3>${claims(findings.compare?.agrees)}</section>
<section aria-labelledby="differ-h"><h3 id="differ-h">Where they differ</h3>${claims(findings.compare?.differs)}</section>
<section id="wrong-about" aria-labelledby="wrong-h">
<h3 id="wrong-h">People we might be wrong about</h3>
<p class="lede">${esc(WRONG_LEDE)}</p>
${computed}
${lead}
</section>
</section>`;
}

function notesHtml(run, stories, findings, audit) {
  const rows = runNotes(run, stories, findings, audit).map((n) => {
    const lead = n.text ?? (n.items?.length ? '' : 'None.');
    const items = n.items?.length ? `<ul>${n.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '';
    return `<div><dt>${esc(n.label)}</dt><dd>${esc(lead)}${items}</dd></div>`;
  });
  return `<section id="run-notes" aria-labelledby="notes-h">
<h2 id="notes-h">Run notes</h2>
<dl class="notes">${rows.join('\n')}</dl>
</section>`;
}

export function renderPage(run, stories, findings, audit, template, filterSource) {
  const f = facts(run, stories);
  // Related links go only to stories on the page. Every "<" in the data becomes <, so no
  // quote can close the script tag early.
  const onPage = new Set(f.retained.map((s) => s.id));
  const pageStories = f.retained.map((s) => ({ ...s, related: (s.related ?? []).filter((id) => onPage.has(id)) }));
  const json = JSON.stringify({ run, stories: pageStories, fitParts: findings.fitParts ?? null, audit: audit ?? null })
    .replace(/</g, '\\u003c');
  const values = {
    '{{TITLE}}': esc(`Customer stories ${run.date}`),
    '<!--REPORT-TOP-->': [headerHtml(run, f, findings), forcesHtml(f, stories, findings), findingsHtml(stories, findings), compareHtml(stories, findings)].join('\n'),
    '<!--RUN-NOTES-->': notesHtml(run, stories, findings, audit),
    '<!--STORY-DATA-->': `<script id="story-data" type="application/json">${json}</script>`,
    '/*PAGE-FILTER*/': filterSource.replace(/^export /gm, ''),
  };
  for (const token of Object.keys(values)) {
    const n = template.split(token).length - 1;
    if (n !== 1) throw new Error(`page-template.html must contain ${token} exactly once, found ${n}`);
  }
  // One pass over the template, so text inside the values is never read as a placeholder.
  const pattern = new RegExp(Object.keys(values).map((t) => t.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')).join('|'), 'g');
  return template.replace(pattern, (token) => values[token]);
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (err) {
    throw new Error(`${path}: ${err.message}`);
  }
}

async function main(args) {
  const runDir = args.find((a) => !a.startsWith('--'));
  if (!runDir) {
    console.error('usage: node scripts/story-research/build-report.mjs <run-dir> [--check-findings]');
    process.exit(1);
  }
  const data = await readJson(join(runDir, 'stories.json'));
  const findings = await readJson(join(runDir, 'findings.json'));
  if (args.includes('--check-findings')) {
    const errors = [...validateRun(data, 'rated'), ...validateFindings(findings, data.stories)];
    if (errors.length > 0) {
      console.error('findings.json has problems:');
      for (const e of errors) console.error(`- ${e}`);
      process.exit(1);
    }
    console.log('findings.json passes the step-5 check.');
    return;
  }
  let audit = null;
  try {
    audit = JSON.parse(await readFile(join(runDir, 'audit.json'), 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw new Error(`${join(runDir, 'audit.json')}: ${err.message}`);
  }
  const errors = [...validateRun(data, 'final'), ...validateFindings(findings, data.stories)];
  if (errors.length > 0) {
    console.error('report.md and page.html were not built:');
    for (const e of errors) console.error(`- ${e}`);
    process.exit(1);
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const template = await readFile(join(here, 'page-template.html'), 'utf8');
  const filterSource = await readFile(join(here, 'page-filter.mjs'), 'utf8');
  const md = join(runDir, 'report.md');
  const page = join(runDir, 'page.html');
  await writeFile(md, renderMarkdown(data.run, data.stories, findings, audit));
  await writeFile(page, renderPage(data.run, data.stories, findings, audit, template, filterSource));
  console.log(`wrote ${md} and ${page}`);
  for (const w of [...lintRun(data), ...lintAudit(audit)]) console.log(`LINT ${w}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(process.argv.slice(2));
}
