This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Mobile baseline

Every page must render without horizontal scroll at **375 × 667** (iPhone SE). This is the guaranteed baseline — anything narrower is not supported.

The regression guard is a Playwright spec that loads each representative route at 375 px and asserts `document.documentElement.scrollWidth <= clientWidth + 1`:

```bash
npm run test:mobile
```

It boots a local mock of `api.grove.md` and a fresh `next dev` on an isolated `NEXT_DIST_DIR` so it does not collide with your running dev server. New pages must pass this test before merge.

## Merging

CI runs automatically on every PR and every push to `main` via
`.github/workflows/check.yml`:

- `npm run typecheck` — `tsc --noEmit`
- `npm run build` — Next.js production build
- `npm test` — vitest unit + integration (44 tests)
- `npm run test:mobile` — mobile scroll baseline (Playwright)
- `npm audit --audit-level=high` — flag known high/critical vulnerabilities
- `gitleaks` — scan for accidentally committed secrets

Dependabot proposes weekly grouped npm updates and monthly GitHub Actions
bumps.

Optional local pre-push hook runs the fast check before every push:

```bash
git config core.hooksPath .githooks
```

Branch protection should require the `check` workflow's status checks to
pass before merge to `main`. See `AGENTS.md` for the recommended
configuration.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
