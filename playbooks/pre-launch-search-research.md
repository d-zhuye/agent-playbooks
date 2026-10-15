# Pre-launch search research (ASO and SEO)

A one-off, on-demand audit an agent runs before an app launches. It collects free search
signals (Google, App Store and Google Play autocomplete, plus App Store competition), groups queries
by what people want, and writes proposed listing text for the App Store, Google Play and the
project's web pages. Agents propose; a human pastes. Built for mobile apps with a small website;
the script is Node, the method applies to any stack.

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

- **Script:** queries the free sources at a safe rate, merges results, computes demand and
  difficulty tiers by fixed rules.
- **Agent:** writes seeds, picks which suggestions to follow, shortens web queries to store-style
  forms, groups clusters, reads competitors, writes the report and proposals.
- **Human:** optionally reads two account-gated tools for a shortlist; reviews proposals and
  conflicts; pastes approved text into the stores and site.

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
- **Proposal:** a proposed value for one listing field, with the current value, the queries it
  targets and the post-launch metric it should move.
- **Conflict:** a query the data favors that a project copy rule blocks. Listed for a human,
  never placed in a proposal.

### The run

```
1. Seeds         agent writes docs/aso/<date>/seeds.txt from the product's own docs
2. Collect       node scripts/search-research/collect.mjs seeds.txt queries.csv
                   └ per query: Google, App Store and Play autocomplete, typed the way a person
                     types it ("ro", "road", "road tr", … "road trip games"), and the App Store
                     top 10 via the iTunes Search API → typed shares, and new rows for suggestions
3. Expand        agent adds relevant suggestions and store-style forms to seeds.txt, runs again
                   (1–2 more passes; already-looked-up queries are skipped)
4. Look around   agent's own web search for top web queries; competitor store pages
5. Human step    optional: Keyword Planner ranges and Apple Ads popularity for a shortlist,
                   typed into queries.csv, script re-run to recompute tiers
6. Analyze       clusters × demand × difficulty → targets, in report.md
7. Propose       proposals.md: each field, current vs proposed, with limits, metrics, conflicts
```

Output, one folder per audit so a later audit can be compared:

| File | What it holds |
|---|---|
| `docs/aso/<date>/seeds.txt` | Every input query, grouped by cluster in comments |
| `docs/aso/<date>/queries.csv` | One row per query: sources, tiers, cluster, store-style form |
| `docs/aso/<date>/report.md` | Clusters, competition, targets, and what was left out |
| `docs/aso/<date>/proposals.md` | Proposed listing per surface, and the Conflicts section |

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
2. **Copy the script** to `scripts/search-research/collect.mjs` (section 4).
3. **Copy the skill** to `.claude/skills/search-research/SKILL.md` and fill its
   `TODO(project):` lines: where the product is described, the current listing, the copy
   rules, the surfaces in scope, the country and language.
4. **Paste the agent rule** into `AGENTS.md` (section 5).
5. **Commit `docs/aso/`.** The audit folder is small text and is the record the post-launch
   playbook builds on. Nothing goes in `.gitignore`.

---

## 4. Starter code

### `scripts/search-research/collect.mjs`

```js
#!/usr/bin/env node
// Collects free search signals for a list of queries and merges them into queries.csv.
//
//   node scripts/search-research/collect.mjs <seeds.txt> <queries.csv> [--country us] [--lang en] [--refresh]
//
// For each query in seeds.txt (one per line, # for comments) it reads Google, App Store and
// Google Play autocomplete as the query is typed ("ro", "road", "road tr", "road trip",
// "road trip ga", "road trip gam", "road trip games") and the top 10 App Store results from the iTunes Search API.
// Each source's column holds the typed share: the least of a query, in percent, that had to be
// typed before that source suggested it. Lower means more searched. Suggestions become new rows,
// so the next run can take the promising ones as input. Queries already looked up are skipped
// unless --refresh.
//
// Columns this script owns are rewritten on every run. Human columns (kp_range, ads_popularity)
// and agent columns (cluster, store_form, notes) are kept as they are. Node 18+, no dependencies.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const positional = [];
const opts = { country: 'us', lang: 'en', refresh: false };
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--refresh') opts.refresh = true;
  else if (a === '--country' || a === '--lang') opts[a.slice(2)] = String(process.argv[++i]).toLowerCase();
  else positional.push(a);
}
const [seedsPath, csvPath] = positional;
if (!seedsPath || !csvPath) {
  console.error('Usage: collect.mjs <seeds.txt> <queries.csv> [--country us] [--lang en] [--refresh]');
  process.exit(2);
}
const { country, lang, refresh } = opts;

// App Store storefront IDs for the hints endpoint. TODO(project): add your storefronts.
const STOREFRONTS = { us: 143441, gb: 143444, ca: 143455, au: 143460, ie: 143449, nz: 143461 };
if (!STOREFRONTS[country]) {
  console.error(`No App Store storefront ID for "${country}". Add it to STOREFRONTS.`);
  process.exit(2);
}

// Untuned starting thresholds. Change them when notes from real projects say so.
const DIFFICULTY = { low: 1_000, high: 50_000 }; // median App Store rating count of the top 10
const tierFromShare = (share) =>
  share === '' ? 'None' : Number(share) <= 40 ? 'High' : Number(share) <= 70 ? 'Medium' : 'Low';
const tierFromPlanner = (range) => {
  // Keyword Planner buckets such as "1K – 10K" or "100 – 1K": the lower bound decides.
  const m = String(range).trim().match(/^([\d.,]+)\s*([KM]?)/i);
  if (!m) return null;
  const low = parseFloat(m[1].replace(/,/g, '')) * ({ k: 1e3, m: 1e6 }[m[2].toLowerCase()] ?? 1);
  return low >= 10_000 ? 'High' : low >= 1_000 ? 'Medium' : low >= 100 ? 'Low' : 'None';
};
const tierFromAds = (dots) => {
  // Apple Ads search popularity, 1 to 5.
  const n = Number(dots);
  if (!n) return null;
  return n >= 4 ? 'High' : n === 3 ? 'Medium' : 'Low';
};

const SCRIPT_COLUMNS = ['query', 'parent', 'looked_up', 'google', 'appstore', 'play', 'as_top10_median_ratings', 'as_top3', 'difficulty', 'web_demand', 'appstore_demand', 'play_demand'];
const OTHER_COLUMNS = ['kp_range', 'ads_popularity', 'cluster', 'store_form', 'notes'];

// --- CSV -------------------------------------------------------------------------------------

function parseCsv(text) {
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

const csvField = (v) => (/[",\n\r]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ''));

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

const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
const existing = existsSync(csvPath) ? parseCsv(readFileSync(csvPath, 'utf8')) : { header: [], records: [] };
const rows = new Map(existing.records.map((r) => [norm(r.query), r]));
const row = (q, parent) => {
  const key = norm(q);
  if (!rows.has(key)) rows.set(key, { query: key, parent });
  return rows.get(key);
};
// Keep the lowest typed share seen across lookups.
const lower = (a = '', b) => (a === '' ? String(b) : String(Math.min(Number(a), b)));

const inputs = [...new Set(readFileSync(seedsPath, 'utf8').split('\n').map((l) => norm(l.replace(/#.*/, ''))).filter(Boolean))];
const todo = inputs.filter((q) => refresh || !rows.get(q)?.looked_up);
const failures = Object.fromEntries([...Object.keys(sources), 'itunes'].map((s) => [s, 0]));
const requests = Object.fromEntries([...Object.keys(sources), 'itunes'].map((s) => [s, 0]));
const done = Object.fromEntries(Object.keys(sources).map((s) => [s, new Set()])); // lookups made this run
const today = new Date().toISOString().slice(0, 10);
console.error(`${todo.length} of ${inputs.length} queries to look up (${country}, ${lang}).`);

async function lookUp(name, lookup) {
  if (done[name].has(lookup)) return;
  done[name].add(lookup);
  const source = sources[name];
  await source.wait();
  requests[name]++;
  let list;
  try {
    list = (await source.suggest(lookup)).map(norm);
  } catch (e) {
    failures[name]++;
    console.error(`  ${name} "${lookup}": ${e.message}`);
    return;
  }
  for (const s of list) {
    const r = row(s, lookup);
    // Stores also suggest strings that don't start with what was typed (app names, other word
    // orders). Those rows are kept for reading, but only a true continuation has a typed share.
    if (s.startsWith(lookup)) r[name] = lower(r[name], Math.round((100 * lookup.length) / s.length));
  }
}

for (const [n, q] of todo.entries()) {
  const r = row(q, '(input)');
  r.parent = '(input)';
  // Type it the way a person does: each word's first two letters, half of a long word, then the
  // whole word. Without the half step, one-word heads like "trivia" only show when typed in full.
  const words = q.split(' ');
  const lookups = [];
  words.forEach((w, i) => {
    const before = words.slice(0, i).join(' ');
    const cuts = [2, w.length >= 6 ? Math.ceil(w.length / 2) : 0].filter((n) => n && n < w.length);
    for (const n of cuts) lookups.push(`${before} ${w.slice(0, n)}`.trim());
    lookups.push(`${before} ${w}`.trim());
  });
  await Promise.all([
    ...Object.keys(sources).map(async (name) => {
      for (const l of lookups) await lookUp(name, l);
    }),
    appStoreTop10(q).then(
      (top) => {
        const counts = top.map((t) => t.ratings).sort((a, b) => a - b);
        const median = counts.length ? counts[Math.floor((counts.length - 1) / 2)] : 0;
        r.as_top10_median_ratings = String(median);
        r.as_top3 = top.slice(0, 3).map((t) => t.name).join(' | ');
        r.difficulty = median < DIFFICULTY.low ? 'Low' : median <= DIFFICULTY.high ? 'Medium' : 'High';
      },
      (e) => { failures.itunes++; console.error(`  itunes "${q}": ${e.message}`); },
    ),
  ]);
  r.looked_up = today;
  console.error(`  ${n + 1}/${todo.length} ${q}`);
}

// Demand tiers: a human source wins when present; otherwise autocomplete, marked "?" (unconfirmed).
for (const r of rows.values()) {
  r.web_demand = tierFromPlanner(r.kp_range) ?? `${tierFromShare(r.google ?? '')}?`;
  r.appstore_demand = tierFromAds(r.ads_popularity) ?? `${tierFromShare(r.appstore ?? '')}?`;
  r.play_demand = `${tierFromShare(r.play ?? '')}?`;
}

const header = [...new Set([...SCRIPT_COLUMNS, ...OTHER_COLUMNS, ...existing.header])];
const sorted = [...rows.values()].sort((a, b) => a.query.localeCompare(b.query));
writeFileSync(csvPath, [header, ...sorted.map((r) => header.map((h) => r[h] ?? ''))].map((f) => f.map(csvField).join(',')).join('\n') + '\n');
console.error(`Wrote ${sorted.length} rows to ${csvPath}.`);
console.error(`Requests: ${JSON.stringify(requests)}. Failed: ${JSON.stringify(failures)}`);
if (todo.length && Object.values(failures).some((f) => f >= todo.length)) process.exit(1);
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
- Current listing text, per surface: TODO(project): e.g. `docs/release/app-store-listing.md`,
  or "none yet"
- Copy rules the listing must follow: TODO(project): e.g. the voice section of the design doc,
  words the project never uses
- Surfaces in scope: TODO(project): App Store, Google Play, web (drop any the project lacks)
- Country and language: TODO(project): `--country us --lang en`

## Steps

Work in `docs/aso/<YYYY-MM-DD>/`. The script is `scripts/search-research/collect.mjs`.

1. **Seeds.** Read the product inputs and write `seeds.txt`: 30–60 queries, one per line,
   grouped under `# cluster` comments. Cover each intent cluster: places and situations,
   groups, feature or game names, constraints ("offline", "no wifi", "no ads"). Mix short heads
   ("road trip games") with longer web-style queries ("games to play while waiting in line").
   Include every word in the current listing's searchable fields, so none is dropped untested.
   Leave out other products' names. If the human gave seeds, include them.
2. **Collect.** `node scripts/search-research/collect.mjs docs/aso/<date>/seeds.txt
   docs/aso/<date>/queries.csv <country/lang flags>`. If it prints failures for a whole source,
   say so in the report and carry on with the rest.
3. **Expand, once or twice.** Don't read `queries.csv` whole: it grows to thousands of rows.
   Filter it with a short script, e.g. suggestion rows (blank `looked_up`) on topic with a typed
   share under 45 in a store column. Add the relevant ones to `seeds.txt`, under their cluster. For each web-style query, write its store-style form
   in the `store_form` column: lowercase, 1–3 words, without question words, "best", "to play",
   "app", "free" or "download". Add each store-style form to `seeds.txt` too. Run step 2 again;
   only new queries are looked up. Stop when a pass adds few relevant rows.
4. **Fill `cluster`** for every input. In `notes`, mark inputs that mean something else in the
   stores (read `as_top3`: "car games" there are driving games), that a copy rule blocks, or that
   would be untrue of the product. Read singular and plural rows together: autocomplete often
   suggests only one of them.
5. **Look around.**
   - Web: for the ~10 strongest web queries, use your web-search tool once each. Note what ranks
     (listicles, forums, app pages, video) in `notes`: that's the web difficulty.
   - App Store: read `as_top3` for each strong query. Open the store pages of the 3–5 competitors
     that recur most, and note their names, subtitles and the words they repeat. The app's own
     subtitle is the `<p class="subtitle">` right after the page's `<h1>`; the other subtitles
     on the page belong to related apps.
   - Google Play: for a few strong queries, open `https://play.google.com/store/search?q=<query>&c=apps`.
     Search pages show no install counts: open the top five results' details pages and read the
     band beside "Downloads".
6. **Human step (optional).** Write `shortlist.txt`: at most 50 queries worth confirming. Ask the
   human to type, into `queries.csv`, the Google Ads Keyword Planner range in `kp_range` (e.g.
   `1K – 10K`) and the Apple Ads search popularity (1–5) in `ads_popularity`. Then run step 2
   again so the tiers update. If they skip it, carry on: tiers stay marked `?`.
7. **Analyze, in `report.md`.**
   - **Targets:** relevant queries with demand High or Medium and difficulty Low or Medium.
   - **Stretch:** demand High, difficulty High. Only worth it for the name or subtitle, and only
     if the words define the product.
   - **Left out:** a line each for strong queries you dropped, and why.
   - Check each target against the product: it must do what the query asks for.
8. **Propose, in `proposals.md`.** One section per surface in scope, each field with current
   value, proposed value, its length against the limit, the queries it targets, and the
   post-launch metric it should move (search impressions, conversion, or Search Console clicks).
   - **App Store:** name (30), subtitle (30), keywords (100 bytes, commas without spaces, no
     word repeated from the name or subtitle, no other apps' names), promotional text (170).
     The description isn't indexed: propose changes only for conversion.
   - **Google Play:** title (30), short description (80), full description (4,000). Play indexes
     the full description; use each target naturally a few times, never in lists of keywords.
   - **Web:** for each page, the title (about 60 characters), meta description (about 155) and H1.
     If there's no landing page, propose a page plan: one page per strong cluster, with its title
     and the questions it answers.
   - **Conflicts:** every query the data favors that a copy rule blocks: the row, the rule, and
     what the human could change. Never put it in a proposal.
   - **Human decisions:** anything outside the rules, such as the extra-locale keyword option for
     the US App Store.
9. **Hand back** a short summary: the top three targets, the proposed App Store keywords line,
   the number of conflicts, and anything that failed.

## Rules

- Free sources only: the script, your own web search, single store pages. No bulk scraping, no
  logins, no paid tools or APIs.
- The `google`, `appstore` and `play` columns hold the typed share: the least of a query, in
  percent, that had to be typed before that source suggested it. Lower is more searched; blank
  is never suggested. Compare within a source, not across them.
- A store-style form counts for ASO only if a store's autocomplete shows it (a value in
  `appstore` or `play`). Unconfirmed forms can still serve the web.
- Every proposed word traces to a row in `queries.csv`.
- Copy rules beat data. When they clash, it's a Conflict for the human.
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
   the new seed is looked up.
3. **Unprompted use.** In a fresh session, ask "what keywords should the App Store listing use?"
   without naming the skill. The agent follows the skill and produces the four files, not a list
   from memory.
4. **Conflicts surface.** Add a copy rule that bans a word the data favors (for example a word the
   project's listing avoids). The word appears under Conflicts with its row and the rule, and in
   no proposal.
5. **Limits hold.** Every proposed field shows its length, and the App Store keyword field is
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
- **Don't read the CSV whole.** Two expansion passes on about 110 inputs gave 4,300 rows. Filter
  it with a short script: inputs only, or on-topic suggestions under a typed share.
- **Plurals split the data.** In the App Store "road trip game" scored 29 and "road trip games"
  100, because hints suggested only the singular. Read singular and plural rows together.
  Apple matches some plural forms on its own, so the keyword field rarely needs both.
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
