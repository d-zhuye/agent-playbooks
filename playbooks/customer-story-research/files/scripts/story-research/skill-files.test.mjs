import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalize } from './stories.mjs';

// The skill's files live at their installed paths, relative to the project root.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SKILL = '.claude/skills/story-research';
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
// The profile's template guidance, while it is still a template: a human may delete the guidance
// when filling it in.
const PROFILE = 'docs/research/stories/ideal-user.md';
const profileTemplate = () => (read(PROFILE).includes('TODO(project):') ? normalize(read(PROFILE)) : null);
const BLIND_BRIEFS = ['plan-brief.md', 'finder-brief.md', 'forces-brief.md', 'findings-brief.md'];
const ALL_BRIEFS = [...BLIND_BRIEFS, 'fit-brief.md', 'audit-brief.md'];
const ACCESS_RULES = 'public pages only, one page at a time, no bulk scraping. Allowed: the agent\'s own web search and page '
  + 'reading; fetching a single public page\'s raw text directly; feeds or APIs a site publishes for public reading. Not '
  + 'allowed: logins or signed-in browsers, closed groups, disguising requests, solving captchas, archive copies used to get '
  + 'round a block, undocumented endpoints. A refusal is logged and the finder moves on.';

test('plan, finder, forces and findings briefs never name the profile', () => {
  for (const name of BLIND_BRIEFS) {
    assert.ok(!/ideal.?user/i.test(read(`${SKILL}/${name}`)), name);
  }
});

test('the blind briefs each list their allowed inputs and say not to work from who the product is for', () => {
  for (const name of BLIND_BRIEFS) {
    const text = read(`${SKILL}/${name}`);
    assert.ok(text.startsWith('You may read:'), name);
    assert.ok(text.includes('Read nothing else'), name);
    assert.ok(normalize(text).includes('who the product is for'), name);
  }
});

test('every brief starts with its inputs and ends with its output format', () => {
  for (const name of ALL_BRIEFS) {
    const text = read(`${SKILL}/${name}`);
    assert.ok(text.startsWith('You may read:'), name);
    const headings = text.match(/^## .+$/gm) ?? [];
    assert.equal(headings.at(-1), '## Output', name);
  }
});

test('the plan brief states the platform cap rounded up, with an example', () => {
  // A trial planner read "a fifth of 8" as 1 per platform; the cap is 2.
  const text = normalize(read(`${SKILL}/plan-brief.md`));
  assert.ok(text.includes('rounded up'), 'rounded up');
  assert.ok(text.includes('2 of 8'), '2 of 8');
});

// Lessons from the first trial run.
test('finders record the author\'s name, and briefs whose agents write about people forbid gender guesses', () => {
  // The owner's call: keep the name the page shows, so a human can find a post again.
  const finder = normalize(read(`${SKILL}/finder-brief.md`));
  assert.ok(finder.includes('"author"') && finder.includes('copied exactly'), 'author');
  for (const name of ['finder-brief.md', 'forces-brief.md', 'fit-brief.md', 'audit-brief.md', 'findings-brief.md']) {
    assert.ok(!normalize(read(`${SKILL}/${name}`)).includes('never write a username'), `${name}: names allowed`);
  }
  // The trial's force rater guessed genders the stories never gave; finders did too, in situations.
  for (const name of ['finder-brief.md', 'forces-brief.md', 'fit-brief.md', 'audit-brief.md', 'findings-brief.md']) {
    assert.ok(normalize(read(`${SKILL}/${name}`)).includes('never guess'), `${name}: gender`);
  }
});

test('thin confidence has a concrete threshold wherever it is defined', () => {
  // The trial's fit scorer called an 85-word review solid.
  assert.ok(normalize(read(`${SKILL}/fit-brief.md`)).includes('under 150 words'), 'fit brief');
  assert.ok(profileTemplate()?.includes('under 150 words') ?? true, 'profile template');
});

test('the finder brief asks for short situation labels and keeps stories told by children', () => {
  const text = normalize(read(`${SKILL}/finder-brief.md`));
  assert.ok(text.includes('short label'), 'short situation labels');
  // The owner's call: children's stories can give insight, so they count like any other.
  assert.ok(!text.includes('leave out stories whose writer'), 'children are not excluded');
});

test('fit scores need evidence for every part of an anchor', () => {
  // The trial's scorer gave "talks and avoids screens" a 2 to stories that never mention screens.
  assert.ok(normalize(read(`${SKILL}/fit-brief.md`)).includes('silence is not evidence'), 'fit brief');
  assert.ok(profileTemplate()?.includes('one thing a story can show') ?? true, 'profile template');
});

test('finders gather what people think of the alternatives they rejected', () => {
  // A trial finder skipped an author's worries about screens, so no force could cite them.
  assert.ok(normalize(read(`${SKILL}/finder-brief.md`)).includes("alternatives they didn't choose"));
});

// Lessons from the final review.
test('a fresh planning agent writes the second wave, not the lead', () => {
  const skill = normalize(read(`${SKILL}/SKILL.md`));
  assert.ok(skill.includes('second wave') && skill.includes('fresh planning agent'), 'SKILL.md');
  assert.ok(!skill.includes('add slices'), 'the lead no longer writes slices');
  assert.ok(normalize(read(`${SKILL}/plan-brief.md`)).includes('## second wave'), 'plan brief');
});

test('preflight is given the neutral product brief the planner reads', () => {
  assert.ok(normalize(read(`${SKILL}/SKILL.md`)).includes('preflight.mjs <profile path> --brief docs/research/stories/product-brief.md'));
  assert.ok(normalize(read(`${SKILL}/plan-brief.md`)).includes('product-brief.md'), 'the planner reads the brief');
});

test('the product brief template says what to leave out', (t) => {
  // Both trial runs: once setup fills the template, this test has nothing left to check.
  const brief = read('docs/research/stories/product-brief.md');
  if (!brief.includes('TODO(project):')) return t.skip('product brief filled in');
  assert.ok(normalize(brief).includes("not who it's for"), 'says what to leave out');
});

// Efficiency changes after the trial (owner-approved items 1-3, 5-9).
test('finders carry about 5 stories each, and more of them run', () => {
  const skill = normalize(read(`${SKILL}/SKILL.md`));
  assert.ok(skill.includes('one finder per 5 stories gathered'), 'budget');
  assert.ok(skill.includes('stop at about 5 stories'), 'finder prompt');
  assert.ok(normalize(read(`${SKILL}/plan-brief.md`)).includes('one slice per 5 stories'), 'planner cuts small slices');
});

test('finders stop a dry situation, skip known refusals and check their own file in one command', () => {
  const finder = normalize(read(`${SKILL}/finder-brief.md`));
  assert.ok(finder.includes('after about 5 searches'), 'stop rule');
  assert.ok(read(`${SKILL}/finder-brief.md`).split('\n\n')[1].includes('sources-log.md'), 'reads the sources log');
  assert.ok(finder.includes('check.mjs --local'), 'one offline check');
  assert.ok(!finder.includes('write your own check') || finder.includes("don't write your own check"), 'no ad-hoc checks');
  assert.match(read('docs/research/stories/sources-log.md'), /^\| reddit\.com \|/m);
});

test('force raters work from the digest and open pages only when needed', () => {
  const inputs = read(`${SKILL}/forces-brief.md`).split('\n\n').slice(0, 3).join('\n');
  assert.ok(inputs.includes('digest.mjs'), inputs);
  assert.ok(normalize(inputs).includes('only when'), inputs);
});

test('SKILL.md uses the digest, not one-liners, and handles LINT lines', () => {
  const skill = read(`${SKILL}/SKILL.md`);
  assert.ok(!skill.includes('node -e'), 'no one-liners');
  assert.ok(skill.includes('digest.mjs <run folder> --ids') && skill.includes('digest.mjs <run folder> --pick`'));
  assert.ok(skill.includes('LINT'), 'LINT lines');
});

// The owner's call: the profile is read only after the findings are written. Both trial leads had
// filled in the profile themselves, so the findings now go to a fresh agent.
test('a fresh findings writer writes the findings before the profile is opened, during the audit', () => {
  const skill = read(`${SKILL}/SKILL.md`);
  const flat = normalize(skill);
  const blind = skill.indexOf('**Findings, before the profile.**');
  const writer = skill.indexOf('findings-brief.md');
  const fitMerge = skill.indexOf('analysis.mjs <run folder> --fit');
  const compare = skill.indexOf('**Compare with the profile.**');
  const opens = skill.indexOf('Now open the profile');
  assert.ok(blind > 0 && writer > blind && compare > writer && fitMerge > compare && opens > fitMerge,
    `${blind} ${writer} ${compare} ${fitMerge} ${opens}`);
  assert.ok(flat.includes('at the same time, dispatch a fresh findings writer'), 'overlaps the audit');
  assert.ok(flat.includes('findings-before-compare.json'), 'keeps a snapshot');
  assert.ok(flat.includes('writtenbeforeprofile'), 'records it');
  const brief = normalize(read(`${SKILL}/findings-brief.md`));
  assert.ok(brief.includes('--check-findings'), 'the writer checks its file');
  assert.ok(brief.includes('"fitparts": []'), 'leaves fitParts empty');
  assert.ok(normalize(read(`${SKILL}/audit-brief.md`)).includes('fit/'), 'the auditor reads fit from the batch files');
});

test('the sources log groups personal blogs, says what a venue yields, and never carries fit', () => {
  // The Codex trial numbered personal blogs one by one, and every row said "All retained quotes rechecked".
  for (const path of [`${SKILL}/SKILL.md`, 'docs/research/stories/sources-log.md']) {
    const text = normalize(read(path));
    assert.ok(text.includes('"personal blogs" row'), `${path}: personal blogs`);
    assert.ok(text.includes('all retained quotes rechecked'), `${path}: a bad row, by example`);
    assert.ok(text.includes('never fit'), `${path}: no fit`);
  }
});

test('finders may read the solution words', () => {
  const inputs = read(`${SKILL}/finder-brief.md`).split('\n\n')[1];
  assert.ok(inputs.includes('run.json'), inputs);
});

test('SKILL.md makes audit fixes in the batch files and never reruns the check after rating', () => {
  const text = normalize(read(`${SKILL}/SKILL.md`));
  assert.ok(text.includes('in the batch files'), 'batch files');
  assert.ok(text.includes('never rerun check.mjs'), 'no check rerun');
});

test('SKILL.md front matter names story-research and has a description', () => {
  const m = /^---\nname: (.+)\ndescription: (.+)\n---\n/.exec(read(`${SKILL}/SKILL.md`));
  assert.ok(m, 'front matter');
  assert.equal(m[1], 'story-research');
  assert.equal(m[2], 'Use when asked to research customers or users, jobs to be done, why people would or wouldn\'t '
    + 'switch to this product, or who to aim it at, from stories people share online.');
});

test('every script command in SKILL.md names a file that exists', () => {
  const texts = ['SKILL.md', ...ALL_BRIEFS].map((n) => read(`${SKILL}/${n}`)).join('\n');
  const scripts = [...texts.matchAll(/node scripts\/story-research\/(\S+?\.mjs)/g)].map((m) => m[1]);
  for (const s of ['preflight.mjs', 'check.mjs', 'analysis.mjs', 'build-report.mjs', 'fetch-text.mjs', 'digest.mjs', 'add-quote.mjs']) {
    assert.ok(scripts.includes(s), `${s} is never run`);
  }
  for (const s of scripts) assert.ok(existsSync(join(ROOT, 'scripts/story-research', s)), s);
  for (const n of ALL_BRIEFS) assert.ok(read(`${SKILL}/SKILL.md`).includes(n), `SKILL.md never names ${n}`);
});

test('SKILL.md and the finder brief carry the access rules verbatim', () => {
  for (const name of ['SKILL.md', 'finder-brief.md']) {
    assert.ok(normalize(read(`${SKILL}/${name}`)).includes(normalize(ACCESS_RULES)), name);
  }
});

test('ideal-user template has five criteria, each with 0, 1 and 2 anchors and the not-shown rule', (t) => {
  const text = read('docs/research/stories/ideal-user.md');
  assert.ok(text.includes('A human edits this file'));
  const section = text.slice(text.indexOf('## Fit criteria'));
  const end = section.indexOf('\n## ', 4);
  const criteria = (end === -1 ? section : section.slice(0, end)).split(/\n(?=\d+\. )/).slice(1);
  assert.equal(criteria.length, 5);
  for (const c of criteria) for (const score of ['0', '1', '2']) assert.match(c, new RegExp(`^\\s+- ${score}: `, 'm'), c);
  // Both trial runs: once setup fills the template, its guidance and TODOs are gone.
  if (!criteria.every((c) => c.includes('TODO(project):'))) return t.skip('profile filled in');
  assert.ok(normalize(section).includes('not shown'));
  // The trial profiles scored resemblance, not need; Codex's attitude anchors needed 19 corrections.
  assert.ok(normalize(section).includes('one criterion measures need'), 'a need criterion');
  assert.ok(normalize(section).includes('not an attitude or a degree'), 'anchors are events');
  assert.ok(normalize(text).includes('floor of age or ability'), 'who is too young or unable');
  assert.ok(normalize(text).includes('preflight fails until'), 'the example story is required');
});

test('the plan brief keeps every story type and asks each slice for reviews of something paid', () => {
  // The Codex trial's planner told finders to treat asking threads as leads: 1 plea, 2 reviews,
  // and almost no evidence on what makes people hesitate to pay.
  const plan = normalize(read(`${SKILL}/plan-brief.md`));
  assert.ok(plan.includes('keep every story type'), 'every type');
  assert.ok(plan.includes('never tell finders to skip a type'), 'no filtering');
  assert.ok(plan.includes('reviews of something paid'), 'paid reviews per slice');
});

test('finders note quotes about another moment, record a word count and keep notes apart from situations', () => {
  const finder = normalize(read(`${SKILL}/finder-brief.md`));
  assert.ok(finder.includes('gets a `note` when it is about a different moment'), 'quote note');
  assert.ok(finder.includes('"words"'), 'word count');
  assert.ok(finder.includes('`newsituations` holds situations only'), 'notes apart');
  assert.ok(!/\b30 words\b/.test(finder), 'no quote length cap: the owner wants the nuance');
  for (const name of ['forces-brief.md', 'fit-brief.md']) {
    assert.ok(normalize(read(`${SKILL}/${name}`)).includes('a quote with a note'), `${name}: reads notes`);
  }
});

test('the audit scales with the run, can add a quote, and patterns get a fresh review', () => {
  const skill = normalize(read(`${SKILL}/SKILL.md`));
  assert.ok(skill.includes('5 stories or a tenth of the counted stories'), 'budget');
  assert.ok(skill.includes('add-quote.mjs <run folder> <story id> <url>'), 'add a quote');
  assert.ok(skill.includes('review that one rule across every batch'), 'fresh review of a pattern');
  assert.ok(skill.includes('never send the review back to the agents that made the mistake'));
  assert.ok(normalize(read(`${SKILL}/audit-brief.md`)).includes('addquotes'), 'auditor lists passages');
});

test('SKILL.md locks the run folder, needs no wave for CAPPED alone, and keeps pages', () => {
  // The Claude trial ran two leads in one folder; CAPPED forced a wave above target.
  const skill = normalize(read(`${SKILL}/SKILL.md`));
  assert.ok(skill.includes('`lead` file') && skill.includes('another lead may be running'), 'lock');
  assert.ok(skill.includes('`capped` alone needs no wave'), 'CAPPED');
  assert.ok(skill.includes('keep `pages/`'), 'pages kept for tracing a story');
  assert.ok(skill.includes('record who said it'), 'authors kept');
});

test('the sources log is a table ready for its first rows', () => {
  assert.match(read('docs/research/stories/sources-log.md'), /^\| Platform \|/m);
});
