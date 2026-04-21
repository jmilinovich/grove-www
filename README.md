# grove-www

The web surface for Grove — a hosted knowledge API that makes Obsidian
vaults searchable and writable from any Claude client.

This is the marketing site, the note viewer, and the dashboard, all in one
Next.js app. It talks to the Grove server at `api.grove.md`; it owns no
vault state itself.

## Quick start

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`.

Requires the Grove server running locally (or pointed at production). See
`/Users/jm/src/grove/README.md` for server setup.

## Scripts

```bash
npm run dev          # dev server with fast refresh
npm run build        # production build
npm run start        # run the production build locally

# Verification — run before opening a PR
npm run check        # fast: drift-lint + typecheck + vitest
npm run check:full   # fast + mobile-scroll + visual-regression (~30s)

# Individual gates
npm run lint:drift         # bash scripts/drift-check.sh — grep for design violations
npm run typecheck          # tsc --noEmit
npm test                   # vitest unit / integration tests
npm run test:mobile        # Playwright: no horizontal scroll at 375px
npm run test:visual        # Playwright: pixel-diff key routes at 375 + 1280
npm run test:visual:update # regenerate screenshot baselines (intentional changes)
npm run test:e2e           # full end-to-end Playwright suite
```

## Mobile baseline

Every page must render without horizontal scroll at **375 × 667** (iPhone SE).
That's the guaranteed baseline; anything narrower is out of scope.

The regression guard loads each representative route at 375 px and asserts
`document.documentElement.scrollWidth <= clientWidth + 1`:

```bash
npm run test:mobile
```

It boots a local mock of `api.grove.md` and a fresh `next dev` on an isolated
`NEXT_DIST_DIR` so it doesn't collide with your running dev server. New
pages must pass this test before merge.

## Design

Read `DESIGN.md` before writing any UI. The design system is prescriptive —
five brand tokens, two font weights, four opacity stops, one radius default,
no shadows, no gradients. It's the whole spec for visual decisions and it's
enforced by `npm run check`.

The two gates that keep drift out:

- **`scripts/drift-check.sh`** — grep-based lint. Every rule in DESIGN.md
  maps to a pattern. Runs in under a second. Update it whenever a rule
  changes in DESIGN.md.
- **`test/visual.spec.ts`** — Playwright screenshot diff across 8 key
  routes × 2 viewports. Catches what grep can't (layout shifts, spacing
  regressions, component drift). Baselines live in
  `test/__screenshots__/` and are version-controlled.

## Merging

CI runs automatically on every PR and every push to `main`
(`.github/workflows/check.yml`): drift lint, typecheck, build, unit tests,
mobile test, `npm audit --audit-level=high`, gitleaks secret scan. Visual
regression runs separately (`.github/workflows/visual.yml`) in a pinned
Playwright Docker image and can regenerate baselines on manual dispatch.

Dependabot proposes weekly grouped npm updates and monthly GitHub Actions
bumps.

Optional local pre-push hook runs the fast check before every push:

```bash
git config core.hooksPath .githooks
```

Branch protection should require the `check` workflow's status checks to
pass before merge to `main`. See `AGENTS.md` for the recommended
configuration.

## Related docs

- `DESIGN.md` — the design system (tokens, rules, do's and don'ts)
- `GOAL.md` — product intent and the landing-page structure
- `AGENTS.md` — quick warnings for agents working in this repo
- `CLAUDE.md` — agent instructions (points at `AGENTS.md`)
