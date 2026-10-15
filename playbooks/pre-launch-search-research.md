# Pre-launch search research (ASO and SEO)

A one-off, on-demand audit an agent runs before an app launches. It collects free search
signals (Google, App Store and Google Play autocomplete, plus App Store competition), groups queries
by what people want, and writes proposed listing text for the App Store, Google Play and the
project's web pages. Agents propose; a human pastes. Built for mobile apps with a small website;
the scripts are Node, the method applies to any stack.

**Adopt it when** a listing or landing page is about to be written or submitted and nobody has
checked how people actually search for what the product does. After launch, first-party data
(App Store Connect, Play Console, Search Console) beats everything here; that needs a separate
playbook.

---

## 1. Why use it

Without it, store keywords and page titles come from the team's own words for the product, which
are rarely the words searchers type. An agent asked to "do ASO" guesses, or quotes generic advice,
and there is no record of why a word was chosen, so nobody can judge it after launch.

With it, every proposed word traces to a row in `queries.csv` with its sources, every rejected
word that the data favored is listed for a human, and the post-launch playbook has a baseline.

Figures come from **one project** (the first run, a party-games app with 114 input queries),
so treat them as rough:

| Step | Computer | Agent | Human |
|---|---|---|---|
| Collection (three passes, 114 input queries, ~1,600 requests) | ~8.5 min in all | 10–15 min | 0 |
| Looking at web results and competitor pages | 0 | ~5 min | 0 |
| Optional account-gated signals | 0 | 2 min | ~10 min |
| Analysis, report and proposals | 0 | 15–25 min | 0 |
| Reviewing the proposals and conflicts | 0 | 0 | 15–30 min |

The first run took about 35 minutes of agent time end to end, including fixing the script's
demand measure; the fixes are already in the starter code. Agent tokens: roughly 150k–250k,
about half of it reading collector output and web results (estimated, not measured).
TODO(review): replace with figures from notes.

**Who does what**

- **Scripts:** `collect.mjs` queries the free sources at a safe rate, merges results and computes
  demand and difficulty tiers by fixed rules. `report.mjs` ranks the targets, groups singular and
  plural forms, lists blocked queries and measures how well the tiers agree with human data.
- **Agent:** writes seeds, picks which suggestions to follow, shortens web queries to store-style
  forms, judges fit, reads competitors, writes the report and proposals.
- **Human:** decides conflicts and open questions; optionally reads two account-gated tools for a
  shortlist; pastes approved text into the stores and site.

---

## 2. How it works

### Terms

- **Surface:** one place people search: the App Store, Google Play, or the web.
- **Listing:** every searchable field a surface has for the product (App Store name, subtitle,
  keywords; Play title, short and full description; a web page's title, meta description, H1).
- **Seed:** a query the agent starts from, before any data.
- **Query:** what a person types into a surface's search box. One row in `queries.csv`.
- **Store-style form:** a web query cut down to what people type in a store ("games to play while
  waiting in line" → "waiting in line games"). It counts for ASO only if a store's autocomplete
  shows it.
- **Typed share:** the least of a query, in percent, someone had to type before a source
  suggested it. 19 means it was suggested after typing 19% of it. Lower means more searched.
- **Keyword:** a word or phrase placed in a listing field. Queries are the demand; keywords are
  the supply.
- **Intent cluster:** queries that want the same thing, grouped by what defines them: a place or
  situation, a group, a feature or game name, or a constraint ("offline", "no wifi").
- **Demand tier:** High, Medium, Low or None, per surface, computed by the script. A trailing
  `?` means only autocomplete backs it (unconfirmed).
- **Difficulty tier:** Low, Medium or High: how hard it is to rank, from competitors' strength.
- **Fit:** whether a query suits the product. Blank means it does; `other-meaning`, `blocked`,
  `untrue` and `weak` keep it out of targets.
- **Proposal:** a proposed value for one listing field, with the current value, the queries it
  targets and the post-launch metric it should move.
- **Conflict:** a query the data favors that a project copy rule blocks. Listed for a human,
  never placed in a proposal.

### The run

```
1. Seeds         agent writes docs/aso/<date>/seeds.txt under "# cluster:" headings
2. Collect       node scripts/search-research/collect.mjs seeds.txt queries.csv
                   └ per query: Google, App Store and Play autocomplete, typed the way a person
                     types it ("ro", "road", "road tr", … "road trip games"), and the App Store
                     top 10 via the iTunes Search API → typed shares, and new rows for suggestions
3. Expand        agent adds suggestions, competitors' generic terms and store-style forms to
                   seeds.txt and runs again (1–2 more passes; finished queries are skipped)
4. Judge fit     agent marks queries that mean something else, are blocked or untrue
5. Look around   web search for the top web targets; competitor store pages; Play install bands
6. Analyze       node scripts/search-research/report.mjs queries.csv → ranked tables → report.md
7. Propose       proposals.md: each field, current vs proposed, with limits, metrics, conflicts
8. Check         every number in report.md and proposals.md against the data
9. Hand back     summary + human decisions + shortlist.txt
10. Human step   optional, after hand-back: Keyword Planner ranges and Apple Ads popularity for
                   the shortlist → re-run both scripts → update proposals, note the calibration
```

Output, one folder per audit so a later audit can be compared:

| File | What it holds |
|---|---|
| `docs/aso/<date>/seeds.txt` | Every input query, grouped by cluster in comments |
| `docs/aso/<date>/queries.csv` | One row per query: sources, tiers, cluster, store-style form |
| `docs/aso/<date>/report.md` | Clusters, competition, targets, and what was left out |
| `docs/aso/<date>/proposals.md` | Proposed listing per surface, Conflicts and Human decisions |
| `docs/aso/<date>/shortlist.txt` | Queries for the optional human step |
| `docs/aso/<date>/run-log.md` | Steps, problems and fixes; only until the notes list three projects |

### Sources (free only)

| Source | Signal | Access |
|---|---|---|
| Google autocomplete | How much of a query must be typed before it's suggested | Public, unofficial; script, 1/s |
| App Store search hints | Same, inside the App Store | Public, unofficial; script, 1/s |
| Google Play search suggest | Same, inside Play | Public, unofficial; script, 1/s |
| iTunes Search API | Top 10 App Store apps and their rating counts | Official; ~20 calls/min, script 1 per 3.5 s |
| Agent's web-search tool | Who ranks on the web for a query | One look per query, by hand |
| Store pages | Competitors' subtitles, Play install bands | Fetched one at a time, by hand |
| Google Ads Keyword Planner | Monthly volume ranges (e.g. 1K–10K) | Human, free account, no spend |
| Apple Ads keyword popularity | 1–5 popularity per keyword | Human, free account |

Not allowed: bulk scraping of search results pages, logging into anyone's account, paid APIs or
paid tools. Google Trends is fine for a human to glance at, but has no field in the CSV.

### Rules the script applies

- **Typed share:** each query is looked up as each word's first two letters, half of any word of
  six letters or more, then the whole word. A suggestion counts only if it starts with what was
  typed. The column keeps the lowest share across all lookups; blank means never suggested.
- **Demand from autocomplete:** typed share up to 40 High, up to 70 Medium, above 70 Low, blank
  None, marked `?`.
- **Demand from humans, which wins when present:** Keyword Planner lower bound ≥10K High,
  ≥1K Medium, ≥100 Low, below None (web). Apple Ads popularity 4–5 High, 3 Medium, 1–2 Low
  (App Store). Play has no free human source, so Play demand is always `?`.
- **Difficulty (App Store):** median rating count of the top 10 results: under 1,000 Low,
  1,000–50,000 Medium, over 50,000 High. These thresholds are untuned guesses; notes should
  tune them.

---

## 3. Setup checklist

1. **Node 18 or later** (for built-in `fetch`). No packages.
2. **Copy the three scripts** to `scripts/search-research/` (section 4). Add the project's
   storefronts to `STOREFRONTS` in `collect.mjs` if it targets more than the ones listed.
3. **Copy the skill** to `.claude/skills/search-research/SKILL.md` and fill its
   `TODO(project):` lines: where the product is described, the current listing and the reasons
   given for it, the copy rules, the surfaces in scope, the country and language.
4. **Paste the agent rule** into `AGENTS.md` (section 5).
5. **Link it from where listing text is prepared.** Add a line to the project's listing doc or
   its pre-submission checklist: "Keywords, titles and descriptions come from the latest
   `docs/aso/<date>/proposals.md`; run the search-research skill if there is none." The skill's
   trigger fires only when someone asks about ASO; this line fires every time the listing is
   edited.
6. **Commit `docs/aso/`.** The audit folder is small text and is the record the post-launch
   playbook builds on. Nothing goes in `.gitignore`.

---

## 4. Starter code

Three scripts in `scripts/search-research/`, and the skill. `shared.mjs` holds the CSV format, the
column lists and every threshold, so the two scripts always score the same way.

### `scripts/search-research/shared.mjs`

```js
// Shared by collect.mjs and report.mjs: the CSV format, the column lists and every threshold, so
// both scripts score queries the same way. Node 18+, no dependencies.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

// Bump when a change alters what the source columns or tiers mean. collect.mjs refuses to merge
// into a queries.csv made by another version, because old and new values can't be compared.
export const SCRIPT_VERSION = '2';

export const SCRIPT_COLUMNS = ['query', 'parent', 'looked_up', 'script', 'google', 'appstore', 'play', 'as_top10_median_ratings', 'as_top3', 'difficulty', 'web_demand', 'appstore_demand', 'play_demand'];
// Human columns: kp_range, ads_popularity. Agent columns: cluster, fit, store_form, notes.
export const OTHER_COLUMNS = ['kp_range', 'ads_popularity', 'cluster', 'fit', 'store_form', 'notes'];
// Blank fit means the query fits the product. Anything else keeps it out of targets.
export const FIT_VALUES = ['', 'yes', 'other-meaning', 'blocked', 'untrue', 'weak'];

// Untuned starting thresholds, from one project. Tune them from the calibration that
// report.mjs prints once humans have filled kp_range or ads_popularity.
export const DIFFICULTY = { low: 1_000, high: 50_000 }; // median App Store rating count of the top 10
export const tierFromShare = (share) =>
  share === '' || share == null ? 'None' : Number(share) <= 40 ? 'High' : Number(share) <= 70 ? 'Medium' : 'Low';
export const tierFromPlanner = (range) => {
  // Keyword Planner buckets such as "1K – 10K" or "100 – 1K": the lower bound decides.
  const m = String(range ?? '').trim().match(/^([\d.,]+)\s*([KM]?)/i);
  if (!m) return null;
  const low = parseFloat(m[1].replace(/,/g, '')) * ({ k: 1e3, m: 1e6 }[m[2].toLowerCase()] ?? 1);
  return low >= 10_000 ? 'High' : low >= 1_000 ? 'Medium' : low >= 100 ? 'Low' : 'None';
};
export const tierFromAds = (dots) => {
  // Apple Ads search popularity, 1 to 5.
  const n = Number(dots);
  if (!n) return null;
  return n >= 4 ? 'High' : n === 3 ? 'Medium' : 'Low';
};
export const difficultyFromMedian = (median) =>
  median < DIFFICULTY.low ? 'Low' : median <= DIFFICULTY.high ? 'Medium' : 'High';

export const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();

export function readCsv(path) {
  if (!existsSync(path)) return { header: [], records: [] };
  const text = readFileSync(path, 'utf8');
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header = [], ...body] = rows.filter((r) => r.some((f) => f !== ''));
  return { header, records: body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? '']))) };
}

export function writeCsv(path, existingHeader, records) {
  const header = [...new Set([...SCRIPT_COLUMNS, ...OTHER_COLUMNS, ...existingHeader])];
  const field = (v) => (/[",\n\r]/.test(String(v ?? '')) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ''));
  const sorted = [...records].sort((a, b) => a.query.localeCompare(b.query));
  writeFileSync(path, [header, ...sorted.map((r) => header.map((h) => r[h] ?? ''))].map((f) => f.map(field).join(',')).join('\n') + '\n');
}

// seeds.txt: one query per line. A "# cluster: <name>" line names the cluster for the lines under
// it; anything after " - ", " — " or " (" is a description ("# cluster: place - road trips").
// Other comments, and text after a mid-line "#", are ignored.
export function readSeeds(path) {
  const seeds = new Map();
  let cluster = '';
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (t.startsWith('#')) {
      const m = t.match(/^#\s*cluster:\s*(.+)$/i);
      if (m) cluster = norm(m[1].split(/\s[-—(]/)[0]);
      continue;
    }
    const q = norm(t.replace(/#.*/, ''));
    if (q && !seeds.has(q)) seeds.set(q, cluster);
  }
  return seeds; // query → cluster
}
```

### `scripts/search-research/collect.mjs`

```js
#!/usr/bin/env node
// Collects free search signals for a list of queries and merges them into queries.csv.
//
//   node scripts/search-research/collect.mjs <seeds.txt> <queries.csv> [--country us] [--lang en]
//
// For each query in seeds.txt it reads Google, App Store and Google Play autocomplete as the
// query is typed ("ro", "road", "road tr", "road trip", "road trip ga", "road trip gam",
// "road trip games") and the top 10 App Store results from the iTunes Search API. Each source's
// column holds the typed share: the least of a query, in percent, that had to be typed before
// that source suggested it. Lower means more searched. Suggestions become new rows, so the next
// run can take the promising ones as input.
//
// A query is marked looked_up only when every source answered, so running again retries just the
// failures; finished queries are never looked up twice. To measure again later, start a new audit
// folder: values from different days or script versions don't belong in one file.
//
// Columns this script owns are rewritten on every run. Human columns (kp_range, ads_popularity)
// and agent columns (cluster, fit, store_form, notes) are kept, except that a blank cluster is
// filled from the seeds file's "# cluster:" headings. Node 18+, no dependencies.

import {
  SCRIPT_VERSION, difficultyFromMedian, norm, readCsv, readSeeds, tierFromAds, tierFromPlanner,
  tierFromShare, writeCsv,
} from './shared.mjs';

const positional = [];
const opts = { country: 'us', lang: 'en' };
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--country' || a === '--lang') opts[a.slice(2)] = String(process.argv[++i]).toLowerCase();
  else positional.push(a);
}
const [seedsPath, csvPath] = positional;
if (!seedsPath || !csvPath) {
  console.error('Usage: collect.mjs <seeds.txt> <queries.csv> [--country us] [--lang en]');
  process.exit(2);
}
const { country, lang } = opts;

// App Store storefront IDs for the hints endpoint. TODO(project): add your storefronts.
const STOREFRONTS = { us: 143441, gb: 143444, ca: 143455, au: 143460, ie: 143449, nz: 143461 };
if (!STOREFRONTS[country]) {
  console.error(`No App Store storefront ID for "${country}". Add it to STOREFRONTS.`);
  process.exit(2);
}

const existing = readCsv(csvPath);
const versions = new Set(existing.records.filter((r) => r.looked_up).map((r) => r.script || '1'));
if (versions.size && !(versions.size === 1 && versions.has(SCRIPT_VERSION))) {
  console.error(`${csvPath} was made by script version ${[...versions].join(', ')}; this is version ${SCRIPT_VERSION}.`);
  console.error('Their values mean different things. Start a new queries.csv (or a new audit folder).');
  process.exit(2);
}

// --- Sources ---------------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function throttle(intervalMs) {
  let next = 0;
  return async () => {
    const now = Date.now();
    const at = Math.max(now, next);
    next = at + intervalMs;
    await sleep(at - now);
  };
}
const UA = { 'User-Agent': 'Mozilla/5.0 (search-research)' };
const decodeXml = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");

const sources = {
  google: {
    wait: throttle(1_000),
    async suggest(q) {
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&ie=utf-8&oe=utf-8&hl=${lang}&gl=${country}&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: UA });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json())[1];
    },
  },
  appstore: {
    wait: throttle(1_000),
    async suggest(q) {
      // Unofficial endpoint the App Store app uses for search hints; returns a plist.
      const url = `https://search.itunes.apple.com/WebObjects/MZSearchHints.woa/wa/hints?clientApplication=Software&term=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { ...UA, 'X-Apple-Store-Front': `${STOREFRONTS[country]}-1,29` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      return [...xml.matchAll(/<key>term<\/key>\s*<string>([^<]*)<\/string>/g)].map((m) => decodeXml(m[1]));
    },
  },
  play: {
    wait: throttle(1_000),
    async suggest(q) {
      // Unofficial RPC the Play Store website uses for its search box.
      const url = `https://play.google.com/_/PlayStoreUi/data/batchexecute?rpcids=teXCtc&hl=${lang}&gl=${country}`;
      const req = JSON.stringify([[['teXCtc', JSON.stringify([null, [q], [10], [2, 1], 4]), null, 'generic']]]);
      const res = await fetch(url, {
        method: 'POST',
        headers: { ...UA, 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: `f.req=${encodeURIComponent(req)}`,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const outer = JSON.parse((await res.text()).replace(/^\)\]\}'/, ''));
      const entry = outer.find((e) => e[0] === 'wrb.fr' && e[1] === 'teXCtc');
      const data = entry?.[2] ? JSON.parse(entry[2]) : null;
      return (data?.[0] ?? []).map((s) => s[0]);
    },
  },
};

// Official, documented at about 20 calls a minute per IP: stay under it.
const itunesWait = throttle(3_500);
async function appStoreTop10(q) {
  await itunesWait();
  requests.itunes++;
  const url = `https://itunes.apple.com/search?entity=software&limit=10&country=${country}&term=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()).results.map((r) => ({ name: r.trackName, ratings: r.userRatingCount ?? 0 }));
}

// --- Run -------------------------------------------------------------------------------------

const rows = new Map(existing.records.map((r) => [norm(r.query), r]));
const row = (q, parent) => {
  const key = norm(q);
  if (!rows.has(key)) rows.set(key, { query: key, parent });
  return rows.get(key);
};
// Keep the lowest typed share seen across lookups.
const lower = (a = '', b) => (a === '' ? String(b) : String(Math.min(Number(a), b)));

const seeds = readSeeds(seedsPath); // query → cluster
const todo = [...seeds.keys()].filter((q) => !rows.get(q)?.looked_up);
const failures = Object.fromEntries([...Object.keys(sources), 'itunes'].map((s) => [s, 0]));
const requests = Object.fromEntries([...Object.keys(sources), 'itunes'].map((s) => [s, 0]));
const done = Object.fromEntries(Object.keys(sources).map((s) => [s, new Map()])); // lookup → succeeded
const today = new Date().toISOString().slice(0, 10);
console.error(`${todo.length} of ${seeds.size} queries to look up (${country}, ${lang}).`);

async function lookUp(name, lookup) {
  if (done[name].has(lookup)) return done[name].get(lookup);
  done[name].set(lookup, false);
  const source = sources[name];
  await source.wait();
  requests[name]++;
  let list;
  try {
    list = (await source.suggest(lookup)).map(norm);
  } catch (e) {
    failures[name]++;
    console.error(`  ${name} "${lookup}": ${e.message}`);
    return false;
  }
  for (const s of list) {
    const r = row(s, lookup);
    // Stores also suggest strings that don't start with what was typed (app names, other word
    // orders). Those rows are kept for reading, but only a true continuation has a typed share.
    if (s.startsWith(lookup)) r[name] = lower(r[name], Math.round((100 * lookup.length) / s.length));
  }
  done[name].set(lookup, true);
  return true;
}

let incomplete = 0;
for (const [n, q] of todo.entries()) {
  const r = row(q, '(input)');
  r.parent = '(input)';
  // Type it the way a person does: each word's first two letters, half of a long word, then the
  // whole word. Without the half step, one-word heads like "trivia" only show when typed in full.
  const words = q.split(' ');
  const lookups = [];
  words.forEach((w, i) => {
    const before = words.slice(0, i).join(' ');
    const cuts = [2, w.length >= 6 ? Math.ceil(w.length / 2) : 0].filter((c) => c && c < w.length);
    for (const c of cuts) lookups.push(`${before} ${w.slice(0, c)}`.trim());
    lookups.push(`${before} ${w}`.trim());
  });
  const results = await Promise.all([
    ...Object.keys(sources).map(async (name) => {
      let ok = true;
      for (const l of lookups) ok = (await lookUp(name, l)) && ok;
      return ok;
    }),
    appStoreTop10(q).then(
      (top) => {
        const counts = top.map((t) => t.ratings).sort((a, b) => a - b);
        const median = counts.length ? counts[Math.floor((counts.length - 1) / 2)] : 0;
        r.as_top10_median_ratings = String(median);
        r.as_top3 = top.slice(0, 3).map((t) => t.name).join(' | ');
        r.difficulty = difficultyFromMedian(median);
        return true;
      },
      (e) => { failures.itunes++; console.error(`  itunes "${q}": ${e.message}`); return false; },
    ),
  ]);
  if (results.every(Boolean)) {
    r.looked_up = today;
    r.script = SCRIPT_VERSION;
  } else incomplete++;
  console.error(`  ${n + 1}/${todo.length} ${q}`);
}

for (const r of rows.values()) {
  if (r.looked_up && !r.cluster && seeds.get(r.query)) r.cluster = seeds.get(r.query);
  // Demand tiers: a human source wins when present; otherwise autocomplete, marked "?" (unconfirmed).
  r.web_demand = tierFromPlanner(r.kp_range) ?? `${tierFromShare(r.google)}?`;
  r.appstore_demand = tierFromAds(r.ads_popularity) ?? `${tierFromShare(r.appstore)}?`;
  r.play_demand = `${tierFromShare(r.play)}?`;
}

writeCsv(csvPath, existing.header, rows.values());
console.error(`Wrote ${rows.size} rows to ${csvPath}.`);
console.error(`Requests: ${JSON.stringify(requests)}. Failed: ${JSON.stringify(failures)}`);
if (incomplete) console.error(`${incomplete} queries are incomplete. Run again to retry only those.`);
if (todo.length && Object.values(failures).some((f) => f >= todo.length)) process.exit(1);
```

### `scripts/search-research/report.mjs`

```js
#!/usr/bin/env node
// Prints the analysis tables for report.md and proposals.md from queries.csv, as Markdown.
//
//   node scripts/search-research/report.mjs <queries.csv> [--top 15]
//
// Only looked-up queries (inputs) are ranked, since only they have a difficulty. Singular and
// plural forms are read together: a query's typed share is the best of its forms ("road trip
// games" takes "road trip game"'s 29 if the stores only suggest the singular). Queries whose
// fit is anything but blank or "yes" never become targets. Read-only; Node 18+, no dependencies.

import {
  FIT_VALUES, SCRIPT_VERSION, readCsv, tierFromAds, tierFromPlanner, tierFromShare,
} from './shared.mjs';

const args = process.argv.slice(2);
const csvPath = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--top');
const top = Number(args[args.indexOf('--top') + 1]) || 15;
if (!csvPath) {
  console.error('Usage: report.mjs <queries.csv> [--top 15]');
  process.exit(2);
}

const { records } = readCsv(csvPath);
const inputs = records.filter((r) => r.looked_up);
const fits = (r) => r.fit === '' || r.fit === 'yes' || r.fit == null;

// Singular/plural key: drop a final "s" from words longer than three letters ("games" → "game").
const formKey = (q) => q.split(' ').map((w) => (w.length > 3 && /[^s]s$/.test(w) ? w.slice(0, -1) : w)).join(' ');
const forms = new Map();
for (const r of records) {
  const k = formKey(r.query);
  if (!forms.has(k)) forms.set(k, []);
  forms.get(k).push(r);
}
// Best typed share for a source across a query's forms, and which form gave it.
function best(r, source) {
  let value = r[source] === '' ? null : Number(r[source]);
  let from = r.query;
  for (const f of forms.get(formKey(r.query))) {
    if (f[source] !== '' && (value === null || Number(f[source]) < value)) {
      value = Number(f[source]);
      from = f.query;
    }
  }
  return { value, from };
}
const shareCell = (b, r) => (b.value === null ? '–' : b.from === r.query ? String(b.value) : `${b.value} (as "${b.from}")`);
const demand = (r, source) => {
  const human = source === 'google' ? tierFromPlanner(r.kp_range) : source === 'appstore' ? tierFromAds(r.ads_popularity) : null;
  return human ?? `${tierFromShare(best(r, source).value ?? '')}?`;
};
const strong = (tier) => ['High', 'Medium'].includes(tier.replace('?', ''));
const byShare = (source) => (a, b) =>
  (best(a, source).value ?? 999) - (best(b, source).value ?? 999) ||
  Number(a.as_top10_median_ratings || 0) - Number(b.as_top10_median_ratings || 0);
const fmt = (n) => Number(n || 0).toLocaleString('en-US');

function table(title, rows, source, { difficulty = true, limit = top } = {}) {
  console.log(`\n## ${title} (${rows.length}${rows.length > limit ? `, top ${limit} shown` : ''})\n`);
  if (!rows.length) return console.log('None.');
  console.log(`| Query | Typed share | Demand | ${difficulty ? 'Difficulty (median ratings) | ' : ''}Cluster |`);
  console.log(`|---|---|---|${difficulty ? '---|' : ''}---|`);
  for (const r of rows.slice(0, limit)) {
    const d = difficulty ? ` ${r.difficulty} (${fmt(r.as_top10_median_ratings)}) |` : '';
    console.log(`| ${r.query} | ${shareCell(best(r, source), r)} | ${demand(r, source)} |${d} ${r.cluster || '–'} |`);
  }
}

// --- Checks ----------------------------------------------------------------------------------

console.log(`# Search research tables: ${csvPath}\n`);
console.log(`${records.length} rows, ${inputs.length} looked up.`);
const warnings = [];
const versions = new Set(inputs.map((r) => r.script || '1'));
if (versions.size > 1 || !versions.has(SCRIPT_VERSION)) warnings.push(`script versions in this file: ${[...versions].join(', ')} (this is ${SCRIPT_VERSION})`);
const unclustered = inputs.filter((r) => !r.cluster).map((r) => r.query);
if (unclustered.length) warnings.push(`no cluster: ${unclustered.join('; ')}`);
const badFit = inputs.filter((r) => !FIT_VALUES.includes(r.fit ?? '')).map((r) => `${r.query} (${r.fit})`);
if (badFit.length) warnings.push(`unknown fit values: ${badFit.join('; ')} (use ${FIT_VALUES.filter(Boolean).join(', ')})`);
for (const w of warnings) console.log(`- **Warning:** ${w}`);

// --- Targets ---------------------------------------------------------------------------------

const ok = inputs.filter(fits);
table('App Store targets', ok.filter((r) => strong(demand(r, 'appstore')) && ['Low', 'Medium'].includes(r.difficulty)).sort(byShare('appstore')), 'appstore');
table('App Store stretch (High demand, High difficulty)', ok.filter((r) => demand(r, 'appstore').startsWith('High') && r.difficulty === 'High').sort(byShare('appstore')), 'appstore');
table('Google Play targets (read install bands for the top 5)', ok.filter((r) => strong(demand(r, 'play'))).sort(byShare('play')), 'play', { difficulty: false });
table('Web targets (check what ranks for the top 10)', ok.filter((r) => strong(demand(r, 'google'))).sort(byShare('google')), 'google', { difficulty: false });

// --- Left out --------------------------------------------------------------------------------

const blocked = inputs.filter((r) => r.fit === 'blocked').sort(byShare('appstore'));
console.log(`\n## Blocked by a copy rule: for Conflicts (${blocked.length})\n`);
if (!blocked.length) console.log('None.');
else {
  console.log('| Query | App Store | Play | Google | Difficulty (median ratings) | Notes |\n|---|---|---|---|---|---|');
  for (const r of blocked) {
    const cells = ['appstore', 'play', 'google'].map((s) => shareCell(best(r, s), r)).join(' | ');
    console.log(`| ${r.query} | ${cells} | ${r.difficulty} (${fmt(r.as_top10_median_ratings)}) | ${r.notes || '–'} |`);
  }
}
const out = inputs.filter((r) => !fits(r) && r.fit !== 'blocked');
console.log(`\n## Left out for fit (${out.length})\n`);
for (const r of out) console.log(`- ${r.query}: ${r.fit}${r.notes ? `, ${r.notes}` : ''}`);
if (!out.length) console.log('None.');

// --- Calibration -----------------------------------------------------------------------------
// How often the autocomplete tier agrees with a human source. Paste the result into the
// playbook note: it's how the thresholds get tuned across projects.

const rank = { None: 0, Low: 1, Medium: 2, High: 3 };
function calibrate(label, source, humanTier) {
  const pairs = inputs
    .map((r) => [tierFromShare(best(r, source).value ?? ''), humanTier(r)])
    .filter(([, h]) => h);
  if (!pairs.length) return console.log(`- ${label}: no human data yet.`);
  const gaps = pairs.map(([a, h]) => Math.abs(rank[a] - rank[h]));
  const share = (n) => `${Math.round((100 * gaps.filter((g) => g === n).length) / gaps.length)}%`;
  const above = pairs.filter(([a, h]) => rank[a] > rank[h]).length;
  console.log(`- ${label}: ${pairs.length} ${pairs.length === 1 ? 'query' : 'queries'}; same tier ${share(0)}, one off ${share(1)}, two or more off ${Math.round((100 * gaps.filter((g) => g >= 2).length) / gaps.length)}%; autocomplete higher in ${above}, lower in ${pairs.length - above - gaps.filter((g) => g === 0).length}.`);
}
console.log('\n## Calibration\n');
calibrate('Google typed share vs Keyword Planner', 'google', (r) => tierFromPlanner(r.kp_range));
calibrate('App Store typed share vs Apple Ads popularity', 'appstore', (r) => tierFromAds(r.ads_popularity));
```

### `.claude/skills/search-research/SKILL.md`

````md
---
name: search-research
description: Use when asked about ASO, SEO, App Store or Google Play keywords, store listing text, landing-page titles, or how people search for what this product does, before launch.
---

# Pre-launch search research

Find how people search for what this product does, on the App Store, Google Play and the web, and
propose listing text from that. Free data only. You propose; a human pastes. Never change App
Store Connect, Play Console or the website yourself.

## Project inputs

- What the product does, where and for whom: TODO(project): e.g. `README.md`, `docs/design/`
- Current listing text, per surface, and the reasons written next to it: TODO(project): e.g.
  `docs/release/app-store-listing.md`, or "none yet"
- Copy rules the listing must follow: TODO(project): e.g. the voice section of the design doc,
  words the project never uses
- Surfaces in scope: TODO(project): App Store, Google Play, web (drop any the project lacks)
- Country and language: TODO(project): `--country us --lang en`

## Budget

Defaults for one audit. Go over only when the product has many distinct features, and say why in
the report.

- 3 collection passes and about 120 input queries.
- About 10 web searches, about 10 App Store pages and about 15 Play pages.

## Steps

Work in `docs/aso/<YYYY-MM-DD>/`. The scripts are in `scripts/search-research/`.

1. **Seeds.** Read the product inputs and write `seeds.txt`: 30–60 queries, one per line, under
   `# cluster: <name>` headings (`# cluster: place - road trips`). Cover each intent cluster:
   places and situations, groups, feature names, constraints ("offline", "no wifi", "no ads").
   Mix short heads ("road trip games") with longer web-style queries ("games to play while
   waiting in line"). Include every word in the current listing's searchable fields, so none is
   dropped untested. Leave out other products' names. If the human gave seeds, include them.
2. **Collect.** `node scripts/search-research/collect.mjs docs/aso/<date>/seeds.txt
   docs/aso/<date>/queries.csv <country/lang flags>`. It fills `cluster` from the headings. If a
   whole source fails, say so in the report and carry on. If some queries are incomplete, run it
   again: only those are retried.
3. **Expand, once or twice.** Don't read `queries.csv` whole: it grows to thousands of rows.
   Filter it with a short script, e.g. suggestion rows (blank `looked_up`) on topic with a typed
   share under 45 in a store column. Add to `seeds.txt`, under their cluster:
   - relevant suggestions;
   - generic terms from the names in `as_top3` ("pass the phone", "group games"), never the
     brand names;
   - for each web-style query, its store-style form: lowercase, 1–3 words, without question
     words, "best", "to play", "app", "free" or "download". Write it in that row's `store_form`.

   Run step 2 again; only new queries are looked up. Stop when a pass adds few relevant rows, or
   at the budget.
4. **Judge fit.** Read `as_top3` for the inputs, and set `fit` on any that don't fit, with a
   reason in `notes`. Blank means it fits.
   - `other-meaning`: the stores read it as something else ("car games" there are driving games).
   - `blocked`: a copy rule forbids a word in it.
   - `untrue`: the product doesn't do what it asks.
   - `weak`: it fits only loosely, or the top results serve a different audience.
5. **Look around.**
   - Web: run `report.mjs` (step 6) and use your web-search tool once for each of the top 10
     web targets. Note in the report what kind of site ranks (lists, forums, app pages, video):
     that's the web difficulty.
   - App Store: open the store pages of the 3–5 competitors that recur most in `as_top3`, and
     note their names, subtitles and the words they repeat. The app's own subtitle is the
     `<p class="subtitle">` right after the page's `<h1>`; the other subtitles on the page belong
     to related apps.
   - Google Play: for each of the top 5 Play targets, open
     `https://play.google.com/store/search?q=<query>&c=apps`, then the top five results' details
     pages, and note the band beside "Downloads". Search pages don't show it.
6. **Analyze, in `report.md`.** Run `node scripts/search-research/report.mjs
   docs/aso/<date>/queries.csv`. It prints ranked target, stretch, blocked and left-out tables,
   reading singular and plural forms together. Build the report from those tables; don't
   re-rank by eye.
   - **Targets:** the top ~15 per surface, with their typed share and difficulty.
   - **Stretch:** demand High, difficulty High. Only worth it for words already in the listing,
     or for the name or subtitle if the words define the product.
   - **Left out:** a line each for strong queries dropped, and why.
   - **Contradictions:** wherever the data contradicts a reason written in the project's docs
     (a doc says a word is "too generic", but it ranks as a target). These go to Human decisions.
   - Check each target against the product: it must do what the query asks for.
7. **Propose, in `proposals.md`.** One section per surface in scope, each field with current
   value, proposed value, its length against the limit, the queries it targets, and the
   post-launch metric it should move (search impressions, conversion, or Search Console clicks).
   - **App Store:** name (30), subtitle (30), keywords (100 bytes), promotional text (170). The
     description and promotional text aren't indexed: propose changes there only for conversion.
     To fill the keyword field:
     1. List the words the App Store targets need.
     2. Strike words the name and subtitle already have.
     3. Rank the rest by the best target each one completes, then by bytes, and add them in
        that order as single words with commas and no spaces.
     4. Leave out other apps' names.
     5. Stop at 100 bytes, checking with `printf %s '<line>' | wc -c`.
   - **Google Play:** title (30), short description (80), full description (4,000). Play indexes
     the full description: use each target once, in a sentence a person would write, never in a
     list of keywords. If an App Store description exists, propose Play's as edits to it.
   - **Web:** for each page, the title (about 60 characters), meta description (about 155) and H1.
     If there's no landing page, propose a page plan: one page per strong cluster, with its title
     and the questions it answers. Prefer clusters where blogs rank, not big publishers.
   - **Conflicts:** every row with `fit` = `blocked` that the data favors: the query, the rule, and
     what the human could change. Never put it in a proposal.
   - **Human decisions:** the contradictions from step 6, and anything outside the rules, such as
     the extra-locale keyword option for the US App Store.
8. **Check every number.** Each typed share, median, count and length in `report.md` and
   `proposals.md` must match `queries.csv` or the `report.mjs` output. Fix any that don't.
9. **Hand back** a short summary:
   - the top three targets;
   - the proposed App Store keyword line;
   - the number of conflicts;
   - every human decision;
   - anything that failed.

   Also write `shortlist.txt` (at most 50 queries worth confirming) and ask the human to do the
   optional step below. Don't wait for it.
10. **Optional human step, after hand-back.** For each shortlisted query, the human types into
    `queries.csv` the Google Ads Keyword Planner range in `kp_range` (e.g. `1K – 10K`) and the
    Apple Ads search popularity (1–5) in `ads_popularity`. Then run `collect.mjs` again (nothing
    is looked up; the tiers update), re-run `report.mjs`, update the proposals if a target moved,
    and copy its Calibration lines into the playbook note.

## Run log while the playbook is young

Until the playbook's notes list three projects, also write `run-log.md`: each step with its time,
what worked, what didn't, what you changed and why. Keep it short. Its lessons go into the
playbook note and, if they're fixes, into the playbook.

## Rules

- Free sources only: the scripts, your own web search, single store pages. No bulk scraping, no
  logins, no paid tools or APIs.
- The `google`, `appstore` and `play` columns hold the typed share: the least of a query, in
  percent, that had to be typed before that source suggested it. Lower is more searched; blank
  is never suggested. Compare within a source, not across them.
- A store-style form counts for ASO only if a store's autocomplete shows it (a value in
  `appstore` or `play`). Unconfirmed forms can still serve the web.
- Every proposed word traces to a row in `queries.csv`.
- Copy rules beat data. When they clash, it's a Conflict for the human.
- Apple and Google don't document most of how search ranks. When a proposal relies on
  undocumented behavior (how words combine across fields, which small words are ignored), say
  it's common practice, not fact.
- If a script's scoring looks wrong mid-audit, stop. Fix the script in the playbook first, bump
  `SCRIPT_VERSION` in `shared.mjs` if values change meaning, start a new `queries.csv`, and say so
  in the report.
- Don't propose a listing in a language the product doesn't support.
````

---

## 5. Agent rule

Paste into `AGENTS.md`:

```md
- For ASO, SEO, store keywords, or listing and landing-page research before launch, follow
  `.claude/skills/search-research/SKILL.md`. Agents write proposals in `docs/aso/<date>/`; only
  a human pastes listing text into App Store Connect, Play Console or the website.
```

Why each part is there:

- **The trigger words** make agents without skill auto-loading (Codex, others) find the procedure.
- **"Proposals in docs/aso"** keeps every suggestion reviewable and dated.
- **"Only a human pastes"** because store changes are public, and App Store keyword and subtitle
  changes need a new version and App Review.

---

## 6. Acceptance test

1. **The script runs clean.** `node scripts/search-research/collect.mjs` on a three-line seeds
   file finishes in under a minute, prints `Failed` with all zeros, and writes rows with a typed
   share in all three source columns for at least one seed.
2. **Reruns keep human work.** Type a Keyword Planner range and an Apple Ads number into one row,
   add a seed, run again: the typed values stay, that row's demand tiers lose their `?`, and only
   the new seed is looked up. Every input has the cluster of its `# cluster:` heading.
3. **Versions don't mix.** Change `script` on one row to another version and run again: the
   script refuses, names both versions and exits 2.
4. **The report ranks and calibrates.** `report.mjs` on that file prints the four target tables,
   shows a plural's share taken from its singular (`29 (as "road trip game")`) where the stores
   suggest only one, keeps rows with a `fit` out of targets, and prints a Calibration line for
   the row with human data.
5. **Unprompted use.** In a fresh session, ask "what keywords should the App Store listing use?"
   without naming the skill. The agent follows the skill and produces the audit files, not a list
   from memory.
6. **Conflicts surface.** Add a copy rule that bans a word the data favors (for example a word the
   project's listing avoids). The agent sets `fit` to `blocked`, and the word appears under
   Conflicts with its row and the rule, and in no proposal.
7. **Limits hold.** Every proposed field shows its length, and the App Store keyword field is
   at most 100 bytes (`printf %s '…' | wc -c`).

---

## 7. Gotchas

- **The first demand measure didn't rank anything.** "Best position under the query minus its
  last word" left every one-word head ("trivia", "riddles") at the bottom. Cutting the last word
  to two letters made nearly everything first. Typed share, with lookups at each word's first two
  letters, half of a long word and the whole word, spread queries from 15 to 100. Without the
  half-word step, one-word heads still scored 100.
- **Suggestions that don't continue the typing.** App Store hints include app names and other
  word orders ("carpool: road trip games" for "road trip"). Counting them made a long app name
  look like the most-searched query (typed share 5). Only continuations get a typed share.
- **Don't read the CSV whole.** Two expansion passes on about 110 inputs gave 4,300 rows. Use
  `report.mjs` for the analysis, and a short filter for picking suggestions.
- **Hand analysis made errors.** The first run wrote seven throwaway scripts to rank and count,
  and still got a row count and one table wrong. `report.mjs` exists so the tables come from the
  data, and step 8 checks what's left.
- **Plurals split the data.** In the App Store "road trip game" scored 29 and "road trip games"
  100, because hints suggested only the singular. `report.mjs` reads the forms together.
  Apple matches some plural forms on its own, so the keyword field rarely needs both.
- **Changing the scoring mid-audit.** The first run re-ran pass 1 four times while fixing the
  demand measure. Merging old and new values would have mixed two meanings in one column without
  any sign of it, so `collect.mjs` now records its version on each row and refuses to merge
  another.
- **Keyword packing by trial.** Fitting the first keyword field took five tries (147, 133, 141,
  107, then 100 bytes). The skill's packing steps get there in one pass.
- **Data that contradicts the project's docs.** The first project's listing doc called one game
  name "too generic to search for", but the data made it a target. That only showed up as
  "not covered" in a table. Contradictions now go to Human decisions.
- **Words mean different things in stores.** "line games" looked like a waiting-in-line query,
  but its App Store top 3 were line-drawing puzzles with ~73K median ratings. Car, restaurant,
  plane and airport games were driving, cooking and flight sims, and I Spy was hidden-object
  games. Read `as_top3` before trusting a tier: a High tier for an unrelated meaning is neither
  competition nor demand for this product.
- **Hints include app names.** App Store hints returned "carpool: road trip games", an app's
  name. Navigational queries for other apps are not targets. Apple's guideline 2.3.7 bans other
  apps' names in metadata, so they never go in a proposal.
- **The iTunes Search API is a proxy.** Its order is close to App Store search but not the same.
  Use it for difficulty, never as "where we would rank".
- **Typed shares are relative.** They rank queries within one source; they aren't volumes, and
  each source's autocomplete behaves differently. That's why tiers stay `?` until a human
  source confirms them.
- **Competitor subtitles.** An App Store page's data holds many `"subtitle"` values; the first
  ones belong to related apps. The app's own is the `<p class="subtitle">` right after the `<h1>`.
- **Play installs aren't on search pages.** Read the band beside "Downloads" on each result's
  details page.
- **Test the current listing's words.** The first run nearly dropped "quiz" from the keyword
  field without data. Seeds now include every word already in the listing.
- **The unofficial endpoints can break.** The App Store hints and Play suggest endpoints are
  what the store apps and sites use, not public APIs. The script counts failures per source and
  exits 1 if a source failed for every query; report a broken source, don't silently drop it.
- **Web queries don't always carry over.** Long questions ("what games can we play while waiting
  in line") get searched on the web, but people type short heads in stores. Only a store-style
  form that store autocomplete shows counts for ASO.
- **The App Store doesn't index the description.** Only the name, subtitle, keyword field (and
  in-app purchase names) count for App Store search. Words in the description help conversion,
  not ranking. Play does index its full description.

## 8. What it does not cover

- **After launch.** Impressions, conversion, search terms from App Store Connect, Play Console and
  Search Console, and measuring the proposals. That's a separate playbook.
- **Paid tools** (AppTweak, Sensor Tower and others), paid search ads, and A/B tests (Product Page
  Optimization, store listing experiments).
- **Other languages.** It covers the primary locale. When the app adds a language, run the audit
  again in that language with native seeds; translated keywords miss how people search there.
  Don't add store listings in languages the app doesn't support: it misleads, risks rejection,
  and brings 1-star reviews. The mainland China App Store also needs a government game license
  (ISBN number) before a game can be listed. The US storefront also indexes some extra
  localizations (e.g. Spanish (Mexico)) for more keyword bytes; whether to use that is a human
  decision, flagged in the report, never proposed.
- **Submitting.** Agents never push metadata through App Store Connect, Play Developer or fastlane
  APIs.
- **Screenshots and icons.** Proposals may suggest caption text, but design is out of scope.

## 9. Builds on

- [App Store upload readiness](app-store-upload-readiness.md) checks the listing fields are valid
  at upload time. This playbook decides what goes in them.
- [Docs without copies](docs-without-copies.md): listing text is pasted into an external system,
  so it is one of the allowed copies. Proposals keep placeholders for counts.
