// Types for the v2 dashboard data layer.
// Owned by W0-MOCK-1; this file is the canonical shared type module per PLAN.md D-19/D-21.
//
// Currently used by:
//   - src/lib/grove-api.v2.ts (entry)
//   - src/lib/grove-api.v2.mock.ts (mock impl)
//   - src/components/primitives/* (consumer types)
//
// See SPEC.md §14.1 for the contract.

export type TaskState =
  | "pending"
  | "running"
  | "review"
  | "done"
  | "dismissed"
  | "failed";

export type Cadence = "daily" | "weekly" | "on-trigger" | "on-demand";

export interface GroveProvenance {
  voice: "durable" | "perishable" | "legacy-unknown";
  by?: string;
  writtenAt?: string;
  source?: string;
  basis?: string[];
  reason?: string;
}

export type TaskArtifactType =
  | "surface"
  | "note-change"
  | "note-create"
  | "note-link"
  | "concept-merge";

export interface TaskResult {
  artifact: {
    type: TaskArtifactType;
    notePath?: string;
    surfaceText?: string;
  };
  provenance: GroveProvenance;
}

/**
 * Suggestion class for a review-state Task in the Inbox v2 surface.
 *
 * See ~/src/grove/docs/inbox-v2-spec.md §"The three suggestion classes":
 * - `disambiguation` — same surface form maps to N candidates; user picks one
 * - `link`           — surface form has a confident target; user confirms or skips
 * - `enrichment`     — proposed content expansion for an under-written note
 *
 * Hydrated server-side from the linked `decisions` row (S-INBOX-9 bridge).
 * Legacy review tasks with no backing decision leave `itemType` undefined;
 * the UI handles undefined as "use legacy verb set" until W-INBOX-2 ships.
 */
export type SuggestionType = "disambiguation" | "link" | "enrichment";

/**
 * One choice the user can pick on a review-state Task. Server-assigned ids
 * (`opt-1`, `opt-2`, …) are stable for the life of the decision row so the
 * client can echo `option_id` back in the apply call without inventing one.
 *
 * `source` distinguishes schema-defined options (the always-present choices
 * for that suggestion class, e.g. "do not link") from LLM-proposed ones
 * (the ranked candidates). Future UI may render them differently; v1 treats
 * them uniformly.
 */
export interface ReviewOption {
  id: string;
  label: string;
  description?: string;
  source: "schema" | "llm";
}

export interface Task {
  id: string;
  skillId: string;
  title: string;
  description: string;
  state: TaskState;
  scheduledFor: string | null;
  startedAt: string | null;
  completedAt: string | null;
  estimatedMinutes: number;
  actualMinutes: number | null;
  result: TaskResult | null;
  needsReviewReason?: string;
  sourceNotes?: string[];
  errorMessage?: string;
  // Inbox v2 (W-INBOX-1): present on review-state tasks backed by a
  // Decision row; absent on legacy review tasks. UI must tolerate
  // undefined and fall back to the legacy verb set until W-INBOX-2.
  itemType?: SuggestionType;
  options?: ReviewOption[];
}

export interface Skill {
  id: string;
  slug: string;
  name: string;
  domain:
    | "knowledge"
    | "journal"
    | "relationships"
    | "health"
    | "finances"
    | "system";
  author: "builtin";
  description: string;
  sampleTasks: string[];
  cadenceOptions: Cadence[];
  defaultCadence: Cadence | null;
  defaultArtifactType: TaskArtifactType;
  installState: "installed" | "available" | "disabled";
  starterPendingTasks?: string[];
}

export interface ThroughputView {
  rollingWeekVelocity: number | null;
  cleared7d: number;
  pending: number;
  estimatedClearText: string;
  planCeiling: number;
  showCeiling: boolean;
}

export interface BacklogPayload {
  reviewTasks: Task[];
  pendingTasks: Task[];
  clearedTasks: Task[];
  throughput: ThroughputView;
  skills: Skill[];
  planTier: "free" | "pro";
}
