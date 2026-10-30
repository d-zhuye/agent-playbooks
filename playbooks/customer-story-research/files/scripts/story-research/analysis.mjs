#!/usr/bin/env node
// Merge the force raters' and fit scorers' batch files into stories.json, in two steps:
//
//   node scripts/story-research/analysis.mjs <run-dir>         forces only
//   node scripts/story-research/analysis.mjs <run-dir> --fit   forces and fit
//
// Reads forces/*.json ({ "s001": {forces, trigger, job} }) and, with --fit, fit/*.json
// ({ "s001": {parts, confidence} }), computing each fit's total and shown. Without --fit, fit
// stays out of stories.json even if its files exist, so the findings writer works before
// seeing anything drawn from the profile. It writes only when every retained story has what the
// step needs and the run passes its check; otherwise it lists the problems and exits 1, leaving
// stories.json as it was. LINT lines are warnings to fix in the batch files.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateRun, lintRun } from './stories.mjs';

export function mergeAnalysis(data, forcesFiles, fitFiles) {
  const out = structuredClone(data);
  const byId = new Map(out.stories.map((s) => [s.id, s]));
  const unknown = new Set();
  for (const file of forcesFiles) {
    for (const [id, a] of Object.entries(file)) {
      const s = byId.get(id);
      if (!s) { unknown.add(id); continue; }
      s.forces = a.forces;
      s.trigger = a.trigger ?? null;
      s.job = a.job ?? null;
    }
  }
  for (const file of fitFiles) {
    for (const [id, a] of Object.entries(file)) {
      const s = byId.get(id);
      if (!s) { unknown.add(id); continue; }
      const scores = (a.parts ?? []).map((p) => p?.score).filter((x) => typeof x === 'number');
      s.fit = {
        parts: a.parts,
        // A part the story doesn't show (null) adds nothing and isn't counted as shown.
        total: scores.reduce((sum, x) => sum + x, 0),
        shown: scores.length,
        confidence: a.confidence,
      };
    }
  }
  const retained = out.stories.filter((s) => !s.excess);
  const missing = {
    forces: retained.filter((s) => s.forces == null).map((s) => s.id),
    fit: retained.filter((s) => s.fit == null).map((s) => s.id),
  };
  return { data: out, missing, unknown: [...unknown] };
}

async function readBatches(dir) {
  let names = [];
  try {
    names = (await readdir(dir)).filter((n) => n.endsWith('.json')).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  } catch {
    return [];
  }
  const files = [];
  for (const n of names) {
    try {
      files.push(JSON.parse(await readFile(join(dir, n), 'utf8')));
    } catch (err) {
      throw new Error(`${join(dir, n)}: ${err.message}`);
    }
  }
  return files;
}

async function main(args) {
  const runDir = args.find((a) => !a.startsWith('--'));
  const withFit = args.includes('--fit');
  if (!runDir) {
    console.error('usage: node scripts/story-research/analysis.mjs <run-dir> [--fit]');
    process.exit(1);
  }
  const path = join(runDir, 'stories.json');
  const data = JSON.parse(await readFile(path, 'utf8'));
  const fitFiles = withFit ? await readBatches(join(runDir, 'fit')) : [];
  const { data: merged, missing, unknown } = mergeAnalysis(data, await readBatches(join(runDir, 'forces')), fitFiles);
  const needFit = withFit ? missing.fit : [];
  const problems = [
    ...missing.forces.map((id) => `${id}: no forces yet (forces/*.json)`),
    ...needFit.map((id) => `${id}: no fit yet (fit/*.json)`),
    ...unknown.map((id) => `${id}: not a story in stories.json`),
  ];
  // Rule out stories still waiting for a pass before validating, so each problem is listed once.
  const waiting = new Set([...missing.forces, ...needFit]);
  const errors = validateRun(merged, withFit ? 'final' : 'rated').filter((e) => !waiting.has(e.split(':')[0]));
  problems.push(...errors);
  if (problems.length > 0) {
    console.error('stories.json was not updated:');
    for (const p of problems) console.error(`- ${p}`);
    process.exit(1);
  }
  await writeFile(path, `${JSON.stringify(merged, null, 2)}\n`);
  const n = merged.stories.filter((s) => !s.excess).length;
  console.log(withFit ? `${n} stories analyzed, forces and fit; wrote ${path}` : `${n} stories analyzed, forces only (fit not merged); wrote ${path}`);
  for (const w of lintRun(merged)) console.log(`LINT ${w}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(process.argv.slice(2));
}
