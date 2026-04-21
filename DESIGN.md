---
version: alpha
name: Grove
description: >
  The design system for Grove — a hosted knowledge API made visible on the
  web. Warm, editorial, cream-based. A knowledge system that feels like a
  well-made book.

colors:
  # Brand palette — five tokens, no more.
  cream: "#FAF7F2"        # Page Linen — the ground
  ink: "#2C2416"          # Book Ink — every mark of meaning
  moss: "#7A8B5C"         # Moss Shade — interaction, aliveness
  harvest: "#D4890A"      # Harvest Honey — warmth and emphasis
  earth: "#3D3524"        # Deep Loam — depth and gravity

  # Semantic roles — all derived from brand tokens.
  background: "{colors.cream}"
  foreground: "{colors.ink}"
  primary: "{colors.moss}"
  on-primary: "{colors.cream}"
  accent: "{colors.harvest}"
  inset: "{colors.earth}"           # code blocks, dark wells

  # Surface derivations — warm, slightly darker than ground.
  surface: "#F0EBE1"                # cards, panels
  surface-hover: "#E8E2D6"          # interactive surface on hover
  surface-border: "rgba(44,36,22,0.15)"  # ink @ 15 — see opacity grammar

  # Text tiers — ink at the four sanctioned stops.
  text-primary: "{colors.ink}"             # ink @ 100
  text-secondary: "rgba(44,36,22,0.60)"    # ink @ 60
  text-tertiary: "rgba(44,36,22,0.40)"     # ink @ 40
  text-faint: "rgba(44,36,22,0.15)"        # ink @ 15

  # Code surfaces — only place darkness belongs in the UI.
  code-bg: "{colors.ink}"
  code-fg: "#E8E2D6"
  code-border: "{colors.earth}"

opacity-stops:
  full: 1.00
  secondary: 0.60
  tertiary: 0.40
  faint: 0.15

typography:
  families:
    serif: "Lora, Georgia, serif"          # prose, headings, hero
    sans: "Inter, -apple-system, sans-serif" # UI, labels, body
    mono: "Geist Mono, ui-monospace, monospace" # code, keys, timestamps
  weights:
    regular: 400
    medium: 500
  scale:
    # Major Third, 1.25 ratio. Every step earns its place.
    detail: "0.64rem"    # xs — timestamps, metadata microcopy
    label: "0.8rem"      # sm — section labels, table headers
    body: "1rem"         # base — UI body text
    prose: "1.0625rem"   # note reading size
    subhead: "1.25rem"   # md — h4
    title: "1.5625rem"   # lg — h3
    heading: "1.953rem"  # xl — h2, page titles
    page: "2.441rem"     # 2xl — h1
    display: "3.052rem"  # hero mobile
    display-lg: "3.815rem" # hero desktop
  treatment:
    heading-tracking: "-0.015em"
    subhead-tracking: "-0.01em"
    prose-line-height: 1.75
    prose-max-width: "65ch"
    ui-line-height: 1.5

rounded:
  none: "0"
  sm: "4px"       # inline code, pill badges
  md: "8px"       # cards, code blocks, inputs, images
  lg: "12px"      # large surfaces, modal
  full: "9999px"  # avatars, dots

spacing:
  # 4px base. Rhythm follows an 8-grid with a 4-unit half-step for text.
  xxs: "0.25rem"   # 4  — label-to-heading gap
  xs: "0.5rem"     # 8  — tight groupings
  sm: "0.75rem"    # 12 — input padding-y
  md: "1rem"       # 16 — paragraph rhythm, section-y small
  lg: "1.5rem"     # 24 — card padding (p-6), section px
  xl: "2rem"       # 32 — grid gap (gap-8)
  xxl: "3rem"      # 48 — grid gap (gap-12)
  section-y: "5rem"   # 80 — landing-page section vertical rhythm (py-20)

layout:
  max-content: "64rem"        # max-w-5xl — all landing sections
  max-prose: "65ch"           # note viewer reading width
  section-pattern: "py-20 px-6 max-w-5xl mx-auto"
  breakpoints:
    sm: "640px"
    md: "768px"
    lg: "1024px"
    xl: "1280px"

motion:
  durations:
    instant: "150ms"   # micro-interactions, hover colors
    quick: "200ms"     # transitions between surface states
    calm: "500ms"      # entrance fades, content reveal
  easings:
    out: "ease-out"
    standard: "ease-in-out"
    step: "step-end"   # cursor blink only
  reduced-motion: required  # all non-essential animation disabled

elevation:
  # Grove does not cast shadows. Depth comes from borders and tone shifts.
  none: "0"
  border: "1px solid {colors.surface-border}"
  inset: "inset 0 1px 0 rgba(255,255,255,0.02)"

components:
  button-primary:
    backgroundColor: "{colors.ink}"
    color: "{colors.cream}"
    borderRadius: "{rounded.md}"
    paddingX: "{spacing.lg}"          # 24
    paddingY: "0.875rem"              # 14 — the "py-3.5" baseline
    fontFamily: "{typography.families.sans}"
    fontSize: "{typography.scale.label}"
    fontWeight: "{typography.weights.medium}"
    hoverBackgroundColor: "{colors.earth}"
    transition: "background {motion.durations.quick} {motion.easings.standard}"

  button-secondary:
    backgroundColor: "transparent"
    color: "{colors.ink}"
    border: "1px solid {colors.surface-border}"
    borderRadius: "{rounded.md}"
    paddingX: "{spacing.lg}"
    paddingY: "0.875rem"
    hoverBackgroundColor: "{colors.surface-hover}"
    hoverBorderColor: "{colors.ink}"

  button-ghost:
    backgroundColor: "transparent"
    color: "{colors.text-secondary}"
    paddingX: "{spacing.sm}"
    paddingY: "{spacing.xs}"
    hoverColor: "{colors.ink}"

  link:
    color: "{colors.moss}"
    textDecoration: "underline"
    textUnderlineOffset: "2px"
    hoverTextUnderlineOffset: "3px"

  wikilink:
    color: "{colors.foreground}"
    borderBottom: "1px solid {colors.surface-border}"
    hoverColor: "{colors.moss}"
    hoverBorderColor: "{colors.moss}"

  wikilink-unresolved:
    color: "{colors.text-secondary}"
    cursor: "default"

  input:
    backgroundColor: "{colors.surface}"
    color: "{colors.foreground}"
    border: "1px solid {colors.surface-border}"
    borderRadius: "{rounded.md}"
    paddingX: "{spacing.lg}"          # 24 — matches button and card
    paddingY: "{spacing.sm}"
    fontFamily: "{typography.families.sans}"
    fontSize: "{typography.scale.body}"
    focusBorderColor: "{colors.moss}"
    focusRing: "2px solid {colors.moss}"

  card:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.surface-border}"
    borderRadius: "{rounded.md}"
    padding: "{spacing.lg}"           # p-6 — no p-5, no p-4
    hoverBackgroundColor: "{colors.surface-hover}"
    hoverBorderColor: "{colors.ink}"
    transition: "border-color {motion.durations.quick}, background {motion.durations.quick}"

  table-row:
    paddingX: "{spacing.lg}"          # px-6, not px-4
    paddingY: "{spacing.sm}"
    borderBottom: "1px solid {colors.surface-border}"

  code-inline:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.surface-border}"
    borderRadius: "{rounded.sm}"
    paddingX: "0.35em"
    paddingY: "0.15em"
    fontFamily: "{typography.families.mono}"
    fontSize: "0.85em"

  code-block:
    backgroundColor: "{colors.code-bg}"
    color: "{colors.code-fg}"
    border: "1px solid {colors.code-border}"
    borderRadius: "{rounded.md}"
    padding: "{spacing.md}"
    fontFamily: "{typography.families.mono}"
    fontSize: "0.85em"
    lineHeight: 1.6

  callout-note:
    backgroundColor: "{colors.surface}"
    borderLeft: "3px solid {colors.moss}"
    borderRadius: "{rounded.sm}"
    padding: "0.75rem 1rem"
    titleColor: "{colors.moss}"
    titleFontWeight: "{typography.weights.medium}"  # NOT 600

  callout-warning:
    borderLeft: "3px solid {colors.harvest}"
    titleColor: "{colors.harvest}"

  callout-tip:
    borderLeft: "3px solid {colors.moss}"
    titleColor: "{colors.moss}"

  callout-danger:
    borderLeft: "3px solid {colors.harvest}"
    titleColor: "{colors.harvest}"

  callout-info:
    borderLeft: "3px solid {colors.moss}"
    titleColor: "{colors.moss}"

  callout-quote:
    borderLeft: "3px solid {colors.earth}"
    titleColor: "{colors.earth}"

  focus-ring:
    outline: "2px solid {colors.moss}"
    outlineOffset: "2px"
---

# Grove — Design System

## Overview

Grove feels like a well-made book. Cream pages, ink marks, the occasional flash
of moss or harvest in the margin. Where most software reaches for glass,
gradients, and drop shadows, Grove reaches for paper, cloth, and pressed
leaves. Every surface is warm. Every line earns its place.

The core product is a knowledge API — the UI is the quiet room around it. It
should feel *handcrafted, not templated*: editorial typography, generous
negative space, subtractive chrome. When an agent doesn't know which token to
pick, it should ask: *would this appear in a carefully set book?* If the
answer is no (drop shadows, bright gradients, emoji, exclamation marks,
stock photography), pick something else.

This is a *manifesto in the shape of a product*. The landing page is not a
brochure; the note viewer is not a reader control; the dashboard is not a
SaaS console. All three are typeset pages from the same volume.

**North-star phrases** — return to these when in doubt:
*warm · editorial · cream-based · calm · precise · dry · handcrafted · slow to
reveal, fast to use · the page is the product.*

**Anti-patterns Grove rejects:**
SaaS marketing gradients · stock photography · illustrative heroes ·
exclamation marks · emoji · title-case headings · gamification · toast
confetti · drop shadows · skeuomorphic "glass" · decorative motion.

---

## Colors

Grove uses **five brand tokens and nothing else.** Raw Tailwind palette
classes (`text-gray-500`, `bg-blue-600`, `border-slate-200`) are violations.
Hardcoded hex values in components are violations. If a new color seems
necessary, it is almost always ink, moss, or harvest at a different opacity
stop — not a new color.

| Token | Hex | Evocative name | Use |
|-------|-----|----------------|-----|
| **cream** | `#FAF7F2` | Page Linen | Page ground, card surfaces, button text on dark |
| **ink** | `#2C2416` | Book Ink | Primary text, outlines, dark buttons, code background |
| **moss** | `#7A8B5C` | Moss Shade | Links, interactive accents, selected states, focus ring |
| **harvest** | `#D4890A` | Harvest Honey | Warm accent, highlights, warning callouts, emphasis |
| **earth** | `#3D3524` | Deep Loam | Hover depth on dark, code borders, quote callouts |

### Opacity grammar — four stops, no others

| Stop | Token | Use |
|------|-------|-----|
| **100** | `{colors.text-primary}` | Primary text, first-class marks — the default; omit the modifier |
| **60** | `{colors.text-secondary}` | Body prose, secondary content, captions |
| **40** | `{colors.text-tertiary}` | Tertiary text, bullets, table cell dividers |
| **15** | `{colors.text-faint}` | Separators, hover tints, surface borders, faint rules |

`/100`, `/60`, `/40`, `/15` are the only sanctioned opacity values anywhere in
the system — in Tailwind classes (`text-ink/60`) *and* in CSS variables
defined as `rgba(...)`. Values like `/50`, `/70`, `/30`, `/20`, `/80`, `/10`,
`/25`, `/75`, `/90`, `0.375` are violations.

### Colored text
Moss is the only color that regularly carries meaning (links, accents, focus).
Harvest is reserved for warmth (highlights, warning titles) and should never
compete with moss on the same screen for the same purpose. Earth appears only
as an inset (code background on dark) or as a hover shift over ink.

### Surfaces
All surfaces derive from cream by warm darkening, not gray. `surface` is
cream shifted toward earth by about one step; `surface-hover` is one more. No
cool grays ever appear in the system.

---

## Typography

Three families. Two weights. One scale.

### Families

| Family | Role | When to use |
|--------|------|-------------|
| **Lora** (serif) | `{typography.families.serif}` | Prose body, all headings h1–h4, hero display, note viewer |
| **Inter** (sans) | `{typography.families.sans}` | UI chrome, labels, buttons, navigation, table cells, metadata |
| **Geist Mono** (mono) | `{typography.families.mono}` | Code (inline and block), API keys, commands, timestamps in tables |

### Weights

Only **400 (regular)** and **500 (medium)**. No 600, 700, 800, 900, 300, 100.
A heading is medium; a paragraph is regular. A label is medium. Bold does not
exist in this system.

> **Known drift:** `globals.css:322` sets `.callout-title { font-weight: 600 }`.
> This is a violation — it should be 500. Fix on next pass.

### Scale

The scale is a Major Third (×1.25). Every step has one purpose. Never use
bracketed ad-hoc sizes (`text-[1.93rem]`) — if a size isn't in the scale, it
isn't in the design.

| Token | rem | Tailwind var | Use |
|-------|-----|--------------|-----|
| `{typography.scale.detail}` | 0.64 | `text-detail` | Timestamps, metadata micro |
| `{typography.scale.label}` | 0.80 | `text-label` | Section labels, table headers, button text |
| `{typography.scale.body}` | 1.00 | `text-base` | UI body text |
| `{typography.scale.prose}` | 1.0625 | via `.prose` | Note reading size (desktop) |
| `{typography.scale.subhead}` | 1.25 | `text-md` | h4, inline subheadings |
| `{typography.scale.title}` | 1.5625 | `text-subhead` | h3 |
| `{typography.scale.heading}` | 1.953 | `text-title` | h2, page titles |
| `{typography.scale.page}` | 2.441 | `text-heading` | h1 |
| `{typography.scale.display}` | 3.052 | `text-display` | Hero (mobile) |
| `{typography.scale.display-lg}` | 3.815 | `text-display-lg` | Hero (desktop) |

### Treatment rules (which tokens cannot encode)

- Headings track tight: `letter-spacing: -0.015em` for h1/h2, `-0.01em` for h3/h4.
- Prose line-height is **1.75** — slow reading cadence. Never tighter.
- Prose column is capped at **65ch**. Wider lines break the book feel.
- On mobile, prose falls to `body` size (1rem). Never smaller.
- The **bold-as-heading** pattern: a `<strong>` alone on a line in prose renders
  as a subhead (Lora 500, 1.25rem). This is a convention from the vault; honor it.
- Sentence case for headings. "How it works", not "How It Works".
- No `uppercase`, no `tracking-wider` labels. If a label needs emphasis, use
  Inter 500 at `text-label` size. That is enough.

---

## Layout & Spacing

### Section rhythm

Every landing section follows this exact pattern:

```
py-20 px-6 max-w-5xl mx-auto
```

No exceptions. Sections that don't follow this pattern are drift.

### Spacing scale

Grove is an 8-pixel grid with a 4-pixel half-step for tight text rhythm.
Choose from the scale — never from Tailwind's full range.

| Use | Value | Tailwind |
|-----|-------|----------|
| Label → heading | `{spacing.md}` | `mb-4` |
| Heading → content | `{spacing.lg}` | `mb-6` |
| Paragraph rhythm | `{spacing.md}` | `space-y-4` |
| Card/table padding | `{spacing.lg}` | `p-6`, `px-6 py-3` |
| Grid / step gap | `{spacing.xl}` or `{spacing.xxl}` | `gap-8` or `gap-12` |
| Section vertical | `{spacing.section-y}` | `py-20` |

**Gap discipline:** layout grids use `gap-8` or `gap-12`. Not `gap-4`, `gap-5`,
`gap-6`, `gap-10`. `space-y-4` is reserved for paragraph/form field flow —
not for laying out cards or stats.

**Padding discipline:** cards, dashboard panels, and table cells all use
`p-6` or `px-6`. Not `p-5`, not `px-4`. This is the single biggest active
drift in the codebase — treat it as hot.

### Breakpoints

Mobile-first. Every layout must work at 375px. Then graceful expansion at
`sm` (640), `md` (768), `lg` (1024), `xl` (1280). No breakpoint beyond `xl` —
the content-column cap (max-w-5xl) prevents it from mattering.

---

## Elevation & Depth

**Grove does not cast shadows.** Depth comes from two moves:

1. A **hairline border** (`1px solid` at ink @ 15) to separate surfaces.
2. A **warm tone shift** (`cream → surface → surface-hover`) to indicate state.

No `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, or
`drop-shadow-*` anywhere in the UI. The only permissible "shadow" is the
subtle internal highlight in code blocks (`elevation.inset`), and even that
is optional.

Likewise, no `backdrop-blur`, no `filter`, no glassmorphism. The page is
paper; paper does not refract light.

---

## Shapes

Three radii. Pick the smallest that reads as intentional.

| Token | Value | Use |
|-------|-------|-----|
| `{rounded.sm}` | 4px | Inline code, pill tags |
| `{rounded.md}` | 8px | **Default** — cards, inputs, buttons, images, code blocks |
| `{rounded.lg}` | 12px | Only for large surfaces (modals, hero cards) |
| `{rounded.full}` | 9999px | Avatars, status dots — nowhere else |

Do not mix radii at the same level of hierarchy. A card with an 8px radius
should contain 8px buttons, not 4px.

---

## Motion

Motion in Grove is *atmospheric, not performative*. Things fade; things do
not pop, slide, or bounce.

| Role | Duration | Easing |
|------|----------|--------|
| Hover color shifts | `{motion.durations.instant}` (150ms) | `{motion.easings.standard}` |
| Surface state transitions | `{motion.durations.quick}` (200ms) | `{motion.easings.standard}` |
| Entrance fade-up on scroll | `{motion.durations.calm}` (500ms) | `{motion.easings.out}` |
| Cursor blink | 1s | `{motion.easings.step}` |

**The only permissible named animations** are `fade-up` (scroll-in) and
`cursor-blink` (typing caret simulation). No slides, no flips, no springs,
no framer-motion sequences. The one sanctioned transform is
`active:scale-[0.98]` on buttons — a 2% press acknowledgement that gives
tactile feedback and disappears the moment the button is released. Nothing
else scales, pops, or bounces.

All motion must respect `prefers-reduced-motion`. The existing global rule
(`globals.css:133-141`) handles `fade-up` and `cursor-blink`; any new
animation must add its own reduced-motion fallback.

---

## Iconography

**Library:** [Lucide](https://lucide.dev) (install `lucide-react`). Monoline,
24×24 grid, stroke-width 2.

> **Current state:** lucide-react is **not yet installed** in grove-www.
> Icons today are hand-coded SVGs inline in components. Migrating to Lucide
> is a tracked cleanup — until then, new icons should be authored to match
> Lucide's 24×24, stroke-2 conventions so the swap is mechanical.

### Rules
- **24×24** is the default size. `16×16` is permitted for inline icons in tight
  table cells. Nothing else.
- **Stroke only.** Filled icons are not in the system — no `lucide-filled`,
  no Material-style filled variants.
- **Color states:**
  - rest: `text-ink/60`
  - hover: `text-ink`
  - active / selected: `text-moss`
  - disabled: `text-ink/40`
- Never use color fills inside an icon (a red heart, a green checkmark). If
  semantic color is needed, color the icon stroke with moss or harvest.

---

## Content Types

Grove surfaces eight first-class content types from the vault. Each has a
canonical rendering.

| Type | Source | Render as |
|------|--------|-----------|
| **Note / Concept** | `Resources/Concepts/*.md` | Serif prose, 65ch column, frontmatter metadata bar above title |
| **Person** | `Resources/People/*.md` | Same as note; metadata bar shows name, aliases, role |
| **Project** | `Resources/Projects/*.md` | Same as note; metadata bar shows status, linked goals |
| **Journal entry** | `Journal/YYYY/YYYY-MM-DD.md` | Serif prose with the date as title; breadcrumbs show year |
| **Recipe** | `Resources/Recipes/*.md` | Serif prose; frontmatter shows meal-type, prep-time as pills |
| **Source / quote** | `Sources/*.md` | Same as note; backlinks ("cited by") emphasized |
| **Company / Place** | `Resources/{Companies,Places}/*.md` | Same as note with type pill in metadata |
| **Trail** | stored in Grove server | Curated path of notes; rendered as an ordered stack with prose intro |

### The Note Viewer

The core reading surface. Treat it with reverence.

- **Prose:** `Lora` serif, `{typography.scale.prose}` (1.0625rem), 1.75 line-height, max 65ch.
- **Headings:** Lora 500, tight tracking, with h2 receiving a hairline bottom border.
- **Links:** moss, underlined with 2px offset.
- **Wikilinks:** foreground with a subtle bottom border; moss on hover.
- **Unresolved wikilinks:** `ink @ 60`, no border, `cursor: default` — a
  red link is a backlog item, not an error.
- **Code blocks:** dark inset (`{colors.code-bg}`), earth border, `{rounded.md}`, mono 0.85em.
- **Callouts:** left border in a brand color; title in the same. Six types
  (note/warning/tip/danger/info/quote) map to moss / harvest / moss / harvest / moss / earth.
- **Images:** `{rounded.md}`, 1px surface border. No captions beneath (the
  image carries itself).

---

## Components

Every component declaration above (in frontmatter) is authoritative. Below is
prose guidance for the ones that matter most.

### Button

There is a single button primitive with three variants: **primary**, **secondary**,
**ghost**. Every button-shaped thing in the app should use it.

- Primary = ink on cream, 24px × 14px padding, 8px radius.
- Secondary = transparent with 1px ink-15 border, same padding.
- Ghost = no border, no background, `text-ink/60`, tighter padding.
- **Never** improvise button padding. `py-2`, `py-2.5`, `py-3` are all wrong;
  the baseline is `py-3.5` (14px).

> **Current state:** No shared `<Button>` component exists. Buttons are
> inlined across login, dashboard, tables, and the landing page with at
> least 8 different padding combinations. Building a primitive is the
> highest-leverage next step.

### Input

Serif does not appear in forms. Inputs are Inter, `body` size, on `surface`
with a 15-stop border. Focus state = moss 2px outline with 2px offset (the
global focus ring). Never use a raw `outline: none` followed by a
custom ring — use `:focus-visible` and let the global rule do its work.

### Card

Every card is `surface` background, `{rounded.md}`, `p-6`, 1px surface border.
Hover tightens the border to ink and shifts the background to `surface-hover`.
No `p-5`, no `p-4`, no drop shadows.

### Table row

`px-6 py-3`. Rows separated by 1px `surface-border`. Header rows in Inter 500
at `label` size; body cells in Inter 400 at `body` size. Mono for API keys,
timestamps, and numeric identifiers.

### Callout

Six variants sharing one skeleton: `surface` background, 3px left border in
the variant color, title in the same color at `0.9em` and weight **500**
(not 600 — this is a live drift to fix in `globals.css:322`).

### Link and Wikilink

Regular links are **moss, underlined, 2px offset**. Wikilinks in prose are
**foreground with a bottom border** that shifts to moss on hover. The
distinction matters: external = moss immediately; internal = reveal moss
on interaction.

---

## Voice

Direct · calm · precise · warm · dry.

- No exclamation marks. Ever. In UI copy, in docs, in error messages.
- No emoji. The citrus mark is the only pictogram the system owns.
- Sentence case for every heading. "How it works", not "How It Works".
- Active voice. First person where it earns its place ("I keep my life in
  an Obsidian vault" — singular, honest).
- No superlatives, no buzzwords. No "revolutionary", "game-changing",
  "seamlessly", "delightful", "powerful", "next-generation".
- Show the work. A command, a git log, a latency number beats an adjective.
- Dry wit is welcome. Corporate cheer is not.

---

## Brand Marks

- **Full mark:** Haeckel-style botanical citrus. Used sparingly — the landing
  hero, the favicon-at-large, marketing. Not in the app chrome.
- **Icon:** Simplified citrus cross-section. Favicon, app icon, the header.
- **Wordmark:** "Grove" in Lora medium. Always capitalized. Never "GROVE",
  never "grove.".

---

## Accessibility

- **Focus ring:** global 2px moss outline with 2px offset on every
  `:focus-visible` target. Do not remove it locally. Do not replace it with
  a subtle alternative.
- **Contrast:** ink-on-cream meets WCAG AAA. Moss-on-cream meets AA for
  text ≥18px — use moss for small secondary text only when it is not the
  sole indicator of meaning (links pair color with underline).
- **Reduced motion:** every animation must fall back to `opacity: 1` with
  no transform when `prefers-reduced-motion: reduce`.
- **Selection:** moss background with cream foreground — keep this global.
- **Keyboard:** all interactive elements reachable in logical order; no
  `tabindex="-1"` on visible interactives.

---

## Do's and Don'ts

### Colors
- **Do** use the five brand tokens only.
- **Do** use exactly four opacity stops: 100, 60, 40, 15.
- **Don't** use raw Tailwind palette classes (`text-gray-*`, `bg-blue-*`, `border-slate-*`).
- **Don't** introduce hex colors in components. If you think you need a new color, you need a new opacity stop of an existing color.
- **Don't** use `/50`, `/70`, `/30`, `/20`, `/80`, `/10`, `/25`, `/75`, `/90` anywhere — including inside `rgba()` in `globals.css`.

### Typography
- **Do** use only `font-medium` and `font-normal`.
- **Do** use the named scale tokens (`text-label`, `text-heading`, etc.).
- **Do** cap prose at 65ch.
- **Don't** use `font-bold`, `font-semibold`, `font-light`, `font-thin`, `font-extrabold`, `font-black`.
- **Don't** use `text-[1.93rem]` or any other bracketed ad-hoc size.
- **Don't** mix serif and sans in the same sentence or button.
- **Don't** uppercase labels or track them wide.

### Layout
- **Do** use `py-20 px-6 max-w-5xl mx-auto` for every landing section.
- **Do** use `p-6` or `px-6 py-3` for cards and table cells.
- **Do** use `gap-8` or `gap-12` in grids.
- **Don't** use `p-5`, `p-4`, `px-4`, `px-5` on cards, tables, or inputs — these are the #1 active drift.
- **Don't** use `gap-4`, `gap-5`, `gap-6`, `gap-10`, `gap-14` in layout grids.
- **Don't** reach for `space-y-*` to lay out cards — it's for paragraph flow and form fields only.

### Depth & decoration
- **Don't** use `shadow-*` anywhere in the UI.
- **Don't** use `bg-gradient-*`, `from-*`, `via-*`, `to-*`.
- **Don't** use `backdrop-blur`, `filter`, `blur-*`.
- **Don't** add stock photography, illustrations, or mascot graphics.
- **Don't** add decorative icons that aren't load-bearing.

### Inline styles
- **Don't** use `style={{}}` in JSX. Exceptions: dynamically computed geometry (tree indent as a function of depth, progress bar widths from percentages, image `aspectRatio`). Everything else is a missing token.

### Components
- **Do** reach for the `Button`, `Card`, `Input` primitives — once they exist.
- **Do** build a primitive the second time you see a pattern, not the third.
- **Don't** re-invent button, input, or card styling inline. Every new variant is drift.
- **Don't** use filled icons. Stroke only.
- **Don't** install icon libraries other than Lucide.

### Motion
- **Do** fade things in over 500ms with `ease-out`.
- **Do** honor `prefers-reduced-motion`.
- **Do** keep `active:scale-[0.98]` on all buttons — the only sanctioned transform.
- **Don't** use springs, bounces, slides, or flips.
- **Don't** scale anything else. No hover scales, no entrance scales.
- **Don't** install framer-motion or similar motion libraries. CSS keyframes are enough.

### Voice
- **Don't** use exclamation marks in UI copy.
- **Don't** use emoji in UI copy.
- **Don't** title-case headings.
- **Don't** write in marketing superlatives.

---

## Verification

Two gates run via `npm run check:full`:

- **`scripts/drift-check.sh`** — grep lint. Every forbidden pattern in this
  document has a rule. Passes in under a second. If a rule here changes,
  the script must change too.
- **`test/visual.spec.ts`** — Playwright pixel-diff of 8 routes at 375 and
  1280. Baselines in `test/__screenshots__/` are version-controlled.
  Intentional visual changes: `npm run test:visual:update` then commit.

When a PR changes UI, both gates should be green before merge. The fast
gate (`npm run check`) runs drift + typecheck + unit tests and is cheap
enough to run on every save.

## Known drift (as of 2026-04-21)

Rather than pretend the system is clean, this section enumerates the active
drift so any agent can fix it on sight.

### Recently closed
- Opacity grammar in `globals.css` — `--accent-dim`, `--amber-dim`,
  `--muted`, `--muted-light`, `--surface-border` now snap to `/15 /40 /60`.
- `.callout-title font-weight: 600` → `500`.
- `shadow-2xl` and `backdrop-blur-sm` purged from modals, panels, and
  sticky surfaces.
- Bare `rounded` (18 files, 58 sites) → `rounded-md`.
- `p-5` / card `p-4` → `p-6`; table `px-4` / form `px-4` → `px-6`.
- Opacity modifiers outside `/15 /40 /60` bulk-snapped — `/5 /10 /20 /25`
  → `/15`; `/30` → `/40`; `/50 /70 /75 /80` → `/60`; `/90 /95` dropped.
- `bg-moss/90` hover → `bg-earth`.
- `bg-white` in the command palette → `bg-cream`; `rounded-xl` → `rounded-lg`.
- `lucide-react` installed; every inline SVG outside `graph-explorer.tsx`
  (D3) and `health-view.tsx` (sparkline) replaced with Lucide components.
- `graph-explorer.tsx` hex colors → `var(--moss|harvest|ink|earth|muted|muted-light|surface-border)` references.
- `<Button>` primitive applied across login, scoped sign-in links, landing
  hero + bottom CTAs, profile, handle editor, user table, key table,
  trail list, trail editor. The primitive lives at
  `src/components/primitives/button.tsx` — exports `Button` and
  `buttonClasses()` (the latter is server-safe for `<Link>` / `<a>` usage).
- `text-xs` / `text-sm` / `text-lg` / `text-xl` / `text-2xl` swept to
  `text-detail` / `text-label` / `text-subhead` / `text-title` / `text-heading`.
- `text-[10px]` arbitrary values → `text-detail`.
- `bg-white` in all form inputs → `bg-cream`.
- Custom focus-ring overrides (`focus:ring-2 focus:ring-moss/15`) removed —
  the global `:focus-visible` rule now applies everywhere.
- Orphan `text-rust` token (undefined, rendered colorless) → `text-harvest`.
- `font-semibold` residue → `font-medium`.
- Two verification gates wired into `npm run check` and `npm run check:full`.

### Still outstanding

| Severity | Drift | Where | Fix |
|----------|-------|-------|-----|
| Low | Bracketed prose-column widths | `note-view.tsx:76` (`max-w-[680px]`), `page.tsx` hero (`max-w-[20ch]`, `max-w-[60ch]`), `(resident)/s/[id]/page.tsx:61` (`max-w-[680px]`) | Treat as permitted typographic exceptions — these encode reading-column widths the token system doesn't yet name. If the list grows, add a `max-prose` token. |

**The codebase is ~97% coherent.** The outstanding drift is migration work —
each remaining item follows a pattern already proven in login. Do one
category at a time, in its own commit, with a grep-able check.

---

## How to extend this system

1. **Propose the need.** A new color / radius / weight / animation begins as
   a written case: what use does it solve, and why can't an existing token
   solve it?
2. **Update the frontmatter first.** Add the token to the YAML above with its
   semantic name, its value, and its `{reference}` if derived.
3. **Update the prose section.** Explain where the new token lives, when to
   reach for it, and what it replaces.
4. **Add a Do or Don't.** Guardrails keep the system from drifting.
5. **Propagate to code.** Add the CSS variable to `globals.css`, register it
   in the `@theme inline` block, use it everywhere the old pattern lived.
6. **Delete what it replaces.** A system stays clean by subtraction.

If adding a token takes more than fifteen minutes of justification, it
probably shouldn't exist.
