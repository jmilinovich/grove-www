# Grove v2 Dashboard — Specification

*Final spec from `/mili:spec` workflow, 2026-05-13. Revised from `SPEC.draft.md` after three blind expert panel reviews (user/product, technical architecture, scope/scrutiny). Rooted in the [Grove product thesis: knowledge throughput as pricing](https://grove.md/@jm/personal/Resources/Concepts/grove-product-thesis-knowledge-throughput-as-pricing).*

---

## One-line claim

**Grove is the first knowledge tool where the AI's backlog is the homepage, not a sidebar.**

The thesis: knowledge graphs generate an ongoing supply of AI work; the rate at which it gets processed is the pricing axis. The v2 dashboard makes that legible.

---

## What this spec covers (and what it doesn't)

### In v2 scope (ship target: 3 weeks of UI work, gated on a 0.5-week backend contract milestone)

- Backlog homepage with Needs Review pinned + Pending + recent Cleared
- CapacityStrip header (text gap framing; no projection math)
- 5–7 built-in skills, hardcoded (no marketplace)
- Ritual review surface (the only place dispositions happen)
- Read-only provenance badges on note pages
- 15s polling-on-focus refresh (no SSE)
- Server Actions for all mutations
- Cache Components for backlog/throughput reads
- Accessibility spec at primitive level (week 1, not phase 6)
- Auto-run-on-signup that produces surface-only artifacts (no vault writes without explicit consent)
- Two tiers: Free + Pro
- Mobile-aware responsive layout (one UI; desktop-primary in practice — acknowledged)

### Explicitly deferred to v3 (with rationale)

- **Skills marketplace** (Browse / Install third-party / Author tools) — no third-party authors yet, dev experience undesigned, browse tab full of "coming soon" is worse than no tab
- **Dedicated `/throughput` route with charts** — CapacityStrip IS the v2 throughput view; charts pre-data are decoration
- **`/settings/billing` integration with capacity dial** — existing billing surface stays; capacity dial is a v3 build
- **In-flow review write-actions on note pages** — provenance badges read-only in v2; disposition happens only in the ritual Needs Review surface (one review surface = one bug surface)
- **SSE real-time** — Vercel function timeouts make 30s polling the real refresh path anyway; re-evaluate after launch
- **Power tier** — two-tier ship; Power introduces premature decisions about parallel execution + premium models
- **Motion tokens + framer-motion** — DESIGN.md has no motion vocabulary yet; designing motion is its own discipline
- **"Pro tier clears by Friday" upgrade projection** — requires per-tier compute telemetry that doesn't exist; ship gap framing as text only

---

## Context (codebase state, May 2026)

`grove-www`: Next.js 16.2.4 + React 19.2.5, TypeScript strict, App Router (RSC + Server Actions), Tailwind 4 with locked DESIGN.md tokens, Vercel-deployed, custom encrypted-cookie auth (`__Host-grove_token`) wrapping a Grove API key, magic-link flow, all vault operations server-side through SSR route handlers against `api.grove.md`.

v1 dashboard at `/{atHandle}/{vault}/dashboard` is six read-only stats cards. Access management has solid CRUD patterns. No client state library. No streaming. No skill-running UI. No review or labeling UI. No provenance display. The new `/api/backlog` patterns become the first write-capable surfaces.

**DESIGN.md is law:** 5 colors (cream / ink / moss / harvest / earth), 4 opacities (100 / 60 / 40 / 15), Lora + Inter + Geist Mono, 8px grid, Major Third scale, two weights, no shadows, no gradients.

---

## Design decisions (with rationale)

### 1. Interaction primitives — hybrid composition

Three primitive types:

- **Task atom** — states: `pending → running → review → done` (plus `dismissed` and `failed` terminals). One atom, state-machine UI.
- **Skill** — installable lens that generates tasks. Built-in only in v2 (no third-party authors).
- **Throughput meter** — derived view computed from task state and plan tier. Not an atom.

Pure state-machine over-collapses; pure orthogonal types over-fragments. Hybrid is the cleanest mental model.

### 2. Default layout — backlog dominant, review pinned, capacity in header

```
[Grove  vault@me                   🌿 ≈2 wks at your pace ▾]
─────────────────────────────────────────────────────────────
NEEDS REVIEW (3)
  • [skill chip] merge concepts? "Pappu" ≈ "Aparna"   from [[Yulie Kwon Kim]]
  • [skill chip] mark perishable as durable? (12d old)
  • [skill chip] 3 dup people detected
─────────────────────────────────────────────────────────────
PENDING (47)                           [filter] [+ run skill]
  • Weekly journal patterns         tonight 11pm    [skill chip]
  • Relationship surface            Mon 6am         [skill chip]
  • Concept-graph cleanup           on-demand       [skill chip]
  • Dormant thread surface          weekly          [skill chip]
─────────────────────────────────────────────────────────────
CLEARED THIS WEEK (23)                              view ›
```

**The headline is a feeling, not a metric** (Panel 1 critique applied). CapacityStrip lead: *"≈2 weeks at your pace"*. Counts (cleared / pending) live in the dropdown detail. Time-to-clear is the emotional axis.

**Every TaskCard carries a skill chip + source backlink** (Panel 1 critique). At a glance, every line is visibly *"from your graph,"* not user-authored. This is what differentiates v2 from a smarter to-do app.

### 3. Empty state — surface-only first run

On signup:
1. Daily Vault Review skill auto-installed
2. Skill runs against user's vault — produces **surface-only artifacts** (patterns, summaries, suggestions). **No vault writes.** Result is a "Needs Review" item showing what the AI noticed; user can promote any insight to a vault note with an explicit action.
3. 3–5 starter tasks pre-populate Pending — user can run any of them via the run button
4. Within 30s the user sees: 1 surface-only review item, 3–5 pending, capacity strip alive

**Auto-run never writes to the vault on first run.** This is the load-bearing trust call (Panel 3 prediction otherwise: viral *"Grove rewrote my vault"* complaint within first 100 users). Any skill that wants to write requires explicit per-action confirmation on its first execution against this vault.

### 4. Throughput unit — tasks-cleared + time-equivalent on hover, gap framing in headline

- **Headline (CapacityStrip)**: *"≈2 weeks at your pace"* — time-to-clear projection from rolling 4-week velocity vs current backlog
- **Detail (dropdown / tap)**: *"23 cleared this week · 41 pending · ~6 hrs cleared"*
- **Per-task hover/tap**: *"cleared Mon 11pm · ~14 min · 12 patterns surfaced"*

**"Dismissed" never counts as "cleared"** (Panel 3 gaming risk). Throughput counts only confirmed-or-completed tasks. Dismissed items have their own filter view.

### 5. Cadence — conservative cadenced + front-loaded one-shots

- **Cadenced**: 1 starter skill (Daily Vault Review) enabled by default
- **One-shots ready to run**: 3–5 pre-populated starter tasks in Pending the user can execute themselves on day 1 (Panel 1 fix for the "first 24h feels alive" problem)
- **Backpressure**: skills auto-pause cadence when Needs Review exceeds a threshold (default 10 items) so the queue doesn't pile up unattended (Panel 3 anti-pattern: "power user wakes up to 47 review items")

### 6. Review modality — ritual surface only in v2

- **Ritual**: Pinned Needs Review section at the top of the backlog. Disposition actions (confirm / refine / dismiss / mark stale) live here.
- **In-flow on note pages**: provenance badges are **read-only**. Tap to expand (source / basis / reason / voice). No disposition actions on note pages in v2 — one review surface = one bug surface (Panel 3).

The labeled-data flywheel still lives on the homepage. Provenance visibility lives everywhere AI has touched.

### 7. Capacity dial — gap as text, no projection math

- **What you typically do**: rolling 4-week velocity (post-day-28; before that, a "warming up" state)
- **What your plan allows**: tier ceiling
- **The gap**: surfaced as text — *"≈2 weeks at your pace"*

**No "Pro tier clears by Friday" projection** (Panel 3 prediction: removed within 90 days because per-tier compute model is unbuilt). Upgrade hook is a static comparison page, accessed from the CapacityStrip dropdown.

### 8. Free tier — generous one-shot allowance with per-run cost ceiling

- **Free**: 1 cadenced skill (Daily Vault Review, daily) + **15 one-shots/month** + browse-only marketplace placeholder
- **Pro**: All skills cadence-configurable + 100 one-shots/month + install third-party skills (when v3 ships)

**Per-run cost ceiling** rather than count-only (Panel 3 unit-econ risk). Each one-shot has a token ceiling; if a skill on a large vault would exceed it, the skill degrades quality (e.g., samples the vault rather than processing all of it) rather than hard-failing. Surfaced as: *"this run processed 80% of your vault; upgrade to Pro for full coverage."*

**Capacity dial hidden during the first 14 days of usage** (Panel 1 controversial take). Capacity is something earned, not imposed. New users see throughput (cleared / pending) but not the ceiling until they have rhythm.

### 9. Marketplace — placeholder only

**Skills page in v2 has one tab: Installed.** Lists the 5–7 hardcoded built-in skills. Configuration UI (cadence, triggers). Run-now affordance. **No Browse tab.** No third-party installs.

A small "Skills coming from the community" footer card teases v3; clicking takes the user to a marketing page. That's the entire marketplace presence in v2.

### 10. Form factor — one UI, biased by surface

Same routes, responsive layout. Every action possible on every form factor. Bias differs by what each form factor is good at:

- **Mobile bias**: single column, larger tap targets, full-screen task detail, condensed throughput chrome
- **Desktop bias**: multi-column where it fits, side-by-side diff in review, denser pending list, capacity strip more prominent

**Honest acknowledgment**: 5 of 7 routes are desktop-primary in practice. Mobile is fully functional but the broad-view + multi-pane affordances live on desktop (Panel 1 critique applied).

### 11. Real-time refresh — 15s polling-on-focus

- Client polls `/api/backlog` every 15s **while the tab is focused**
- Polling pauses when tab is hidden (visibility API)
- Polling resumes on focus regain
- **No SSE in v2** (Panel 2 + 3 converge: Vercel function timeouts make SSE unreliable; polling is fine for backlog liveness)
- Optimistic UI on user mutations via `useOptimistic` per TaskCard

### 12. First-run — surface-only choreography

```
t=0s    Signup magic-link verified; vault provisioned/imported
t=2s    Daily Vault Review auto-installed (server-side, no UI step)
t=3s    Skill starts running on the user's vault — SURFACE-ONLY output
t=4s    Dashboard renders with backlog skeleton; loading state for the running task
        3-5 pre-populated starter pending tasks appear (templates from skill spec)
t=15-25s Daily Vault Review completes → first Needs Review item lands
        CapacityStrip animates: throughput count ticks
t=30s   User sees: 1 surface-only review item, 3-5 pending, capacity strip alive,
        a one-line punchline: "your first AI artifact is ready"
```

**No vault writes during first 30s.** If the user wants to act on the surface-only artifact (e.g., promote a pattern to a vault concept), that's an explicit action.

### 13. Copy register — extend Grove's garden voice

- Lowercase section headers (`needs review`, `pending`, `cleared this week`)
- Quiet, declarative, no exclamation marks
- Light agrarian language only where it earns the metaphor — not theme park
- Lora for prose, Inter for chrome (per DESIGN.md)
- No first-person AI voice ("3 patterns this week" not "I found 3 patterns")

### 14. Plan tier names — Free / Pro for v2 ship

Garden-voiced names (Cultivator / Steward) deferred. Free / Pro is recognizable and ships.

---

## Specification

### 14.1 Interaction primitives — types

```typescript
type TaskState = 'pending' | 'running' | 'review' | 'done' | 'dismissed' | 'failed';

interface Task {
  id: string;
  skillId: string;
  title: string;
  description: string;
  state: TaskState;
  scheduledFor: ISO8601 | null;       // null = on-demand
  startedAt: ISO8601 | null;
  completedAt: ISO8601 | null;
  estimatedMinutes: number;
  actualMinutes: number | null;
  result: TaskResult | null;
  needsReviewReason?: string;
  sourceNotes?: string[];             // wikipaths to source notes for "from your graph" badge
}

type TaskArtifactType =
  | 'surface'       // read-only insight; v2 default for auto-runs (no vault write)
  | 'note-change'   // proposed diff; requires user confirmation in review
  | 'note-create'   // proposed new note; requires user confirmation
  | 'note-link'     // proposed wikilink addition; requires user confirmation
  | 'concept-merge' // proposed concept dedupe; requires user confirmation
  | 'failed';

interface TaskResult {
  artifact: {
    type: TaskArtifactType;
    diff?: NoteDiff;
    notePath?: string;
    surfaceText?: string;
  };
  provenance: GroveProvenance;        // voice, basis, source, reason
}

interface Skill {
  id: string;
  slug: string;
  name: string;
  domain: 'knowledge' | 'journal' | 'relationships' | 'health' | 'finances' | 'system';
  author: 'builtin';                  // v2: only built-in skills
  description: string;
  cadenceOptions: ('daily' | 'weekly' | 'on-trigger' | 'on-demand')[];
  defaultCadence: 'daily' | 'weekly' | 'on-trigger' | null;
  defaultArtifactType: TaskArtifactType;
  installState: 'installed' | 'available' | 'disabled';
  starterPendingTasks?: string[];     // titles for first-run pre-population
}

interface ThroughputView {
  rollingWeekVelocity: number | null; // null during first 14 days
  cleared7d: number;
  pending: number;
  estimatedClearText: string;         // "≈2 weeks at your pace" or "warming up"
  planCeiling: number;                // per week
  showCeiling: boolean;               // hidden during first 14 days
}
```

### 14.2 Routes

| Route | Purpose | Form-factor bias |
|---|---|---|
| `/{atHandle}/{vault}` | **Backlog homepage** | Both |
| `/{atHandle}/{vault}/task/{id}` | Task detail + run / review | Mobile-friendly full-screen |
| `/{atHandle}/{vault}/skills` | Installed skills (no Browse tab in v2) | Both |
| `/{atHandle}/{vault}/skills/{slug}` | Built-in skill detail + cadence config | Both |
| `/{atHandle}/{vault}/dashboard/*` | Existing vault admin — preserved as-is | Desktop |
| `/{atHandle}/{vault}/[...path]` | Existing note viewer + read-only provenance badges | Both |

### 14.3 Components (new)

| Component | Purpose | Mobile/Desktop notes |
|---|---|---|
| `<CapacityStrip />` | Header: text gap framing + dropdown for counts | Compact on mobile |
| `<NeedsReviewList />` | Pinned section; up to 5 collapsed; "see all" link | One-tap actions mobile |
| `<BacklogList />` | Pending tasks; filterable; polling-subscribed; windowed if >50 items | Single column mobile |
| `<TaskCard />` | Title + skill chip + source backlink + cadence + ETA + run/defer/dismiss | Larger tap targets mobile |
| `<TaskDetail />` | Full task detail: status, schedule, run history, provenance, related notes | Full-screen mobile |
| `<ReviewItem />` | Diff view (or surface text) + confirm / refine / dismiss / mark-stale | Side-by-side desktop; stacked mobile |
| `<ProvenanceBadge />` | Voice chip (durable / perishable) — **read-only in v2** | Tooltip desktop; sheet mobile |
| `<SkillCard />` (installed) | Cadence config + last-run + next-run + run-now + disable | Same layout both |
| `<RunSkillButton />` | Triggers one-shot run from backlog header | Modal mobile; popover desktop |
| `<UpgradePrompt />` | Gap-framed CTA: text only, no projection math | Bottom-sheet mobile; inline desktop |

**Accessibility spec at primitive level (week 1, not phase 6):**
- Every interactive primitive has documented keyboard map
- `<BacklogList />` re-renders via polling tick: `role="feed"` + `aria-busy` toggling + new items get `aria-live="polite"` announcement
- `<ProvenanceBadge />` tap-to-expand uses standard disclosure pattern with focus management
- `<ReviewItem />` swipe gestures (mobile) have keyboard equivalents on desktop (Enter = confirm, Cmd-X = dismiss, R = refine)
- Color tokens hit WCAG 2.2 AA contrast on cream-ink and moss-cream pairings (verify in DESIGN.md extension)

### 14.4 Server actions + API routes

**Server Actions** (CSRF-resistant by construction in Next.js 16):

```typescript
// All defined in src/app/(resident)/[atHandle]/[vaultSlug]/_actions.ts
'use server'

export async function runTask(taskId: string): Promise<void>
export async function deferTask(taskId: string, until: ISO8601): Promise<void>
export async function dismissTask(taskId: string): Promise<void>
export async function reviewTask(taskId: string, action: ReviewAction): Promise<void>
export async function configureSkill(slug: string, cadence: Cadence): Promise<void>
export async function enableSkill(slug: string): Promise<void>
export async function disableSkill(slug: string): Promise<void>

type ReviewAction =
  | { kind: 'confirm-durable' }
  | { kind: 'refine'; refinement: string }
  | { kind: 'dismiss' }
  | { kind: 'mark-stale' }
  | { kind: 'apply-write'; confirmed: true };  // for write-type artifacts; requires explicit confirmation
```

All Server Actions call `revalidateTag` after mutation so Cache Components serve fresh data on next poll.

**Route handlers** (read-only, cached):

| Route | Purpose | Cache pattern |
|---|---|---|
| `/api/backlog` | Paged tasks + throughput summary | `use cache` + `cacheTag('vault:{slug}', 'backlog')` |
| `/api/throughput` | ThroughputView | `use cache` + `cacheTag('vault:{slug}', 'throughput')` |
| `/api/skills` | Installed + available built-in skills | Static; revalidate hourly |

No SSE endpoint in v2. Polling is the refresh path.

### 14.5 Read-only provenance display on note pages

When user views any note touched by AI:
- Inline badges next to commit-authored sections: `durable` (moss, opacity 100) or `perishable` (harvest, opacity 60)
- Tap/hover reveals: `by`, `written_at`, `source`, `basis`, `reason`
- **No disposition actions on note pages in v2.** A footer link offers *"this note has 3 perishable segments — review in your queue"* which deeplinks to the ritual review surface.

### 14.6 Real-time refresh (polling)

```typescript
// src/lib/use-backlog-polling.ts
function useBacklogPolling() {
  const visible = usePageVisibility();
  const router = useRouter();

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => router.refresh(), 15_000);
    return () => clearInterval(id);
  }, [visible, router]);
}
```

`router.refresh()` re-fetches RSC for the current route; Cache Components serve the fresh `<BacklogList />` and `<CapacityStrip />`. No client state library; no SSE.

**Optimistic mutations** via `useOptimistic`:
- User taps "dismiss" → optimistic UI removes the card
- Server Action runs; `revalidateTag('vault:{slug}/backlog')` fires
- Next 15s poll returns canonical state; React reconciles
- Pending mutation persists in client state until reconciliation completes (Panel 2 race-condition fix)

### 14.7 Auto-run on signup — surface-only, no vault writes

The 30s post-signup choreography is detailed in §12. **The critical detail (Panel 3 trust risk):** the first auto-run produces a *surface-only* artifact. The user sees what the AI noticed but the vault is untouched. Any skill capable of writing requires explicit per-action confirmation on its first run for the vault.

### 14.8 5–7 built-in skills (v2 ship set)

Working list (refined before week 2):

1. **Daily Vault Review** — auto-installed at signup. Daily cadence. Surface-only output: today's noteworthy patterns, dormant threads, perishable claims approaching staleness.
2. **Concept Graph Cleanup** — on-demand. Surfaces probable duplicates, orphans, dead concepts for ritual review. Writes only on user confirmation.
3. **Relationship Surface** — weekly. People in the graph with stale last-contact, overdue follow-ups. Surface-only.
4. **Dormant Thread Surface** — weekly. Concepts not visited in N weeks that have meaningful link density. Surface-only.
5. **Journal Patterns** — weekly. Patterns across Journal/ entries (what you keep returning to, what stopped). Surface-only.
6. **Perishable Audit** — weekly. Perishable claims aged past N days needing review. Triggers `mark-stale` or `confirm-durable` in ritual review.
7. **Vault Health Check** — weekly. Orphan notes, broken `[[wikilinks]]`, missing frontmatter. Mostly surface; user-confirmed writes for safe fixes.

Each skill ships with `starterPendingTasks` array used during the first-run pre-population.

### 14.9 Dismissed-task recovery

Hidden default; accessible via the Pending list filter (`show dismissed`). Items remain recoverable for 30 days; auto-purged after. Recovery action restores them to Pending with original schedule. (Panel 1: must be findable; Panel 3: must not pollute throughput counts.)

### 14.10 Failure-mode UX

A `failed` task shows:
- Distinct visual treatment (cream / earth tone, no harvest — failure isn't urgent)
- Last-error summary one-liner
- Two actions: `retry` (queues a fresh run) and `dismiss`
- Stays in the backlog until disposed; does not count toward throughput

### 14.11 Day-7 returning-user experience (Panel 1 blind-spot fix)

User returns after 4 days away:
- Backlog has accumulated; `<NeedsReviewList />` shows up to 5 with "(+ N more)" affordance
- A one-line context banner: *"4 days since your last visit. 12 new items, 3 need review."*
- Backpressure has triggered if Needs Review > 10: cadenced skills paused, banner notes this and offers "catch up + resume"
- No guilt copy. No streak gamification.

---

## Implementation plan

### Week 0 — Backend contract gate

Before any UI work, confirm `api.grove.md` exposes (or commits to expose by week 2):

- Task CRUD + state machine (`pending → running → review → done`, plus `dismissed` / `failed`)
- Scheduler with cadences (`daily` / `weekly` / `on-trigger` / `on-demand`)
- Webhook stream OR polling-on-server-side change feed for SSR cache invalidation
- Skill registry (read-only in v2: list builtin skills + per-vault install state)
- Throughput aggregation (rolling 4-week velocity, plan ceiling)
- Write paths for `confirm-durable` / `refine` / `mark-stale` (extend `provenance_blame`)
- Surface-artifact persistence (skill outputs that aren't vault commits)
- Idempotency keys on `/run` and `/install`
- Plan-tier enforcement (Free / Pro)

**Gate**: ≥80% of the above is VERIFIED before week 1 UI work begins. If <80%, descope v2 to read-only + dismiss.

### Week 1 — Foundation primitives

- Extend DESIGN.md with provenance-badge tokens
- Build `<CapacityStrip />`, `<ProvenanceBadge />`, `<TaskCard />`, `<SkillCard />` primitives in isolation
- Server Action scaffolds + Cache Components setup
- Polling-on-focus hook (`useBacklogPolling`)
- Accessibility spec for each primitive

### Week 2 — Backlog homepage

- `<NeedsReviewList />`, `<BacklogList />` (windowed via `@tanstack/react-virtual` if >50 items)
- New `/{atHandle}/{vault}/page.tsx` (replace v1 dashboard as homepage; v1 dashboard accessible via `/dashboard`)
- `runTask` / `deferTask` / `dismissTask` Server Actions wired
- `useOptimistic` per TaskCard for dismiss/run
- 15s polling refresh via `router.refresh()`

### Week 3 — Review + skills + first-run + polish

- `<TaskDetail />`, `<ReviewItem />` with diff view
- `reviewTask` Server Action
- Read-only `<ProvenanceBadge />` on note pages with deeplink to review queue
- `/skills` page (Installed tab only)
- Skill detail with cadence config
- First-run auto-install + auto-run choreography (surface-only)
- Day-7 returning-user banner
- Failure-mode UX
- Dismissed-task recovery filter
- Cross-browser, accessibility audit, mobile polish

### Files to create

```
src/app/(resident)/[atHandle]/[vaultSlug]/
  page.tsx                              # NEW — v2 backlog homepage
  _actions.ts                           # NEW — Server Actions
  task/[id]/page.tsx                    # NEW
  skills/
    page.tsx                            # NEW — Installed tab
    [slug]/page.tsx                     # NEW

src/app/api/
  backlog/route.ts                      # NEW — cached read
  throughput/route.ts                   # NEW — cached read
  skills/route.ts                       # NEW — cached read

src/components/
  primitives/
    capacity-strip.tsx                  # NEW
    task-card.tsx                       # NEW
    provenance-badge.tsx                # NEW (read-only in v2)
    skill-card.tsx                      # NEW
  backlog/
    needs-review-list.tsx               # NEW
    backlog-list.tsx                    # NEW
    day-seven-banner.tsx                # NEW
  task/
    task-detail.tsx                     # NEW
    review-item.tsx                     # NEW
  skill/
    skill-detail.tsx                    # NEW
  upgrade/
    upgrade-prompt.tsx                  # NEW

src/lib/
  grove-api.ts                          # EXTEND
  use-backlog-polling.ts                # NEW
  use-page-visibility.ts                # NEW

DESIGN.md                               # EXTEND — provenance badge tokens
```

### Dependencies to add

- `@tanstack/react-virtual` (windowing for backlog list when >50 items)
- `date-fns` (relative-time formatting)
- **No** `framer-motion` (motion tokens unbuilt; v3)
- **No** state management library (RSC + Server Actions + `useOptimistic` sufficient)

---

## Open questions (intentionally deferred)

1. **Plan tier names** — Free / Pro ship; garden-voiced alternatives (Cultivator / Steward) revisit in v3.
2. **Notification strategy** — daily ritual product needs a daily ping; push / email / browser-notif decision is v2.5.
3. **What Grove backend does with collected labels** — disposition data is gathered; the flywheel only closes if it feeds something. v3 problem; v2 just captures.
4. **Multi-resident routing** — v2 ships single-resident assumption; shared vaults are visible-disabled.
5. **Time-equivalent calibration** — wall-clock vs work-equivalent. Picking wall-clock for v2 honesty; re-evaluate at 90 days.
6. **The "warming up" capacity state** (first 14 days, before rolling velocity) — exact UI TBD before week 2.
7. **Garden voice marketplace copy** — when v3 marketplace lands.

---

## Hand-off

This spec is the implementation contract for the engineering agent or human. Open questions are non-blocking. Week 0 backend gate is blocking — if api.grove.md isn't ≥80% ready, descope to read-only + dismiss.

**Source artifacts:**
- This file: `~/src/grove-www/SPEC.md`
- Draft (pre-panel-review): `~/src/grove-www/SPEC.draft.md`
- Product thesis (Grove): [grove-product-thesis-knowledge-throughput-as-pricing](https://grove.md/@jm/personal/Resources/Concepts/grove-product-thesis-knowledge-throughput-as-pricing)
- Architecture project (Grove): [grove-skill-overlays-architecture](https://grove.md/@jm/personal/Resources/Projects/grove-skill-overlays-architecture)
