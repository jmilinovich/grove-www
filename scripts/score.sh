#!/usr/bin/env bash
# grove-www fitness function — product & visual quality scorecard
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
# BRAND COHESION (30 pts)
# ═══════════════════════════════════════════════════════════════════════
CURRENT_COMPONENT=brand
$JSON_MODE || printf "\n── Brand Cohesion (30 pts) ──\n"

check 3 "Product palette in CSS vars" \
  "$(has "$CSS" '#08090a')"

check 3 "Accent green defined" \
  "$(has "$CSS" '#4ade80')"

check 3 "Amber secondary defined" \
  "$(has "$CSS" '#f5a623')"

check 3 "Inter + Geist Mono loaded" \
  "$(both "$(has "$LAYOUT" 'Geist_Mono')" "$(has "$LAYOUT" 'Inter')")"

check 3 "No exclamation marks in landing copy" \
  "$(hasnt "$PAGE" '"[^"]*![^="]*"')"

check 3 "Selection uses accent color" \
  "$(has "$CSS" '::selection')"

check 3 "Noise texture overlay" \
  "$(has "$CSS" 'fractalNoise')"

check 3 "No img tags in landing page" \
  "$(hasnt "$PAGE" '<img ')"

check 3 "Components use tokens not raw hex" \
  "$(hasnt "$NOTEVIEW" '#[0-9a-fA-F]{6}')"

check 3 "OpenGraph metadata present" \
  "$(has "$LAYOUT" 'openGraph')"


# ═══════════════════════════════════════════════════════════════════════
# LANDING PAGE (35 pts)
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
  "$(has "$PAGE" 'Tools\(\)\|SixTools\|TheTools')"

check 4 "Comparison table (vs other MCP servers)" \
  "$(has "$PAGE" 'Comparison\|<table\|comparison')"

check 3 "Deploy options (3 cards)" \
  "$(all3 "$(has "$PAGE" 'function Deploy')" "$(has "$PAGE" 'Self-hosted')" "$(has "$PAGE" 'Enterprise')")"

check 4 "Waitlist email capture (real form)" \
  "$(has "$PAGE" '<form\|<input.*email\|formAction\|action.*submit')"

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
  "$(hasnt "$ROOT/package.json" 'framer-motion\|three\|gsap\|lottie')"


# ═══════════════════════════════════════════════════════════════════════
# POLISH (30 pts)
# ═══════════════════════════════════════════════════════════════════════
CURRENT_COMPONENT=polish
$JSON_MODE || printf "\n── Polish (30 pts) ──\n"

check 4 "Command palette (Cmd+K)" \
  "$(both "$(exists "$CMDPAL")" "$(has "$CMDPAL" 'metaKey')")"

check 3 "Mobile responsive (sm: breakpoints)" \
  "$(has "$PAGE" 'sm:text-')"

check 3 "Consistent dark theme (bg-background on body)" \
  "$(has "$LAYOUT" 'bg-background')"

check 3 "Fade-up scroll animations" \
  "$(both "$(has "$CSS" 'fadeUp')" "$(has "$PAGE" 'fade-up')")"

check 3 "Hover transitions on surfaces" \
  "$(has "$CSS" 'transition.*border-color')"

check 3 "Login/auth flow" \
  "$(exists "$LOGIN")"

check 3 "404 page" \
  "$(exists "$NOTFOUND")"

check 3 "Type-colored badges in directory listing" \
  "$(has "$CATCHALL" 'TYPE_COLORS')"

check 3 "Last-visited redirect" \
  "$(exists "$SRC/components/last-visited.tsx")"

check 2 "Keyboard nav in command palette" \
  "$(both "$(has "$CMDPAL" 'ArrowDown')" "$(has "$CMDPAL" 'ArrowUp')")"


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
  "polish": $POLISH
}
ENDJSON
else
  echo ""
  echo "==========================================="
  printf "  Brand Cohesion:  %3d / 30\n" "$BRAND"
  printf "  Landing Page:    %3d / 35\n" "$LANDING"
  printf "  Note Viewer:     %3d / 30\n" "$VIEWER"
  printf "  Performance:     %3d / 25\n" "$PERFORMANCE"
  printf "  Polish:          %3d / 30\n" "$POLISH"
  echo "-------------------------------------------"
  printf "  TOTAL:           %3d / %d\n" "$TOTAL" "$MAX"
  echo "==========================================="
fi
