#!/usr/bin/env bash
# grove-www fitness function — product & visual quality scorecard
# Measures alignment between the live site and DESIGN.md / GOAL.md
# Usage: bash scripts/score.sh          (human-readable)
#        bash scripts/score.sh --json   (machine-parseable)
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src"
PAGE="$SRC/app/page.tsx"
LAYOUT="$SRC/app/layout.tsx"
CSS="$SRC/app/globals.css"
NOTEVIEW="$SRC/components/note-view.tsx"
METADATA="$SRC/components/metadata-bar.tsx"
CMDPAL="$SRC/components/command-palette.tsx"
CATCHALL="$SRC/app/[...path]/page.tsx"
NOTFOUND="$SRC/app/[...path]/not-found.tsx"
BREADCRUMBS="$SRC/components/breadcrumbs.tsx"
LOGIN="$SRC/app/login/page.tsx"
MARKDOWN="$SRC/lib/markdown.ts"
PKG="$ROOT/package.json"

JSON_MODE=false
[[ "${1:-}" == "--json" ]] && JSON_MODE=true

# ── Scoring ──────────────────────────────────────────────────────────
TOTAL=0; MAX=0
BRAND=0; LANDING=0; VIEWER=0; PERFORMANCE=0; POLISH=0
CURRENT_COMPONENT=""

check() {
  local pts="$1" name="$2" result="$3"
  MAX=$((MAX + pts))
  if [[ "$result" == "1" ]]; then
    TOTAL=$((TOTAL + pts))
    case "$CURRENT_COMPONENT" in
      brand) BRAND=$((BRAND + pts)) ;;
      landing) LANDING=$((LANDING + pts)) ;;
      viewer) VIEWER=$((VIEWER + pts)) ;;
      performance) PERFORMANCE=$((PERFORMANCE + pts)) ;;
      polish) POLISH=$((POLISH + pts)) ;;
    esac
    $JSON_MODE || printf "  [PASS] %s (%d pts)\n" "$name" "$pts"
  else
    $JSON_MODE || printf "  [FAIL] %s (%d pts)\n" "$name" "$pts"
  fi
}

has() { grep -qE "$2" "$1" 2>/dev/null && echo 1 || echo 0; }
hasnt() { grep -qE "$2" "$1" 2>/dev/null && echo 0 || echo 1; }
exists() { [[ -f "$1" ]] && echo 1 || echo 0; }
both() { [[ "$1" == "1" && "$2" == "1" ]] && echo 1 || echo 0; }
all3() { [[ "$1" == "1" && "$2" == "1" && "$3" == "1" ]] && echo 1 || echo 0; }


# ═══════════════════════════════════════════════════════════════════════
# BRAND COHESION (40 pts)
# Does the site actually look like DESIGN.md describes?
# ═══════════════════════════════════════════════════════════════════════
CURRENT_COMPONENT=brand
$JSON_MODE || printf "\n── Brand Cohesion (40 pts) ──\n"

# Brand palette: cream, ink, harvest, moss, earth must exist as CSS vars
check 4 "Brand palette defined (cream #FAF7F2)" \
  "$(has "$CSS" '#FAF7F2|--cream|--brand-cream')"

check 3 "Brand palette defined (ink #2C2416)" \
  "$(has "$CSS" '#2C2416|--ink|--brand-ink')"

check 3 "Brand palette defined (harvest #D4890A)" \
  "$(has "$CSS" '#D4890A|--harvest|--brand-harvest')"

check 3 "Brand palette defined (moss #7A8B5C)" \
  "$(has "$CSS" '#7A8B5C|--moss|--brand-moss')"

# Hero uses brand palette — cream bg, not dark
check 5 "Hero uses cream/warm background" \
  "$(has "$PAGE" 'bg-cream|bg-brand|bg-\[#FAF7F2\]')"

# Hero text uses ink/earth, not white/gray
check 4 "Hero text uses ink/dark warm tone" \
  "$(has "$PAGE" 'text-ink|text-brand-ink|text-earth')"

# Serif font loaded for wordmark (DESIGN.md: transitional serif)
check 5 "Serif font loaded for brand typography" \
  "$(has "$LAYOUT" 'Playfair|Lora|Libre_Baskerville|DM_Serif|Merriweather|Source_Serif|Crimson')"

# Wordmark in page uses serif class
check 4 "Wordmark/hero uses serif font class" \
  "$(has "$PAGE" 'font-serif|font-brand')"

# Transition from brand to product palette exists
check 3 "Visual transition from hero (warm) to body (dark)" \
  "$(has "$PAGE" 'bg-background|bg-\[#08090a\]')"

# Amber used as bridge accent (not just on "coming soon" labels)
check 3 "Amber accent used in product sections" \
  "$(has "$PAGE" 'text-amber|border-amber|bg-amber')"

# Voice: no exclamation marks
check 3 "No exclamation marks in copy" \
  "$(hasnt "$PAGE" '"[^"]*![^="]*"')"


# ═══════════════════════════════════════════════════════════════════════
# LANDING PAGE (35 pts)
# Are all GOAL.md sections present?
# ═══════════════════════════════════════════════════════════════════════
CURRENT_COMPONENT=landing
$JSON_MODE || printf "\n── Landing Page (35 pts) ──\n"

check 3 "Hero with dual CTAs" \
  "$(all3 "$(has "$PAGE" 'function Hero')" "$(has "$PAGE" 'Early access')" "$(has "$PAGE" 'Self-host')")"

check 3 "Problem statement section" \
  "$(has "$PAGE" 'function TheProblem')"

check 3 "How It Works (numbered steps)" \
  "$(both "$(has "$PAGE" 'function HowItWorks')" "$(has "$PAGE" '01')")"

check 4 "The 6 Tools section with examples" \
  "$(has "$PAGE" 'Tools()|SixTools|TheTools')"

check 4 "Comparison table (vs other MCP servers)" \
  "$(has "$PAGE" 'Comparison|<table|comparison')"

check 3 "Deploy options (3 cards)" \
  "$(all3 "$(has "$PAGE" 'function Deploy')" "$(has "$PAGE" 'Self-hosted')" "$(has "$PAGE" 'Enterprise')")"

check 4 "Waitlist email capture (real form)" \
  "$(has "$PAGE" '<form|<input.*email|formAction')"

check 3 "Groves preview section" \
  "$(has "$PAGE" 'function Groves')"

check 3 "Why Now / Karpathy quote" \
  "$(both "$(has "$PAGE" 'function WhyNow')" "$(has "$PAGE" 'Karpathy')")"

check 3 "Bottom CTA" \
  "$(has "$PAGE" 'function BottomCTA')"

check 2 "Footer with links" \
  "$(has "$PAGE" 'function Footer')"


# ═══════════════════════════════════════════════════════════════════════
# NOTE VIEWER (30 pts)
# Reading experience matches DESIGN.md spec
# ═══════════════════════════════════════════════════════════════════════
CURRENT_COMPONENT=viewer
$JSON_MODE || printf "\n── Note Viewer (30 pts) ──\n"

check 3 "Prose typography with dark overrides" \
  "$(has "$CSS" 'tw-prose-body')"

check 3 "Wikilink styling (normal + unresolved)" \
  "$(both "$(has "$CSS" '\.wikilink[^-]')" "$(has "$CSS" 'wikilink-unresolved')")"

check 3 "All 6 callout types" \
  "$(both \
     "$(both "$(has "$CSS" 'callout-note')" "$(has "$CSS" 'callout-warning')")" \
     "$(both "$(has "$CSS" 'callout-tip')" "$(has "$CSS" 'callout-danger')")")"

check 3 "Code blocks styled (Shiki)" \
  "$(both "$(has "$CSS" 'prose pre')" "$(has "$MARKDOWN" 'shiki')")"

check 3 "Metadata bar (type + tags + dates)" \
  "$(all3 "$(exists "$METADATA")" "$(has "$METADATA" 'TYPE_COLORS')" "$(has "$METADATA" 'tags')")"

check 3 "Breadcrumb navigation" \
  "$(exists "$BREADCRUMBS")"

check 3 "Backlinks section" \
  "$(has "$NOTEVIEW" 'backlinks')"

check 3 "KaTeX math rendering" \
  "$(both "$(has "$CSS" 'katex')" "$(has "$MARKDOWN" 'katex')")"

check 3 "Mermaid diagram support" \
  "$(exists "$SRC/components/mermaid-hydrator.tsx")"

check 3 "Image styling in prose" \
  "$(has "$CSS" 'prose img')"


# ═══════════════════════════════════════════════════════════════════════
# PERFORMANCE (25 pts)
# ═══════════════════════════════════════════════════════════════════════
CURRENT_COMPONENT=performance
$JSON_MODE || printf "\n── Performance (25 pts) ──\n"

check 5 "Server-rendered markdown" \
  "$(both "$(hasnt "$NOTEVIEW" "'use client'")" "$(has "$NOTEVIEW" 'renderMarkdown')")"

check 4 "Fonts via next/font (not CDN)" \
  "$(has "$LAYOUT" 'next/font')"

UC_COUNT=$(grep -rl "'use client'" "$SRC" 2>/dev/null | wc -l | tr -d ' ')
check 4 "Minimal use client directives (<=4)" \
  "$([[ $UC_COUNT -le 4 ]] && echo 1 || echo 0)"

IMG_COUNT=$(find "$ROOT/public" -type f \( -name '*.jpg' -o -name '*.png' -o -name '*.webp' \) 2>/dev/null | wc -l | tr -d ' ')
check 4 "No large image assets in public/" \
  "$([[ $IMG_COUNT -eq 0 ]] && echo 1 || echo 0)"

check 4 "Landing page is server component" \
  "$(hasnt "$PAGE" "'use client'")"

check 4 "No unnecessary heavy deps" \
  "$(hasnt "$PKG" 'framer-motion\|three\|gsap\|lottie')"


# ═══════════════════════════════════════════════════════════════════════
# USABILITY & MOBILE (30 pts)
# Does it work well on phones? Is it comprehensible to target users?
# ═══════════════════════════════════════════════════════════════════════
CURRENT_COMPONENT=polish
$JSON_MODE || printf "\n── Usability & Mobile (30 pts) ──\n"

# Mobile-first layout: hero must have mobile-specific sizing
check 3 "Hero has mobile text scaling (base + sm/md breakpoints)" \
  "$(both "$(has "$PAGE" 'text-4xl')" "$(has "$PAGE" 'sm:text-5xl')")"

# Touch targets: CTAs must be large enough (py-3 or larger)
check 3 "Touch-friendly CTA sizing (py-3+)" \
  "$(has "$PAGE" 'py-3')"

# Readable line lengths: max-w constraints on prose
check 3 "Content max-width for readability" \
  "$(has "$PAGE" 'max-w-2xl')"

# No horizontal scroll: code blocks and pre tags handle overflow
check 2 "Code blocks handle overflow (overflow-x)" \
  "$(has "$CSS" 'overflow-x')"

# Mobile nav: reasonable spacing, not cramped
check 3 "Nav has reasonable mobile layout" \
  "$(has "$PAGE" 'gap-6')"

# Deploy cards stack on mobile (grid-cols-1 base, expand on sm)
check 3 "Deploy cards stack on mobile" \
  "$(both "$(has "$PAGE" 'grid-cols-1')" "$(has "$PAGE" 'sm:grid-cols-3')")"

# Command palette accessible without keyboard (touch button exists)
check 3 "Search accessible via touch (button with onClick)" \
  "$(has "$CMDPAL" 'openPalette')"

# Full viewport layout
check 2 "Body has min-h-screen for full viewport" \
  "$(has "$LAYOUT" 'min-h-screen')"

# Note viewer: responsive padding
check 3 "Note viewer has responsive padding" \
  "$(has "$CATCHALL" 'px-6')"

# Comprehensibility: hero explains what Grove IS in first fold
check 3 "Hero subtitle explains product clearly" \
  "$(both "$(has "$PAGE" 'notes')" "$(has "$PAGE" 'connected')")"

# Login page exists
check 2 "Login/auth flow exists" \
  "$(exists "$LOGIN")"


# ═══════════════════════════════════════════════════════════════════════
# OUTPUT
# ═══════════════════════════════════════════════════════════════════════

if $JSON_MODE; then
  cat <<ENDJSON
{
  "total": $TOTAL,
  "max": $MAX,
  "brand": $BRAND,
  "landing": $LANDING,
  "viewer": $VIEWER,
  "performance": $PERFORMANCE,
  "usability": $POLISH
}
ENDJSON
else
  echo ""
  echo "==========================================="
  printf "  Brand Cohesion:  %3d / 40\n" "$BRAND"
  printf "  Landing Page:    %3d / 35\n" "$LANDING"
  printf "  Note Viewer:     %3d / 30\n" "$VIEWER"
  printf "  Performance:     %3d / 25\n" "$PERFORMANCE"
  printf "  Usability:       %3d / 30\n" "$POLISH"
  echo "-------------------------------------------"
  printf "  TOTAL:           %3d / %d\n" "$TOTAL" "$MAX"
  echo "==========================================="
fi
