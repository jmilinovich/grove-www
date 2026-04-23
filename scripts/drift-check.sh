#!/usr/bin/env bash
# scripts/drift-check.sh
#
# Hard gate against design-system drift. Each rule maps to a clause in
# DESIGN.md. Any match is a violation; exit code is non-zero if any rule
# fails. Run via `npm run check:drift` or before opening a PR.
#
# Passes quickly (<500ms) on a fresh clone. Update this file whenever a
# rule changes in DESIGN.md.

set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src"
CSS="$SRC/app/globals.css"

fails=0

# Files where a small, documented set of inline styles are permitted —
# specifically for *computed* geometry (tree indent, node color mapping,
# progress-bar widths, image aspect ratios).
inline_style_whitelist=(
  "src/components/sidebar.tsx"
  "src/components/trail-editor.tsx"
  "src/components/image-grid.tsx"
  "src/components/lifecycle-view.tsx"
  "src/app/(resident)/[atHandle]/[vaultSlug]/dashboard/page.tsx"
  "src/app/(resident)/[atHandle]/[vaultSlug]/dashboard/graph/graph-explorer.tsx"
)

# Files where hand-rolled SVG or hardcoded colors are expected (data viz,
# or an inline HTML template served from a proxy where Tailwind classes
# don't reach).
svg_whitelist=(
  "src/app/(resident)/[atHandle]/[vaultSlug]/dashboard/graph/graph-explorer.tsx"
  "src/components/health-view.tsx"
  "src/proxy.ts"
)

SEARCH_TSX() {
  grep -rnE --include='*.tsx' --include='*.ts' "$@" "$SRC" 2>/dev/null || true
}
SEARCH_CSS() {
  grep -nE "$@" "$CSS" 2>/dev/null || true
}

section() { printf "\n\033[1m── %s ─────────────────\033[0m\n" "$1"; }
pass()    { printf "  \033[32m✓\033[0m %s\n" "$1"; }
fail() {
  local title="$1"; shift
  local hits="$*"
  if [[ -z "$hits" ]]; then
    return 0
  fi
  printf "  \033[31m✗\033[0m %s\n" "$title"
  printf "%s\n" "$hits" | sed 's/^/      /'
  fails=$((fails+1))
}

# ── COLORS ──────────────────────────────────────────────────────────
section "Colors"

raw_palette=$(SEARCH_TSX '\b(text|bg|border|fill|ring|stroke|placeholder|divide|outline|decoration|accent)-(gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]+' || true)
fail "Raw Tailwind palette (use brand tokens: cream/ink/moss/harvest/earth)" "$raw_palette"
[[ -z "$raw_palette" ]] && pass "no raw Tailwind palette classes"

# Hex literals in TSX/TS outside data-viz allow-list.
# Exclude HTML entities (`&#8984;`) which share the # prefix but aren't colors.
hex_hits=$(SEARCH_TSX '#[0-9a-fA-F]{3,8}\b' | grep -v '&#' | grep -vFf <(printf '%s\n' "${svg_whitelist[@]}") || true)
fail "Hex color literals outside data-viz" "$hex_hits"
[[ -z "$hex_hits" ]] && pass "no hardcoded hex in components"

# Orphan tokens — `text-rust`, etc.
orphan_tokens=$(SEARCH_TSX '\b(text|bg|border)-(rust)\b' || true)
fail "Undefined color tokens (use harvest/moss/earth/ink/cream)" "$orphan_tokens"
[[ -z "$orphan_tokens" ]] && pass "no orphan color tokens"

# ── OPACITY GRAMMAR ─────────────────────────────────────────────────
section "Opacity grammar (/15 /40 /60 /100 only)"

bad_opacity=$(SEARCH_TSX '/(5|10|20|25|30|50|70|75|80|90|95)\b' || true)
fail "Forbidden opacity modifiers" "$bad_opacity"
[[ -z "$bad_opacity" ]] && pass "all opacity modifiers within grammar"

# globals.css opacity values
bad_css_opacity=$(SEARCH_CSS 'rgba\([^)]*, ?0\.(1|05|2|25|3|5|7|75|8|9|95)\)' || true)
fail "globals.css rgba() outside grammar (0.15/0.40/0.60/1.0)" "$bad_css_opacity"
[[ -z "$bad_css_opacity" ]] && pass "globals.css opacity values clean"

# ── TYPOGRAPHY ──────────────────────────────────────────────────────
section "Typography"

bad_weight=$(SEARCH_TSX '\bfont-(bold|semibold|light|thin|extrabold|black)\b' || true)
fail "Non-sanctioned font-weight (only font-normal and font-medium)" "$bad_weight"
[[ -z "$bad_weight" ]] && pass "font weights within grammar"

bad_weight_css=$(grep -nE 'font-weight: ?(100|200|300|600|700|800|900)' "$CSS" 2>/dev/null || true)
fail "globals.css font-weight outside 400/500" "$bad_weight_css"
[[ -z "$bad_weight_css" ]] && pass "globals.css font weights clean"

# Heading pages use serif (Lora) — `text-title` and `text-heading` are
# SIZE tokens only, so an <h1>/<h2> carrying them without `font-serif`
# inherits `--font-sans` (Inter). This rule surfaces headings that opted
# into the display size but forgot the family pairing, which is how the
# profile / error / not-found pages silently drifted for ~2 days before
# anyone noticed. Multi-line className={[...]} arrays fall outside this
# grep — add an inline `// drift: font-serif` tag if you must.
heading_no_serif=$(SEARCH_TSX '<h[1-2] [^>]*\b(text-title|text-heading)\b' | grep -v 'font-serif' | grep -v '// drift: font-serif' || true)
fail "Heading uses text-title/text-heading without font-serif (Lora family missing)" "$heading_no_serif"
[[ -z "$heading_no_serif" ]] && pass "heading-size tokens paired with font-serif"

# ── RADIUS ──────────────────────────────────────────────────────────
section "Radius"

bad_radius=$(SEARCH_TSX '\brounded-(xl|2xl|3xl)\b' || true)
fail "Non-sanctioned radius (only sm/md/lg/full)" "$bad_radius"
[[ -z "$bad_radius" ]] && pass "radius within grammar"

bare_rounded=$(SEARCH_TSX '\brounded\b(?![-a-z])' || true)
# grep -E doesn't support lookaround — fall back:
bare_rounded=$(SEARCH_TSX '\brounded[^-a-zA-Z]' || true)
fail "Bare \`rounded\` (use rounded-md by default)" "$bare_rounded"
[[ -z "$bare_rounded" ]] && pass "no bare rounded"

# ── DEPTH / DECORATION ──────────────────────────────────────────────
section "Depth & decoration"

shadows=$(SEARCH_TSX '\bshadow-(sm|md|lg|xl|2xl|inner)\b|\bdrop-shadow-' || true)
fail "Shadows (Grove has no shadows; use hairline borders)" "$shadows"
[[ -z "$shadows" ]] && pass "no shadow utilities"

blurs=$(SEARCH_TSX '\bbackdrop-blur|\bblur-(sm|md|lg|xl|2xl|3xl|none)\b' || true)
fail "Blur / backdrop-blur (no glass effects)" "$blurs"
[[ -z "$blurs" ]] && pass "no blur / backdrop"

gradients=$(SEARCH_TSX '\bbg-gradient-|[[:space:]]from-[a-z]+-[0-9]+|[[:space:]]via-[a-z]+-[0-9]+|[[:space:]]to-[a-z]+-[0-9]+' || true)
fail "Gradients (Grove does not use gradients)" "$gradients"
[[ -z "$gradients" ]] && pass "no gradients"

# ── INLINE STYLES ───────────────────────────────────────────────────
section "Inline styles"

inline_styles=$(SEARCH_TSX 'style=\{\{' | grep -vFf <(printf '%s\n' "${inline_style_whitelist[@]}") || true)
fail "Inline style={{}} outside whitelist (move to class or primitive)" "$inline_styles"
[[ -z "$inline_styles" ]] && pass "inline styles contained"

# ── MOTION ──────────────────────────────────────────────────────────
section "Motion"

# active:scale-[0.98] is the sanctioned tactile press. scale-100 is the
# default (used as `disabled:active:scale-100` to disable the press). Anything
# else is drift.
bad_scale=$(SEARCH_TSX '\bscale-(75|90|95|105|110|125|150)\b|\bscale-\[(?!0\.98\b)' || true)
fail "Scale transforms (only active:scale-[0.98] is permitted)" "$bad_scale"
[[ -z "$bad_scale" ]] && pass "no unauthorized scales"

bad_duration=$(SEARCH_TSX '\bduration-(75|100|300|500|700|1000)\b' || true)
fail "Non-sanctioned transition durations (150/200/500 only)" "$bad_duration"
[[ -z "$bad_duration" ]] && pass "durations within grammar"

# ── SUMMARY ─────────────────────────────────────────────────────────
printf "\n"
if [[ $fails -gt 0 ]]; then
  printf "\033[31mFAIL: %d drift rule(s) violated.\033[0m See DESIGN.md.\n" "$fails"
  exit 1
fi
printf "\033[32mPASS: zero drift.\033[0m\n"
exit 0
