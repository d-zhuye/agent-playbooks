# Tiered test runs

Four test tiers, so an agent runs only the tests a change can break: related tests while editing,
a quick check before handing work back, a pre-commit hook on staged files, and the full check in
CI. Starter code is for Node projects using Jest, ESLint and GitHub Actions; the tiers and the
agent rule apply to any stack (see section 8).

**Adopt it when** agents run the whole suite after every edit, or skip tests because the suite
is slow.

---

## 1. Why use it

Agents tend to run the full check after every edit "to be safe". In the project this came from,
that was about 75 s per run (typecheck, lint, about 880 tests with coverage, content and build
checks), many times per task. Most edits touch a few files whose tests take seconds.

| Moment | Before | After |
|---|---|---|
| Each edit | full check, ~75 s | related tests, ~2–10 s |
| Handing back a change set | full check, ~75 s | quick check, ~30–45 s |
| Each commit | nothing enforced | lint + related tests on staged files, ~5–15 s |
| Each PR | nothing, or "trust me" | full check in CI, 0 s of agent time |

Agent tokens drop too: every full run prints a long report the agent has to read.

## 2. How it works

| Tier | Command | Runs | When |
|---|---|---|---|
| 1. While editing | `npm run test:related -- <files>` | tests that import the given files | after each edit |
| 2. Before hand-back | `npm run check:quick` | typecheck, lint, tests touched since `main` | once per change set |
| 3. Pre-commit hook | `lint-staged` | lint and related tests for staged files | every commit |
| 4. CI | `npm run check` | everything, with coverage gates | every PR and push to `main` |

Jest works out which tests are related from the import graph (`--findRelatedTests`) or from git
(`--changedSince=main`). The hook blocks a commit that breaks lint or a related test. CI is the
only place the full check must run; locally it runs only for foundation changes.

## 3. Setup checklist

1. Have ESLint and Jest already configured (any config; the scripts only call them). Then install
   the pinned dev dependencies (versions tested together):
   ```sh
   npm install --save-dev --save-exact jest@29.7.0 husky@9.1.7 lint-staged@17.6.0
   npx husky init        # creates .husky/pre-commit and adds "prepare": "husky"
   ```
2. Add the scripts in section 4 to `package.json`.
3. Replace `.husky/pre-commit` with the one in section 4. `husky init` writes `npm test` there,
   which would run the whole suite on every commit.
4. Add `lint-staged.config.mjs` and `.github/workflows/check.yml` from section 4.
5. Pin Node for CI: write the version you use to `.nvmrc` (for example `24.12.0`).
6. Paste the agent rule (section 5) into `AGENTS.md`.
7. Commit, then run the acceptance test (section 6).

## 4. Starter code

### `package.json` (scripts)

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint --max-warnings=0 .",
    "test": "jest",
    "test:related": "jest --findRelatedTests --passWithNoTests",
    "test:changed": "jest --changedSince=main --passWithNoTests",
    "check:quick": "npm run typecheck && npm run lint && npm run test:changed",
    "check": "npm run typecheck && npm run lint && npm test -- --maxWorkers=2 --coverage",
    "prepare": "husky"
  }
}
```

- `TODO(project):` drop `typecheck` if the project has no TypeScript; append other cheap,
  whole-project checks (data validation, build-config checks) to `check`.
- `--maxWorkers=2`: Jest picks its worker count from the CPU count, which differs between a
  laptop and a CI runner. Naming it gives the same behavior everywhere (see Gotchas).
- `--coverage` belongs in `check` only if `jest.config.js` sets a `coverageThreshold`.
  Otherwise it just costs time; leave it out.
- `--changedSince=main`: rename `main` if your default branch differs.

### `.husky/pre-commit`

```sh
npx lint-staged
```

### `lint-staged.config.mjs`

```js
// Pre-commit: lint staged code and run only the tests that depend on it. CI runs the full check.
export default {
  '*.{js,mjs,cjs,ts,tsx}': ['eslint --max-warnings=0'],
  // TODO(project): the folder your tested source lives in.
  'src/**/*.{js,ts,tsx}': (files) =>
    `jest --bail --findRelatedTests --passWithNoTests ${files.map((f) => JSON.stringify(f)).join(' ')}`,
  // Whole-project checks (for example data validation) run once, not once per file:
  // 'data/**/*.json': () => 'npm run data:check',
};
```

A function entry receives every staged path at once, so Jest starts once for all of them.

### `.github/workflows/check.yml`

```yaml
name: Check

on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: check-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0   # needed only if a check compares against git history
      - uses: actions/setup-node@v6
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run check
```

## 5. Agent rule

Paste into `AGENTS.md`:

```md
- Testing is tiered; run the smallest tier that covers the change, never the full check per edit:
  - While editing: `npm run test:related -- <changed files>` (only tests that import them).
  - Before handing back a change set: `npm run check:quick` (typecheck, lint, tests touched since main).
  - The pre-commit hook lints staged files and runs their related tests; never skip it with --no-verify.
  - Experiments that break code on purpose (fault injection, trying out a check) run in their own git
    worktree, never the main checkout: other sessions run tests against it.
  - CI runs `npm run check` on every PR. Run it locally only for foundation changes
    (TODO(project): list them, e.g. shared state, payments, config, dependencies, build).
```

Why each line is there:

- **"Never the full check per edit"**: without it, agents default to the full check.
- **Naming the tiers by moment** ("while editing", "before handing back") lets an agent pick one
  without weighing costs.
- **"Never skip it with --no-verify"**: agents reach for `--no-verify` when a hook fails.
- **The worktree line**: tests read the working tree, so one session's deliberate breakage fails
  every other session's tests (see Gotchas).
- **Foundation changes**: some edits have effects the import graph can't see (config,
  dependencies, shared state). Listing them tells the agent when the full run is worth it.

## 6. Acceptance test

In a scratch project with the setup installed, and two modules `a.js` and `b.js` each with a test:

1. **Related tests are narrow.** Edit `a.js` and run `npm run test:related -- a.js`: only
   `a.test.js` runs.
2. **The hook blocks a broken commit.** Break `a.js` so its test fails, stage it and commit: the
   commit is refused and `a.test.js` is named. Fix it and commit: it succeeds, and `b.test.js`
   never ran.
3. **The quick check sees the branch.** On a branch, change `b.js` and commit; then run
   `npm run check:quick`: `b.test.js` runs (`--changedSince` compares against `main`, not the
   last commit).
4. **CI runs everything.** Push the branch and open a PR: the Check workflow runs every test.
5. **An agent picks the tier unprompted.** Ask an agent with the rule in `AGENTS.md` to make a
   small change in `a.js`. It runs `test:related` while editing and `check:quick` before handing
   back, never the full `check`.

## 7. Gotchas

- **"Flaky" tests that are really a shared checkout.** In the source project, tests failed in two
  of three full runs and passed alone. The cause was another agent session breaking files in the
  same checkout on purpose, to try out a check. It reverted three minutes later, and every failing
  run fell inside that window. Before chasing a race, check whether someone else was editing the
  tree (`git status`, the other sessions' logs). The worktree line in the agent rule prevents it.
- **Worker count differs between machines.** With no `--maxWorkers`, Jest used 15 workers on a
  16-core laptop and 1 on a 2-vCPU runner. GitHub's standard runner for private repos has 2 vCPU
  (public repos get 4). On 2 pinned cores, `--maxWorkers=2` took 48 s where `--runInBand` took
  69–78 s, and it stayed stable with both cores saturated.
- **`--runInBand` was never needed.** It came with the original scaffold, and no reason for it was
  ever recorded. Check `git log -S` for the reason behind a slow flag before keeping it.
- **Coverage looked unused but was a gate.** The config set a 100% threshold on four payment files
  after an App Store rejection. Read `jest.config.js` before removing `--coverage`.
- **lint-staged runs once per glob.** A command that checks the whole project goes in a function
  entry (`() => 'npm run data:check'`), or it runs once per staged file.
- **Agent worktrees lack `node_modules`.** A fresh `git worktree` has no dependencies. Symlink the
  main checkout's `node_modules` (and never commit the link) or run `npm ci` there.

## 8. What it does not cover

- Which tests are worth writing, and test speed itself. This only chooses which tests run.
- Monorepos: run the related tests per package, or use the workspace tool's "affected" command.
- **Other stacks:** keep the four tiers and the agent rule, and swap the commands:
  - Python: `pytest --testmon` or `pytest <test files for changed modules>` for tier 1;
    `pre-commit` for tier 3.
  - Go: `go test ./path/to/changed/pkg/...` for tier 1.
  - Any stack: the hook framework (husky, `pre-commit`, lefthook) matters less than running only
    related tests in it.
