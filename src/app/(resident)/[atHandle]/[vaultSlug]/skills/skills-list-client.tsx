"use client";

import {
  useCallback,
  useMemo,
  useState,
  useTransition,
  type ChangeEvent,
  type JSX,
} from "react";
import { useRouter } from "next/navigation";
import { SkillCard } from "@/components/primitives/skill-card";
import type { Cadence, Skill } from "@/lib/grove-api.v2.types";
import {
  useKeyboardShortcuts,
  type ShortcutBinding,
} from "@/lib/use-keyboard-shortcuts";
import {
  configureSkill,
  enableSkill,
  disableSkill,
} from "../_actions/skills";

// W3-SKILLS — Installed-tab keymap + run/configure plumbing.
//
// Per PLAN.md D-15a (parent list owns the keymap; primitives don't bind):
// this client island wraps the server-rendered list of installed skills
// and owns:
//
//   j / k / ArrowDown / ArrowUp  cycle focus
//   Enter                        open detail (`/skills/<slug>`)
//   r                            run-now on focused skill
//   c                            configure (jumps to detail page)
//
// "Run-now" is intentionally NOT a Server Action — there is no
// `runSkill` in grove-api.v2; what users mean by "run now" on a skill
// is "fire a one-shot task against this skill". That belongs to the
// task domain, not the skills domain. The v2 mock doesn't model
// one-shot task creation yet (per the SPEC §14.8 sample-tasks list,
// it's a starter-tasks-as-fixture model), so `r` is a soft-affordance
// in v2: it routes the user to the detail page where the "run now"
// button is the explicit, debounced trigger. This keeps the keymap
// honest (every key has a visible affordance behind it) without
// pretending we have a runSkill primitive that doesn't exist.
//
// `c` (configure) similarly routes to detail — the cadence dropdown
// lives on the detail page, not inline on the list. Inline editing
// (Linear-style) would re-introduce a tactical-card / configuration
// primitive we don't have yet (cadence picker as a popover) — out of
// scope for v2 per the W3-SKILLS PR description.
//
// Enable/disable IS wired here because the disable affordance is on
// the card itself (per W1-PRIM-4): `onDisable` is the "soft" path to
// flipping installState. Enable is symmetric for the disabled state.

export interface SkillsListClientProps {
  skills: Skill[];
  vaultSlug: string;
  atHandle: string;
}

export function SkillsListClient({
  skills,
  vaultSlug,
  atHandle,
}: SkillsListClientProps): JSX.Element {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const count = skills.length;
  const safeFocusedIndex =
    focusedIndex >= 0 && focusedIndex < count ? focusedIndex : -1;
  const focusedSkill =
    safeFocusedIndex >= 0 ? skills[safeFocusedIndex] ?? null : null;

  const detailHref = useCallback(
    (slug: string) => `/${atHandle}/${vaultSlug}/skills/${slug}`,
    [atHandle, vaultSlug],
  );

  const openDetail = useCallback(
    (slug: string) => {
      router.push(detailHref(slug));
    },
    [router, detailHref],
  );

  const handleDisable = useCallback(
    (slug: string) => {
      startTransition(async () => {
        try {
          await disableSkill(slug, vaultSlug);
        } catch (err: unknown) {
          // Server Action errors revert naturally on next render once
          // <Toast /> is wired (W2-ACTIONS pattern). Until then, surface
          // to console so the keymap binding doesn't silently fail.
          // eslint-disable-next-line no-console
          console.error("disableSkill failed", err);
        }
      });
    },
    [vaultSlug],
  );

  const handleEnable = useCallback(
    (slug: string) => {
      startTransition(async () => {
        try {
          await enableSkill(slug, vaultSlug);
        } catch (err: unknown) {
          // eslint-disable-next-line no-console
          console.error("enableSkill failed", err);
        }
      });
    },
    [vaultSlug],
  );

  const bindings = useMemo<ShortcutBinding[]>(() => {
    const hasFocus = () => safeFocusedIndex >= 0;
    const moveDown = () => {
      setFocusedIndex((prev) =>
        prev < 0 ? 0 : Math.min(prev + 1, count - 1),
      );
    };
    const moveUp = () => {
      setFocusedIndex((prev) => Math.max(0, prev - 1));
    };
    return [
      {
        key: "j",
        description: "skills · focus next card",
        when: () => count > 0,
        handler: moveDown,
      },
      {
        key: "ArrowDown",
        description: "skills · focus next card",
        when: () => count > 0,
        handler: moveDown,
      },
      {
        key: "k",
        description: "skills · focus previous card",
        when: () => count > 0,
        handler: moveUp,
      },
      {
        key: "ArrowUp",
        description: "skills · focus previous card",
        when: () => count > 0,
        handler: moveUp,
      },
      {
        key: "Enter",
        description: "skills · open detail",
        when: hasFocus,
        handler: () => {
          if (focusedSkill) openDetail(focusedSkill.slug);
        },
      },
      {
        key: "r",
        description: "skills · run now (opens detail)",
        when: hasFocus,
        handler: () => {
          if (focusedSkill) openDetail(focusedSkill.slug);
        },
      },
      {
        key: "c",
        description: "skills · configure (opens detail)",
        when: hasFocus,
        handler: () => {
          if (focusedSkill) openDetail(focusedSkill.slug);
        },
      },
    ];
  }, [count, safeFocusedIndex, focusedSkill, openDetail]);

  useKeyboardShortcuts(bindings);

  if (count === 0) {
    return (
      <p className="font-sans text-body text-ink/60">
        no skills installed yet
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3" data-testid="skills-list">
      {skills.map((skill, idx) => {
        const isFocused = idx === safeFocusedIndex;
        const isDisabled = skill.installState === "disabled";
        return (
          <li key={skill.slug} onClick={() => setFocusedIndex(idx)}>
            <SkillCard
              skill={skill}
              focused={isFocused}
              onRunNow={() => openDetail(skill.slug)}
              onConfigure={() => openDetail(skill.slug)}
              onDisable={
                isDisabled
                  ? () => handleEnable(skill.slug)
                  : () => handleDisable(skill.slug)
              }
              shortcuts={isFocused ? { run: "r", configure: "c" } : undefined}
            />
          </li>
        );
      })}
    </ul>
  );
}

// ─── SkillDetailClient ─────────────────────────────────────────────────
//
// The interactive surface on `/skills/[slug]`. Server component fetches
// the skill, this island owns the three mutations:
//
//   - cadence dropdown   → configureSkill Server Action
//   - enable/disable     → enableSkill / disableSkill Server Actions
//   - run-now            → routes to `/{atHandle}/{vault}/skills/[slug]`
//                          (placeholder — there is no `runSkill` primitive
//                          in v2 grove-api; one-shot task creation lands
//                          in v3 alongside the skill marketplace)
//
// Per D-21, mutations use a small useTransition wrapper. We don't reach
// for `useOptimistic` here because the cadence dropdown is a single
// `<select>` whose visible value is local-state-driven anyway — the
// optimistic value is the rendered value until the server confirms.
// If the action throws, we revert local state and log; the W2-ACTIONS
// pattern with `<Toast />` lands in a follow-up PR.

export interface SkillDetailClientProps {
  skill: Skill;
  vaultSlug: string;
}

export function SkillDetailClient({
  skill,
  vaultSlug,
}: SkillDetailClientProps): JSX.Element {
  const [cadence, setCadence] = useState<Cadence | "">(
    skill.defaultCadence ?? "",
  );
  const [installState, setInstallState] = useState<Skill["installState"]>(
    skill.installState,
  );
  const [isPending, startTransition] = useTransition();

  const onCadenceChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const next = e.target.value as Cadence;
      const prev = cadence;
      setCadence(next);
      startTransition(async () => {
        try {
          await configureSkill(skill.slug, next, vaultSlug);
        } catch (err: unknown) {
          // Revert visible cadence so the dropdown stays honest.
          setCadence(prev);
          // eslint-disable-next-line no-console
          console.error("configureSkill failed", err);
        }
      });
    },
    [cadence, skill.slug, vaultSlug],
  );

  const onToggleInstall = useCallback(() => {
    const wasDisabled = installState === "disabled";
    const nextState: Skill["installState"] = wasDisabled
      ? "installed"
      : "disabled";
    setInstallState(nextState);
    startTransition(async () => {
      try {
        if (wasDisabled) {
          await enableSkill(skill.slug, vaultSlug);
        } else {
          await disableSkill(skill.slug, vaultSlug);
        }
      } catch (err: unknown) {
        setInstallState(installState);
        // eslint-disable-next-line no-console
        console.error(
          wasDisabled ? "enableSkill failed" : "disableSkill failed",
          err,
        );
      }
    });
  }, [installState, skill.slug, vaultSlug]);

  const onRunNow = useCallback(() => {
    // No runSkill primitive in v2 grove-api; "run now" on a skill is
    // really "fire a one-shot task" and that lands in v3. In v2 the
    // button exists for affordance + keymap binding but is a no-op
    // beyond a console log so the page is exercisable.
    // eslint-disable-next-line no-console
    console.log("run-now (skill)", skill.slug, "— one-shot tasks land in v3");
  }, [skill.slug]);

  const isDisabled = installState === "disabled";

  return (
    <div className="flex flex-col gap-6" data-testid="skill-detail-client">
      {/* Cadence dropdown — native <select> per the PR description */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="cadence-select"
          className="font-sans font-medium text-label text-ink"
        >
          cadence
        </label>
        <select
          id="cadence-select"
          data-testid="cadence-select"
          value={cadence}
          onChange={onCadenceChange}
          disabled={isPending || isDisabled}
          className="bg-surface border border-surface-border rounded-md px-3 py-2 font-sans text-body text-ink focus:outline-none focus:border-ink"
        >
          {skill.cadenceOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Action row — enable/disable + run-now */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleInstall}
          disabled={isPending}
          data-testid="toggle-install"
          data-install-state={installState}
          className="font-sans text-label text-ink/60 hover:text-ink transition-colors disabled:cursor-not-allowed"
        >
          {isDisabled ? "enable" : "disable"}
        </button>
        <button
          type="button"
          onClick={onRunNow}
          disabled={isPending || isDisabled}
          data-testid="run-now"
          className="font-sans text-label text-moss hover:text-ink transition-colors disabled:cursor-not-allowed disabled:text-ink/40"
        >
          run now
        </button>
      </div>
    </div>
  );
}
