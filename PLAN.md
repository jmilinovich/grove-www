# Grove v2 Dashboard — PLAN.md

> Operational sibling to [`SPEC.md`](./SPEC.md), [`GOAL.md`](./GOAL.md), [`DESIGN.md`](./DESIGN.md), [`AGENTS.md`](./AGENTS.md). Forward-looking; completed work collapses into "what was built" summaries.

**Status:** Week 0 — Backend Contract Gate
**Last updated:** 2026-05-13 (post-panel-review)

---

## Reading order for a cold-start agent

1. `GOAL.md` — product intent
2. `SPEC.md` — the v2 dashboard contract
3. `DESIGN.md` — design system (law)
4. `AGENTS.md` — operational rules (drift / typecheck / test gates, mobile 375px, merge authorization)
5. This file — what to build, in what order, with what acceptance criteria

Every task below is **self-contained**: an agent reads the task block, knows the files to touch, the interface to honor, the tests to write, and how to verify done. Gaps in a task are plan bugs — fix them here, don't guess in implementation.

---

## Implementation order (dependency DAG)

```
Week 0                Week 1                       Week 2                     Week 3
─────────             ─────────                    ─────────                  ──────────
W0-MOCK-1   ─────────►W1-DESIGN-1                                              W3-FIRSTRUN-1
W0-PROBE-1            W1-KBD-1                                                 W3-SKILLS
                      W1-LIB-1 ─┐                                              W3-TASK-1 ─►W3-REVIEW-1
                      W1-PRIM-1 ┤                                              W3-FAIL-1
                      W1-PRIM-2 ┤                                              W3-SHORT-1
                      W1-PRIM-3 ┼─►W2-LIST-1 ──┐                               W3-SWAP-1 (LAST)
                      W1-PRIM-4 ┘  W2-LIST-2 ──┴──►W2-PAGE-1 ──►W2-ACTIONS
                      W1-ROUTE-1
```

**Critical path:** W0 → W1-LIB-1 + W1-PRIM-{1,2,3} + W1-KBD-1 → W2-LIST-{1,2} → W2-PAGE-1 → W2-ACTIONS → W3-FIRSTRUN-1 + W3-SWAP-1.

**Concurrency policy** (D-16): **sequential PRs, one task per PR**. No batch runner. Per-PR auto-merge under AGENTS.md standing authorization.

---

## Current state (May 2026)

**Codebase:** Next.js 16.2.4, React 19.2.5, TypeScript strict, App Router (RSC + Server Actions), Tailwind 4 + locked DESIGN.md tokens, vitest + Playwright. Vercel deploy.

**Verified facts** (from codebase scan, not assumed):
- `src/app/(resident)/[atHandle]/[vaultSlug]/page.tsx` **does not exist** (`dashboard/`, `settings/`, `images/`, `layout.tsx` do). W1-ROUTE-1 creates it new.
- `src/app/(resident)/[atHandle]/[vaultSlug]/layout.tsx` **exists** — extended (not replaced) for the client-shell boundary.
- Root `src/app/layout.tsx` already mounts a `<CommandPalette>` bound to `⌘K`. The new shortcuts cheatsheet binds `⌘/` and **augments** the existing command palette; does not replace it.
- `src/lib/grove-api.ts` exports note-fetching primitives (`fetchNote`, `listNotes`, `searchNotes`) — backlog/task/skill primitives are net-new.
- `src/components/primitives/button.tsx` is the only primitive that exists.
- No `cacheComponents` flag yet in `next.config.ts`; gated by W0-MOCK-1's config update.
- No `_actions.ts` exists in the resident folder; created new in W2-ACTIONS.
- Mock-mode Playwright fixtures live at `test/mobile-mock-api.mjs` + `test/multi-resident-mock-api.mjs` — both must be extended in W0-MOCK-1.
- Test layout convention: Playwright specs in `test/`. Vitest unit tests co-locate next to the unit (no `__tests__/` subfolder; use `foo.test.ts` next to `foo.ts`). This plan follows that.

**Backend (api.grove.md) state:** Provenance read API confirmed (`provenance_blame`). Everything else (skill registry, scheduler, task CRUD, review writes, throughput aggregation) is **not yet confirmed**. W0-PROBE-1 quantifies the gap.

**Backend strategy:** mock api.grove.md inside grove-www via `GROVE_API_MODE=mock` env flag. UI ships against mock through weeks 1–2; swap to real backend in week 3 or stays on mock for production-soft-launch if backend isn't ready.

**Ship strategy:** v2 lives at `/{atHandle}/{vault}` (currently 404); v1 stays at `/{atHandle}/{vault}/dashboard`. W3-SWAP-1 is the single PR that makes v2 the default landing route by updating home links.

---

## Design decisions log

Cross-references to SPEC.md (load-bearing or non-obvious choices).

| # | Decision | Source | Why |
|---|---|---|---|
| D-1 | Hybrid primitives (task atom + skill + throughput meter) | SPEC §1 | Pure state-machine over-collapses; pure orthogonal types over-fragments |
| D-2 | Backlog dominant, review pinned, capacity in header | SPEC §2 | Backlog IS the homepage per thesis |
| D-3 | Surface-only first run (no vault writes for 30s) | SPEC §3, §12 | Panel-flagged trust bomb |
| D-4 | Tasks-cleared + time-equivalent tooltip; "≈2 weeks at your pace" headline | SPEC §4 | Empirical: Devin/Replit/Lovable moved off tokens; emotional framing > metric |
| D-5 | Conservative cadence + front-loaded one-shots | SPEC §5 | Liveness without AI sprawl |
| D-6 | Ritual review only in v2; in-flow provenance read-only | SPEC §6 | One review surface = one bug surface |
| D-7 | Capacity dial hidden during first 14 days | SPEC §7, §8 | Earned, not imposed |
| D-8 | Free: 1 cadenced + 15 one-shots + per-run cost ceiling | SPEC §8 | Habit-building + unit-econ ceiling |
| D-9 | First-class Skills nav; no Browse tab in v2 | SPEC §9 | Marketplace = v3 |
| D-10 | One UI, biased by surface | SPEC §10 | Each form factor optimizes for what it's good at |
| D-11 | 15s polling-on-focus; no SSE | SPEC §11 | Vercel function timeouts make SSE the wrong fit |
| D-12 | Server Actions for all mutations | SPEC §14.4 | CSRF-resistant by construction in Next.js 16 |
| D-13 | Cache Components in the data layer (`'use cache'` on `fetchBacklog`); no standalone `/api/backlog` route handler | This plan, per Architect panel | One cache origin per tag — `revalidateTag` works correctly; no race between RSC fetch and route-handler fetch |
| D-14 | Mock api.grove.md in grove-www | This plan | Decouple UI velocity from backend slips |
| D-15 | Keyboard-first on desktop (W1 primitive, not polish) | SPEC §15 | Power-user triage without mouse |
| D-15a | Keyboard bindings live on the parent **list** (NeedsReviewList / BacklogList / SkillsPage), not on `TaskCard` | This plan, per Architect | TaskCard is reused across surfaces; `r` means "run" in Pending list, "refine" in Review list — collision resolves at the parent |
| D-15b | No chord sequences (`g b`, `g s`); single keys + modifier chords only | This plan, per Scope Cop | Chord sequences are Linear-imitation; v2 doesn't need them; reintroduce if Skills traffic justifies |
| D-15c | Cheatsheet content is **hardcoded** from SPEC §15, not a dynamic registry | This plan, per Scope Cop + Architect | One consumer = premature abstraction. Static list survives React 19 strict mode + RSC boundaries trivially |
| D-15d | Cheatsheet bound to `⌘/`; existing `<CommandPalette>` keeps `⌘K` | This plan, per Architect | Augment, don't replace |
| D-16 | Sequential PRs, one task per PR | This plan | Matches AGENTS.md standing auto-merge authorization |
| D-17 | v2 at new route, swap last | This plan | Lower risk than in-place replacement |
| D-18 | New homepage at `/{atHandle}/{vault}` | This plan | v1 keeps `/dashboard`; v2 takes the bare vault root |
| D-19 | Server Actions split into per-domain files (`_actions/tasks.ts`, `_actions/skills.ts`, `_actions/review.ts`) | This plan, per Architect | Five future PRs touching one file = merge conflicts |
| D-20 | No `@tanstack/react-virtual`, no `date-fns` | This plan, per Scope Cop + AGENTS.md | Native scroll for <500 items; `Intl.RelativeTimeFormat` for time formatting |
| D-21 | No `pendingMutations` Set; `useOptimistic` is the entire mutation pattern | This plan, per Scope Cop + Architect | React 19 native primitive; reinventing it is the bug |

---

## Scope guard (v3-deferred — do NOT slip in)

Per SPEC.md "Explicitly deferred to v3" — anything in this list appearing as a task is scope creep:

- Skills marketplace Browse/Install/Author tabs
- `/throughput` dedicated route with charts
- `/settings/billing` integration with capacity dial
- In-flow review write-actions on note pages (badges stay read-only)
- SSE real-time
- Power tier
- Motion tokens + framer-motion
- "Pro tier clears by Friday" upgrade-projection math
- Push / email notifications
- Day-7 returning-user banner (cut from v2 per panel — re-add when usage data justifies)
- Dismissed-task recovery filter (cut from v2 — re-add if users file the bug)
- Mobile swipe gestures (cut from v2 — keyboard nav handles desktop; mobile uses standard tap)

**If a task feels like it needs one of these, stop and update SPEC.md first** — don't fork the contract in implementation.

---

## Verification standards

A task is "done" when ALL of:

1. **PR open, CI green** — `npm run check` (drift + typecheck + vitest) and, for UI-touching PRs, `npm run check:full` (+ mobile no-scroll 375px + visual regression with intentional baseline updates committed).
2. **Acceptance criteria** are all assertable and asserted in the named test file.
3. **Docs updated** — `DESIGN.md` for new tokens, `AGENTS.md` for new conventions, only when actually needed.
4. **Visible verification** — for UI tasks, the task block names the Playwright spec that exercises the change at 375px and 1280px.
5. **Keyboard map documented** — for any interactive component, the task block enumerates its keyboard bindings.
6. **No drift introduced** — `npm run lint:drift` continues to pass; if a new pattern requires a whitelist, update `scripts/drift-check.sh` in the same PR.

**Server Action error contract** (D-12): Server Actions throw `AuthError` (no cookie), `ApiError` (api.grove.md rejected), or `ValidationError` (bad input). Client islands catch and surface inline error via `useOptimistic`'s natural revert + a small `<Toast />` (built-in to v1; check `src/components/`).

**PR merge:** `gh pr merge <n> --auto --squash --delete-branch` (AGENTS.md standing authorization for green CI). Tasks marked **"Needs human review"** below are exceptions per AGENTS.md (DESIGN.md / AGENTS.md substantive changes).

---

# Phases

## Phase W0 — Backend Contract Gate (0.5 week)

Gates everything else. The probe surfaces backend reality; the mock unblocks UI in spite of gaps.

### W0-PROBE-1 — Probe api.grove.md against v2 contract

A script that hits the 5 endpoints week 1–2 needs and reports VERIFIED / GAP / PARTIAL per endpoint. Outputs a markdown table + exit code. Run weekly.

**Endpoints probed (v2 critical path only — other 7 SPEC endpoints probed when their consumer ships):**
1. `GET /tasks?vault={slug}` — list backlog
2. `POST /tasks/{id}/run` — trigger now
3. `GET /tasks/{id}` (with `provenance_blame`) — task detail
4. `GET /throughput?vault={slug}` — throughput view
5. `GET /skills?vault={slug}` — skill list

**Files:**
- `scripts/probe-grove-api.ts` — new
- Add `probe:api` to `package.json` scripts

**Behavior:** Loads `GROVE_API_URL` + a probe API key (env var, not committed). Calls each endpoint with a fixture vault. Reports shape mismatches as PARTIAL, non-2xx as GAP. Exits 0 if ≥80% VERIFIED, 1 otherwise.

**Tests:** `test/probe-grove-api.spec.ts` — happy-dom + intercepted fetch:
- Probe returns VERIFIED when shape matches
- Probe returns PARTIAL when extra/missing fields
- Probe returns GAP on 4xx/5xx
- Exit code 0 when ≥80% VERIFIED; 1 otherwise

**Acceptance criteria:**
- Running against deliberately-broken mock fixture returns exit 1
- Running against correct mock fixture returns exit 0
- Output is human-readable markdown + machine-parseable when `--json` flag passed

**PR title:** `feat(probe): grove api v2 contract probe (5 critical endpoints)`

**Decision baked in:** PLAN.md is updated with the probe result under "what was built" when W0 closes. If <80%: W2 work blocks until probe passes OR mock-mode is used through production (decided by John).

---

### W0-MOCK-1 — Mock api.grove.md inside grove-www

The data spine that backs the entire v2 UI build through weeks 1–2 (and potentially production if real backend slips).

**Files:**
- `src/lib/grove-api.types.ts` — new shared type module: `Task`, `Skill`, `ThroughputView`, `Cadence`, `ReviewAction`, `GroveProvenance` (verbatim from SPEC §14.1)
- `src/lib/grove-api.v2.ts` — new module exporting v2 functions
- `src/lib/grove-api.v2.mock.ts` — in-memory mock implementation
- `src/lib/grove-api.v2.live.ts` — live implementation calling `api.grove.md`
- `src/lib/__fixtures__/mock-tasks.ts` — 25 tasks across states (3 review, 12 pending, 8 done, 2 dismissed)
- `src/lib/__fixtures__/mock-skills.ts` — 7 built-in skills per SPEC §14.8
- `src/lib/__fixtures__/mock-throughput.ts` — derived from task set
- `.env.example` — add `GROVE_API_MODE=mock`
- `next.config.ts` — enable Cache Components: `experimental: { cacheComponents: true }`
- `test/mobile-mock-api.mjs` + `test/multi-resident-mock-api.mjs` — extend with backlog routes returning mock data when `GROVE_API_MODE=mock`
- `scripts/drift-check.sh` — whitelist `rgba(212,137,10,0.15)` if it appears in DESIGN.md token literals (W1-DESIGN-1)
- `AGENTS.md` — add **Mock mode** subsection: env flag, fixture location, persistence model (in-memory module singleton; restart resets state)

**Interface contract** (v2 module exports — same signatures for `.mock.ts` and `.live.ts`):

```typescript
// grove-api.v2.ts — re-exports based on GROVE_API_MODE
export async function fetchBacklog(vault: string): Promise<{
  reviewTasks: Task[];
  pendingTasks: Task[];
  clearedTasks: Task[];
  throughput: ThroughputView;
  skills: Skill[];
}>;
export async function fetchTask(taskId: string): Promise<Task>;
export async function runTask(taskId: string): Promise<void>;
export async function deferTask(taskId: string, until: ISO8601): Promise<void>;
export async function dismissTask(taskId: string): Promise<void>;
export async function reviewTask(taskId: string, action: ReviewAction): Promise<void>;
export async function fetchSkills(vault: string): Promise<Skill[]>;
export async function fetchThroughput(vault: string): Promise<ThroughputView>;
export async function configureSkill(slug: string, cadence: Cadence): Promise<void>;
export async function enableSkill(slug: string): Promise<void>;
export async function disableSkill(slug: string): Promise<void>;

// Auth: all functions read __Host-grove_token via existing src/lib/auth.ts getSession();
// throw AuthError if absent.
```

**Mock store** (in-memory module-level singleton; restart resets — documented at top of file):

```typescript
// src/lib/grove-api.v2.mock.ts
let mockStore = { tasks: [...MOCK_TASKS], skills: [...MOCK_SKILLS], lastVisit: null };
// Mutations (run, dismiss, review, configure) update mockStore in place.
// Subsequent reads reflect mutations. No persistence; this is dev/test data.
```

**Tests:** `test/grove-api.v2.mock.test.ts` — vitest with happy-dom:
- Each function returns the type contract
- `runTask(id)` mutates state visible in next `fetchBacklog()`
- `reviewTask(id, { kind: 'confirm-durable' })` removes from review queue
- AuthError thrown when no cookie
- Switching to `live` mode against unreachable URL produces network error, not mock data

**Acceptance criteria:**
- `GROVE_API_MODE=mock npm run dev` boots; mock data renders
- `npm run probe:api` against the mock fixtures returns 5/5 VERIFIED
- Playwright visual tests at 375px / 1280px render against mock without hitting real api.grove.md (verify with `nock`-style network spy in CI)
- `next.config.ts` has `cacheComponents: true`; `npm run check` still passes

**PR title:** `feat(api): mock grove-api for v2 (types + fixtures + cache components flag)`

**Needs human review per AGENTS.md** — adds AGENTS.md subsection, modifies `next.config.ts`, modifies `scripts/drift-check.sh`.

---

## Phase W1 — Foundation Primitives (1 week)

### W1-DESIGN-1 — Extend DESIGN.md with provenance badge + shortcut chip tokens

**Files:**
- `DESIGN.md` — add new sections per SPEC §14.5 + §15
- `globals.css` — register CSS custom properties for new tokens
- `scripts/drift-check.sh` — add whitelist exemptions OR (preferred) move new RGB literals into CSS custom properties so the drift check still rejects raw hex/rgba in components

**Tokens to add (frontmatter):**

```yaml
  provenance-badge-durable:
    backgroundColor: "{colors.surface}"
    color: "{colors.moss}"
    border: "1px solid {colors.surface-border}"
    borderRadius: "{rounded.sm}"
    paddingX: "0.4rem"
    paddingY: "0.1rem"
    fontFamily: "{typography.families.mono}"
    fontSize: "0.7rem"

  provenance-badge-perishable:
    backgroundColor: "{colors.surface}"
    color: "{colors.harvest}"
    border: "1px solid var(--harvest-15)"  # registered in globals.css; not a raw rgba
    borderRadius: "{rounded.sm}"
    # remaining identical to durable

  shortcut-chip:
    backgroundColor: "{colors.surface}"
    color: "{colors.text-secondary}"
    border: "1px solid {colors.surface-border}"
    borderRadius: "{rounded.sm}"
    paddingX: "0.3rem"
    paddingY: "0.05rem"
    fontFamily: "{typography.families.mono}"
    fontSize: "0.625rem"
```

**Acceptance criteria:**
- `npm run lint:drift` passes
- Each new token has a Do / Don't entry in the prose section
- No `rgba(...)` literals introduced outside `globals.css`

**PR title:** `design: provenance badge + shortcut chip tokens`

**Needs human review per AGENTS.md** — substantive DESIGN.md change.

---

### W1-KBD-1 — `useKeyboardShortcuts` hook + `<ShortcutChip />` primitive

The keyboard-first foundation. Scope per D-15a/b/c: per-list bindings, no chord sequences, no registry.

**Files:**
- `src/lib/use-keyboard-shortcuts.ts` — new hook
- `src/lib/use-keyboard-shortcuts.test.ts` — co-located vitest
- `src/components/primitives/shortcut-chip.tsx` — new primitive
- `src/components/primitives/shortcut-chip.test.tsx`

**Interface:**

```typescript
// Single-key and modifier-chord syntax only — NO sequential chords ("g b").
// Canonical key strings: 'r', 'Enter', 'Esc', '⌘k', '⌘/', 'Shift+Tab'.
// '⌘' resolves to metaKey on Mac, ctrlKey elsewhere. Hook owns the platform mapping.
type ShortcutBinding = {
  key: string;
  description: string;
  handler: () => void;
  when?: () => boolean;
  preventDefault?: boolean;
};

export function useKeyboardShortcuts(bindings: ShortcutBinding[]): void;
// No `useActiveShortcuts()` export — registry intentionally omitted per D-15c.
```

**Behavior:**
- Listens on `window` for `keydown` while mounted
- Ignores when focus is inside `<input>`, `<textarea>`, `[contenteditable]`
- `⌘` maps to `metaKey` on `navigator.platform.includes('Mac')`, `ctrlKey` otherwise
- `when` predicate gates context
- **Conflicting bindings:** first-mounted wins (silent — no throw). Document.
- Mobile: no mobile detection. The hook still mounts on mobile; nothing binds because there's no keyboard. ShortcutChip renders `null` via CSS `@media (hover: none)`, not JS.

**ShortcutChip:**

```typescript
interface ShortcutChipProps {
  keys: string;  // 'r', '⌘K'
}
export function ShortcutChip({ keys }: ShortcutChipProps): JSX.Element;
// Renders the shortcut-chip token. Hidden on mobile via CSS `@media (hover: none)`.
```

**Tests** (`use-keyboard-shortcuts.test.ts`):
- Single key fires handler
- Modifier chord fires with `preventDefault`
- Focus inside `<input>` blocks firing
- `when: () => false` blocks firing
- `⌘k` fires on metaKey when Mac, ctrlKey when non-Mac (test with `Object.defineProperty(navigator, 'platform', ...)`)
- Two components register the same key: first-mounted wins; second is silent
- Unmount removes listener; no leaks

**ShortcutChip test:**
- Renders Geist Mono, correct size
- Verify mobile-hidden via Playwright at 375px (visual baseline shows no chip)

**Acceptance criteria:**
- All vitest assertions pass
- Playwright visual at 375px confirms chip is hidden; at 1280px confirms chip renders

**PR title:** `feat(kbd): useKeyboardShortcuts hook + ShortcutChip primitive`

---

### W1-LIB-1 — `usePageVisibility` + `useBacklogPolling` hooks

**Files:**
- `src/lib/use-page-visibility.ts`
- `src/lib/use-page-visibility.test.ts`
- `src/lib/use-backlog-polling.ts`
- `src/lib/use-backlog-polling.test.ts`
- `src/lib/format-time.ts` — small `Intl.RelativeTimeFormat` wrapper (replaces `date-fns` per D-20)
- `src/lib/format-time.test.ts`

**Interfaces:**

```typescript
export function usePageVisibility(): boolean;
export function useBacklogPolling(opts?: { intervalMs?: number }): void;
// format-time.ts
export function formatRelative(iso: string): string;  // "2d ago", "in 3h"
export function formatScheduledTime(iso: string): string;  // "Mon 6am", "tonight 11pm"
```

**Tests** (vitest, happy-dom):
- `usePageVisibility` true initially, false when `visibilitychange → hidden`
- `useBacklogPolling` calls `router.refresh()` at interval while visible
- Polling fires zero refreshes within 100ms after `visibilitychange → hidden`
- Polling resumes within 100ms of focus regain
- Unmount → no leaks
- `formatRelative('2026-05-13T...')` returns plausible "Xd ago" string

**Acceptance criteria:** All assertions pass; no leaked intervals.

**PR title:** `feat(lib): page-visibility + polling + format-time utilities`

---

### W1-PRIM-1 — `<ProvenanceBadge />` primitive (read-only)

Built once; W3-PROV-1 wires it into note pages.

**Files:**
- `src/components/primitives/provenance-badge.tsx`
- `src/components/primitives/provenance-badge.test.tsx`

**Interface:**

```typescript
interface ProvenanceBadgeProps {
  voice: 'durable' | 'perishable' | 'legacy-unknown';
  basis?: string[];
  source?: string;
  reason?: string;
  by?: string;
  writtenAt?: string;
}
export function ProvenanceBadge(props: ProvenanceBadgeProps): JSX.Element | null;
```

**Behavior:**
- `legacy-unknown` → returns `null`
- Tap / Enter / Space toggles a popover with metadata
- `basis[]` renders as a list (test for ≥10 entries to catch XSS / overflow regressions)
- Esc closes popover, focus returns to trigger
- No write actions in v2

**Tests:**
- Renders correct chip per voice
- `legacy-unknown` → null
- Popover toggles on Enter / Space
- Popover renders `basis[]` as list; long list does not break layout
- Esc closes, focus returns

**Acceptance criteria:** Tests pass; Playwright baseline at 375px + 1280px.

**PR title:** `feat(primitives): ProvenanceBadge (read-only)`

---

### W1-PRIM-2 — `<TaskCard />` primitive

**Files:**
- `src/components/primitives/task-card.tsx`
- `src/components/primitives/task-card.test.tsx`

**Interface:**

```typescript
interface TaskCardProps {
  task: Task;
  skill: { slug: string; name: string };
  onRun?: () => void;
  onDefer?: () => void;
  onDismiss?: () => void;
  onOpen?: () => void;
  onRetry?: () => void;        // wired but only visible when task.state === 'failed'
  focused?: boolean;
  shortcuts?: { run?: string; defer?: string; dismiss?: string; retry?: string };
  // shortcuts visualize as ShortcutChips when present; parent list decides what to pass
}
export function TaskCard(props: TaskCardProps): JSX.Element;
```

**Critical decision (D-15a):** **TaskCard does NOT register keyboard shortcuts.** It receives callbacks; the parent list (NeedsReviewList, BacklogList) registers `useKeyboardShortcuts` for the focused row. This is why callbacks are optional — the parent passes what makes sense in its context.

**Layout:**

```
┌───────────────────────────────────────────────────────────┐
│ [skill chip]  Weekly journal patterns                     │
│  weekly · runs tonight 11pm · ~14m                        │
│  from your journal entries                                │
│                          [r] run  [e] defer  [d] dismiss  │
└───────────────────────────────────────────────────────────┘
```

**State variants:**
- Default: as drawn
- `task.state === 'failed'`: cream/earth tone, no harvest, `errorMessage` one-liner; shortcuts show `[r] retry [d] dismiss`
- `focused === true`: 2px moss left border (no shadow)

**Tests:**
- Renders all fields
- Click on action fires correct callback
- `task.state === 'failed'` renders retry instead of run
- ShortcutChip renders only when prop is passed AND viewport is desktop
- Mobile 375px: chips hidden, full-width row, no horizontal scroll

**Acceptance criteria:** Tests pass; Playwright visual at both viewports including failed-state variant.

**PR title:** `feat(primitives): TaskCard (callback-based; parent owns keymap)`

---

### W1-PRIM-3 — `<CapacityStrip />` primitive

**Files:**
- `src/components/primitives/capacity-strip.tsx`
- `src/components/primitives/capacity-strip.test.tsx`

**Interface:**

```typescript
interface CapacityStripProps {
  throughput: ThroughputView;
  planTier: 'free' | 'pro';   // upgrade CTA suppressed for Pro
}
export function CapacityStrip(props: CapacityStripProps): JSX.Element;
```

**Behavior:**
- Lead text from `throughput.estimatedClearText` ("warming up" or "≈2 weeks at your pace")
- Dropdown caret expands a small panel with `cleared7d`, `pending`, `rollingWeekVelocity`
- Upgrade CTA: visible only when `planTier === 'free' && throughput.showCeiling && throughput.pending > throughput.planCeiling`
- **No focus trap** (D — per Architect: focus trap on dropdown is screen-reader anti-pattern). Use `aria-expanded`, `aria-controls`; let Tab move out naturally.

**Tests:**
- "warming up" rendered when `rollingWeekVelocity === null`
- Projection rendered when not null
- Upgrade CTA visibility per `planTier` and gap math
- Enter on chip toggles expanded
- Esc collapses; focus returns to chip

**Acceptance criteria:** Tests pass; baseline both viewports, collapsed + expanded.

**PR title:** `feat(primitives): CapacityStrip (no focus trap; aria-expanded only)`

---

### W1-PRIM-4 — `<SkillCard />` primitive (installed variant)

**Files:**
- `src/components/primitives/skill-card.tsx`
- `src/components/primitives/skill-card.test.tsx`

**Interface:**

```typescript
interface SkillCardProps {
  skill: Skill;
  lastRunAt?: string;
  nextRunAt?: string;
  onRunNow?: () => void;
  onConfigure?: () => void;
  onDisable?: () => void;
  focused?: boolean;
  shortcuts?: { run?: string; configure?: string };
}
export function SkillCard(props: SkillCardProps): JSX.Element;
```

Same convention as TaskCard: parent owns keymap; SkillCard renders chips when shortcuts passed.

**Tests:**
- All fields render; "never" when `lastRunAt` undefined
- Handlers fire on click
- Disabled state grays out actions

**Acceptance criteria:** Tests pass; baseline both viewports.

**PR title:** `feat(primitives): SkillCard (installed variant)`

---

### W1-ROUTE-1 — New homepage route scaffold + client-shell boundary

**Files:**
- `src/app/(resident)/[atHandle]/[vaultSlug]/page.tsx` — NEW (file does not exist today)
- `src/app/(resident)/[atHandle]/[vaultSlug]/_client-shell.tsx` — NEW (client component boundary that mounts hooks)
- `src/app/(resident)/[atHandle]/[vaultSlug]/page.test.tsx`

**Architecture (per Architect):**
- `page.tsx` is a server component. It server-renders a placeholder.
- `_client-shell.tsx` is `'use client'`, mounted as a child of `page.tsx`. It mounts `useBacklogPolling()` and global keyboard shortcuts (`⌘/` for cheatsheet; `Esc` for modal dismiss).

**Behavior (this PR only):**
- Placeholder card: *"v2 dashboard — under construction (W2 will fill this in)"*
- Mounts `useBacklogPolling` (no-op while placeholder)
- Mounts global shortcuts: `⌘/` opens placeholder toast saying "shortcuts coming in W3"; `Esc` is a no-op stub
- v1 dashboard route at `/dashboard` unaffected

**Tests:**
- Route renders for authed user
- Placeholder card present
- Spy on `useBacklogPolling` confirms it's called (mount the page in vitest with a stub hook)
- `⌘/` does not crash (handler stub fires)

**Acceptance criteria:** Tests pass; visible at `/@me/<vault-slug>` in dev with `GROVE_API_MODE=mock`.

**PR title:** `feat(route): scaffold v2 route + client-shell boundary`

---

## Phase W2 — Backlog Homepage (1 week)

### W2-LIST-1 — `<NeedsReviewList />` composite (owns review keymap)

**Files:**
- `src/components/backlog/needs-review-list.tsx`
- `src/components/backlog/needs-review-list.test.tsx`

**Interface:**

```typescript
interface NeedsReviewListProps {
  reviewTasks: Task[];
  skillsBySlug: Record<string, Skill>;
  onConfirmDurable: (taskId: string) => void;
  onRefine: (taskId: string) => void;       // opens existing review modal — not inline textarea (D-15a + scope cop)
  onDismiss: (taskId: string) => void;
  onMarkStale: (taskId: string) => void;
}
```

**Behavior:**
- Up to 5 items collapsed; "see all N ▸" link when N > 5
- Hide section entirely when `reviewTasks.length === 0`
- **Owns the focused-row keymap:** `j/k` cycle focus; `Tab/Shift-Tab` move to/from BacklogList; per-row `c/r/x/s` fire callbacks. TaskCard inside doesn't bind anything.

**Tests:**
- Renders null when empty
- 5 items + "see all" link at N > 5
- j/k cycle focus state
- c/r/x/s on focused row call correct callback
- Tab moves focus out of this list (verify focus lands somewhere else)

**Acceptance criteria:** Tests pass; baseline both viewports.

**PR title:** `feat(backlog): NeedsReviewList with review keymap`

---

### W2-LIST-2 — `<BacklogList />` composite (owns pending keymap)

**Files:**
- `src/components/backlog/backlog-list.tsx`
- `src/components/backlog/backlog-list.test.tsx`

**Interface:**

```typescript
interface BacklogListProps {
  pendingTasks: Task[];
  clearedTasks: Task[];
  skillsBySlug: Record<string, Skill>;
  onRun: (taskId: string) => void;
  onDefer: (taskId: string) => void;
  onDismiss: (taskId: string) => void;
  onOpen: (taskId: string) => void;
}
```

**Scope cuts applied (per Scope Cop):**
- No virtualization library. Native `<ul>` scroll handles <500 items.
- Filter dropdown: **by skill only** in v2. Cadence/state filters are v3.
- No "+ run skill" popover. Affordance removed from mockup; deferred to v2.5 with skill marketplace.

**Behavior:**
- Pending list, then Cleared (last 7 days, capped at 20)
- Filter dropdown narrows Pending by skill
- "view ›" on Cleared section deeplinks to `/cleared` (placeholder route — 404 in v2, written in v3)
- **Owns the focused-row keymap:** `j/k` cycle; `Tab` moves to Cleared section (or out if Cleared empty); per-row `r/e/d/Enter` fire callbacks

**Tests:**
- Filter narrows list
- j/k cycle correctly
- r/e/d/Enter call correct callback on focused row
- Cleared section caps at 20
- 100+ items render without performance regression (basic Playwright timing assertion)

**Acceptance criteria:** Tests pass; visual baseline both viewports; mobile 375px no horizontal scroll.

**PR title:** `feat(backlog): BacklogList with skill filter + pending keymap`

---

### W2-PAGE-1 — v2 homepage `page.tsx` composing primitives + lists + cache layer

**Files:**
- `src/app/(resident)/[atHandle]/[vaultSlug]/page.tsx` — fully implement (replaces W1 placeholder)
- `src/app/(resident)/[atHandle]/[vaultSlug]/_client-shell.tsx` — extend to mount full keyboard shortcuts (global navigation)
- `src/lib/grove-api.v2.ts` — annotate `fetchBacklog` with `'use cache'` + `cacheTag(\`vault:\${slug}\`, 'backlog')` (per D-13: data-layer cache, no standalone route handler)
- `src/app/(resident)/[atHandle]/[vaultSlug]/page.test.tsx` (Playwright spec at `test/v2-homepage.spec.ts`)

**Composition:**

```tsx
export default async function VaultHomepage({ params }) {
  const data = await fetchBacklog(params.vaultSlug);  // cached via 'use cache'
  return (
    <main>
      <ClientShell>
        <CapacityStrip throughput={data.throughput} planTier={data.planTier} />
        <NeedsReviewList ... />
        <BacklogList ... />
      </ClientShell>
    </main>
  );
}
```

**Acceptance criteria:**
- Page renders against `GROVE_API_MODE=mock`
- `npm run check:full` green (mobile + visual)
- **Playwright spec `test/v2-homepage.spec.ts` asserts**: page issues second `fetchBacklog` call within 16s while focused (mock the timer + spy on fetch); zero calls within 30s of simulated `visibilitychange → hidden`
- Visual baseline at 375px + 1280px
- Keyboard: `g` is not a global; opening this route by typing in address bar or click; `j/k` work on the focused list

**PR title:** `feat(backlog): v2 homepage composition (cached data layer)`

---

### W2-ACTIONS — `_actions/tasks.ts` + run/defer/dismiss + optimistic UI

Per D-19 (split per-domain). Per D-21 (`useOptimistic` is the entire pattern; no `pendingMutations`).

**Files:**
- `src/app/(resident)/[atHandle]/[vaultSlug]/_actions/tasks.ts` — `'use server'` with `runTask`, `deferTask`, `dismissTask`, `retryTask`
- `src/app/(resident)/[atHandle]/[vaultSlug]/_actions/tasks.test.ts`
- TaskCard wires `onRun`/`onDefer`/`onDismiss` to the actions via a small client wrapper component
- BacklogList passes the wrapper down

**Implementation:**
- Each action: read cookie via `getSession()`, call `groveApiV2.{run,defer,dismiss}(taskId)`, then `revalidateTag(\`vault:\${slug}/backlog\`)`
- Throws `AuthError`, `ApiError`, `ValidationError` per the error contract
- Client wrapper uses `useOptimistic` to apply mutation immediately; on Server Action error, React reverts the optimistic state naturally and a `<Toast />` surfaces the error

**Tests** (vitest):
- Each action mutates mock store and `revalidateTag` fires (spy)
- Optimistic UI shows mutation immediately (`useOptimistic` test with simulated server delay)
- Server error → optimistic revert verified
- Auth error → no mutation; error surfaced

**Playwright spec** `test/v2-mutations.spec.ts`:
- Run a pending task → it disappears from Pending, appears in Done/Cleared
- Dismiss a task → it disappears from Pending; doesn't appear in Cleared (D: dismissed ≠ cleared)

**Acceptance criteria:** All actions work end-to-end against mock; optimistic behavior verified visually + via spec.

**PR title:** `feat(actions): tasks domain — run/defer/dismiss with useOptimistic`

---

## Phase W3 — Review + Skills + First-Run + Swap (1 week)

### W3-TASK-1 — `<TaskDetail />` page

**Files:**
- `src/app/(resident)/[atHandle]/[vaultSlug]/task/[id]/page.tsx`
- `src/components/task/task-detail.tsx`
- `src/components/task/task-detail.test.tsx`

**Behavior:**
- Server-renders task + provenance via `fetchTask` (cached)
- Renders title, description, scheduled-for, run history, related notes, provenance badges (W1-PRIM-1)
- Footer: primary action (run if pending; confirm if review; retry if failed)
- Keyboard (registered in the page-level client island): `↑/↓` cycle related notes; `Enter` primary action; `Esc` back to backlog

**Acceptance criteria:** Tests pass; baseline both viewports.

**PR title:** `feat(task): TaskDetail page`

---

### W3-REVIEW-1 — `<ReviewItem />` + `_actions/review.ts`

**Files:**
- `src/components/task/review-item.tsx`
- `src/components/task/review-item.test.tsx`
- `src/app/(resident)/[atHandle]/[vaultSlug]/_actions/review.ts` (per D-19)
- Playwright spec `test/v2-review.spec.ts`

**Behavior:**
- For `note-change` artifacts: side-by-side diff (desktop) or stacked (mobile)
- For `surface` artifacts: rendered text + source backlinks
- Actions: `c` confirm-durable, `r` refine (opens **modal**, not inline textarea — per Scope Cop), `x` dismiss, `s` mark-stale
- For write-type artifacts on first run of a skill: a per-action confirmation prompt: *"this skill will write to your vault. continue?"* (preference stored per-vault per-skill)

**Acceptance criteria:** All four actions work; first-write confirmation appears once per skill per vault; refine modal round-trips correctly.

**PR title:** `feat(review): ReviewItem + review domain actions`

---

### W3-PROV-1 — Wire `<ProvenanceBadge />` into note pages

**Files:**
- `src/app/(resident)/[atHandle]/[vaultSlug]/[...path]/page.tsx` — extend
- Helper: per-block provenance from `provenance_blame`
- Playwright spec extension

**Behavior:**
- Inline badges next to AI-authored sections
- Tap expands popover (W1-PRIM-1 mechanic)
- Footer link: *"this note has N perishable segments — review in your queue ›"* (deeplinks to backlog; filter logic deferred to v3, the link just lands on `/{atHandle}/{vault}`)

**Acceptance criteria:** Badges render on notes with provenance; popover works; deeplink lands on backlog homepage.

**PR title:** `feat(notes): inline provenance badges (read-only)`

---

### W3-SKILLS — Combined skills list + detail + `_actions/skills.ts`

Per Scope Cop: combine SKILLS-1 + SKILLS-2 into one PR.

**Files:**
- `src/app/(resident)/[atHandle]/[vaultSlug]/skills/page.tsx` — Installed tab
- `src/app/(resident)/[atHandle]/[vaultSlug]/skills/[slug]/page.tsx` — detail
- `src/app/(resident)/[atHandle]/[vaultSlug]/_actions/skills.ts` — `configureSkill`, `enableSkill`, `disableSkill`
- Playwright spec

**Behavior:**
- Installed: list of 7 hardcoded built-in skills (SPEC §14.8)
- Tabs: Installed (active), Browse (placeholder "coming in v3"), New (placeholder)
- Detail: description, sample tasks, cadence dropdown, enable/disable, run-now
- Keyboard (owned by the page): `j/k` cycle cards, `Enter` open, `r` run-now, `c` configure

**Acceptance criteria:** All actions wired; cadence changes persist (mock store); cards render at both viewports.

**PR title:** `feat(skills): installed skills + detail + skills domain actions`

---

### W3-FIRSTRUN-1 — Auto-install + auto-run + welcome punchline

**Files:**
- `src/app/(resident)/[atHandle]/[vaultSlug]/_first-run.ts` — server-side bootstrap helper
- `src/components/onboarding/welcome-review.tsx` — punchline UI
- Playwright spec `test/v2-first-run.spec.ts` with mock-api artificially delaying skill output

**Behavior:**
- On first authed visit AND no installed skills: server-side install Daily Vault Review, trigger immediate run (surface-only artifact)
- Pre-populate 3–5 starter pending tasks via a hardcoded array in `mock-tasks.ts` (per Scope Cop — not a schema field)
- Within 30s, the first review item lands with a one-line punchline: *"your first AI artifact is ready"*
- Subsequent reloads: no re-trigger. **First-run done flag** stored as a vault metadata key (mock store records it; api.grove.md schema TBD)

**Acceptance criteria** (Playwright):
- First load shows punchline within 30s of mock-api responding
- Second load does not re-trigger
- Auto-run artifact is `surface` type, not `note-change`

**PR title:** `feat(onboarding): surface-only first run + welcome review`

---

### W3-FAIL-1 — Failure-mode UX visible

Wires the failed-state UI scaffold that's already in TaskCard from W1-PRIM-2.

**Files:**
- Verify TaskCard handles `task.state === 'failed'` per W1-PRIM-2 visual spec
- `src/app/(resident)/[atHandle]/[vaultSlug]/_actions/tasks.ts` — add `retryTask` action
- Playwright spec extension

**Behavior:**
- Failed tasks shown with cream/earth tone, no harvest
- `errorMessage` one-liner visible
- Actions: `r` retry, `d` dismiss (bound from parent list per D-15a)
- Failed tasks excluded from `throughput.cleared7d`

**Acceptance criteria:** Failed visual matches DESIGN.md; retry queues new run; throughput math correct.

**PR title:** `feat(task): failure-mode + retry action`

---

### W3-SHORT-1 — Shortcuts cheatsheet on `⌘/`

**Files:**
- `src/components/keyboard/shortcuts-cheatsheet.tsx` — modal overlay
- Wire into the global keyboard handler in W1-ROUTE-1's client shell

**Behavior:**
- `⌘/` (or `Ctrl+/`) opens modal
- **Cheatsheet content is hardcoded** from SPEC §15 (per D-15c) — no dynamic registry
- Sections: Global, Backlog, Review, Task Detail, Skills
- `Esc` closes
- Mobile: `⌘/` doesn't register; cheatsheet is desktop-only

**Acceptance criteria:** Cheatsheet renders all SPEC §15 bindings; Esc closes; mobile no-op verified by Playwright at 375px.

**PR title:** `feat(kbd): shortcuts cheatsheet (⌘/)`

---

### W3-SWAP-1 — Route swap (LAST — gate on all other W3 green)

**Files:**
- Update home links / breadcrumbs to land on `/{atHandle}/{vault}` (today they target `/dashboard`)
- Confirm `/dashboard` v1 still serves
- Update marketing landing page CTA if it deep-links into the app

**Prerequisites (verify before merging):** Every other W3 task green; `/{atHandle}/{vault}` renders the full v2 homepage; `/{atHandle}/{vault}/dashboard` still renders v1.

**Acceptance criteria:**
- `/{atHandle}/{vault}` serves v2 in production
- `/{atHandle}/{vault}/dashboard` serves v1 unchanged
- No 404s on existing links
- Full `npm run check:full` green

**Rollback plan:** Revert this single PR. v2 components stay; route default reverts.

**PR title:** `feat(route): swap v2 to vault homepage default`

---

## What was built

> Each completed phase collapses here as a one-paragraph summary.

(Nothing yet — Week 0 in progress.)

---

## Plan gaps (resolve before relevant task starts)

These are open questions that don't block week 1 but must be resolved before the named task:

- **Mock-store backend persistence model** — RESOLVED: in-memory module-level singleton; restart resets state (per Scope Cop).
- **First-write confirmation modal copy** — TBD before W3-REVIEW-1.
- **First-run "done" flag storage** — TBD before W3-FIRSTRUN-1. Likely a per-vault metadata key in mock store; api.grove.md schema follows.
- **`/cleared` placeholder route behavior in W3-SWAP-1** — 404 OK or wire to filtered backlog view? Decide before W3-SWAP-1 merges.
