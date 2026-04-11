#!/usr/bin/env bash
# grove-www design coherence scorecard
# Tests for what SHOULDN'T be there (violations) not what SHOULD (features)
# A clean system scores high. Current state should be ~80-100 / 250.
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
LOGIN="$SRC/app/login/page.tsx"
MARKDOWN="$SRC/lib/markdown.ts"
PKG="$ROOT/package.json"

JSON_MODE=false
[[ "${1:-}" == "--json" ]] && JSON_MODE=true

# ── Scoring ──────────────────────────────────────────────────────────
TOTAL=0; MAX=0
TOKEN=0; TYPO=0; COLOR=0; SPACING=0; CONTENT=0; A11Y=0; PERF=0
CURRENT=""

check() {
  local pts="$1" name="$2" result="$3"
  MAX=$((MAX + pts))
  if [[ "$result" == "1" ]]; then
    TOTAL=$((TOTAL + pts))
    case "$CURRENT" in
      token) TOKEN=$((TOKEN + pts)) ;;
      typo) TYPO=$((TYPO + pts)) ;;
      color) COLOR=$((COLOR + pts)) ;;
      spacing) SPACING=$((SPACING + pts)) ;;
      content) CONTENT=$((CONTENT + pts)) ;;
      a11y) A11Y=$((A11Y + pts)) ;;
      perf) PERF=$((PERF + pts)) ;;
    esac
    $JSON_MODE || printf "  [PASS] %s (%d pts)\n" "$name" "$pts"
  else
    $JSON_MODE || printf "  [FAIL] %s (%d pts)\n" "$name" "$pts"
  fi
}

has() { grep -qE -- "$2" "$1" 2>/dev/null && echo 1 || echo 0; }
hasnt() { grep -qE -- "$2" "$1" 2>/dev/null && echo 0 || echo 1; }
exists() { [[ -f "$1" ]] && echo 1 || echo 0; }
both() { [[ "$1" == "1" && "$2" == "1" ]] && echo 1 || echo 0; }
all3() { [[ "$1" == "1" && "$2" == "1" && "$3" == "1" ]] && echo 1 || echo 0; }
all4() { [[ "$1" == "1" && "$2" == "1" && "$3" == "1" && "$4" == "1" ]] && echo 1 || echo 0; }

# Count violations, return score: start at max, lose penalty per hit, floor 0
count_violations() {
  local max="$1" penalty="$2" pattern="$3" path="$4" glob="${5:-*.tsx}"
  local count
  count=$(grep -rE "$pattern" "$path" --include="$glob" 2>/dev/null | wc -l | tr -d ' ')
  local score=$((max - count * penalty))
  if [ $score -lt 0 ]; then score=0; fi
  $JSON_MODE || [[ $count -eq 0 ]] || printf "    ↳ %d violations found\n" "$count" >&2
  echo "$score"
}

# Score from violation count (for use with check)
violation_check() {
  local max="$1" penalty="$2" pattern="$3" path="$4" glob="${5:-*.tsx}"
  local score
  score=$(count_violations "$max" "$penalty" "$pattern" "$path" "$glob")
  [[ $score -eq $max ]] && echo 1 || echo 0
}


# ═══════════════════════════════════════════════════════════════════════
# TOKEN DISCIPLINE (50 pts)
# No raw Tailwind colors, no hardcoded hex, no bracket sizes, clean opacity
# ═══════════════════════════════════════════════════════════════════════
CURRENT=token
$JSON_MODE || printf "\n── Token Discipline (50 pts) ──\n"

# Raw Tailwind palette colors in tsx (deduct 2 per violation, max 15)
RAW_TW_SCORE=$(count_violations 15 2 \
  'text-green-|bg-green-|border-green-|text-blue-|bg-blue-|border-blue-|text-stone-|bg-stone-|border-stone-|text-rose-|bg-rose-|border-rose-|text-purple-|bg-purple-|border-purple-|text-cyan-|bg-cyan-|border-cyan-|text-red-|bg-red-|border-red-|text-gray-|bg-gray-|text-slate-|bg-slate-|text-zinc-|bg-zinc-|text-neutral-|bg-neutral-|text-yellow-|bg-yellow-|text-orange-|bg-orange-|text-emerald-|bg-emerald-|text-teal-|bg-teal-|text-indigo-|bg-indigo-|text-violet-|bg-violet-|text-pink-|bg-pink-|text-sky-|bg-sky-|text-lime-|bg-lime-|text-fuchsia-|bg-fuchsia-' \
  "$SRC")
MAX=$((MAX + 15)); TOKEN=$((TOKEN + RAW_TW_SCORE)); TOTAL=$((TOTAL + RAW_TW_SCORE))
$JSON_MODE || printf "  [%s] No raw Tailwind palette colors (%d/15 pts)\n" \
  "$([[ $RAW_TW_SCORE -eq 15 ]] && echo PASS || echo FAIL)" "$RAW_TW_SCORE"

# Hardcoded hex in tsx files (deduct 2 per violation, max 10)
HEX_SCORE=$(count_violations 10 2 '#[0-9a-fA-F]{6}' "$SRC")
MAX=$((MAX + 10)); TOKEN=$((TOKEN + HEX_SCORE)); TOTAL=$((TOTAL + HEX_SCORE))
$JSON_MODE || printf "  [%s] No hardcoded hex in components (%d/10 pts)\n" \
  "$([[ $HEX_SCORE -eq 10 ]] && echo PASS || echo FAIL)" "$HEX_SCORE"

# Bracket size literals in tsx: text-[...rem], text-[...px] (deduct 1 per, max 10)
BRACKET_SCORE=$(count_violations 10 1 'text-\[[0-9]' "$SRC")
MAX=$((MAX + 10)); TOKEN=$((TOKEN + BRACKET_SCORE)); TOTAL=$((TOTAL + BRACKET_SCORE))
$JSON_MODE || printf "  [%s] No bracket size literals (%d/10 pts)\n" \
  "$([[ $BRACKET_SCORE -eq 10 ]] && echo PASS || echo FAIL)" "$BRACKET_SCORE"

# Bad opacity stops: anything not /100, /60, /40, /15, /5 (deduct 1 per, max 15)
# Allow /5 for very subtle hover tints. Everything else is a violation.
BAD_OPACITY=$(grep -roE '/[0-9]+' "$SRC" --include='*.tsx' 2>/dev/null \
  | grep -vE '/(100|60|40|15|5)$' \
  | grep -vE '/(1|2|3|4|6|7|8|9)$' \
  | wc -l | tr -d ' ')
# Also count the single-digit false positives that are actual opacity: /50, /70, /30, /20, /80, /10, /90, /25, /75
BAD_OPACITY2=$(grep -roE '/(50|70|30|20|80|10|90|25|75|35|45|55|65|85|95)\b' "$SRC" --include='*.tsx' 2>/dev/null | wc -l | tr -d ' ')
BAD_OPACITY_TOTAL=$((BAD_OPACITY2))
OPACITY_SCORE=$((15 - BAD_OPACITY_TOTAL))
if [ $OPACITY_SCORE -lt 0 ]; then OPACITY_SCORE=0; fi
MAX=$((MAX + 15)); TOKEN=$((TOKEN + OPACITY_SCORE)); TOTAL=$((TOTAL + OPACITY_SCORE))
$JSON_MODE || [[ $BAD_OPACITY_TOTAL -eq 0 ]] || printf "    ↳ %d bad opacity stops found\n" "$BAD_OPACITY_TOTAL"
$JSON_MODE || printf "  [%s] Opacity uses only 100/60/40/15 stops (%d/15 pts)\n" \
  "$([[ $OPACITY_SCORE -eq 15 ]] && echo PASS || echo FAIL)" "$OPACITY_SCORE"


# ═══════════════════════════════════════════════════════════════════════
# TYPOGRAPHY COHERENCE (40 pts)
# Type scale vars used, serif loaded, consistent weights
# ═══════════════════════════════════════════════════════════════════════
CURRENT=typo
$JSON_MODE || printf "\n── Typography Coherence (40 pts) ──\n"

check 5 "Type scale CSS vars defined (--text-xs through --text-hero)" \
  "$(all4 \
     "$(has "$CSS" '--text-xs')" \
     "$(has "$CSS" '--text-base')" \
     "$(has "$CSS" '--text-xl')" \
     "$(has "$CSS" '--text-hero')")"

check 5 "Serif font loaded (Lora)" \
  "$(has "$LAYOUT" 'Lora')"

check 5 "Note prose uses serif font" \
  "$(has "$CSS" 'font-family.*--font-serif')"

# font-bold / font-semibold / font-light / font-thin violations (deduct 2 per, max 10)
WEIGHT_SCORE=$(count_violations 10 2 'font-bold|font-semibold|font-light|font-thin|font-black|font-extrabold' "$SRC")
MAX=$((MAX + 10)); TYPO=$((TYPO + WEIGHT_SCORE)); TOTAL=$((TOTAL + WEIGHT_SCORE))
$JSON_MODE || printf "  [%s] Only font-medium and font-normal used (%d/10 pts)\n" \
  "$([[ $WEIGHT_SCORE -eq 10 ]] && echo PASS || echo FAIL)" "$WEIGHT_SCORE"

# Section headings use consistent size (all h2 on page.tsx use same text-[] value)
H2_SIZES=$(grep -oE 'h2.*?text-\[[^\]]+\]' "$PAGE" 2>/dev/null | grep -oE 'text-\[[^\]]+\]' | sort -u | wc -l | tr -d ' ')
check 5 "Section headings use consistent size (1 text size for all h2)" \
  "$([[ $H2_SIZES -le 2 ]] && echo 1 || echo 0)"

# Section labels use consistent size
LABEL_SIZES=$(grep -oE 'uppercase.*?text-\[[^\]]+\]' "$PAGE" 2>/dev/null | grep -oE 'text-\[[^\]]+\]' | sort -u | wc -l | tr -d ' ')
check 5 "Section labels use consistent size" \
  "$([[ $LABEL_SIZES -le 1 ]] && echo 1 || echo 0)"

check 5 "Hero headline uses serif" \
  "$(has "$PAGE" 'font-serif')"


# ═══════════════════════════════════════════════════════════════════════
# COLOR COHERENCE (40 pts)
# Brand palette defined, components use tokens not raw colors
# ═══════════════════════════════════════════════════════════════════════
CURRENT=color
$JSON_MODE || printf "\n── Color Coherence (40 pts) ──\n"

check 5 "Brand palette vars defined (cream, ink, moss, harvest, earth)" \
  "$(all4 \
     "$(has "$CSS" '--cream.*#FAF7F2')" \
     "$(has "$CSS" '--ink.*#2C2416')" \
     "$(has "$CSS" '--moss.*#7A8B5C')" \
     "$(both "$(has "$CSS" '--harvest.*#D4890A')" "$(has "$CSS" '--earth.*#3D3524')")")"

# metadata-bar.tsx: raw Tailwind colors (deduct 3 per violation, max 10)
META_COLOR_SCORE=$(count_violations 10 1 \
  'bg-green-|text-green-|border-green-|bg-blue-|text-blue-|border-blue-|bg-stone-|text-stone-|border-stone-|bg-rose-|text-rose-|border-rose-|bg-purple-|text-purple-|border-purple-|bg-cyan-|text-cyan-|border-cyan-' \
  "$METADATA" "*.tsx")
MAX=$((MAX + 10)); COLOR=$((COLOR + META_COLOR_SCORE)); TOTAL=$((TOTAL + META_COLOR_SCORE))
$JSON_MODE || printf "  [%s] metadata-bar uses brand tokens (%d/10 pts)\n" \
  "$([[ $META_COLOR_SCORE -eq 10 ]] && echo PASS || echo FAIL)" "$META_COLOR_SCORE"

# [...path]/page.tsx: raw Tailwind colors (deduct 2 per, max 5)
CATCH_COLOR_SCORE=$(count_violations 5 1 \
  'text-green-|text-blue-|text-purple-|text-rose-|text-cyan-|text-stone-' \
  "$CATCHALL" "*.tsx")
MAX=$((MAX + 5)); COLOR=$((COLOR + CATCH_COLOR_SCORE)); TOTAL=$((TOTAL + CATCH_COLOR_SCORE))
$JSON_MODE || printf "  [%s] [...path]/page.tsx uses brand tokens (%d/5 pts)\n" \
  "$([[ $CATCH_COLOR_SCORE -eq 5 ]] && echo PASS || echo FAIL)" "$CATCH_COLOR_SCORE"

# Callout colors use hardcoded hex (deduct 1 per, max 10)
CALLOUT_HEX=$(grep -E 'callout' "$CSS" 2>/dev/null | grep -cE '#[0-9a-fA-F]{3,6}' || echo 0)
CALLOUT_SCORE=$((10 - CALLOUT_HEX))
if [ $CALLOUT_SCORE -lt 0 ]; then CALLOUT_SCORE=0; fi
MAX=$((MAX + 10)); COLOR=$((COLOR + CALLOUT_SCORE)); TOTAL=$((TOTAL + CALLOUT_SCORE))
$JSON_MODE || [[ $CALLOUT_HEX -eq 0 ]] || printf "    ↳ %d hardcoded hex in callouts\n" "$CALLOUT_HEX"
$JSON_MODE || printf "  [%s] Callout colors use brand tokens (%d/10 pts)\n" \
  "$([[ $CALLOUT_SCORE -eq 10 ]] && echo PASS || echo FAIL)" "$CALLOUT_SCORE"

# Prose overrides use hardcoded hex instead of var() (deduct 1 per, max 10)
PROSE_HEX=$(grep -A1 'tw-prose-' "$CSS" 2>/dev/null | grep -cE '#[0-9a-fA-F]{3,6}' || echo 0)
# Also count hex in prose body/headings/links vars
PROSE_HEX2=$(grep -E 'tw-prose-(body|headings|links|bold|code)' "$CSS" 2>/dev/null | grep -cE '#[0-9a-fA-F]{3,6}' || echo 0)
PROSE_SCORE=$((10 - PROSE_HEX2))
if [ $PROSE_SCORE -lt 0 ]; then PROSE_SCORE=0; fi
MAX=$((MAX + 10)); COLOR=$((COLOR + PROSE_SCORE)); TOTAL=$((TOTAL + PROSE_SCORE))
$JSON_MODE || [[ $PROSE_HEX2 -eq 0 ]] || printf "    ↳ %d hardcoded hex in prose vars\n" "$PROSE_HEX2"
$JSON_MODE || printf "  [%s] Prose colors use CSS vars (%d/10 pts)\n" \
  "$([[ $PROSE_SCORE -eq 10 ]] && echo PASS || echo FAIL)" "$PROSE_SCORE"


# ═══════════════════════════════════════════════════════════════════════
# SPACING CONSISTENCY (30 pts)
# Same py- on all sections, consistent label→heading→content gaps
# ═══════════════════════════════════════════════════════════════════════
CURRENT=spacing
$JSON_MODE || printf "\n── Spacing Consistency (30 pts) ──\n"

# All landing sections use same py- value (exactly 1 = perfect)
PY_VALUES=$(grep -oE 'className="py-[0-9]+' "$PAGE" 2>/dev/null | grep -oE 'py-[0-9]+' | sort -u | wc -l | tr -d ' ')
check 8 "All sections use same py- value ($PY_VALUES unique)" \
  "$([[ $PY_VALUES -eq 1 ]] && echo 1 || echo 0)"

# Label-to-heading gap: all section labels use same mb- (exactly 1)
LABEL_MB=$(grep -E 'uppercase.*mb-|mb-.*uppercase' "$PAGE" 2>/dev/null | grep -oE 'mb-[0-9]+' | sort -u)
LABEL_MB_COUNT=$(echo "$LABEL_MB" | sort -u | wc -l | tr -d ' ')
check 8 "Label-to-heading gap consistent ($LABEL_MB_COUNT unique mb- values)" \
  "$([[ $LABEL_MB_COUNT -eq 1 ]] && echo 1 || echo 0)"

# Heading-to-content gap: h2 mb- values (exactly 1)
H2_MB=$(grep -E '<h2' "$PAGE" 2>/dev/null | grep -oE 'mb-[0-9]+' | sort -u)
H2_MB_COUNT=$(echo "$H2_MB" | sort -u | wc -l | tr -d ' ')
check 7 "Heading-to-content gap consistent ($H2_MB_COUNT unique mb- on h2)" \
  "$([[ $H2_MB_COUNT -eq 1 ]] && echo 1 || echo 0)"

# Paragraph spacing: space-y values (max 2 — one for tight, one for loose)
SPACEY=$(grep -oE 'space-y-[0-9]+' "$PAGE" 2>/dev/null | sort -u | wc -l | tr -d ' ')
check 7 "Paragraph spacing consistent ($SPACEY unique space-y values)" \
  "$([[ $SPACEY -le 2 ]] && echo 1 || echo 0)"


# ═══════════════════════════════════════════════════════════════════════
# CONTENT COMPLETENESS (40 pts)
# Key sections present
# ═══════════════════════════════════════════════════════════════════════
CURRENT=content
$JSON_MODE || printf "\n── Content Completeness (40 pts) ──\n"

check 5 "Hero section with CTAs" \
  "$(both "$(has "$PAGE" 'Early access')" "$(has "$PAGE" 'Self-host')")"

check 5 "Problem section" \
  "$(has "$PAGE" 'TheProblem|problem')"

check 5 "How It Works section with steps" \
  "$(both "$(has "$PAGE" 'HowItWorks|How it works|how-it-works')" "$(has "$PAGE" '01')")"

check 5 "Tools section" \
  "$(has "$PAGE" 'Tools|TheTools|SixTools|The tools')"

check 5 "Comparison section" \
  "$(has "$PAGE" 'Comparison|comparison|<table')"

check 5 "Deploy options" \
  "$(all3 "$(has "$PAGE" 'Deploy|deploy')" "$(has "$PAGE" 'Self-hosted')" "$(has "$PAGE" 'Enterprise')")"

check 5 "Waitlist email form" \
  "$(has "$PAGE" '<form|<input.*email|formAction')"

check 5 "Proper heading hierarchy (h1 + multiple h2)" \
  "$(both "$(has "$PAGE" '<h1')" "$([[ $(grep -c '<h2' "$PAGE" 2>/dev/null || echo 0) -ge 5 ]] && echo 1 || echo 0)")"


# ═══════════════════════════════════════════════════════════════════════
# ACCESSIBILITY (30 pts)
# ═══════════════════════════════════════════════════════════════════════
CURRENT=a11y
$JSON_MODE || printf "\n── Accessibility (30 pts) ──\n"

H2_COUNT=$(grep -c '<h2' "$PAGE" 2>/dev/null || echo 0)
check 5 "Heading hierarchy (>=5 h2 tags)" \
  "$([[ $H2_COUNT -ge 5 ]] && echo 1 || echo 0)"

check 5 "Focus states defined" \
  "$(has "$CSS" ':focus-visible|focus:ring|focus:outline')"

check 4 "Form labels present" \
  "$(has "$LOGIN" '<label|htmlFor')"

check 4 "Sections have aria-label" \
  "$(has "$PAGE" 'aria-label')"

check 4 "Skip-to-content link" \
  "$(has "$PAGE" 'skip-to|skip-nav|#main|#content')"

check 4 "Respects prefers-reduced-motion" \
  "$(has "$CSS" 'prefers-reduced-motion')"

check 4 "Custom selection color" \
  "$(has "$CSS" '::selection')"


# ═══════════════════════════════════════════════════════════════════════
# PERFORMANCE (20 pts)
# ═══════════════════════════════════════════════════════════════════════
CURRENT=perf
$JSON_MODE || printf "\n── Performance (20 pts) ──\n"

check 4 "Server-rendered landing page (no 'use client')" \
  "$(hasnt "$PAGE" "'use client'")"

check 3 "Server-rendered note viewer" \
  "$(both "$(hasnt "$NOTEVIEW" "'use client'")" "$(has "$NOTEVIEW" 'renderMarkdown')")"

check 3 "Fonts via next/font (preloaded)" \
  "$(has "$LAYOUT" 'next/font')"

UC_COUNT=$(grep -rl "'use client'" "$SRC" 2>/dev/null | wc -l | tr -d ' ')
check 3 "Minimal client components (<=4)" \
  "$([[ $UC_COUNT -le 4 ]] && echo 1 || echo 0)"

check 3 "No heavy animation deps" \
  "$(hasnt "$PKG" 'framer-motion|three|gsap|lottie')"

check 2 "Mermaid lazy-loaded" \
  "$(has "$SRC/components/mermaid-hydrator.tsx" 'dynamic|lazy')"

check 2 "No large unoptimized images (>100KB)" \
  "$([[ $(find "$ROOT/public" -type f \( -name '*.jpg' -o -name '*.png' -o -name '*.webp' \) -size +100k 2>/dev/null | wc -l | tr -d ' ') -eq 0 ]] && echo 1 || echo 0)"


# ═══════════════════════════════════════════════════════════════════════
# OUTPUT
# ═══════════════════════════════════════════════════════════════════════

if $JSON_MODE; then
  cat <<ENDJSON
{
  "total": $TOTAL,
  "max": $MAX,
  "token_discipline": $TOKEN,
  "typography": $TYPO,
  "color_coherence": $COLOR,
  "spacing": $SPACING,
  "content": $CONTENT,
  "accessibility": $A11Y,
  "performance": $PERF
}
ENDJSON
else
  echo ""
  echo "==========================================="
  printf "  Token Discipline:  %3d / 50\n" "$TOKEN"
  printf "  Typography:        %3d / 40\n" "$TYPO"
  printf "  Color Coherence:   %3d / 40\n" "$COLOR"
  printf "  Spacing:           %3d / 30\n" "$SPACING"
  printf "  Content:           %3d / 40\n" "$CONTENT"
  printf "  Accessibility:     %3d / 30\n" "$A11Y"
  printf "  Performance:       %3d / 20\n" "$PERF"
  echo "-------------------------------------------"
  printf "  TOTAL:           %3d / %d\n" "$TOTAL" "$MAX"
  echo "==========================================="
  echo ""
  if [ $TOTAL -ge 200 ]; then
    echo "  System is genuinely coherent."
  elif [ $TOTAL -ge 150 ]; then
    echo "  Getting there. Focus on token discipline."
  elif [ $TOTAL -ge 100 ]; then
    echo "  Significant violations remain."
  else
    echo "  System needs fundamental cleanup."
  fi
fi
