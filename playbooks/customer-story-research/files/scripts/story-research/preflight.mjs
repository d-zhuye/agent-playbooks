#!/usr/bin/env node
// Blindness check, run before every story-research run. The agents that plan, find and rate
// stories must never see the ideal-user profile, and subagents load the project's instruction
// files automatically. This fails if any of those files names the profile or repeats one of its
// fit criteria:
//
//   node scripts/story-research/preflight.mjs <profile-path> --brief <product-brief> [more files…]
//
// It reads CLAUDE.md, CLAUDE.local.md, .claude/CLAUDE.md and AGENTS.md in the current folder,
// CLAUDE.md, CLAUDE.local.md and AGENTS.md in every parent folder, ~/.claude/CLAUDE.md and
// ~/.codex/AGENTS.md, any files given after the profile path (an agent memory index, or the file
// the planning agent reads about the product), every file those import with @path, and every
// existing .md file they name in prose ("Read docs/design/design.md", looked for beside the naming
// file first), as deep as Claude Code follows imports. Prose mentions of the story-research skill
// are skipped: it names the profile for the lead, and agents read it only when told to run it. It
// also fails while the profile's fit criteria or its example story are unfilled. It can't see
// memory systems it isn't told about.
//
// Every file agents load (the instruction files, what they import, what they tell agents to read,
// and the product brief) gets a looser check too: it fails when any sentence holds most of a
// criterion's content words, which catches a criterion said in other words ("for people
// physically together" for "physically together as a group"). A file another document only
// mentions gets the exact checks. The product brief should say what the product does, not who
// it's for.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { normalize, FIT_PARTS } from './stories.mjs';

const PROJECT_FILES = ['CLAUDE.md', 'CLAUDE.local.md', '.claude/CLAUDE.md', 'AGENTS.md'];
const SKILL_DIR = '.claude/skills/story-research';
const MAX_DEPTH = 5;

// The profile's fit criteria: the numbered lines under "## Fit criteria", without markup. Lines
// still marked TODO aren't filled in.
function filledCriteria(profileText) {
  const start = profileText.indexOf('## Fit criteria');
  if (start === -1) return [];
  const rest = profileText.slice(start + 3);
  const end = rest.indexOf('\n## ');
  const section = end === -1 ? rest : rest.slice(0, end);
  return [...section.matchAll(/^\d+\.\s+(.+)$/gm)]
    .map((m) => normalize(m[1].replace(/[*_`]/g, '')).replace(/[.:;]+$/, '').trim())
    .filter((c) => !c.includes('todo('));
}

// @path imports: relative to the importing file, ~/ for home. An @ inside a word (an email
// address) is not an import.
function importsOf(text, fromFile) {
  return [...text.matchAll(/(?:^|\s)@((?:~\/|\/|\.{1,2}\/)?[\w.\-/]*\w)/g)].map((m) => {
    const p = m[1];
    if (p.startsWith('~/')) return join(homedir(), p.slice(2));
    return isAbsolute(p) ? p : resolve(dirname(fromFile), p);
  });
}

// .md files named in prose, resolved against the naming file's folder, then the project root;
// only files that exist count.
function namedFiles(text, fromFile, root) {
  const found = [];
  for (const m of text.matchAll(/(?:^|[\s`'"([])((?:~\/|\.{0,2}\/)?[\w.\-/]*\w\.md)(?![\w/])/g)) {
    const p = m[1];
    let candidates = [resolve(dirname(fromFile), p), resolve(root, p)];
    if (p.startsWith('~/')) candidates = [join(homedir(), p.slice(2))];
    else if (isAbsolute(p)) candidates = [p];
    const hit = candidates.find((c) => existsSync(c));
    if (hit) found.push(hit);
  }
  return found;
}

// Words that carry a criterion's meaning: no stopwords, and plain suffixes dropped so "games" and
// "game", "looking" and "look" compare equal.
const STOPWORDS = new Set(('a an the and or to of for with as in on at by from into they them their theyre who what which '
  + 'when where has have had is are was were be been being it its that this these those up do does did away toward towards '
  + 'something someone one there here not no very more most just only also than then so if but about over under out own '
  + 'same such can will would could should may might must i we you he she his her our your my me us').split(' '));
const stem = (w) => (w.length > 4 ? w.replace(/(ing|ed|s)$/, '') : w);
const contentWords = (text) => normalize(text).split(' ').map((w) => stem(w.replace(/[^\p{L}\p{N}]/gu, '')))
  .filter((w) => w && !STOPWORDS.has(w));

// Criteria a brief restates: some sentence holds two thirds of a criterion's content words, and at
// least two of them.
export function briefEchoes(briefText, criteria) {
  const sentences = briefText.split(/[.!?;:\n]+/).map((s) => new Set(contentWords(s)));
  return criteria.filter((c) => {
    const words = [...new Set(contentWords(c))];
    if (words.length < 2) return false;
    const need = Math.max(2, Math.ceil((2 * words.length) / 3));
    return sentences.some((set) => words.filter((w) => set.has(w)).length >= need);
  });
}

// The text under "## Example story", or '' when the section is missing or still a TODO.
function exampleStory(profileText) {
  const start = profileText.indexOf('## Example story');
  if (start === -1) return '';
  const rest = profileText.slice(start + 3);
  const end = rest.indexOf('\n## ');
  const section = (end === -1 ? rest : rest.slice(0, end)).replace(/^.*\n/, '').trim();
  return section.includes('TODO(') ? '' : section;
}

// Instruction files agents load from the folders above the project.
function parentFiles(root) {
  const files = [];
  for (let dir = dirname(resolve(root)); ; dir = dirname(dir)) {
    files.push(...['CLAUDE.md', 'CLAUDE.local.md', 'AGENTS.md'].map((f) => join(dir, f)));
    if (dirname(dir) === dir) return files;
  }
}

export function preflight(root, profilePath, extraFiles = [], { brief } = {}) {
  if (!existsSync(profilePath)) return [`${profilePath}: profile not found; fill it in before a run`];
  const profileText = readFileSync(profilePath, 'utf8');
  const filled = filledCriteria(profileText);
  if (filled.length < FIT_PARTS) {
    return [`${profilePath}: the fit criteria aren't filled in yet (${filled.length} of ${FIT_PARTS}); a human fills them before a run`];
  }
  if (!exampleStory(profileText)) {
    return [`${profilePath}: the example story isn't filled in; a human writes one short made-up story, scored, so the scorers calibrate`];
  }
  // Criteria shorter than three words would match too much ordinary text.
  const lines = filled.filter((c) => c.split(' ').length >= 3);
  const name = normalize(basename(profilePath).replace(/\.md$/i, ''));
  const skillDir = resolve(root, SKILL_DIR) + sep;
  const problems = [];
  const seen = new Set([resolve(profilePath)]);
  const label = (file) => {
    const r = relative(root, file);
    return r.startsWith('..') || isAbsolute(r) ? file : r;
  };

  if (brief) {
    if (!existsSync(brief)) {
      problems.push(`${label(resolve(brief))}: product brief not found; write it before a run`);
    } else {
      for (const c of briefEchoes(readFileSync(brief, 'utf8'), filled)) {
        problems.push(`${label(resolve(brief))}: the product brief echoes fit criterion "${c}"; say what the product does, not who it's for`);
      }
    }
  }

  // Breadth first, so a file loaded at the top level is reported under its own name.
  const queue = [...PROJECT_FILES.map((f) => join(root, f)), ...parentFiles(root), ...(brief ? [brief] : []), ...extraFiles]
    .map((file) => ({ file, via: null, how: '', depth: 0, loaded: true }));
  while (queue.length > 0) {
    const { file, via, how, depth, loaded } = queue.shift();
    const abs = resolve(file);
    if (seen.has(abs) || !existsSync(abs) || !statSync(abs).isFile()) continue;
    seen.add(abs);
    const text = readFileSync(abs, 'utf8');
    const flat = normalize(text);
    const where = via ? `${label(abs)} (${how} ${label(via)})` : label(abs);
    const hit = lines.find((c) => flat.includes(c));
    // The brief's own echo check ran above, with its own advice.
    const echo = !loaded || (brief && abs === resolve(brief)) ? undefined : briefEchoes(text, filled)[0];
    if (flat.includes(name)) problems.push(`${where}: names the profile (${name})`);
    else if (hit) problems.push(`${where}: repeats fit criterion "${hit}"`);
    else if (echo) problems.push(`${where}: echoes fit criterion "${echo}" in other words`);
    if (depth >= MAX_DEPTH) continue;
    // Imports load with their file; a file named in prose loads only when an instruction file
    // (depth 0) tells agents to read it.
    for (const next of importsOf(text, abs)) queue.push({ file: next, via: abs, how: 'imported by', depth: depth + 1, loaded });
    for (const next of namedFiles(text, abs, root)) {
      if (!resolve(next).startsWith(skillDir)) {
        queue.push({ file: next, via: abs, how: 'named in', depth: depth + 1, loaded: loaded && depth === 0 });
      }
    }
  }
  return problems;
}

function main(args) {
  const briefAt = args.indexOf('--brief');
  const brief = briefAt === -1 ? null : args[briefAt + 1];
  const [profile, ...more] = briefAt === -1 ? args : args.filter((a, i) => i !== briefAt && i !== briefAt + 1);
  if (!profile || (briefAt !== -1 && !brief)) {
    console.error('usage: node scripts/story-research/preflight.mjs <profile-path> --brief <product-brief> [more files…]');
    process.exit(1);
  }
  const userFiles = [join(homedir(), '.claude', 'CLAUDE.md'), join(homedir(), '.codex', 'AGENTS.md')];
  const problems = preflight(process.cwd(), resolve(profile), [...userFiles, ...more.map((m) => resolve(m))],
    { brief: brief ? resolve(brief) : undefined });
  if (problems.length > 0) {
    console.error('Preflight failed:');
    for (const p of problems) console.error(`- ${p}`);
    console.error('The agents that plan, find and rate stories load these files, so they must stay clear of the profile. Fix each line, then run again.');
    console.error('Where a file and a criterion share only the product\'s own words, reword the criterion as the person\'s situation.');
    process.exit(1);
  }
  console.log('Preflight passed: no file the blind agents load names the profile or repeats its criteria.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
