<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# grove-www — agent notes

## Before shipping a change

Run **`npm run check`** — the fast local gate. It runs:

1. `npm run typecheck` — `tsc --noEmit`.
2. `npm test` — vitest unit + integration.

For UI changes, also run **`npm run test:mobile`** — Playwright asserts no
horizontal scroll at 375 × 667 across representative routes. That's the
guaranteed mobile baseline; anything narrower is out of scope.

The same checks run in CI on every PR and push to main
(`.github/workflows/check.yml`), plus `npm audit --audit-level=high` and a
gitleaks secret scan. CI must be green before merge.

## Pre-push hook (opt-in)

`.githooks/pre-push` runs `npm run check` before every push so local
regressions don't burn a CI minute. Opt in once per clone:

```bash
git config core.hooksPath .githooks
```

Opt out with `git config --unset core.hooksPath`. Bypass a single push
with `git push --no-verify` (don't make a habit).

## Branch protection (configure on GitHub)

Recommended for `main`:

- Require pull request before merging.
- Require the `check / verify`, `check / audit`, and `check / secrets`
  status checks to pass.
- Require branches to be up to date before merging.
- Disallow force pushes and branch deletion.

Enable at github.com/jmilinovich/grove-www → Settings → Branches →
Branch protection rules.

## Dependencies

Dependabot (`.github/dependabot.yml`) opens a weekly grouped PR for npm
minor/patch bumps and a monthly PR for GitHub Actions version pins.
Next.js / React majors come as individual PRs — review by hand.
