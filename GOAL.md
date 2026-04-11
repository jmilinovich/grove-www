# grove.md Website — GOAL.md

> The website is the first thing people see. It has to make them feel something — not just explain what Grove does.

## Core Personas

### 1. The Power User (people like John)
**Who:** Developers, founders, researchers who live in coding agents (Claude Code, Cursor, Copilot). Have an Obsidian vault with hundreds or thousands of notes. Already use MCP. Already have a VPS or are comfortable SSH-ing into one.

**Pain:** They've built a personal knowledge system that works beautifully — on one machine. The moment they switch surfaces (phone, web, different laptop), their AI is lobotomized. They've tried local MCP servers and hit the ceiling: local-only, read-only, no search worth a damn.

**What they want:** "Just give me the URL and I'll self-host it in 20 minutes." They want the architecture, the performance numbers, the git model. They'll read the README before the landing page.

**How we reach them:** Show the code. Show the query latency. Show the git log. Respect their intelligence. No marketing fluff.

### 2. The Builder (friends of John)
**Who:** Technical people who've seen John demo Grove in conversation. They're impressed but don't have 1,000 notes yet. Maybe they have a small vault, maybe they have markdown files scattered around. They're agents-curious — using Claude/ChatGPT daily but haven't set up MCP.

**Pain:** They see the vision but the setup cost feels high. They don't want to run a VPS, configure nginx, manage Docker. They want the *experience* John has without the *infrastructure* John built.

**What they want:** "Connect my GitHub repo and give me an endpoint." The hosted version. Signup, connect, done.

**How we reach them:** Show the before/after. "Open Claude on your phone. Ask it about your notes. It knows." Make the hosted path dead simple.

### 3. The Knowledge Gardener
**Who:** Obsidian power users (5M+ users) who've built elaborate vaults but whose AI tools can't access them properly. They know PARA, they use Dataview, they have templates and conventions. They've tried the 24 local MCP servers and been disappointed.

**Pain:** The existing Obsidian MCP servers treat their vault as a bag of text files. No frontmatter awareness, no type system, no write-back. They want an AI that *respects their vault's structure* — not one that dumps unformatted text into it.

**What they want:** An MCP server that understands Obsidian conventions. Frontmatter validation. Wikilink awareness. Graph analysis. Write-back that creates proper notes, not garbage.

**How we reach them:** "24 Obsidian MCP servers. All local-only, read-only, flat filesystem." The comparison table is their entry point. Then show the write flow validation.

### 4. The Sharer (Phase 2 persona)
**Who:** Anyone with a Grove who wants to give a friend, colleague, or audience access to a slice of their knowledge. A researcher sharing their AI reading list. A chef sharing recipes. A team lead sharing architecture decisions.

**Pain:** Knowledge sharing today is either "send them the whole vault" or "copy-paste into a doc." No way to give someone structured, searchable, scoped access to a piece of your knowledge graph.

**What they want:** "Create a grove, give them the URL, they connect their Claude to it." Topic-scoped, permission-controlled, LLM-filtered knowledge sharing.

**How we reach them:** This is the viral loop. "Your friend has shared a grove with you." The onboarding page for grove consumers.

---

## Core Use Cases

### Right Now (Phase 1, ship week)
1. **Persistent AI memory across surfaces** — Open Claude on phone, it knows your concepts, people, projects
2. **Two-way knowledge flow** — AI learns something in a conversation, plants it in your vault, next conversation finds it
3. **Self-hosted, privacy-first** — Your data, your server, your embeddings. Nothing leaves.
4. **Structured vault operations** — Search, read, write with frontmatter validation and git commits

### Coming (Phase 2)
5. **Groves** — Share scoped slices of your knowledge with anyone
6. **Autonomous discovery** — Background loop that grows your knowledge graph without manual invocation
7. **Hosted version** — Connect your GitHub repo, get an MCP endpoint. No VPS required.

---

## What Pain Points Does the Site Need to Hit?

1. **"My AI doesn't know who I am"** — The phone problem. You built a knowledge system and your AI can't access it from half your devices. This is the emotional hook.

2. **"I tried the existing MCP servers"** — They're local, read-only, flat. The comparison is visceral for anyone who's tried.

3. **"I want write-back but I'm scared of corruption"** — Show the validation pipeline. Every write: frontmatter check, path security, git commit, reindex. The vault is sacred.

4. **"I don't want my data on someone else's server"** — Self-hosted. Open source. Your embeddings run on your box. MIT licensed.

5. **"I want my friends to be able to use this"** — Groves (coming soon). The sharing story.

---

## What a Truly Great grove.md Looks Like

### It's NOT:
- A SaaS landing page with gradients and "Start free trial" 
- A docs site with API reference
- A README rendered in a browser
- A generic "AI tool" page with buzzwords

### It IS:
- **A manifesto disguised as a product page.** The Karpathy quote is the opening act. The problem statement is personal and specific. The solution is opinionated.
- **A technical artifact that earns trust.** Show the query timing. Show the git log. Show the validation pipeline. The audience is technical — impress them with substance, not design.
- **A story with a protagonist.** "I keep my life in an Obsidian vault..." — the README already has this voice. The site should amplify it.
- **An invitation, not a sales pitch.** "Here's how I use it. Here's how you can too. The code is right here."
- **Fast, dark, typographic.** Monospace. No images. No illustrations. No stock photos. The content IS the design. Think: a well-formatted man page that you actually want to read.

### Positioning: Hosted-First, Self-Host as Option

**The primary path is hosted.** Most people don't want to run a VPS. They want the experience — "my AI knows who I am from every surface" — without the infrastructure. The hosted version is the default. Self-hosted is for people who need full control.

Like mem0.ai's "Choose Your Deployment Mode" — present both as equal, legitimate choices. Not "hosted for beginners, self-hosted for real users." Both are real. Both are first-class.

```
Choose how you run Grove:

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Hosted        │  │   Self-Hosted   │  │   Enterprise    │
│                 │  │                 │  │                 │
│  Connect your   │  │  Your server,   │  │  On-prem,       │
│  GitHub repo.   │  │  your data.     │  │  SOC 2, HIPAA.  │
│  We handle      │  │  Full control,  │  │  Dedicated      │
│  the rest.      │  │  MIT licensed.  │  │  support.       │
│                 │  │                 │  │                 │
│  [Get started]  │  │  [GitHub →]     │  │  [Contact us]   │
└─────────────────┘  └─────────────────┘  └─────────────────┘

Same API. Same tools. Same privacy guarantees.
Your vault never leaves your infrastructure — hosted or self-hosted.
```

### Key Sections (in order of scroll):

1. **Hook** — "your knowledge, everywhere your AI is." + the phone problem in one sentence. Primary CTA: "Get started" (hosted). Secondary: "Self-host →"
2. **The Demo** — A real interaction. Show Claude on a phone finding something from the vault. Show a write-back. Show the git commit. Make it feel alive.
3. **The Story** — Why this exists. Personal, first-person. Tightened from the README.
4. **How It Works** — Three steps: Connect your vault → Your AI remembers → Knowledge compounds. Simple, not architecture-diagram-first.
5. **The 6 Tools** — Quick, scannable. Each with a real example query/response, not just description.
6. **Choose Your Deployment** — The mem0-style three-option selector. Hosted / Self-Hosted / Enterprise. Same API, same behavior. No tradeoffs.
7. **Privacy & Security** — Self-hosted embeddings. Git-backed. Every write is a commit. Your data never leaves. This matters for all three deployment modes.
8. **The Comparison** — "24 Obsidian MCP servers. All local-only." Quick table.
9. **Groves Preview** — "Share a slice of your knowledge. Coming soon." Tease Phase 2.
10. **Bottom CTA** — "Stop starting from zero." Email capture for hosted waitlist + GitHub link.
11. **Footer** — Minimal

### The Voice:
- First person where it matters ("I built this because...")
- Technical but warm
- Opinionated ("We chose 6 tools, not 15, because...")
- No superlatives ("revolutionary", "game-changing") — let the substance speak

---

## Fitness Function

### Conversion Metrics (measure externally)

| Metric | Target | How to measure |
|--------|--------|----------------|
| **Power user → self-hosts** | GitHub stars + clones trending up | GitHub insights |
| **Builder → joins waitlist** | Email signups for hosted version | Simple form → Grove note or Notion |
| **Knowledge gardener → tries it** | MCP connections from non-John users | Proxy audit log |
| **Sharer → creates a grove** | Grove creation count | Phase 2 metrics |
| **Time on page** | >60s average | Vercel Analytics |
| **Bounce rate** | <50% | Vercel Analytics |

### Automated Scorecard (180 pts)

Calibrated against Linear, Vercel, Raycast, and Arc quality bars. Scoring 180/180 means the site is genuinely world-class — not just functional.

```bash
bash scripts/score.sh          # human-readable
bash scripts/score.sh --json   # machine-parseable
```

**Components:**

| Component | Max | What it measures |
|-----------|-----|------------------|
| **Brand Identity** | 35 | DESIGN.md palette (cream/ink/harvest/moss) in CSS, serif font for wordmark, hero uses warm ground with warm→dark transition, sans-serif body default, tokenized colors |
| **Content & Comprehension** | 30 | All GOAL.md sections present, real waitlist form, quantified social proof, proper heading hierarchy (h1→h2) |
| **Accessibility** | 30 | WCAG 2.1 AA: heading hierarchy, focus states, touch targets, form labels, aria, skip-nav, reduced motion, contrast ratios |
| **Visual Craft** | 25 | Micro-interactions (press feedback, text-wrap balance, entrance animations), error recovery, loading states, smooth scroll |
| **Mobile & Responsive** | 25 | 375px-proof: text scaling, 44px touch targets, card stacking, readable line lengths, touch search |
| **Performance** | 20 | Server rendering, next/font, <=4 client components, no heavy deps, lazy-loaded Mermaid |
| **Note Viewer** | 15 | Prose typography, wikilinks, callouts, Shiki, metadata bar, backlinks, KaTeX, Mermaid, breadcrumbs |

**Mode: Split** — agents can improve measurement scripts (add checks, fix false positives) but cannot change component weights or point allocations.

### Improvement Loop

1. `bash scripts/score.sh --json` → identify lowest-scoring component
2. Pick highest-impact action from the catalog below
3. Implement the fix
4. Re-run `bash scripts/score.sh --json`
5. If improved: commit with `www: <component> <before>→<after>`
6. If regressed: revert
7. Append to `iterations.jsonl`

### Action Catalog

**Brand Identity (7/35 → 35/35):**

| Action | Pts | Effort | Notes |
|--------|-----|--------|-------|
| Add brand palette CSS vars (cream, ink, harvest, moss, earth) | +4 | 15 min | DESIGN.md hex values as custom properties |
| Load serif font via next/font | +5 | 15 min | Lora, DM Serif Display, or Libre Baskerville |
| Restyle hero: cream bg, ink text, serif headline | +13 | 1 hr | Cream background, earth-tone text, serif h1. Visual transition to dark below |
| Change body default to font-sans | +3 | 5 min | layout.tsx: `font-mono` → `font-sans` |
| Warm→dark section transition | +3 | 15 min | Explicit bg-background on first dark section |

**Content & Comprehension (18/30 → 30/30):**

| Action | Pts | Effort | Notes |
|--------|-----|--------|-------|
| Add "The 6 Tools" section with real examples | +4 | 1 hr | Each MCP tool with a query/response. Scannable, not verbose |
| Add comparison table (24 MCP servers vs Grove) | +4 | 1 hr | Columns: hosted, write-back, vault-aware, search quality |
| Add real waitlist email form | +4 | 30 min | Formspree or server action. Replace `#waitlist` anchor |

**Accessibility (4/30 → 30/30):**

| Action | Pts | Effort | Notes |
|--------|-----|--------|-------|
| Add h2 tags to all landing page sections | +5 | 15 min | Currently h1→p→p. Need h1→h2→h2→h2 |
| Add focus states (focus:ring-2) to all interactive elements | +5 | 30 min | Global focus-visible style or per-element |
| Add `<label>` to login form input | +4 | 5 min | `<label htmlFor="api-key">` |
| Add aria-label to sections | +3 | 10 min | `<section aria-label="How it works">` |
| Add skip-to-content link | +3 | 10 min | Hidden link, visible on focus, jumps to `#main` |
| Add prefers-reduced-motion media query | +3 | 10 min | Disable animations when user prefers reduced motion |
| Bump muted text contrast to 4.5:1+ | +3 | 5 min | `--muted: #5a5a5a` → `#8a8a8a` or similar |

**Visual Craft (11/25 → 25/25):**

| Action | Pts | Effort | Notes |
|--------|-----|--------|-------|
| Add active:scale-[0.98] to CTA buttons | +3 | 5 min | Press feedback like Arc |
| Add text-pretty or text-balance to headlines | +3 | 5 min | Prevents orphaned words on responsive |
| Add error state to search on API failure | +3 | 15 min | Replace silent catch with "Search failed" message |
| Add smooth scroll for anchor links | +2 | 5 min | `html { scroll-behavior: smooth }` |
| Add loading.tsx for note viewer | +3 | 15 min | Next.js loading file with skeleton or spinner |

### Quality Checks (manual review)

**Content:**
- [ ] Every section has a clear "so what" for at least one persona
- [ ] No section is pure feature list — each connects to a pain point
- [ ] The self-host path is copy-pasteable (works in <5 minutes on a fresh VPS)
- [ ] The hosted path has a clear, low-friction signup
- [ ] Copy density: ~50-70 words per section max (Linear standard)
- [ ] Every code block is real, not pseudocode

**Design:**
- [ ] Typography hierarchy scannable in 10 seconds
- [ ] Responsive — works on phone (the phone IS the pitch)
- [ ] No animations that don't serve comprehension
- [ ] Feels handcrafted, not templated
- [ ] The page itself IS the product demo — if it's slow, you've disproven the pitch
