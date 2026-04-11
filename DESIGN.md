# Grove — Design System

> Grove is a personal knowledge system. The brand should feel like the product: organic, structured, quietly confident.

---

## Brand Concept

Two registers, one identity:

1. **The mark** — warm, botanical, heritage. A citrus branch illustration in the Ernst Haeckel tradition. Serif wordmark. Cream and earth tones. The feeling of a well-made book, a botanical garden label, a letterpress print. This is the soul.

2. **The product** — dark, typographic, fast. Monospace and sans-serif. Green on near-black. No illustrations in the UI. The content is the design. This is the surface.

The mark gives Grove its personality. The product gives it credibility. They meet in the voice: direct, warm, precise.

---

## Logo & Mark

### Primary Logotype

Full botanical illustration — a citrus branch (oranges, leaves, blossoms) rendered in detailed line art. Ernst Haeckel / natural history style. Brown/sepia ink on cream. This is the prestige mark — used for brand moments, not UI chrome.

### Scalable Icon

A simplified citrus cross-section — geometric, single-color, works at 16px. Used as favicon, app icon, and anywhere the full illustration won't resolve.

### Wordmark

**"Grove"** set in a transitional serif at medium weight. Mixed case. The serif choice matters — it should feel editorial, not corporate. Reference: the embossed mockup (clean transitional serif, moderate contrast, no decorative terminals).

### Lockup

```
[citrus icon]  Grove
```

Icon left, wordmark right, vertically centered. The icon height matches the cap height of the wordmark.

### Descriptor

When context requires it: **"personal knowledge system"** set in small caps or tracked uppercase beneath the wordmark.

```
Grove
PERSONAL KNOWLEDGE SYSTEM
```

### Usage Rules

- **"Grove"** is always capitalized (it's a proper noun, not a generic word).
- The botanical illustration is for brand moments only — landing page hero, social, print. Never in the app chrome.
- The simplified citrus icon is for product contexts — favicon, nav, loading states.
- Don't place the mark on busy backgrounds. It needs air.

---

## Color

### Brand Palette (identity, marketing, print)

| Name | Hex | Role |
|------|-----|------|
| **Cream** | `#FAF7F2` | Primary light ground. Paper, cards, brand backgrounds. |
| **Ink** | `#2C2416` | Primary dark. Text on light, illustration outlines. |
| **Harvest** | `#D4890A` | Citrus accent. The orange in the illustration. Warm, earthy. |
| **Moss** | `#7A8B5C` | Secondary. Leaf green, muted and natural. |
| **Earth** | `#3D3524` | Deep warm brown. Anchoring, grounding. |

### Product Palette (digital UI)

| Name | Hex | CSS Variable | Role |
|------|-----|-------------|------|
| **Background** | `#08090a` | `--background` | App background. Near-black with cool undertone. |
| **Foreground** | `#d4d4d4` | `--foreground` | Primary text. |
| **Accent** | `#4ade80` | `--accent` | Interactive elements, links, CTAs. Green = growth. |
| **Accent Dim** | `#1a3a28` | `--accent-dim` | Accent at low opacity — hover states, subtle highlights. |
| **Amber** | `#f5a623` | `--amber` | Secondary accent. Warmth, warnings, harvest. |
| **Amber Dim** | `#3a2a10` | `--amber-dim` | Amber at low opacity. |
| **Surface** | `#111214` | `--surface` | Cards, panels, elevated elements. |
| **Surface Border** | `#1c1d20` | `--surface-border` | Borders, dividers. |
| **Surface Hover** | `#1a1b1e` | `--surface-hover` | Hover states on surfaces. |
| **Muted** | `#5a5a5a` | `--muted` | Tertiary text, metadata. |
| **Muted Light** | `#888888` | `--muted-light` | Secondary text, placeholders. |

### Where the Palettes Meet

The brand palette (cream, earth tones) appears on the **landing page hero**, **social cards**, and anywhere Grove is introduced for the first time. The product palette (dark, green accent) takes over once you're **inside the product** — the note viewer, command palette, search results.

The amber accent (`#f5a623`) is the bridge between the two worlds — it echoes the harvest/citrus warmth of the brand palette within the dark product UI.

---

## Typography

### Brand Typography

| Typeface | Role | Notes |
|----------|------|-------|
| **Transitional serif** | Wordmark, headlines on brand materials | The mockups use a face similar to Freight Text or Plantin. Warm, editorial, moderate stroke contrast. |
| **Tracked uppercase sans** | Descriptor, labels | Small caps or tracked uppercase for "PERSONAL KNOWLEDGE SYSTEM" and category labels. |

### Product Typography

| Typeface | CSS Variable | Role |
|----------|-------------|------|
| **Inter** | `--font-sans` | UI text, body copy, navigation. Clean, neutral, excellent at small sizes. |
| **Geist Mono** | `--font-mono` | Code blocks, technical content, the "terminal" feeling. The GOAL.md says "monospace" — this is where it lives. |

### Hierarchy (Product)

| Level | Size | Weight | Font | Use |
|-------|------|--------|------|-----|
| **Hero** | 48-64px | 700 | Inter | Landing page headline. One per page. |
| **H1** | 32px | 700 | Inter | Page titles. |
| **H2** | 24px | 600 | Inter | Section headings. |
| **H3** | 18px | 600 | Inter | Subsection headings. |
| **Body** | 16px | 400 | Inter | Default paragraph text. |
| **Small** | 14px | 400 | Inter | Metadata, captions, secondary info. |
| **Code** | 14px | 400 | Geist Mono | Code blocks, paths, technical values. |
| **Mono Small** | 12px | 400 | Geist Mono | Timestamps, hashes, system text. |

---

## Voice

Documented fully in [GOAL.md](./GOAL.md). The essentials:

- **Direct.** Say what you mean. No hedging, no filler.
- **Calm.** Confident that the tool speaks for itself.
- **Precise.** The right word, not the impressive word.
- **Warm.** There's a person behind this who cares about it.
- **Dry.** Humor is allowed but always understated.

Rules:
- No exclamation marks in product UI or marketing copy.
- No emoji in product surfaces.
- Sentence case for headings ("Search your vault", not "Search Your Vault").
- Active voice always.
- First person where it matters ("I built this because...").
- No superlatives ("revolutionary", "game-changing").

---

## Iconography

- **Lucide** icon set — monoline, rounded caps, rounded joins.
- 24x24 grid default.
- Color: `--muted` at rest, `--foreground` on hover, `--accent` when active/selected.
- No filled icons. No custom icon work unless Lucide genuinely lacks coverage.

---

## Note Viewer

The note viewer is the core product surface — it renders vault content for reading. It should feel like a well-typeset document, not a code editor.

### Prose Styling

- Uses `@tailwindcss/typography` with dark-mode overrides.
- Headings: `#e5e5e5` (slightly brighter than body text for hierarchy).
- Links: `--accent` green, underlined with 2px offset.
- Wikilinks: `--foreground` with subtle bottom border, green on hover.
- Unresolved wikilinks: `--muted`, no hover effect, cursor default.
- Code blocks: `--surface` background, `--surface-border` border, 8px radius.
- Inline code: same surface treatment, 4px radius, slightly smaller font.

### Callouts

Obsidian-style callouts with left border + tinted title:

| Type | Border | Title Color |
|------|--------|-------------|
| Note | `#3b82f6` | `#60a5fa` |
| Warning | `#f59e0b` | `#fbbf24` |
| Tip | `#22c55e` | `#4ade80` |
| Danger | `#ef4444` | `#f87171` |
| Info | `#06b6d4` | `#22d3ee` |
| Quote | `#6b7280` | `#9ca3af` |

### Metadata Bar

Type-aware metadata display above note content. Shows frontmatter fields relevant to the note's type (person, concept, recipe, etc.). Muted text, compact layout.

---

## Layout Principles

- **Content-first.** No sidebars, toolbars, or chrome competing with the content.
- **Generous whitespace.** Let the content breathe. The dark background is not emptiness — it's negative space.
- **Mobile-first.** The phone is literally the pain point Grove solves. Every layout must work on a phone screen first.
- **No decorative elements.** No gradients, no illustrations in UI, no stock photos. If something is on screen, it earns its place.
- **Subtle texture.** A barely-visible noise overlay on the background (`opacity: 0.015`) adds warmth without distraction.

---

## Motion

- **Fade up** on scroll entry: 0.5s ease-out, 12px translate. Staggered delays (100ms increments) for sequential elements.
- **Hover transitions:** 200ms for border-color, background changes.
- **No animations that don't serve comprehension.** No loading spinners that dance. No entrance animations that delay reading.
- **Cursor blink** on the landing page hero — the single animated element that signals "this is a terminal, this is alive."

---

## Landing Page

The landing page is a **manifesto disguised as a product page.** Dark, typographic, monospace-inflected. The brand's botanical identity appears in the hero (logotype) and social cards, but the page itself is pure product aesthetic.

Key design decisions (from GOAL.md):
- Fast, dark, typographic
- No images, no illustrations, no stock photos in the page body
- The content IS the design
- Code blocks are real, not pseudocode
- Page loads in <1s on 3G
- Feels like a well-formatted man page you actually want to read

---

## Brand Applications

### Where to Use Brand Palette (cream, botanical)

- Landing page hero / above-the-fold brand moment
- Social cards (Open Graph, Twitter cards)
- Print materials (stickers, cards, swag)
- README hero image
- Email headers

### Where to Use Product Palette (dark, green)

- Note viewer
- Command palette
- Search results
- Navigation
- All interactive UI
- Landing page body (below the hero)

---

## Quick Reference

| Element | Value |
|---------|-------|
| **Brand name** | Grove (always capitalized) |
| **Descriptor** | personal knowledge system |
| **Mark** | Botanical citrus illustration (full) / citrus cross-section (icon) |
| **Wordmark font** | Transitional serif (TBD — Freight Text or similar) |
| **UI sans** | Inter |
| **UI mono** | Geist Mono |
| **Brand ground** | Cream `#FAF7F2` |
| **Product background** | `#08090a` |
| **Primary accent** | Green `#4ade80` |
| **Secondary accent** | Amber `#f5a623` |
| **Icon set** | Lucide |
| **Default mode** | Dark |
| **Noise texture** | SVG fractalNoise, 0.015 opacity |
