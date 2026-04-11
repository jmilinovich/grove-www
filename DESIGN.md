# Grove — Design System

> Warm, editorial, cream-based. A knowledge system that feels like a well-made book.

---

## Colors

Five brand tokens. No raw Tailwind palette colors. No hardcoded hex in components.

| Token | Hex | Use |
|-------|-----|-----|
| **cream** | `#FAF7F2` | Page ground, card backgrounds |
| **ink** | `#2C2416` | Primary text, outlines |
| **moss** | `#7A8B5C` | Links, accents, interactive elements |
| **harvest** | `#D4890A` | Warm accent, highlights, CTAs |
| **earth** | `#3D3524` | Deep anchoring, hover states, code backgrounds |

**Derived surfaces:** `--surface` (slightly darker cream), `--surface-border` (ink at 10%), `--surface-hover`, `--code-bg` (earth-toned dark inset for code blocks).

### Opacity grammar

Four stops only: **100 / 60 / 40 / 15**

| Stop | Use |
|------|-----|
| `/100` | Default (omit) — full color |
| `/60` | Body text, secondary content |
| `/40` | Tertiary text, borders, bullets |
| `/15` | Faint separators, hover tints, backgrounds |

No other opacity values. `/50`, `/70`, `/30`, `/20`, `/80` are violations.

---

## Typography

**Scale:** Major Third (1.25 ratio), defined as CSS variables.

| Var | Size | Use |
|-----|------|-----|
| `--text-xs` | 0.64rem | System text, timestamps |
| `--text-sm` | 0.8rem | Section labels, metadata |
| `--text-base` | 1rem | UI body text |
| `--text-prose` | 1.0625rem | Note prose body |
| `--text-md` | 1.25rem | Subsection headings (h4) |
| `--text-lg` | 1.5625rem | Section headings (h3) |
| `--text-xl` | 1.953rem | Page headings (h2) |
| `--text-2xl` | 2.441rem | Large headings (h1) |
| `--text-hero` | 3.052rem | Hero headline |
| `--text-hero-lg` | 3.815rem | Hero headline (desktop) |

**Fonts:**

| Family | Var | Use |
|--------|-----|-----|
| **Lora** (serif) | `--font-serif` | Headings, note prose, hero |
| **Inter** (sans) | `--font-sans` | UI text, labels, navigation, body |
| **Geist Mono** (mono) | `--font-mono` | Code blocks, technical content |

**Weights:** Only `font-medium` (500) and `font-normal` (400). No bold, semibold, light, or thin.

---

## Spacing

### Section rhythm

All landing page sections: `py-20 px-6 max-w-5xl mx-auto`.

### Internal gaps

| Pattern | Value |
|---------|-------|
| Label above heading | `mb-4` |
| Heading above content | `mb-6` |
| Paragraph spacing | `space-y-4` |
| Step/card grid gaps | `gap-8` or `gap-12` |

---

## Layout

- **Content-first.** No sidebars or chrome competing with content.
- **Generous whitespace.** Cream background is not emptiness — it is negative space.
- **Mobile-first.** Every layout works on 375px first.
- **No decorative elements.** No gradients, no stock photos, no illustrations in UI.

---

## Voice

- Direct, calm, precise, warm, dry.
- No exclamation marks. No emoji.
- Sentence case for headings.
- Active voice. First person where it matters.
- No superlatives.

---

## Logo & Mark

- **Full mark:** Botanical citrus illustration (Ernst Haeckel style). Brand moments only.
- **Icon:** Simplified citrus cross-section. Favicon, app icon.
- **Wordmark:** "Grove" in Lora medium. Always capitalized.

---

## Note Viewer

The core product surface. Feels like a well-typeset document.

- **Prose:** Lora serif, `--text-prose` size, 65ch max-width, 1.75 line-height.
- **Headings:** Lora serif, weight 500, using type scale vars.
- **Links:** Moss green, underlined with 2px offset.
- **Wikilinks:** Foreground with subtle bottom border, moss on hover.
- **Code blocks:** Dark inset (`--code-bg`), earth-toned border, 8px radius.
- **Callouts:** Left border + tinted title. Colors should use brand tokens (not raw Tailwind).

---

## Iconography

- **Lucide** — monoline, 24x24 grid.
- Rest: muted. Hover: foreground. Active: moss.
- No filled icons.
