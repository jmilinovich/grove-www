import type { JSX } from "react";
import type { Skill } from "@/lib/grove-api.v2.types";
import { formatRelative, formatScheduledTime } from "@/lib/format-time";
import { ShortcutChip } from "./shortcut-chip";

// W1-PRIM-4 — SkillCard primitive (installed variant).
//
// Per PLAN.md D-15a (same convention as TaskCard): SkillCard does NOT
// register keyboard shortcuts itself. It receives optional callbacks; the
// parent list owns `useKeyboardShortcuts` for the focused row.
// `shortcuts` is purely visual — chips render when the prop is passed.
//
// Layout (from PLAN.md W1-PRIM-4):
//   ┌─────────────────────────────────────────────────────────┐
//   │ Weekly Journal Patterns                                 │
//   │ surfaces patterns from your journal entries             │
//   │ cadence: weekly · last run: 2d ago · next: Mon 6am     │
//   │                            [r] run  [c] configure       │
//   └─────────────────────────────────────────────────────────┘
//
// `installState === 'disabled'` grays out the action row via `text-ink/40`
// (the design-system "tertiary" opacity stop). `focused` adds a
// `border-l-2 border-l-moss` left rule, matching TaskCard.

interface SkillCardProps {
  skill: Skill;
  lastRunAt?: string;
  nextRunAt?: string;
  onRunNow?: () => void;
  onConfigure?: () => void;
  onDisable?: () => void;
  focused?: boolean;
  shortcuts?: { run?: string; configure?: string };
}

export function SkillCard({
  skill,
  lastRunAt,
  nextRunAt,
  onRunNow,
  onConfigure,
  onDisable,
  focused = false,
  shortcuts,
}: SkillCardProps): JSX.Element {
  const isDisabled = skill.installState === "disabled";

  // Card classes mirror TaskCard so primitives sit on the same surface
  // grammar (`card` token: bg-surface, hairline border, p-6, hover state).
  // The transparent left border keeps width stable across focus changes.
  const cardClasses = [
    "bg-surface border border-surface-border rounded-md p-6",
    "hover:bg-surface-hover hover:border-ink",
    "border-l-2",
    focused ? "border-l-moss" : "border-l-transparent",
    "transition-colors",
  ].join(" ");

  return (
    <article
      className={cardClasses}
      data-skill-slug={skill.slug}
      data-install-state={skill.installState}
      data-focused={focused ? "true" : "false"}
    >
      {/* Title — Lora 500, subhead size */}
      <h3 className="font-serif font-medium text-subhead text-ink leading-snug">
        {skill.name}
      </h3>

      {/* Description — Inter, body size, ink/60 */}
      <p className="mt-2 font-sans text-body text-ink/60">
        {skill.description}
      </p>

      {/* Metadata row — cadence, last run, next run */}
      <p className="mt-2 font-sans text-detail text-ink/60">
        {formatMetaRow(skill, lastRunAt, nextRunAt)}
      </p>

      {/* Action row — right-aligned, grayed out when disabled */}
      <div
        className={[
          "mt-4 flex items-center justify-end gap-4 font-sans text-label",
          isDisabled ? "text-ink/40" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {onRunNow ? (
          <ActionButton
            onClick={onRunNow}
            label="run"
            shortcut={shortcuts?.run}
            disabled={isDisabled}
          />
        ) : null}
        {onConfigure ? (
          <ActionButton
            onClick={onConfigure}
            label="configure"
            shortcut={shortcuts?.configure}
            disabled={isDisabled}
          />
        ) : null}
        {onDisable ? (
          <ActionButton
            onClick={onDisable}
            label="disable"
            disabled={isDisabled}
          />
        ) : null}
      </div>
    </article>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  label: string;
  shortcut?: string;
  disabled?: boolean;
}

function ActionButton({
  onClick,
  label,
  shortcut,
  disabled = false,
}: ActionButtonProps): JSX.Element {
  // When disabled, color comes from the parent action row (`text-ink/40`).
  // When enabled, the button manages its own hover from ink/60 to ink.
  const className = disabled
    ? "inline-flex items-center gap-1.5 cursor-not-allowed"
    : "inline-flex items-center gap-1.5 text-ink/60 hover:text-ink transition-colors";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {shortcut ? <ShortcutChip keys={shortcut} /> : null}
      <span>{label}</span>
    </button>
  );
}

function formatMetaRow(
  skill: Skill,
  lastRunAt: string | undefined,
  nextRunAt: string | undefined,
): string {
  const parts: string[] = [];
  if (skill.defaultCadence) {
    parts.push(`cadence: ${skill.defaultCadence}`);
  }
  parts.push(`last run: ${lastRunAt ? formatRelative(lastRunAt) : "never"}`);
  if (nextRunAt) {
    parts.push(`next: ${formatScheduledTime(nextRunAt)}`);
  }
  return parts.join(" · ");
}
