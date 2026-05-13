"use client";

import { useMemo, useState, type ChangeEvent, type JSX } from "react";
import type { Skill, Task } from "@/lib/grove-api.v2.types";
import { TaskCard } from "@/components/primitives/task-card";
import {
  useKeyboardShortcuts,
  type ShortcutBinding,
} from "@/lib/use-keyboard-shortcuts";

// W2-LIST-2 — BacklogList composite.
//
// Per PLAN.md D-15a: this list OWNS the keyboard map for its rows.
// TaskCard is a dumb primitive; it renders `[r] run [e] defer [d] dismiss`
// shortcut affordances when handed them but does not bind anything.
//
// Layout (per PLAN.md W2-LIST-2):
//   PENDING (47)                              [filter ▾]
//     [TaskCard]
//     [TaskCard]
//     ...
//   ─────────────────────────────────────────
//   CLEARED THIS WEEK (23)                              view ›
//     [TaskCard with state=done — same component]
//     ...
//
// Scope cuts applied (Scope Cop panel):
//   - No virtualization library — native scroll for <500 items.
//   - Filter: by skill only in v2; no cadence/state filters.
//   - No "+ run skill" popover; deferred to v2.5 with skill marketplace.
//
// Focus model: a single `{ section, index }` cursor. j/k cycle WITHIN
// the current section. Click on a row sets focus. Initial state is no
// focus (index -1). r/e/d only fire when focus is in the pending
// section (cleared rows are done — running them again would re-trigger
// a completed task and is not a v2 affordance).

export interface BacklogListProps {
  pendingTasks: Task[];
  clearedTasks: Task[];
  skillsBySlug: Record<string, Skill>;
  onRun: (taskId: string) => void;
  onDefer: (taskId: string) => void;
  onDismiss: (taskId: string) => void;
  onOpen: (taskId: string) => void;
}

type Section = "pending" | "cleared";

interface FocusState {
  section: Section;
  index: number;
}

const NO_FOCUS: FocusState = { section: "pending", index: -1 };
const CLEARED_VISIBLE_CAP = 20;

// The skill row in TaskCard expects `{ slug, name }`. We dehydrate the
// full Skill object once per render for each task to avoid pushing skill
// lookup logic into the primitive.
function lookupSkillChip(
  task: Task,
  skillsBySlug: Record<string, Skill>,
): { slug: string; name: string } {
  // Tasks reference skills by `skillId` in the type contract. The map
  // we receive is keyed by slug — the page is responsible for shaping
  // it. We support both keys to be defensive; in practice the page
  // shapes the map by slug because that's what the URL needs.
  const direct = skillsBySlug[task.skillId];
  if (direct) return { slug: direct.slug, name: direct.name };
  // Fallback: scan values for an `id` match. O(N) per row but N is
  // bounded by the 7 builtin skills.
  for (const skill of Object.values(skillsBySlug)) {
    if (skill.id === task.skillId) {
      return { slug: skill.slug, name: skill.name };
    }
  }
  // Final fallback: render the bare id so the page is never blank.
  return { slug: task.skillId, name: task.skillId };
}

export function BacklogList({
  pendingTasks,
  clearedTasks,
  skillsBySlug,
  onRun,
  onDefer,
  onDismiss,
  onOpen,
}: BacklogListProps): JSX.Element {
  const [skillFilter, setSkillFilter] = useState<string>("");
  const [focus, setFocus] = useState<FocusState>(NO_FOCUS);

  // Skill options for the filter — derived from the skills actually
  // referenced by the pending list, not the full skills catalog. This
  // keeps the dropdown short and relevant; an empty pending list
  // produces an empty options array and the dropdown collapses to
  // "all skills" only.
  const skillOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const task of pendingTasks) {
      const chip = lookupSkillChip(task, skillsBySlug);
      if (!seen.has(chip.slug)) {
        seen.set(chip.slug, chip.name);
      }
    }
    return Array.from(seen.entries()).map(([slug, name]) => ({ slug, name }));
  }, [pendingTasks, skillsBySlug]);

  const filteredPending = useMemo(() => {
    if (!skillFilter) return pendingTasks;
    return pendingTasks.filter(
      (task) => lookupSkillChip(task, skillsBySlug).slug === skillFilter,
    );
  }, [pendingTasks, skillsBySlug, skillFilter]);

  const visibleCleared = useMemo(
    () => clearedTasks.slice(0, CLEARED_VISIBLE_CAP),
    [clearedTasks],
  );

  const onFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSkillFilter(event.target.value);
    // Filter changes invalidate the current focus index — the row at
    // index N before the filter may not exist after. Reset to no focus.
    setFocus(NO_FOCUS);
  };

  // Cycle focus within the current section. j/k cycle in modular
  // arithmetic so the user can hold the key to scroll without arming
  // any "edge" affordance. If the current section is empty (e.g. the
  // filter eliminated everything pending) the key is a no-op.
  const cycleFocus = (direction: 1 | -1) => {
    setFocus((prev) => {
      const sectionTasks =
        prev.section === "pending" ? filteredPending : visibleCleared;
      if (sectionTasks.length === 0) return prev;
      const next = prev.index < 0
        ? (direction === 1 ? 0 : sectionTasks.length - 1)
        : (prev.index + direction + sectionTasks.length) % sectionTasks.length;
      return { section: prev.section, index: next };
    });
  };

  const focusedPendingTask =
    focus.section === "pending" && focus.index >= 0
      ? filteredPending[focus.index] ?? null
      : null;
  const focusedClearedTask =
    focus.section === "cleared" && focus.index >= 0
      ? visibleCleared[focus.index] ?? null
      : null;
  const focusedTask = focusedPendingTask ?? focusedClearedTask;

  const focusedIsPending = focusedPendingTask !== null;
  const focusedAny = focusedTask !== null;

  // The bindings are constructed each render because they close over
  // the current focused task. `useKeyboardShortcuts` re-binds on dep
  // change, which is what we want — the handler always reads the
  // freshest task id. (D-15a explicitly accepts this; the hook
  // documents memoize-if-you-care.)
  const bindings: ShortcutBinding[] = useMemo(() => {
    return [
      {
        key: "j",
        description: "next row in section",
        handler: () => cycleFocus(1),
      },
      {
        key: "k",
        description: "previous row in section",
        handler: () => cycleFocus(-1),
      },
      {
        key: "ArrowDown",
        description: "next row in section",
        handler: () => cycleFocus(1),
      },
      {
        key: "ArrowUp",
        description: "previous row in section",
        handler: () => cycleFocus(-1),
      },
      {
        key: "r",
        description: "run focused task",
        when: () => focusedIsPending && focusedPendingTask !== null,
        handler: () => {
          if (focusedPendingTask) onRun(focusedPendingTask.id);
        },
      },
      {
        key: "e",
        description: "defer focused task",
        when: () => focusedIsPending && focusedPendingTask !== null,
        handler: () => {
          if (focusedPendingTask) onDefer(focusedPendingTask.id);
        },
      },
      {
        key: "d",
        description: "dismiss focused task",
        when: () => focusedIsPending && focusedPendingTask !== null,
        handler: () => {
          if (focusedPendingTask) onDismiss(focusedPendingTask.id);
        },
      },
      {
        key: "Enter",
        description: "open focused task",
        when: () => focusedAny && focusedTask !== null,
        handler: () => {
          if (focusedTask) onOpen(focusedTask.id);
        },
      },
    ];
    // We intentionally re-create on focus / list / handler change.
  }, [
    cycleFocus,
    focusedIsPending,
    focusedPendingTask,
    focusedAny,
    focusedTask,
    onRun,
    onDefer,
    onDismiss,
    onOpen,
  ]);

  useKeyboardShortcuts(bindings);

  // Per-row click sets focus to that row. Without this, the keymap
  // never wakes up — the mouse user has no way to "enter" the keyboard
  // mode. Clicking a row in either section moves focus to it.
  const setFocusToRow = (section: Section, index: number) => {
    setFocus({ section, index });
  };

  return (
    <section
      aria-label="Backlog"
      className="flex flex-col gap-8"
      data-testid="backlog-list"
    >
      {/* PENDING section */}
      <div data-testid="backlog-pending">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <h2 className="font-sans font-medium text-label text-ink lowercase">
            pending ({pendingTasks.length})
          </h2>
          <label className="inline-flex items-center gap-2 font-sans text-label text-ink/60">
            <span className="sr-only">filter by skill</span>
            <select
              value={skillFilter}
              onChange={onFilterChange}
              className="bg-surface border border-surface-border rounded-md px-2 py-1 font-sans text-label text-ink"
              aria-label="filter by skill"
            >
              <option value="">all skills</option>
              {skillOptions.map((opt) => (
                <option key={opt.slug} value={opt.slug}>
                  {opt.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filteredPending.length === 0 ? (
          <p className="font-sans text-label text-ink/60">
            {skillFilter ? "no tasks for this skill" : "no pending tasks"}
          </p>
        ) : (
          <ul className="flex flex-col gap-3" role="list">
            {filteredPending.map((task, idx) => {
              const skill = lookupSkillChip(task, skillsBySlug);
              const isFocused =
                focus.section === "pending" && focus.index === idx;
              return (
                <li
                  key={task.id}
                  onClick={() => setFocusToRow("pending", idx)}
                  data-row-section="pending"
                  data-row-index={idx}
                >
                  <TaskCard
                    task={task}
                    skill={skill}
                    focused={isFocused}
                    shortcuts={{ run: "r", defer: "e", dismiss: "d" }}
                    onRun={() => onRun(task.id)}
                    onDefer={() => onDefer(task.id)}
                    onDismiss={() => onDismiss(task.id)}
                    onOpen={() => onOpen(task.id)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Cleared section is hidden entirely when the underlying list is
          empty — no point showing an empty "cleared this week (0)" header. */}
      {clearedTasks.length > 0 ? (
        <div data-testid="backlog-cleared">
          {/* Divider */}
          <hr className="border-t border-surface-border mb-6" />

          <div className="flex items-baseline justify-between gap-4 mb-4">
            <h2 className="font-sans font-medium text-label text-ink lowercase">
              cleared this week ({clearedTasks.length})
            </h2>
            <a
              href="#"
              className="font-sans text-label text-moss"
              aria-label="view all cleared tasks"
            >
              view ›
            </a>
          </div>

          <ul className="flex flex-col gap-3" role="list">
            {visibleCleared.map((task, idx) => {
              const skill = lookupSkillChip(task, skillsBySlug);
              const isFocused =
                focus.section === "cleared" && focus.index === idx;
              return (
                <li
                  key={task.id}
                  onClick={() => setFocusToRow("cleared", idx)}
                  data-row-section="cleared"
                  data-row-index={idx}
                >
                  <TaskCard
                    task={task}
                    skill={skill}
                    focused={isFocused}
                    onOpen={() => onOpen(task.id)}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
