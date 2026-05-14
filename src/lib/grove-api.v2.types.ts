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
