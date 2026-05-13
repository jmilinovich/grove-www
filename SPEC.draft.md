# Grove v2 Dashboard — Specification (Draft)

*Draft for expert panel review. Not yet final. Drafted 2026-05-13 from `/mili:spec` workflow rooted in [[grove-product-thesis-knowledge-throughput-as-pricing]] (Grove concept note).*

---

## Context

**What grove-www is today.** Next.js 16.2 + React 19, TypeScript strict, App Router, Tailwind 4 + locked design tokens (DESIGN.md), Vercel-deployed, server-rendered, custom encrypted-cookie auth, all Grove vault operations proxied through SSR route handlers against `api.grove.md`. The v1 dashboard is six read-only stats cards at `/dashboard` (notes/freshness/index/lifecycle/git/system-health). Access-management has solid CRUD patterns. No client-side state library. No streaming. No skill-running UI. No review/labeling UI. No provenance display.

**What v2 solves.** The v1 dashboard treats Grove as a passive vault. The v2 dashboard makes Grove an *active* product: AI does work on the user's graph continuously, and the dashboard is the surface where users see, schedule, run, and review that work. The thesis ([[grove-product-thesis-knowledge-throughput-as-pricing]]): *knowledge graphs generate ongoing AI work; throughput rate is the pricing axis.*

**Who it's for.** v2 ships single-user (current routing assumption: one resident per API key). Multi-resident vault is server-supported and a v3 design problem. Two user modes: power user (vault-native, lives in the product) and casual (daily ritual, mobile-first triage).

**Constraints from codebase analysis.**
- DESIGN.md is law: 5 colors (cream/ink/moss/harvest/earth), 4 opacities (100/60/40/15), Lora/Inter/Geist Mono, 8px grid, two weights, no shadows/gradients.
- Server-side only Grove API access; client never talks to api.grove.md directly.
- Strict CSP (`script-src 'self' 'unsafe-inline'`).
- No streaming pattern exists yet; v2 introduces SSE.
- No write-path UX yet (forms that commit to vault); v2 introduces provenance-aware writes via review actions.
- No provenance badge component yet; v2 introduces it.

---

## Research findings (condensed from Phase 1)

**Backlog-as-homepage is barely instanced today.** Cursor 3 Agents Window and GitHub Copilot Mission Control are the only clean precedents — both very recent. Grove can be category-defining. The standard pattern in adjacent products (Mem, Reflect, Capacities, Notion AI) is "AI is hidden behind a cmd-J palette." That's the anti-pattern: invisible to users who don't know what to ask.

**Effort-based pricing is converging away from raw tokens.** Devin's ACU ("~15 min of active autonomous work"), Replit's checkpoint ("one per request, one feature complete"), Lovable's credit ("0.5 for tweak, 1.5 for complex") all explicitly moved off tokens because users hated unpredictability. Tasks-cleared (Zapier-style) is the most user-aligned axis. Devin's contribution: publish a defensible per-task definition.

**Capacity is best framed as Linear's rolling cycle velocity.** Three-cycle rolling baseline + plan ceiling. Sunsama complements with daily ritual cadence (review and disposition at bookended moments, not continuous nagging).

**Review pattern that works**: Superhuman Split Inbox (re-filing IS the labeling signal, happens in-flow) + Sunsama ritual cadence (uncertainty surfaced in batched moments). Avoid Notion-AI-style continuous autofill — feels like nagging.

**Marketplace activation**: Zapier templates-first. Every skill ships with sample tasks it would generate. Discovery alone doesn't activate; templates do.

**Anti-patterns to avoid**:
1. Cmd-J palette as the only AI affordance
2. Raw token/CPU metering
3. Continuous uncertainty prompts (use ritual cadence)
4. Dishonest ETAs (every queued item needs a real estimate)
5. Marketplace without install path or starter content

---

## Design decisions

Each decision below resolved in the Phase 3 grilling. Format: decision → rationale.

### 1. Interaction primitives (hybrid composition)

Three primitive types:
- **Task atom** — three states: `pending → review → done`. Same atom moves through states; UI shows different affordances per state.
- **Skill** — the installable lens (third-party or built-in). Generates tasks. Has metadata (author, domain, install state, sample tasks).
- **Throughput meter** — derived view, not an atom. Computed from task state + plan tier.

*Rationale:* Pure state-machine over-collapses (a marketplace skill isn't a task). Pure orthogonal types over-fragments (review item vs backlog item is the same thing in different states). Hybrid is cleanest mental model.

### 2. Default layout: backlog dominant + review pinned + capacity header strip

```
[Grove  vault@me                    🌿 4hrs/12hrs ▾]
─────────────────────────────────────────────────────
NEEDS REVIEW (3)
  • merge concepts? "Pappu" ≈ "Aparna"
  • is this still perishable? (12d old)
  • 3 dup people detected
─────────────────────────────────────────────────────
PENDING (47)               [filter] [+ skill]
  • Weekly journal patterns       tonight 11pm
  • Relationship surface          Mon 6am
  • Concept-graph cleanup         on-demand
  • Dormant thread surface        weekly
─────────────────────────────────────────────────────
CLEARED THIS WEEK (23)            view ›
```

*Rationale:* The thesis is "backlog as homepage." Backlog dominates. Capacity in header is always-visible context, never the focus (Lovable nav-bar pattern). Review pinned at top because that's where the labeled-data flywheel lives.

### 3. Empty state: pre-populated starter backlog

New users get the **Daily Vault Review** starter skill auto-installed and auto-run within 30s of signup. Backlog populates with 5–8 starter items including the result of that first run (already in "Needs Review"). The dashboard layout never shows an actual empty state. *Rationale:* Time-to-first-value < 60s. User's first action in the product is reviewing AI work — labeled-data flywheel begins on turn 1.

### 4. Throughput unit: tasks-cleared + time-equivalent on hover

Headline metric in the header strip: **"23 cleared this week · 41 pending"** — count of tasks. Hover/tap any task reveals the time-equivalent: *"cleared Mon 11pm · ~14 min · 12 patterns surfaced."* The Devin-ACU defensibility lives in the tooltip, not the headline.

*Rationale:* Tokens lose users (Devin/Replit/Lovable empirical evidence). Hours-of-work is activity-as-vanity. Tasks-cleared is value-aligned; time-equivalent receipt provides the defensibility power users want. Tokens become a backend cost backstop, never surfaced.

### 5. Default cadence: conservative

New users get **1–2 cadenced skills enabled** (Daily Vault Review + Domain Starter). Daily cadence by default. Users opt-up. Aggressive trial-mode rejected: looks like AI sprawl, triggers the continuous-uncertainty-prompts anti-pattern.

*Rationale:* Demand creation is gentler. Sunsama-ritual feel. Users grow into higher cadence as trust builds. The capacity dial reveals the headroom; if they want to clear faster, the upgrade conversation is contextual (not preemptive).

### 6. Review modality: both — ritual + in-flow

- **Ritual**: Pinned "Needs Review" section at the top of the backlog. Sunsama-style daily/weekly bookend.
- **In-flow**: When user opens any AI-touched note, provenance badges (voice/basis/source/reason) are visible inline. One-click refine, mark-stale, mark-durable.

*Rationale:* The patient user comes to the backlog. The in-the-flow user is reading a note. Both should be able to disposition AI work. Superhuman's in-flow correction + Sunsama's ritual cadence combined.

### 7. Capacity dial: rolling velocity + plan ceiling

Two axes visible:
- **What you typically do**: rolling 4-week throughput (Linear pattern)
- **What your plan allows**: tier ceiling
- **The gap**: where the pricing conversation lives

Header strip example: `🌿 23 cleared this week · 41 pending (≈2 wks at your pace, Pro tier clears by Fri)`.

*Rationale:* Personalization makes the meter feel earned. The gap is the upgrade hook. Static plan ceilings alone are too SaaS-tier-page; user-set targets get forgotten.

### 8. Free tier: generous-for-habit + visible ceiling

- **Free**: 1 cadenced skill (Daily Vault Review) running daily + 5 one-shot runs/month + browse-only marketplace.
- **Pro**: All skills available + cadenced as user pins + 100 one-shots/month + install third-party skills.
- **Power**: All + unlimited one-shots + real-time/parallel execution + premium-model option + early-access marketplace skills.

Capacity dial always shows ceiling. Upgrade prompts contextual at the gap moment, never preemptive.

*Rationale:* Habit-building free tier is the right cohort move. Time-trial pattern (Lovable) has high conversion but rug-pulls; for a daily-ritual product, that breaks trust.

### 9. Marketplace: first-class nav entry "Skills"

Sidebar: **Backlog** (homepage) and **Skills** (peers). Skills page has three tabs:
- **Installed** — your current skills, with cadence config, last-run, run-now
- **Browse** — categories (journal, relationships, knowledge, decisions...), curated, search
- **New** — for skill authors (post-v2 — placeholder for marketplace authoring)

Each skill in Browse shows: domain, author, 3 sample tasks it would generate (templates-first per Zapier research), install cost, reviews/usage signal.

*Rationale:* Discovery surface matters. Contextual-only buttons hide the marketplace from users who don't know to look. Hidden-until-engaged is too clever.

### 10. Form factor: one UI, flexed by surface

Same routes, responsive layout. Every action possible on every form factor. Bias differs:

| Surface | Bias toward | Layout shift |
|---|---|---|
| **Mobile** | Processing | Single column, larger tap targets, swipe-to-confirm/refine/dismiss, full-screen task detail, less throughput chrome |
| **Desktop** | Broad view | Multi-column where it fits, capacity dial more prominent, side-by-side diff in review, marketplace browse density |

No separate mobile app. No desktop-only features in v2. Responsive Next.js layout with media-query-driven priority shifts.

### 11. Real-time refresh: SSE + 30s polling fallback

New route: `/api/backlog/stream` exposes Server-Sent Events. Client subscribes; backlog updates live when a skill completes server-side. Falls back to 30s polling if SSE disconnects. Optimistic updates on user actions (dismiss/run) — server confirms.

*Rationale:* Backlog needs to feel alive. Polling-only feels stale. WebSockets are overkill for v2 (no duplex needs). SSE is the Next.js-native fit.

### 12. First run: auto-execute starter skill within 30 seconds

On signup:
1. Daily Vault Review skill auto-installed
2. Skill runs against user's imported/empty vault
3. Backlog populates with starter items (5–8 pending + the just-completed run sitting in Needs Review)
4. User's first action is reviewing the AI's first artifact

*Rationale:* TTFV under 60s. Labeled-data flywheel from turn 1. No empty state ever shown.

### 13. Copy register: extend Grove's garden voice

- Lowercase section headers (`needs review`, `pending`, `cleared this week`)
- Quiet, declarative, no exclamation marks
- Light agrarian language (cultivate, harvest, tend) only where it earns the metaphor — not theme park
- Lora for prose, Inter for chrome (per existing DESIGN.md)
- No AI-personal-assistant first-person ("I found 3 patterns" → "3 patterns this week")

### 14. Plan tier names (placeholder, to refine)

Working names: **Free / Pro / Power**. Garden-voice alternatives to consider in Phase 7: **Free / Cultivator / Steward** (more on-brand, less recognizable).

---

## Specification

### 14.1 Interaction primitives — spec

#### Task atom

```typescript
type TaskState = 'pending' | 'running' | 'review' | 'done' | 'dismissed';

interface Task {
  id: string;
  skillId: string;            // which skill produced this
  title: string;              // "Weekly journal patterns"
  description: string;        // one-line
  state: TaskState;
  scheduledFor: ISO8601 | null;   // null = on-demand
  startedAt: ISO8601 | null;
  completedAt: ISO8601 | null;
  estimatedMinutes: number;   // for ETA + time-equivalent
  actualMinutes: number | null;
  result: TaskResult | null;  // what the skill produced
  needsReviewReason?: string; // "AI uncertain about concept merge"
}

interface TaskResult {
  artifact: {
    type: 'note-change' | 'note-create' | 'note-link' | 'concept-merge' | 'surface';
    diff?: NoteDiff;        // for note-change (review needs to show this)
    notePath?: string;
    surfaceText?: string;   // for surface-type results (e.g., journal patterns)
  };
  provenance: GroveProvenance;  // voice, basis, source, reason
}
```

#### Skill

```typescript
interface Skill {
  id: string;
  slug: string;             // 'daily-vault-review'
  name: string;             // 'Daily Vault Review'
  domain: string;           // 'knowledge', 'journal', 'relationships', etc.
  author: {
    type: 'builtin' | 'first-party' | 'marketplace';
    handle?: string;        // 'grove' or '@therapist-handle'
  };
  description: string;
  sampleTasks: string[];    // 3 example task titles for browse view
  cadenceOptions: ('daily' | 'weekly' | 'on-trigger' | 'on-demand')[];
  defaultCadence: Cadence | null;
  installState: 'not-installed' | 'installed' | 'disabled';
}
```

#### Throughput meter (derived)

```typescript
interface ThroughputView {
  rollingWeekVelocity: number;   // tasks cleared per week, rolling 4-week
  cleared7d: number;
  pending: number;
  estimatedClearDate: ISO8601;   // at current velocity
  planCeiling: number;           // per week
  upgradeProjection: { tier: string; clearBy: ISO8601 } | null;
}
```

### 14.2 Routes / IA

| Route | Purpose | Form-factor bias |
|---|---|---|
| `/{atHandle}/{vault}` | **Backlog (homepage)** — main dashboard | Both |
| `/{atHandle}/{vault}/task/{id}` | Task detail + run/review | Mobile-primary (full-screen) |
| `/{atHandle}/{vault}/skills` | Skills page — Installed/Browse/New tabs | Desktop-primary |
| `/{atHandle}/{vault}/skills/{slug}` | Skill detail with sample tasks + install | Both |
| `/{atHandle}/{vault}/throughput` | Broad throughput view (charts, trends) | Desktop-primary |
| `/{atHandle}/{vault}/settings/billing` | Plan + capacity ceiling | Desktop-primary |
| `/{atHandle}/{vault}/dashboard/*` | Existing vault admin (preserved as-is) | Desktop-primary |
| `/{atHandle}/{vault}/[...path]` | Existing note viewer + provenance badges + in-flow review | Both |

### 14.3 Components (new)

| Component | Composition | Form-factor notes |
|---|---|---|
| `<CapacityStrip />` | Persistent header: `🌿 X cleared • Y pending • dropdown for detail` | Smaller on mobile |
| `<NeedsReviewList />` | Pinned section, up to 5 items collapsed, "see all" link | One-tap action buttons mobile |
| `<BacklogList />` | Pending tasks grouped/filterable; SSE-subscribed | Single column mobile |
| `<TaskCard />` | Title, cadence, ETA, run/defer/dismiss | Larger tap targets mobile |
| `<TaskDetail />` | Full task detail page: status, schedule, run history, provenance, related notes | Full-screen mobile |
| `<ReviewItem />` | Diff view of proposed change + confirm/refine/dismiss | Side-by-side desktop, stacked mobile |
| `<ProvenanceBadge />` | Voice chip (`durable` / `perishable`) + tap-to-expand for source/basis/reason | Tooltip desktop, sheet mobile |
| `<SkillCard />` (browse) | Author, domain, 3 sample tasks, install button | Card grid desktop, list mobile |
| `<SkillCard />` (installed) | Cadence config, last-run, next-run, run-now, disable | Same layout both |
| `<ThroughputDial />` | Capacity rolling-velocity-vs-plan visualization | Larger desktop, compact mobile (in header strip) |
| `<UpgradePrompt />` | Gap-framed: "your backlog at current pace ≈ Yd. Upgrade clears by Z" | Bottom-sheet mobile, inline desktop |
| `<EmptyStateBootstrap />` | Used only for transient state during first-run; replaced by populated backlog within 30s | N/A — should rarely appear |

### 14.4 API endpoints (new server routes)

| Endpoint | Verb | Returns |
|---|---|---|
| `/api/backlog` | GET | Paged tasks + throughput summary |
| `/api/backlog/stream` | GET (SSE) | Streamed events: `task.state-changed`, `task.created`, `review.requested` |
| `/api/tasks/{id}` | GET | Task detail |
| `/api/tasks/{id}/run` | POST | Trigger now |
| `/api/tasks/{id}/defer` | POST | Reschedule |
| `/api/tasks/{id}/dismiss` | POST | Soft-dismiss |
| `/api/tasks/{id}/review` | POST | `{ action: 'confirm-durable' \| 'refine' \| 'dismiss' \| 'mark-stale', payload }` — drives the labeled-data flywheel |
| `/api/skills` | GET | List installed + browseable |
| `/api/skills/{slug}/install` | POST | Install skill |
| `/api/skills/{slug}/configure` | POST | Set cadence/triggers |
| `/api/skills/{slug}/uninstall` | POST | Remove skill |
| `/api/throughput` | GET | ThroughputView |
| `/api/billing/upgrade-projection` | GET | Pricing surface "clear by Friday" projection |

### 14.5 Provenance display

When a task touches a note, the note shows provenance badges via Grove API's existing `provenance_blame` data:

- **Durable** badge: moss color (Grove existing token), opacity 100
- **Perishable** badge: harvest color, opacity 60 — visually distinct, signals "this is a quoted artifact"
- **Legacy-unknown**: no badge (silent — applies to pre-provenance content)

Tap/hover reveals: `by: claude-opus-4-7 · written: May 13 2026 · source: "session-id" · basis: [paths/URLs] · reason: "one-line"`. Quick actions in note: `confirm durable`, `refine`, `mark stale`. These actions hit `/api/tasks/{id}/review` (same endpoint as ritual review).

### 14.6 Pricing surface placement

- **Capacity strip header**: always visible, never the focus. Format: `🌿 X cleared this week · Y pending ▾`. Tap to reveal: gap framing + upgrade CTA (if applicable).
- **Skills page > Browse**: marketplace skills show install cost. Free skills (built-in starter set) are free for everyone; third-party marketplace skills may cost on top of plan.
- **Settings > Billing**: full plan comparison, capacity dial detail, usage history.
- **Contextual moments**: when user tries to install a 3rd cadenced skill on Free tier, upgrade prompt appears with gap framing — NOT preemptive interruption.

### 14.7 First-run experience (turn-by-turn)

```
t=0s     User completes signup (magic link verified, vault provisioned)
t=2s     Daily Vault Review skill auto-installed (server-side, no UI step)
t=3s     Skill starts running on imported/empty vault
t=4s     Dashboard renders with backlog skeleton (loading state for the running task)
         Other starter items appear in "pending" (Concept-graph health, etc.)
t=15-25s Daily Vault Review completes; result becomes "needs review" item
         CapacityStrip animates: 0 → 1 cleared this week
t=30s    User sees: 1 needs-review item, 4-6 pending items, capacity strip alive
```

Note: starter pending items are pre-shipped as templates from the Daily Vault Review skill spec, not generated. They convey "here's what the system can do for you" without requiring 5 skill runs in the first 30 seconds.

### 14.8 Real-time flow (SSE)

```
Client subscribes to /api/backlog/stream on dashboard mount
Server (Next.js route handler) holds connection, listens to api.grove.md webhooks
Events flow:
  - task.created      → client adds card to backlog
  - task.state-changed → client updates card state
  - review.requested  → client moves card to Needs Review (animates)
  - throughput.updated → CapacityStrip re-renders

Disconnect: client falls back to 30s polling on /api/backlog
Reconnect: client re-subscribes; server replays last 60s of events
```

---

## Implementation sketch

### Phase order (within v2 build)

1. **Foundation (week 1)**
   - Extend DESIGN.md with provenance-badge tokens + (optional) animation tokens for state transitions
   - Build `<CapacityStrip />`, `<ProvenanceBadge />`, `<TaskCard />` primitives in isolation (Storybook-ish)
   - Spec the API contract; build mocked endpoints
2. **Backlog view (week 2)**
   - `<NeedsReviewList />`, `<BacklogList />` composing the primitives
   - Replace `/dashboard` v1 with v2 backlog as homepage
   - SSE endpoint + client subscription
3. **Task interactions (week 3)**
   - `<TaskDetail />`, run/defer/dismiss, optimistic updates
   - `<ReviewItem />` with diff view and disposition actions
   - In-flow provenance review on note pages
4. **Skills (week 4)**
   - `/skills` page (Installed | Browse)
   - `<SkillCard />` browse + install flows
   - Cadence configuration UI
5. **Throughput + pricing (week 5)**
   - `<ThroughputDial />` and `/throughput` route
   - `<UpgradePrompt />` gap framing
   - `/settings/billing` integration with capacity dial
6. **First-run experience + polish (week 6)**
   - Signup → auto-install → auto-run choreography
   - Empty-state guard
   - Cross-browser, accessibility audit, mobile polish

### Key files to create/modify

```
src/app/(resident)/[atHandle]/[vaultSlug]/
  page.tsx                              # NEW — v2 dashboard (backlog homepage)
  task/[id]/page.tsx                    # NEW — task detail
  skills/
    page.tsx                            # NEW — Installed | Browse | New
    [slug]/page.tsx                     # NEW — skill detail
  throughput/page.tsx                   # NEW — broad throughput view
  settings/billing/page.tsx             # NEW — plan + capacity dial

src/app/api/
  backlog/route.ts                      # NEW
  backlog/stream/route.ts               # NEW (SSE)
  tasks/[id]/route.ts                   # NEW
  tasks/[id]/run/route.ts               # NEW
  tasks/[id]/review/route.ts            # NEW
  skills/route.ts                       # NEW
  skills/[slug]/install/route.ts        # NEW
  throughput/route.ts                   # NEW

src/components/
  primitives/
    capacity-strip.tsx                  # NEW
    task-card.tsx                       # NEW
    provenance-badge.tsx                # NEW
    skill-card.tsx                      # NEW
  backlog/
    needs-review-list.tsx               # NEW
    backlog-list.tsx                    # NEW
  task/
    task-detail.tsx                     # NEW
    review-item.tsx                     # NEW
  skill/
    skill-detail.tsx                    # NEW
  throughput/
    throughput-dial.tsx                 # NEW
    upgrade-prompt.tsx                  # NEW

src/lib/
  grove-api.ts                          # EXTEND — task/skill/throughput types
  sse-stream.ts                         # NEW — client SSE subscription helper

DESIGN.md                               # EXTEND — provenance badge tokens, state-transition motion
```

### Dependencies to add

- `date-fns` for relative time + scheduled-for formatting
- `framer-motion` or CSS transitions for state-change animations (decide in Phase 7)
- No new state management library — RSC + server actions + React Context as today
- No new auth — extend current `__Host-grove_token` cookie

### Backend coordination (api.grove.md)

The dashboard depends on Grove backend exposing:
- Skill registry endpoint (list installed + available)
- Task scheduler (cadence + on-demand runs)
- Webhook stream (for SSE relay)
- Provenance read API (already exists per current `provenance_blame` data)

This is the **largest coordination cost**: the dashboard is a thin UI over a meaningful backend extension. Some of this may already exist in `/grove-phase-1-2` (sibling repo seen in `~/src/`).

---

## Open questions

*Things deferred to Phase 5 panel review or to be resolved before implementation.*

1. **Plan tier names** — "Free / Pro / Power" or garden-voiced "Free / Cultivator / Steward"? Trade craft for legibility.
2. **Exact starter skill set** — Daily Vault Review is locked. What 4–7 other items pre-populate the backlog on day 1 to demonstrate range? (Concept health, dormant thread surface, relationship overdue, etc.)
3. **Multi-resident routing** — single-resident v2 is fine, but the routes embed `[atHandle]/[vaultSlug]` which is multi-resident-aware. Decide v2's degradation: shared vaults invisible, or visible-disabled?
4. **Provenance system extensions** — current `provenance_blame` is read-only. Will user disposition actions (confirm/refine/mark-stale) require new write paths to Grove backend? Almost certainly yes.
5. **Skill author developer experience** — marketplace placeholder in v2; v3 problem. But the API contract for skills should be designed v2-forward so we don't reshape it later.
6. **Failure modes** — what does a failed skill run look like in the backlog? Distinct state "failed" with retry vs auto-rolled-back? Affects task atom shape.
7. **Dismissed task history** — visible or hidden? Default proposal: hidden behind "view dismissed" toggle in filter menu; user can recover.
8. **Capacity dial source-of-truth** — rolling 4-week, but new users have no history. First 4 weeks display a "warming up" state or use plan-tier-ceiling as a fallback baseline?
9. **Time-equivalent calibration** — Devin's ACU is "~15 min." Grove needs its own definition. Should the time-equivalent be wall-clock (the skill ran for 14 min) or work-equivalent (what 14 min of human work this would have taken)? Trust implications differ.
10. **Mobile gestures** — confirm/refine/dismiss as swipes is standard, but does swipe-left feel right for "dismiss" vs swipe-right for "confirm"? Worth user-testing post-Phase-7.
11. **Animation discipline** — DESIGN.md doesn't yet specify motion. Backlog needs to feel alive but not jittery. Need motion tokens (durations, easings).
12. **Notifications** — when a cadenced skill completes a "needs-review" item, push notification to mobile? Email digest? Out of scope for v2 UI but architecturally adjacent.

---

## Hand-off

This draft → expert panel review (Phase 5) → synthesis (Phase 6) → final SPEC.md (Phase 7) → implementation hand-off to an engineering agent or human.
