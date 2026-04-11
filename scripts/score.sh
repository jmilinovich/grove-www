#!/usr/bin/env bash
# grove-www fitness function — world-leading product & visual quality
# Calibrated against Linear, Vercel, Raycast, Arc quality bars
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
BRAND=0; CONTENT=0; A11Y=0; CRAFT=0; MOBILE=0; PERF=0; VIEWER=0
CURRENT=""

check() {
  local pts="$1" name="$2" result="$3"
  MAX=$((MAX + pts))
  if [[ "$result" == "1" ]]; then
    TOTAL=$((TOTAL + pts))
    case "$CURRENT" in
      brand) BRAND=$((BRAND + pts)) ;;
      content) CONTENT=$((CONTENT + pts)) ;;
      a11y) A11Y=$((A11Y + pts)) ;;
      craft) CRAFT=$((CRAFT + pts)) ;;
      mobile) MOBILE=$((MOBILE + pts)) ;;
      perf) PERF=$((PERF + pts)) ;;
      viewer) VIEWER=$((VIEWER + pts)) ;;
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
all4() { [[ "$1" == "1" && "$2" == "1" && "$3" == "1" && "$4" == "1" ]] && echo 1 || echo 0; }


# ═══════════════════════════════════════════════════════════════════════
# BRAND IDENTITY (35 pts)
# Does the site look like DESIGN.md? Two palettes, serif mark, warm hero
# ═══════════════════════════════════════════════════════════════════════
CURRENT=brand
$JSON_MODE || printf "\n── Brand Identity (35 pts) ──\n"

check 4 "Brand palette vars in CSS (cream, ink, harvest, moss)" \
  "$(all4 \
     "$(has "$CSS" '#FAF7F2|--cream')" \
     "$(has "$CSS" '#2C2416|--ink')" \
     "$(has "$CSS" '#D4890A|--harvest')" \
     "$(has "$CSS" '#7A8B5C|--moss')")"

check 5 "Hero uses cream/warm background (not dark)" \
  "$(has "$PAGE" 'bg-cream|bg-brand|bg-\[#FAF7F2\]')"

check 4 "Hero text uses ink/earth tone (not white/gray)" \
  "$(has "$PAGE" 'text-ink|text-brand-ink|text-earth')"

check 5 "Serif font loaded for brand typography" \
  "$(has "$LAYOUT" 'Playfair|Lora|Libre_Baskerville|DM_Serif|Merriweather|Source_Serif|Crimson')"

check 4 "Hero headline uses serif font class" \
  "$(has "$PAGE" 'font-serif|font-brand')"

check 3 "Visual transition from warm hero to dark product sections" \
  "$(has "$PAGE" 'bg-background|bg-\[#08090a\]')"

check 3 "Amber accent bridges brand and product palettes" \
  "$(has "$PAGE" 'text-amber|border-amber|bg-amber')"

check 2 "No exclamation marks in copy" \
  "$(hasnt "$PAGE" '"[^"]*![^="]*"')"

check 3 "Body uses sans-serif by default (not monospace)" \
  "$(has "$LAYOUT" 'font-sans')"

check 2 "All colors in components use tokens (no raw hex)" \
  "$(both "$(hasnt "$NOTEVIEW" '#[0-9a-fA-F]{6}')" "$(hasnt "$CMDPAL" '#[0-9a-fA-F]{6}')")"


# ═══════════════════════════════════════════════════════════════════════
# CONTENT & COMPREHENSION (30 pts)
# Can users understand what Grove is in 5 seconds? Is copy tight?
# (calibrated: Linear = 5 words, Raycast = 4 words, Vercel = 7 words)
# ═══════════════════════════════════════════════════════════════════════
CURRENT=content
$JSON_MODE || printf "\n── Content & Comprehension (30 pts) ──\n"

check 3 "Hero with dual CTAs (hosted + self-host)" \
  "$(all3 "$(has "$PAGE" 'function Hero')" "$(has "$PAGE" 'Early access')" "$(has "$PAGE" 'Self-host')")"

check 3 "Problem section exists" \
  "$(has "$PAGE" 'function TheProblem')"

check 3 "How It Works (numbered steps)" \
  "$(both "$(has "$PAGE" 'function HowItWorks')" "$(has "$PAGE" '01')")"

check 4 "The 6 Tools section with real examples" \
  "$(has "$PAGE" 'Tools()|SixTools|TheTools')"

check 4 "Comparison table (24 MCP servers vs Grove)" \
  "$(has "$PAGE" 'Comparison|<table|comparison')"

check 3 "Deploy options (3 cards: hosted/self/enterprise)" \
  "$(all3 "$(has "$PAGE" 'function Deploy')" "$(has "$PAGE" 'Self-hosted')" "$(has "$PAGE" 'Enterprise')")"

check 4 "Waitlist email capture (real form, not anchor link)" \
  "$(has "$PAGE" '<form|<input.*email|formAction')"

check 3 "Quantified social proof (numbers, not just claims)" \
  "$(has "$PAGE" '[0-9]+.*notes|[0-9]+.*ms|[0-9]+.*connections|[0-9]+.*users')"

check 3 "Proper heading hierarchy (h1 → h2 per section)" \
  "$(has "$PAGE" '<h2')"


# ═══════════════════════════════════════════════════════════════════════
# ACCESSIBILITY (30 pts)
# WCAG 2.1 AA minimum. World-class sites hit AAA.
# ═══════════════════════════════════════════════════════════════════════
CURRENT=a11y
$JSON_MODE || printf "\n── Accessibility (30 pts) ──\n"

# Heading hierarchy: every section should have an h2
H2_COUNT=$(grep -c '<h2' "$PAGE" 2>/dev/null || echo 0)
check 5 "Proper heading hierarchy (>=5 h2 tags for sections)" \
  "$([[ $H2_COUNT -ge 5 ]] && echo 1 || echo 0)"

# Focus states on interactive elements
check 5 "Focus states defined (focus:ring or focus:outline)" \
  "$(has "$CSS" 'focus|:focus')"

# Touch targets: command palette buttons must be 44px+
check 4 "Command palette buttons are touch-friendly (py-2+)" \
  "$(has "$CMDPAL" 'py-2 |py-2.5|py-3')"

# Form labels
check 4 "Login form has proper <label> element" \
  "$(has "$LOGIN" '<label|htmlFor')"

# ARIA on sections
check 3 "Sections have aria-label or aria-labelledby" \
  "$(has "$PAGE" 'aria-label')"

# Skip link for keyboard navigation
check 3 "Skip-to-content link for keyboard users" \
  "$(has "$PAGE" 'skip-to|skip-nav|#main|#content')"

# Reduced motion support
check 3 "Respects prefers-reduced-motion" \
  "$(has "$CSS" 'prefers-reduced-motion')"

# Color contrast: muted text should have sufficient contrast token
check 3 "Muted text has 4.5:1+ contrast (>= #767676 on dark)" \
  "$(has "$CSS" '--muted.*#[789a-f]')"


# ═══════════════════════════════════════════════════════════════════════
# VISUAL CRAFT (25 pts)
# Micro-interactions, motion, error states — the polish gap
# (calibrated: Arc = scale transforms + 150ms transitions, Linear = 3s max)
# ═══════════════════════════════════════════════════════════════════════
CURRENT=craft
$JSON_MODE || printf "\n── Visual Craft (25 pts) ──\n"

# Scroll-triggered animations
check 2 "Fade-up scroll animations" \
  "$(both "$(has "$CSS" 'fadeUp')" "$(has "$PAGE" 'fade-up')")"

# Button press feedback (active state with scale)
check 3 "Button press feedback (active:scale or active:translate)" \
  "$(has "$PAGE" 'active:scale|active:translate|active:bg')"

# text-wrap balance on headlines (prevents orphans)
check 3 "Headlines use text-wrap: balance" \
  "$(has "$PAGE" 'text-balance|text-wrap.*balance|text-pretty')"

# Hover transitions on all interactive elements
check 2 "Hover transitions (transition-colors on links)" \
  "$(has "$PAGE" 'transition-colors')"

# Command palette entrance animation (not instant appear)
check 3 "Command palette has entrance/exit animation" \
  "$(has "$CMDPAL" 'animate-|transition-all|scale-|translate-')"

# Search error recovery (not silent failure)
check 3 "Search shows error state on API failure" \
  "$(has "$CMDPAL" 'error|Error|failed|Failed')"

# Noise texture overlay
check 2 "Subtle noise texture for warmth" \
  "$(has "$CSS" 'fractalNoise')"

# Smooth scroll behavior
check 2 "Smooth scroll for anchor links" \
  "$(has "$CSS" 'scroll-behavior.*smooth')"

# Loading skeleton for note viewer
check 3 "Loading state for note content (skeleton or spinner)" \
  "$(has "$CATCHALL" 'loading|skeleton|Suspense|Loading')"

# Selection color matches accent
check 2 "Custom selection color" \
  "$(has "$CSS" '::selection')"


# ═══════════════════════════════════════════════════════════════════════
# MOBILE & RESPONSIVE (25 pts)
# Phone IS the pain point. Must be flawless on 375px.
# (calibrated: 4 breakpoints, 44px touch targets, no overflow)
# ═══════════════════════════════════════════════════════════════════════
CURRENT=mobile
$JSON_MODE || printf "\n── Mobile & Responsive (25 pts) ──\n"

# Hero has proper mobile scaling
check 3 "Hero text scales across breakpoints" \
  "$(both "$(has "$PAGE" 'text-4xl')" "$(has "$PAGE" 'sm:text-5xl')")"

# Touch-friendly CTAs (44px minimum)
check 3 "CTA buttons meet 44px minimum (py-3+)" \
  "$(has "$PAGE" 'py-3')"

# Deploy cards stack on mobile
check 3 "Deploy cards stack (grid-cols-1 → sm:grid-cols-3)" \
  "$(both "$(has "$PAGE" 'grid-cols-1')" "$(has "$PAGE" 'sm:grid-cols-3')")"

# Content max-width for readability
check 2 "Content constrained to readable line length" \
  "$(has "$PAGE" 'max-w-2xl')"

# Search accessible without keyboard
check 3 "Search button visible and tappable on mobile" \
  "$(has "$CMDPAL" 'openPalette')"

# Nav doesn't overflow on mobile
check 3 "Nav items fit on 375px (flex-wrap or compact)" \
  "$(has "$PAGE" 'flex.*items-center.*justify-between')"

# Code blocks scroll horizontally
check 2 "Pre/code blocks have overflow-x handling" \
  "$(has "$CSS" 'overflow-x')"

# Note viewer readable on mobile
check 3 "Note viewer has mobile padding (px-4+)" \
  "$(has "$CATCHALL" 'px-6')"

# Viewport meta handled
check 3 "min-h-screen on body for full viewport" \
  "$(has "$LAYOUT" 'min-h-screen')"


# ═══════════════════════════════════════════════════════════════════════
# PERFORMANCE (20 pts)
# The page IS the product demo. If it's slow, you've disproven yourself.
# (calibrated: Vercel LCP <1s, Linear CLS <0.05)
# ═══════════════════════════════════════════════════════════════════════
CURRENT=perf
$JSON_MODE || printf "\n── Performance (20 pts) ──\n"

check 4 "Server-rendered landing page (no 'use client')" \
  "$(hasnt "$PAGE" "'use client'")"

check 3 "Server-rendered markdown in note viewer" \
  "$(both "$(hasnt "$NOTEVIEW" "'use client'")" "$(has "$NOTEVIEW" 'renderMarkdown')")"

check 3 "Fonts via next/font (preloaded, no CLS)" \
  "$(has "$LAYOUT" 'next/font')"

UC_COUNT=$(grep -rl "'use client'" "$SRC" 2>/dev/null | wc -l | tr -d ' ')
check 3 "Minimal client components (<=4)" \
  "$([[ $UC_COUNT -le 4 ]] && echo 1 || echo 0)"

check 3 "No heavy animation/3D deps" \
  "$(hasnt "$PKG" 'framer-motion|three|gsap|lottie')"

IMG_COUNT=$(find "$ROOT/public" -type f \( -name '*.jpg' -o -name '*.png' -o -name '*.webp' \) -size +100k 2>/dev/null | wc -l | tr -d ' ')
check 2 "No large unoptimized images (>100KB)" \
  "$([[ $IMG_COUNT -eq 0 ]] && echo 1 || echo 0)"

check 2 "Mermaid is lazy-loaded (not in main bundle)" \
  "$(has "$SRC/components/mermaid-hydrator.tsx" 'dynamic|lazy')"


# ═══════════════════════════════════════════════════════════════════════
# NOTE VIEWER (15 pts)
# The product surface. Must feel like a well-typeset document.
# ═══════════════════════════════════════════════════════════════════════
CURRENT=viewer
$JSON_MODE || printf "\n── Note Viewer (15 pts) ──\n"

check 2 "Prose typography with dark overrides" \
  "$(has "$CSS" 'tw-prose-body')"

check 2 "Wikilink styling (normal + unresolved)" \
  "$(both "$(has "$CSS" '\.wikilink[^-]')" "$(has "$CSS" 'wikilink-unresolved')")"

check 2 "Callout types styled (note, warning, tip, danger)" \
  "$(both \
     "$(both "$(has "$CSS" 'callout-note')" "$(has "$CSS" 'callout-warning')")" \
     "$(both "$(has "$CSS" 'callout-tip')" "$(has "$CSS" 'callout-danger')")")"

check 2 "Code blocks with syntax highlighting (Shiki)" \
  "$(both "$(has "$CSS" 'prose pre')" "$(has "$MARKDOWN" 'shiki')")"

check 2 "Metadata bar (type badges + tags + dates)" \
  "$(all3 "$(exists "$METADATA")" "$(has "$METADATA" 'TYPE_COLORS')" "$(has "$METADATA" 'tags')")"

check 2 "Backlinks section" \
  "$(has "$NOTEVIEW" 'backlinks')"

check 1 "KaTeX math rendering" \
  "$(both "$(has "$CSS" 'katex')" "$(has "$MARKDOWN" 'katex')")"

check 1 "Mermaid diagram support" \
  "$(exists "$SRC/components/mermaid-hydrator.tsx")"

check 1 "Breadcrumb navigation" \
  "$(exists "$BREADCRUMBS")"


# ═══════════════════════════════════════════════════════════════════════
# OUTPUT
# ═══════════════════════════════════════════════════════════════════════

if $JSON_MODE; then
  cat <<ENDJSON
{
  "total": $TOTAL,
  "max": $MAX,
  "brand": $BRAND,
  "content": $CONTENT,
  "accessibility": $A11Y,
  "craft": $CRAFT,
  "mobile": $MOBILE,
  "performance": $PERF,
  "viewer": $VIEWER
}
ENDJSON
else
  echo ""
  echo "==========================================="
  printf "  Brand Identity:    %3d / 35\n" "$BRAND"
  printf "  Content:           %3d / 30\n" "$CONTENT"
  printf "  Accessibility:     %3d / 30\n" "$A11Y"
  printf "  Visual Craft:      %3d / 25\n" "$CRAFT"
  printf "  Mobile:            %3d / 25\n" "$MOBILE"
  printf "  Performance:       %3d / 20\n" "$PERF"
  printf "  Note Viewer:       %3d / 15\n" "$VIEWER"
  echo "-------------------------------------------"
  printf "  TOTAL:           %3d / %d\n" "$TOTAL" "$MAX"
  echo "==========================================="
fi
