<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version (16.2.2, React 19.2.4) has breaking changes — APIs, conventions,
and file structure may all differ from your training data. Read the relevant
guide in `node_modules/next/dist/docs/` before writing any code. Heed
deprecation notices.
<!-- END:nextjs-agent-rules -->

# grove-www — agent notes

## Read first
- `DESIGN.md` before any UI change. The design system is prescriptive and
  enforced. "Known drift" at the bottom lists live violations; don't add
  to the list.
- `GOAL.md` for product intent and the landing-page structure.
- `README.md` for dev commands and the mobile baseline.
- `SPEC.md` + `PLAN.md` for v2 dashboard work (the backlog homepage). If
  you're touching `src/app/(resident)/[atHandle]/[vaultSlug]/page.tsx`,
  `src/components/backlog/*`, `src/components/primitives/*`, or
  `src/lib/grove-api.v2*`, read both first.

## Mock mode (v2 dashboard)

The v2 dashboard data layer (`src/lib/grove-api.v2.ts`) routes via mock or
live impl based on `GROVE_API_MODE`:

- `GROVE_API_MODE=mock` (default) — in-memory fixtures from
  `src/lib/grove-api.v2.mock.ts`. Module-level singleton; restart resets
  state. Used during v2 build-out until `api.grove.md` exposes the v2
  endpoints. Run `npm run probe:api -- --vault=<slug>` to check current
  backend readiness.
- `GROVE_API_MODE=live` — calls real `api.grove.md`. Currently a stub
  that throws "not yet implemented" — wire up when W0-PROBE-1 reports
  ≥80% VERIFIED on the v2 contract.

Mock fixtures live alongside the mock module (no separate `__fixtures__/`
folder yet — kept inline for v0). For Playwright visual baselines, the
mock module is read at server-render time; no separate Playwright mock
server entry is needed for v2 routes (the existing `test/mobile-mock-api.mjs`
covers v1 routes only).

### Prod guard

Every v2 page entry point (`page.tsx`, `task/[id]/page.tsx`,
`skills/page.tsx`, `skills/[slug]/page.tsx`) calls
`assertV2Available()` from `src/lib/grove-api.v2.ts` before reading
from any v2 fetcher. The guard behaves like this:

| `VERCEL_ENV`   | `GROVE_API_MODE` | Result                           |
|----------------|------------------|----------------------------------|
| `production`   | `live`           | renders against api.grove.md     |
| `production`   | `mock` / unset   | **404** (guard fires)            |
| `preview`      | anything         | renders (mock-mode dogfood path) |
| unset (dev/CI) | anything         | renders (mock-mode)              |

Shipping mock data to real users is worse than a 404 — it's a lie. The
guard exists so a `main` deploy without `GROVE_API_MODE=live` configured
in Vercel can't accidentally expose fake tasks. To open v2 in prod:
flip `GROVE_API_MODE=live` in the Vercel production environment after
api.grove.md ships the v2 contract (W0-PROBE-1 must report ≥80%
VERIFIED first).

The Vercel preview channel intentionally renders mock data so dogfood
paths and PR-preview review still work end-to-end.

## Non-negotiables

1. **The design system is law.** Five brand tokens (cream, ink, moss, harvest,
   earth). Two font weights (400, 500). Four opacity stops (100, 60, 40, 15).
   One default radius (`rounded-md` = 8px). No shadows. No gradients. No
   backdrop-blur. No emoji. No exclamation marks. No title-case headings.
2. **Mobile first, 375px or bust.** `npm run test:mobile` must pass.
3. **The app is the plumbing.** It owns no vault state. All data flows
   through the Grove server at `api.grove.md`.
4. **Keep deps minimal.** Before adding a package, check whether Next/React
   or the existing deps can do it. `package.json` stays small on purpose.

## Before shipping a UI change

Run **`npm run check`** — the fast gate. It runs three things:

1. **`npm run lint:drift`** (`scripts/drift-check.sh`) — grep-based drift
   detector. Every forbidden pattern in `DESIGN.md` has a rule. Passes in
   under a second. Exits non-zero on any violation.
2. **`npm run typecheck`** — `tsc --noEmit` against the workspace.
3. **`npm run test`** — vitest unit + integration.

Then run **`npm run check:full`** — the slower, visual gate. It adds:

4. **`npm run test:mobile`** — Playwright asserts no horizontal scroll at 375px
   across representative routes.
5. **`npm run test:visual`** — Playwright diffs every key route against
   committed screenshots at 375px and 1280px. Any pixel drift fails.

When a visual change is intentional, run
**`npm run test:visual:update`** to regenerate the baselines. Commit the
`test/__screenshots__/` diff alongside the code change so the next diff
is meaningful.

If a drift-check false-positive crops up, edit `scripts/drift-check.sh` —
don't work around it in product code.

## CI

Two workflows live under `.github/workflows/`:

- **`check.yml`** — runs on every PR and every push to `main`. Three parallel
  jobs:
  - **verify**: `npm ci` → typecheck → build → vitest → Playwright mobile
    (no horizontal scroll at 375px) → drift-lint
  - **audit**: `npm audit --audit-level=high`
  - **secrets**: gitleaks scan
  Typically ~90s. Fails the PR if anything is red.
- **`visual.yml`** — runs on PRs that touch `src/`, `public/`, or test
  config. Uses the pinned `mcr.microsoft.com/playwright:v1.59.1-jammy`
  Docker image so pixel diffs are deterministic across runners. When
  you need to regenerate baselines for an intentional visual change:
  Actions → visual → Run workflow → check "update baselines". The job
  runs `test:visual:update` and commits the new PNGs back to the branch.

Dependabot (`.github/dependabot.yml`) opens a weekly grouped PR for npm
minor/patch bumps, and a monthly grouped PR for GitHub Actions pins.
Dev-dep majors ride along in the same weekly PR; production majors come
as individual PRs. Next.js / React majors are ignored outright — if one
ever appears, `dependabot-auto-merge.yml` routes it to human review.

**`dependabot-auto-merge.yml`** runs on every Dependabot PR, classifies
the update with `dependabot/fetch-metadata@v2`, and enables GitHub's
native `--auto --squash` on anything that isn't a framework major. The
actual merge fires when the required status checks go green — CI is
still the gate; auto-merge is just the trigger. Uses `AUTOMERGE_PAT`
(stored as a repo secret) instead of the default `GITHUB_TOKEN` so
commits the workflow pushes retrigger CI normally.

## Pre-push hook (opt-in)

`.githooks/pre-push` runs `npm run check` before every push so drift /
type / test failures don't burn a CI minute. Opt in once per clone:

```bash
git config core.hooksPath .githooks
```

Opt out with `git config --unset core.hooksPath`. Bypass a single push
with `git push --no-verify` (don't make a habit).

## Branch protection (configured on GitHub)

Recommended for `main`:

- Require pull request before merging.
- Require the `check / verify`, `check / audit`, and `check / secrets`
  status checks to pass.
- Require branches to be up to date before merging.
- Disallow force pushes and branch deletion.

Enable at github.com/jmilinovich/grove-www → Settings → Branches →
Branch protection rules.

## Primitives

- `src/components/primitives/button.tsx` — the only button. Don't re-roll
  inline buttons.
- Icons come from `lucide-react`. Don't hand-roll SVGs unless the icon is
  truly custom (logos, sparklines, charts).

## Merging PRs — standing authorization

You are authorized to merge PRs into `main` without asking first, *if*
the following are all true:

- CI is green: `check / verify`, `check / audit`, `check / secrets` all
  SUCCESS. Visual regression SUCCESS when the PR triggers it.
- `mergeable == "MERGEABLE"` and `mergeStateStatus` is `CLEAN` (or
  `UNSTABLE` only if the sole red check is `visual` and the PR
  doesn't touch UI — then regenerate baselines via
  `gh workflow run visual.yml --ref <branch> -f update_baselines=true`).
- Not a draft.
- No `changes requested` review.
- No label named `needs-human`, `wip`, or `do-not-merge`.
- For Dependabot PRs: any version bump passing CI is fair game,
  including majors of dev tooling (TypeScript, @types/*, Playwright,
  vitest). Framework majors (`next`, `react`, `react-dom`) are always
  off-limits — Dependabot is configured to skip them but check anyway.

Default action for PRs you open yourself: `gh pr merge <n> --auto --squash --delete-branch`. This uses GitHub's native auto-merge queue — the PR sits until required checks pass, then merges without a second touch. No more "wait for CI, come back, merge" round trips.

For existing PRs that are already green, `gh pr merge <n> --squash --delete-branch` still works.

Stale PRs (DIRTY) from Dependabot: comment `@dependabot rebase` and
re-check status before merging.

Ask before merging when:
- The PR changes `DESIGN.md`, `AGENTS.md`, `GOAL.md`, or `README.md`
  substantively (reviewer judgment needed).
- The PR removes tests, lowers the drift/lint/verify bar, or disables
  status checks.
- CI is red for a reason that isn't "rebase onto current main."
- The PR author is a first-time external contributor.

### GitHub auth note

The `gh` CLI used for merges must have the `workflow` scope to merge
PRs that touch `.github/workflows/*`. If `gh pr merge` fails with
"refusing to allow an OAuth App to create or update workflow", run
`gh auth refresh -s workflow` once to grant the scope. Those PRs
(usually Dependabot-updating an Actions version) are otherwise safe
to merge.

### Test stability

Playwright tests that click a React-rendered element after `goto` must
use `waitUntil: "networkidle"`, not `"domcontentloaded"`. The latter
fires before React attaches event handlers; on Linux CI the click
lands on a dead DOM element and the test times out waiting for state
that never arrives. The share-modal spec is the reference; copy its
pattern when writing new interactive tests.

