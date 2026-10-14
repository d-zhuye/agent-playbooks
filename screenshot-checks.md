# Screenshot checks for UI changes (`web:check`)

A drop-in workflow for Expo / React Native apps: every visual state of the app has an approved
screenshot committed to the repo. After a UI change, one command renders every screen in a
headless browser, compares it with its approved screenshot, and prints only what changed or broke.
Agents approve the changes they predicted, fix the ones they didn't, and ask the human only about
what they can't explain.

**Adopt it when** the project has a UI that agents change often and you want those changes checked
without a Mac, a simulator or a human looking at every screen. It needs the app to render on the web
(Expo's web target via react-native-web). It checks layout, not native feel.

---

## 1. Why use it

Without it, an agent "checks" a UI change by photographing screens and looking at them one by one.
That is slow, costs a lot of tokens per image, and only catches problems on the screens it happens to
open. With it, the computer does the comparing and the agent looks only at what changed.

Estimates from the project where this was built (about 140 screens × 2 phone sizes, ~315 tests):

| A change like… | Computer time | Agent time | Agent tokens | Human time |
|---|---|---|---|---|
| Nothing visible changed | ~2 min | <1 min | 1k–3k | 0 |
| An expected visual change | 2.5–4 min | 1–4 min | 3k–10k | 0 |
| An accident that spreads to other screens | 4–6 min | 3–15 min | 8k–30k | 0 (1–3 min if asked) |
| A broken layout or console error | 4–6 min | 2–15 min | 5k–25k | 0 (1–3 min if asked) |
| Adding or removing a screen | ~2 min | 1–3 min | 2k–6k | 0 |

The old "look at screenshots by eye" process was estimated at 5–30 min of agent time, 15k–70k tokens
and 2–20 min of human approval per change, and it could miss an accident entirely. The biggest gain
is not speed: a clean run now *means* nothing changed.

**Who does what**

- **Computer (Playwright):** renders every screen, compares pixels, runs layout checks, writes diffs.
- **Agent:** predicts which screens should change, reads the short report, opens only changed
  images, approves predicted changes, fixes unpredicted ones.
- **Human:** answers only what the agent can't resolve: an unexplained change or a matter of taste.

---

## 2. How it works

```
npm run web:check
  │
  ├─ 1. expo export --platform web  → .preview/web          (static build, ~3 s)
  ├─ 2. playwright test
  │      ├─ starts serve.mjs on a free port (SPA fallback to index.html)
  │      ├─ screens.spec.mjs: for each catalog screen × phone size
  │      │     open from empty storage, seeded randomness → prepare → screenshot
  │      │     → compare with test/web/screens/<size>/<screen>.png → extra checks
  │      └─ any other *.spec.mjs (flows across screens), on full runs only
  └─ 3. check.mjs reads Playwright's JSON report and prints:
         Changed · New · Failed (grouped) · No longer in the catalog
         exit 1 if anything needs attention
```

Files it adds:

| File | Role |
|---|---|
| `playwright.config.mjs` | Where screenshots live, how strictly to compare, the local server |
| `scripts/web-check/catalog.mjs` | **The screen list**: one entry per visual state, with its phone sizes |
| `scripts/web-check/steps.mjs` | Shared steps (tap, settle, scroll) used to reach a state |
| `scripts/web-check/options.mjs` | Parses `--screens`, `--approve`, `--list`; fails fast on typos |
| `scripts/web-check/check.mjs` | The command: export, run, summarise, guard approvals |
| `scripts/web-check/serve.mjs` | Tiny static server for the export |
| `test/web/fixtures.mjs` | Phone sizes, deterministic page, fail on console/page/HTTP errors |
| `test/web/screens.spec.mjs` | Turns the catalog into one screenshot test per screen × size |
| `test/web/screens/<size>/<screen>.png` | **Approved screenshots**, committed with the code |

Commands:

```sh
npm run web:check                                    # every screen + flow tests
npm run web:check -- --screens settings,home         # only these screens (fast, while iterating)
npm run web:check -- --approve --screens settings    # accept the new look of these screens
npm run web:check -- --list                          # screen names and sizes
npx playwright show-report .preview/report           # before/after viewer for humans
```

---

## 3. Setup checklist

1. **Make the app render on the web** (it does not have to ship there):
   ```sh
   npx expo install react-dom react-native-web @expo/metro-runtime
   ```
   If web is not a shipped platform, gate it in `app.config.ts`:
   ```ts
   // Web is a local layout preview only, never shipped.
   platforms: process.env.WEB_PREVIEW === '1' ? ['ios', 'android', 'web'] : ['ios', 'android'],
   ```
   Native-only modules (haptics, purchases, audio, etc.) must not crash on web: use a `.web.ts`
   stub or a `Platform.OS` guard. Any console error fails the check, which surfaces these quickly.
2. **Install Playwright with an exact version** (a version bump moves pixels):
   ```sh
   npm install --save-dev --save-exact @playwright/test@<current version>
   npx playwright install chromium        # add --with-deps on a fresh Linux machine
   ```
3. **Add scripts** to `package.json`:
   ```json
   "web:preview": "WEB_PREVIEW=1 expo start --web",
   "web:export": "WEB_PREVIEW=1 expo export --platform web --output-dir .preview/web",
   "web:check": "node scripts/web-check/check.mjs"
   ```
4. **Ignore output**: add `.preview/` to `.gitignore`. Commit `test/web/screens/`.
5. **Copy the starter files** in section 4, then fill in `catalog.mjs` with the project's screens.
6. **Run `npm run web:check`** once. Every screen is reported as **New**; open each picture once
   to confirm it looks right, then commit them.
7. **Add the agent rule** (section 5) to `AGENTS.md` / `CLAUDE.md`, and a short project doc
   (section 6) the rule can point to.
8. **Prove it works** with the five acceptance tests in section 7.

Requirements: Node 22+ (`Object.groupBy`, recursive `readdirSync`), macOS or Linux.

---

## 4. Starter code

Paths assume `scripts/web-check/` and `test/web/`. Comments explain each part and the reason for it.

### `playwright.config.mjs`

```js
// Screenshot checks against the static web export. Run through `npm run web:check`, which exports
// first and prints a short summary. Plain `npx playwright test` works too but prints far more.
import { defineConfig } from '@playwright/test';

// check.mjs picks a free port so two checks (say, two agents) can run at once.
const port = Number(process.env.PREVIEW_PORT ?? 4729);

export default defineConfig({
  testDir: 'test/web',
  outputDir: '.preview/results',
  // Approved screenshots are committed, one folder per phone size: test/web/screens/<size>/<screen>.png
  snapshotPathTemplate: '{testDir}/screens/{arg}{ext}',
  // A screen without an approved screenshot gets one saved. Playwright then PASSES the test
  // silently, so check.mjs compares the folder before and after to report it as "New".
  updateSnapshots: 'missing',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0, // a retry would hide flaky layouts; fix the cause instead
  timeout: 60_000,
  reporter: [
    // check.mjs prints its own summary, so it turns the list reporter off.
    ...(process.env.PREVIEW_WRAPPED ? [] : [['list']]),
    ['json', { outputFile: '.preview/results.json' }],   // what check.mjs reads
    ['html', { outputFolder: '.preview/report', open: 'never' }], // before/after viewer for humans
  ],
  expect: {
    toHaveScreenshot: {
      // One image pixel per CSS pixel: ~60 KB per screenshot instead of ~500 KB at 3x. Layout is
      // unaffected; fine detail (hairlines) is the trade-off.
      scale: 'css',
      animations: 'disabled',
      caret: 'hide',
      // Identical runs can differ by a pixel or two of anti-aliasing; real changes move hundreds.
      maxDiffPixels: 10,
    },
  },
  // Playwright's pinned Chromium, never the system Chrome, so browser updates don't move pixels.
  use: { browserName: 'chromium', baseURL: `http://127.0.0.1:${port}` },
  webServer: { command: `node scripts/web-check/serve.mjs ${port}`, url: `http://127.0.0.1:${port}`, reuseExistingServer: false },
});
```

### `scripts/web-check/catalog.mjs`

```js
// The screen catalog: one entry per VISUAL STATE (not per route). A settings screen scrolled to
// its end, a sheet open over it, or a card with its answer revealed are separate entries.
// Every entry becomes one screenshot test per phone size in test/web/screens.spec.mjs.
//
// Entry fields:
//   path     URL to open, from empty storage (deep links work through serve.mjs's fallback)
//   prepare  optional async (page) => {} that taps/scrolls into the state
//   check    optional async (page) => {} with extra assertions (see "Checks beyond pixels")
//   devices  phone sizes to compare at (defaults to `regular`)
import { scrollToEnd, tap } from './steps.mjs';

export const devices = {
  // Regular height, current common size.
  'iphone-15': { width: 393, height: 852, scale: 3 },
  // Small and short: catches wrapping, crowding and compact-layout bugs.
  'iphone-se': { width: 375, height: 667, scale: 2 },
  // Add sizes only where they find different bugs (for example a narrower width for cards).
};
const regular = ['iphone-15', 'iphone-se'];

export const screens = {};
function add(id, path, props = {}) { screens[id] = { id, path, devices: regular, ...props }; }

// ── Replace these examples with the project's screens ──
add('home', '/');
add('settings', '/settings');
add('settings-end', '/settings', { prepare: scrollToEnd });
add('home-menu-open', '/', { prepare: (page) => tap(page, 'Menu') });

// One capture per screen × size; used for the tests and to spot leftover screenshots.
export const captures = Object.values(screens)
  .flatMap((screen) => screen.devices.map((device) => ({ screen: screen.id, device })));
```

### `scripts/web-check/steps.mjs`

```js
// Steps shared by catalog entries and flow tests. Select by role and visible label, as a user
// would; it survives refactors and doubles as an accessibility check.

// React Native's Animated runs in JS, so CSS animation disabling doesn't stop it. A short wait
// lets springs and fades finish before a screenshot.
export const settle = (page) => page.waitForTimeout(400);

export async function tap(page, name) {
  await page.getByRole('button', { name, exact: true }).filter({ visible: true }).first().click();
  await settle(page);
}

// react-native-web renders ScrollViews as divs with overflow-y auto/scroll.
export async function scrollToEnd(page) {
  await page.evaluate(() => document.querySelectorAll('div').forEach((node) => {
    if (['auto', 'scroll'].includes(getComputedStyle(node).overflowY)) node.scrollTop = node.scrollHeight;
  }));
  await settle(page);
}
```

### `test/web/fixtures.mjs`

```js
import { test as base, devices as browserDevices } from '@playwright/test';
import { devices } from '../../scripts/web-check/catalog.mjs';
import { settle } from '../../scripts/web-check/steps.mjs';

// Mobile user agent, touch and isMobile from a real iPhone profile; size from the catalog.
// defaultBrowserType is dropped because it can't be set inside a describe block.
const { defaultBrowserType, ...iphone } = browserDevices['iPhone 15'];

export function device(name) {
  const { width, height, scale } = devices[name];
  return { ...iphone, viewport: { width, height }, deviceScaleFactor: scale };
}

// Every page starts from empty storage (a fresh Playwright context) with repeatable randomness,
// and fails its test on any page error, console error or failed request.
export const test = base.extend({
  // eslint-disable-next-line no-empty-pattern
  problems: async ({}, provide) => { await provide([]); },
  // The callback is named `provide`, not Playwright's usual `use`: eslint-plugin-react-hooks
  // mistakes `use(...)` for React's use() hook and fails lint.
  page: async ({ page, problems }, provide) => {
    await page.addInitScript(() => {
      // Seeded Math.random: shuffles and random picks draw the same items on every run.
      let seed = 20260926;
      Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    });
    // If screens show dates or times, also freeze the clock:
    // await page.clock.setFixedTime(new Date('2026-01-15T10:00:00'));
    page.setDefaultTimeout(15000);
    page.on('pageerror', (error) => problems.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) problems.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) problems.push(`HTTP ${response.status()} ${response.url()}`);
    });
    await provide(page);
    // One line, deduplicated: a screen logging the same error on every render reports it once.
    if (problems.length) throw new Error([...new Set(problems)].join('; '));
  },
});

export async function open(page, path = '/') {
  await page.goto(path, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready); // custom fonts loaded before any screenshot
  await settle(page);
}
```

### `test/web/screens.spec.mjs`

```js
// One screenshot test per catalog screen and phone size, compared with its approved image.
// PREVIEW_SCREENS (set by web:check --screens) narrows the run to the named screens.
import { expect } from '@playwright/test';
import { test, device, open } from './fixtures.mjs';
import { captures, screens } from '../../scripts/web-check/catalog.mjs';

const wanted = process.env.PREVIEW_SCREENS?.split(',');
const selected = captures.filter((capture) => !wanted || wanted.includes(capture.screen));

for (const [name, list] of Object.entries(Object.groupBy(selected, (capture) => capture.device))) {
  test.describe(name, () => {
    test.use(device(name));
    for (const { screen } of list) {
      test(screen, async ({ page }) => {
        const entry = screens[screen];
        await open(page, entry.path);
        await entry.prepare?.(page);
        // Soft, so a changed screen still runs its checks and reports every problem in one run.
        await expect.soft(page).toHaveScreenshot([name, `${screen}.png`]);
        await entry.check?.(page);
      });
    }
  });
}
```

Flow tests (things no single screenshot shows, like "Close returns to the previous screen") go in
other `test/web/*.spec.mjs` files using the same `test`, `device` and `open`. They run on full runs.

### `scripts/web-check/serve.mjs`

```js
// Serves the web export for Playwright. Unknown paths without a file extension fall back to
// index.html, so deep links like /settings load the single-page app. Usage: node serve.mjs <port>
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const webDir = fileURLToPath(new URL('../../.preview/web/', import.meta.url));
const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ico': 'image/x-icon',
};
if (!existsSync(join(webDir, 'index.html'))) {
  console.error('No web export found. Run npm run web:export first.');
  process.exit(1);
}
createServer((request, response) => {
  const pathname = normalize(decodeURIComponent(new URL(request.url, 'http://x').pathname));
  let file = join(webDir, pathname);
  if (!existsSync(file) || !statSync(file).isFile()) file = extname(pathname) ? '' : join(webDir, 'index.html');
  if (!file) { response.writeHead(404).end(); return; }
  response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
  response.end(readFileSync(file));
}).listen(Number(process.argv[2]), '127.0.0.1');
```

### `scripts/web-check/options.mjs`

```js
// Parses web:check's options before any export or browser starts, so a typo fails in milliseconds.
import { screens } from './catalog.mjs';

export function parseOptions(args) {
  const options = { list: false, approve: false, screens: null };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--list' || arg === '--help') options.list = true;
    else if (arg === '--approve') options.approve = true;
    else if (arg === '--screens' || arg.startsWith('--screens=')) {
      if (options.screens) throw new Error('Repeated option: --screens');
      const value = arg.includes('=') ? arg.slice('--screens='.length) : args[++i];
      if (!value || value.startsWith('--')) throw new Error('--screens needs a comma-separated list of screen names');
      options.screens = [...new Set(value.split(',').map((name) => name.trim()))];
      for (const name of options.screens) {
        if (!screens[name]) throw new Error(`Unknown screen: ${JSON.stringify(name)}. Run npm run web:check -- --list for names.`);
      }
    } else throw new Error(`Unknown option: ${arg}`);
  }
  // Approving needs explicit names: the agent must say which changes it predicted.
  if (options.approve && !options.screens) throw new Error('--approve needs --screens naming the changes you predicted.');
  return options;
}
```

### `scripts/web-check/check.mjs`

```js
// npm run web:check: exports the web build, compares every catalog screen with its approved
// screenshot, runs the other web tests, and prints only what needs attention.
//
// Why a wrapper instead of plain `npx playwright test`:
//  - Playwright's output is long; agents read this short report instead (far fewer tokens).
//  - A missing screenshot is saved and PASSES silently in Playwright; this reports it as "New".
//  - A screen that failed a check never keeps a new screenshot, even with --approve.
//  - The suggested approvals exclude failed screens, and it never prints a ready-to-paste
//    "approve everything" command: the agent must pick the changes it predicted.
//  - Repeated failures print once; leftover screenshots of removed screens fail the run.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseOptions } from './options.mjs';
import { captures, devices, screens } from './catalog.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const baselineDir = join(root, 'test/web/screens');
const resultsFile = join(root, '.preview/results.json');
const help = `npm run web:check                                    every screen and the other web tests
npm run web:check -- --screens settings,home          only these screens, at their catalog sizes
npm run web:check -- --approve --screens settings     accept the new look of these screens
npm run web:check -- --list                           screen names and sizes`;

const strip = (text) => text.replace(/\u001b\[[0-9;]*m/g, '');
const freePort = () => new Promise((resolve) => {
  const server = createServer().listen(0, '127.0.0.1', () => { const { port } = server.address(); server.close(() => resolve(port)); });
});
// Approved screenshots as relative path → bytes, to detect added, updated and leftover files.
function baselines() {
  if (!existsSync(baselineDir)) return new Map();
  return new Map(readdirSync(baselineDir, { recursive: true }).filter((file) => file.endsWith('.png'))
    .map((file) => [file.replaceAll('\\', '/'), readFileSync(join(baselineDir, file))]));
}
// Walks Playwright's JSON report: yields each test with its describe path (e.g. [device, screen]).
function* tests(suite, titles = []) {
  const path = suite.file && !suite.title.endsWith('.mjs') ? [...titles, suite.title] : titles;
  for (const spec of suite.specs ?? []) for (const test of spec.tests) yield { file: suite.file, name: [...path, spec.title], test };
  for (const child of suite.suites ?? []) yield* tests(child, path);
}

let options;
try { options = parseOptions(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exit(1); }
if (options.list) {
  console.log(`${help}\n\nScreens (sizes):`);
  for (const screen of Object.values(screens)) console.log(`  ${screen.id} (${screen.devices.join(', ')})`);
  console.log(`\nSizes: ${Object.entries(devices).map(([name, size]) => `${name} ${size.width}×${size.height}`).join(', ')}`);
  process.exit(0);
}

// 1. Export. Failing here prints the tail of Expo's output, which names the broken import.
const exported = spawnSync('npm', ['run', 'web:export'], { cwd: root, encoding: 'utf8' });
if (exported.status !== 0) {
  console.error(`web:export failed:\n${strip(exported.stdout + exported.stderr).split('\n').slice(-30).join('\n')}`);
  process.exit(1);
}

// 2. Run Playwright. --screens runs only the screenshot spec; a full run runs every spec.
const before = baselines();
rmSync(resultsFile, { force: true });
const run = spawnSync('npx', ['playwright', 'test', ...(options.screens ? ['test/web/screens.spec.mjs'] : []),
  ...(options.approve ? ['--update-snapshots=changed'] : [])], {
  cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  env: {
    ...process.env, PREVIEW_WRAPPED: '1', PREVIEW_PORT: String(await freePort()),
    ...(options.screens ? { PREVIEW_SCREENS: options.screens.join(',') } : {}),
  },
});
const report = existsSync(resultsFile) ? JSON.parse(readFileSync(resultsFile, 'utf8')) : null;
if (!report || report.errors?.length) {
  const errors = report?.errors?.map((error) => strip(error.message)).join('\n') ?? '';
  console.error(`Playwright did not finish:\n${errors}\n${strip(run.stdout + run.stderr).split('\n').slice(-30).join('\n')}`);
  process.exit(1);
}

// 3. Sort results. "Changed" = a screenshot mismatch (an -actual.png exists). Anything else that
// went wrong is a failure, reduced to its first meaningful line.
const changed = [];
const failed = [];
const broken = new Set();
let count = 0;
for (const { file, name, test } of tests({ suites: report.suites })) {
  count++;
  if (test.status !== 'unexpected') continue;
  const result = test.results.at(-1);
  const label = file.endsWith('screens.spec.mjs') ? name.join('/') : name.join(': ');
  const diff = result.attachments.find((attachment) => attachment.name.endsWith('-diff.png'));
  const actual = result.attachments.find((attachment) => attachment.name.endsWith('-actual.png'));
  if (actual) changed.push({ label, screen: name.at(-1), image: (diff ?? actual).path.replace(root, '') });
  for (const error of result.errors) {
    const message = strip(error.message ?? '');
    if (actual && message.includes('toHaveScreenshot')) continue;
    const text = message.split('\n');
    const line = text.find((line) => line.trim() && !line.startsWith('Error: expect(')) ?? text[0];
    const reason = line.replace(/^\w*Error: /, '').replace(`${label}: `, '');
    const waiting = text.find((line) => line.includes('waiting for'))?.trim();
    failed.push({ label, reason: `${reason}${waiting ? ` (${waiting})` : ''}` });
    broken.add(label);
  }
}

// 4. A failed screen keeps its old screenshot (or gets none), so a broken screen never becomes
// the approved look, whether it was new or being approved.
const rejected = [];
for (const label of broken) {
  const key = `${label}.png`;
  const file = join(baselineDir, key);
  if (!existsSync(file) || before.get(key)?.equals(readFileSync(file))) continue;
  if (before.has(key)) writeFileSync(file, before.get(key));
  else rmSync(file);
  rejected.push(label);
}
const after = baselines();
const added = [...after.keys()].filter((file) => !before.has(file));
const updated = [...after.keys()].filter((file) => before.has(file) && !before.get(file).equals(after.get(file)));

// 5. Report.
const lines = [`web:check ran ${count} tests.`];
if (options.approve) lines.push(`Approved ${updated.length + added.length} screenshots: ${[...updated, ...added].join(', ') || 'none changed'}.`);
if (rejected.length) lines.push(`Did not save screenshots of ${rejected.length} failed screens: ${rejected.join(', ')}. Fix them and run again.`);
if (changed.length) {
  lines.push('', `Changed (${changed.length}): open each image (a diff; -actual.png and -expected.png sit beside it).`);
  for (const { label, image } of changed) lines.push(`  ${label}  ${image}${broken.has(label) ? '  (also failed: fix it first)' : ''}`);
  const approvable = [...new Set(changed.filter(({ label }) => !broken.has(label)).map(({ screen }) => screen))];
  if (approvable.length) lines.push('Approve only the screens your change predicted. Changed screens without failures:',
    `  ${approvable.join(',')}`, '  npm run web:check -- --approve --screens <the predicted ones>');
}
if (added.length && !options.approve) {
  lines.push('', `New (${added.length}): no approved screenshot existed, so this run saved one. Open each to confirm it looks right:`);
  if (added.length > 20) lines.push(`  ${added.length} files under test/web/screens/ (git status lists them)`);
  else for (const file of added) lines.push(`  test/web/screens/${file}`);
}
if (failed.length) {
  // One problem shared by many tests (say, an error on a screen many flows pass through) prints once.
  const groups = Object.entries(Object.groupBy(failed, ({ reason }) => reason));
  lines.push('', `Failed (${broken.size} tests, ${groups.length} problems):`);
  for (const [reason, list] of groups) {
    const labels = [...new Set(list.map(({ label }) => label))];
    lines.push(labels.length === 1 ? `  ${labels[0]}: ${reason}`
      : `  ${reason}\n    in ${labels.length} tests: ${labels.slice(0, 6).join(', ')}${labels.length > 6 ? `, and ${labels.length - 6} more` : ''}`);
  }
}
// Leftover screenshots only make sense to judge on a full run.
let stale = [];
if (!options.screens) {
  const known = new Set(captures.map(({ device, screen }) => `${device}/${screen}.png`));
  stale = [...after.keys()].filter((file) => !known.has(file));
  if (stale.length) lines.push('', `No longer in the catalog (${stale.length}); delete them and commit the deletion:`, ...stale.map((file) => `  test/web/screens/${file}`));
}
if (changed.length || failed.length) lines.push('', 'Before/after viewer for people: npx playwright show-report .preview/report');
else if (!stale.length && (!added.length || options.approve)) lines.push('Nothing changed; nothing to review.');
console.log(lines.join('\n'));
process.exit(changed.length || failed.length || stale.length ? 1 : 0);
```

### Checks beyond pixels (optional, recommended)

A screenshot shows *that* something moved; a check says *what broke*, and catches problems on
screens nobody predicted. Add them as a catalog entry's `check`, or for every screen in
`screens.spec.mjs`. Two generic ones:

```js
// Content cut off: a scroll area whose content is taller than it (for areas that must fit).
export async function noOverflow(page, label) {
  const overflow = await page.evaluate(() => [...document.querySelectorAll('div')]
    .filter((node) => ['auto', 'scroll'].includes(getComputedStyle(node).overflowY) && node.clientHeight > 0)
    .map((node) => node.scrollHeight - node.clientHeight).filter((height) => height > 1));
  if (overflow.length) throw new Error(`${label}: content overflow ${Math.max(...overflow)}px`);
}

// A key action is fully on screen and not covered by something else.
export async function onScreen(page, name) {
  const box = await page.getByRole('button', { name, exact: true }).first().boundingBox();
  const { width, height } = page.viewportSize();
  if (!box || box.y < 0 || box.x < 0 || box.y + box.height > height || box.x + box.width > width) {
    throw new Error(`${name} is off screen`);
  }
  const top = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('[role="button"]')?.getAttribute('aria-label'),
    { x: box.x + box.width / 2, y: box.y + box.height / 2 });
  if (top !== name) throw new Error(`${name} is covered`);
}
```

Write the message as `<label>: <problem>`; the report strips the label and groups identical problems.

For apps with large content sets (card decks, lists), consider a separate "walk" spec that steps
through every item at each size and runs the overflow check, rather than one screenshot per item.

---

## 5. The agent rule (paste into `AGENTS.md`; `CLAUDE.md` can point to `AGENTS.md`)

```markdown
- Run `npm run web:check` when a change can move pixels at phone size: styles, spacing, new or
  longer on-screen copy, new screens or flows. Skip it for logic, state, tests, docs and copy that
  gets no longer. First name the screens your change should alter; run it once per change set, not
  per edit (`--screens` for faster iteration). Approve changed screens you predicted
  (`--approve --screens`), fix ones you didn't, and ask the user only about what you can't resolve:
  an unexplained change or a matter of taste. Open each new screenshot once. Finish on a clean full
  run (without `--screens`) and commit approved screenshots with the change.
  Web checks layout only, never native feel. Review steps: docs/development/web-check.md.
```

Why each part is there:

- **"When a change can move pixels" / "Skip it for…"**: without it, agents run it after every edit or never.
- **"First name the screens"**: the prediction is what makes approving safe; a change outside it is an accident.
- **"Once per change set"**: a full run is ~2 minutes; per-edit runs waste most of a session.
- **"Ask only about what you can't resolve"**: the human approves taste, not routine pixels.
- **"Clean full run, without `--screens`"**: an agent that checks only its predicted screens can't see
  a change leaking onto others. Learned by testing Codex, which otherwise stopped after a partial run.

## 6. Project doc (`docs/development/web-check.md`): the review steps

The rule points here. Keep the commands from section 2 plus:

1. Before running, name the screens the change should alter and why.
2. Run `npm run web:check` once per change set. Use `--screens` to iterate faster.
3. For each changed screen, open its diff and actual image:
   - **predicted and looks right**: approve it with `--approve --screens`;
   - **not predicted**: an accident; fix the code and run again;
   - **can't tell, or a matter of taste**: ask the user, showing actual and expected images.
4. Open each new screenshot once to confirm it looks right; it is already saved.
5. Fix every failure. Finish on a clean full run.
6. Report which screens changed, which you approved and why, and anything left for the user.
7. Commit approved screenshots in `test/web/screens/` with the change.

Also list the project's phone sizes, what its checks cover, and the web limits (section 9).

---

## 7. Acceptance test: prove the setup works

Run these five on a clean tree, undoing each change afterwards (`git checkout -- .`, delete new files):

| # | Change | Expected report |
|---|---|---|
| 1 | Nothing | "Nothing changed; nothing to review.", exit 0 |
| 2 | Recolour one element on one screen | Only that screen's pictures under **Changed**; `--approve --screens <it>` updates exactly those files; the next run is clean |
| 3 | Change a style shared by many screens | **Changed** lists screens beyond the one "intended", proving accidents get caught |
| 4 | Make some text far too long, and add `console.error('x')` to one screen | **Failed** names the overflow (with px) and the error once with a test count; `--approve` of that screen is refused |
| 5 | Add a catalog entry and remove another | **New** lists the new picture; **No longer in the catalog** lists the old ones; exit 1 |

Also give an agent one small UI change *without mentioning the check* and ask for a log of its steps.
It should predict screens, run `web:check`, open only changed images, approve only predicted
screens, finish on a clean full run, and not ask you about the expected change.

---

## 8. Gotchas (all learned the hard way)

- **Render screenshots on one OS.** Fonts render differently on macOS and Linux, so screenshots
  approved on one flag every screen on the other. Pick one (Linux is easiest for CI). From a Mac, run
  it in Playwright's Docker image of the *same* version: `mcr.microsoft.com/playwright:v<version>-noble`.
- **Pin Playwright exactly.** A new version brings a new Chromium; upgrading means re-approving
  every screen in one deliberate commit.
- **Missing screenshots pass silently** with `updateSnapshots: 'missing'`. The wrapper's
  before/after folder comparison is what reports them as New. Keep it.
- **Determinism:** seeded `Math.random`, frozen clock if needed, `document.fonts.ready`, a settle wait
  for RN animations, fresh storage per test. Any flake of more than a few pixels has a cause; find it
  rather than raising `maxDiffPixels`.
- **Sandboxes:** Codex's sandbox blocks the local server (`EPERM` on 127.0.0.1). It asks to run the
  check outside the sandbox and continues; expect one extra prompt or about a minute.
- **Lint:** name the fixture callback `provide`, not `use` (react-hooks lint), and allow the
  empty `({}, …)` pattern.
- **Native-only code on web** throws console errors that fail every screen using it. Stub with
  `.web.ts` files or `Platform.OS` guards; this is the main Expo setup cost.
- **Approval hygiene:** never approve a whole "Changed" list wholesale; a shared-style change can
  touch 100+ screens and only some were intended. The wrapper deliberately prints a pick list.
- **Size:** at `scale: 'css'`, about 60 KB per screenshot (~300 screenshots ≈ 17 MB). Fine in git; use
  Git LFS only if the catalog grows into the thousands.

## 9. What it does not check

Trust it for layout, spacing, colour, copy fit, wrapping and navigation. It is not native sign-off:

- System fonts fall back (SF Pro isn't on Linux); bundled fonts match. Line breaks can differ slightly.
- Switches, pickers and other native controls use web styling.
- No notch, Dynamic Island, safe areas, native stack transitions or swipe-back.
- Haptics, audio and other native modules do nothing; performance says nothing about a device.
- Native sheets, VoiceOver focus and Dynamic Type need a simulator or device.

**Plain web apps (React, Next.js, etc.):** the same setup works. Replace `web:export` with the
project's build command and output folder (or point `webServer` at its dev/preview server), and drop
the Expo-specific steps in section 3.
