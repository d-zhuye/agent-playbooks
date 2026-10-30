#!/usr/bin/env node
// Add one quote that the spot-check auditor found on a story's page but no finder quoted, without
// rebuilding stories.json (rerunning check.mjs after rating renumbers every quote):
//
//   node scripts/story-research/add-quote.mjs <run-dir> <story-id> <url> "<exact words>"
//
// The page must already be captured in pages/ (the auditor captures it with fetch-text.mjs). The
// quote is checked against that capture with the run's own matching, takes the story's next quote
// id and is marked "added": "audit", so the report can say where it came from. It prints the new
// id for the lead to cite in forces/ or fit/. Nothing is written if any check fails.
import { readFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { normalize, pageKey, quoteMatches, quoteProblem, validateRun } from './stories.mjs';

// readPage(url) returns the captured text or null. Returns the updated data and the new quote id.
export function addQuote(data, storyId, url, text, readPage) {
  const out = structuredClone(data);
  const story = out.stories.find((s) => s.id === storyId);
  if (!story) throw new Error(`${storyId} is not a story in this run`);
  if (story.excess) throw new Error(`${storyId} is an excess story, kept out of the report`);
  try {
    if (!['http:', 'https:'].includes(new URL(url).protocol)) throw new Error();
  } catch {
    throw new Error(`"${url}" is not a full URL (it needs https://)`);
  }
  const problem = quoteProblem(text);
  if (problem) throw new Error(`the quote ${problem}`);
  const page = readPage(url);
  if (page == null) throw new Error(`no capture of ${url}; capture it with fetch-text.mjs first`);
  if (!quoteMatches(text, page)) throw new Error(`not in the captured page: "${String(text).slice(0, 60)}"`);
  const same = story.quotes.find((q) => normalize(q.text) === normalize(text));
  if (same) throw new Error(`${storyId} already has this quote as ${same.id}`);
  const next = Math.max(0, ...story.quotes.map((q) => Number(q.id.slice(1)))) + 1;
  const id = `q${next}`;
  story.quotes.push({ id, text, url, check: 'checked', added: 'audit' });
  return { data: out, id };
}

async function main([runDir, storyId, url, text]) {
  if (!runDir || !storyId || !url || !text) {
    throw new Error('usage: node scripts/story-research/add-quote.mjs <run-dir> <story-id> <url> "<exact words>"');
  }
  const path = join(runDir, 'stories.json');
  const data = JSON.parse(await readFile(path, 'utf8'));
  const readPage = (u) => {
    try {
      return readFileSync(join(runDir, 'pages', `${pageKey(u)}.txt`), 'utf8');
    } catch {
      return null;
    }
  };
  const { data: updated, id } = addQuote(data, storyId, url, text, readPage);
  const errors = validateRun(updated, 'checked');
  if (errors.length > 0) throw new Error(`stories.json was not updated:\n- ${errors.join('\n- ')}`);
  await writeFile(path, `${JSON.stringify(updated, null, 2)}\n`);
  console.log(`${storyId}/${id} added. Cite ${id} in the story's forces/ or fit/ batch entry, then rerun analysis.mjs.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
