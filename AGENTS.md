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
minor/patch bumps, and a monthly PR for GitHub Actions version pins.
Next.js / React majors come as individual PRs — review by hand.

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
