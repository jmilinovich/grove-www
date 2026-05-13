// In-memory mock of the v2 grove-api surface. Used when GROVE_API_MODE=mock.
//
// Mock store is a module-level singleton; restart resets state.
// (No JSON-on-disk persistence — intentional, per PLAN.md scope decisions.)
//
// See SPEC.md §14.1 for types, PLAN.md "W0-MOCK-1" for scope.

import type {
  BacklogPayload,
  Cadence,
  Skill,
  Task,
  ThroughputView,
} from "./grove-api.v2.types";

// ─── Fixture: skills ──────────────────────────────────────────────────────

const MOCK_SKILLS: Skill[] = [
  {
    id: "skill-daily-vault-review",
    slug: "daily-vault-review",
    name: "Daily Vault Review",
    domain: "system",
    author: "builtin",
    description:
      "Surfaces today's noteworthy patterns, dormant threads, and perishable claims approaching staleness. Surface-only — never writes.",
    sampleTasks: [
      "today's patterns from your journal",
      "concepts that haven't been touched in 30 days",
      "perishable claims older than 14 days",
    ],
    cadenceOptions: ["daily", "on-demand"],
    defaultCadence: "daily",
    defaultArtifactType: "surface",
    installState: "installed",
  },
  {
    id: "skill-concept-graph-cleanup",
    slug: "concept-graph-cleanup",
    name: "Concept Graph Cleanup",
    domain: "knowledge",
    author: "builtin",
    description:
      "Detects probable duplicates, orphans, and dead concepts. Surfaces them for ritual review.",
    sampleTasks: [
      "concepts that look like duplicates",
      "concepts with zero inbound wikilinks",
      "concepts not touched in 90 days",
    ],
    cadenceOptions: ["weekly", "on-demand"],
    defaultCadence: "weekly",
    defaultArtifactType: "concept-merge",
    installState: "installed",
  },
  {
    id: "skill-relationship-surface",
    slug: "relationship-surface",
    name: "Relationship Surface",
    domain: "relationships",
    author: "builtin",
    description: "People in the graph with stale last-contact and overdue follow-ups.",
    sampleTasks: [
      "people you haven't talked to in 60 days",
      "follow-ups you mentioned but didn't schedule",
      "mutuals with recent activity worth noting",
    ],
    cadenceOptions: ["weekly", "on-demand"],
    defaultCadence: "weekly",
    defaultArtifactType: "surface",
    installState: "installed",
  },
  {
    id: "skill-dormant-thread",
    slug: "dormant-thread-surface",
    name: "Dormant Thread Surface",
    domain: "knowledge",
    author: "builtin",
    description:
      "Concepts not visited in N weeks that have meaningful link density. Worth returning to.",
    sampleTasks: [
      "concepts you keep linking to but never edit",
      "ideas from 6 months ago worth revisiting",
    ],
    cadenceOptions: ["weekly", "on-demand"],
    defaultCadence: "weekly",
    defaultArtifactType: "surface",
    installState: "installed",
  },
  {
    id: "skill-journal-patterns",
    slug: "journal-patterns",
    name: "Journal Patterns",
    domain: "journal",
    author: "builtin",
    description:
      "Patterns across your journal entries. What you keep returning to and what dropped off.",
    sampleTasks: [
      "themes across the last 14 days",
      "topics you've stopped writing about",
      "recurring questions you've raised",
    ],
    cadenceOptions: ["weekly", "on-demand"],
    defaultCadence: "weekly",
    defaultArtifactType: "surface",
    installState: "installed",
  },
  {
    id: "skill-perishable-audit",
    slug: "perishable-audit",
    name: "Perishable Audit",
    domain: "knowledge",
    author: "builtin",
    description:
      "Perishable claims aged past 14 days. Triggers mark-stale or confirm-durable in ritual review.",
    sampleTasks: [
      "perishable AI-authored claims older than two weeks",
      "synthesis older than a month still marked perishable",
    ],
    cadenceOptions: ["weekly", "on-demand"],
    defaultCadence: "weekly",
    defaultArtifactType: "surface",
    installState: "installed",
  },
  {
    id: "skill-vault-health",
    slug: "vault-health",
    name: "Vault Health Check",
    domain: "system",
    author: "builtin",
    description: "Orphan notes, broken wikilinks, missing frontmatter. Safe fixes on confirmation.",
    sampleTasks: [
      "notes with no inbound or outbound links",
      "broken [[wikilinks]] you can repair",
      "notes missing required frontmatter fields",
    ],
    cadenceOptions: ["weekly", "on-demand"],
    defaultCadence: "weekly",
    defaultArtifactType: "note-change",
    installState: "installed",
  },
];

// ─── Fixture: tasks ───────────────────────────────────────────────────────

const NOW = "2026-05-13T18:00:00Z";
const SOON = "2026-05-13T23:00:00Z";
const MONDAY = "2026-05-18T13:00:00Z";

function buildInitialTasks(): Task[] {
  return [
    // Needs review (3)
    {
      id: "task-001",
      skillId: "skill-concept-graph-cleanup",
      title: "merge concepts? \"Pappu\" ≈ \"Aparna\"",
      description: "Two concept notes look like the same person. Confirm a merge or keep separate.",
      state: "review",
      scheduledFor: null,
      startedAt: "2026-05-13T16:00:00Z",
      completedAt: "2026-05-13T16:02:14Z",
      estimatedMinutes: 2,
      actualMinutes: 2,
      result: {
        artifact: {
          type: "concept-merge",
          surfaceText:
            "concept \"Pappu\" and concept \"Aparna\" share 11 wikilinks and 4 source references. Likely a merge candidate.",
        },
        provenance: {
          voice: "perishable",
          by: "claude-opus-4-7",
          writtenAt: "2026-05-13T16:02:14Z",
          source: "concept-graph-cleanup run",
          reason: "high-similarity concept pair surfaced; user disposition needed",
        },
      },
      needsReviewReason: "AI flagged probable duplicate concepts",
      sourceNotes: ["Resources/People/Aparna Pappu.md", "Resources/People/Pappu.md"],
    },
    {
      id: "task-002",
      skillId: "skill-perishable-audit",
      title: "mark perishable as durable? (12d old)",
      description:
        "Claim about Workspace org structure was written 12 days ago as perishable. Confirm durable, refine, or mark stale.",
      state: "review",
      scheduledFor: null,
      startedAt: "2026-05-13T15:00:00Z",
      completedAt: "2026-05-13T15:00:30Z",
      estimatedMinutes: 1,
      actualMinutes: 1,
      result: {
        artifact: {
          type: "surface",
          surfaceText:
            "Perishable claim from 2026-05-01: \"Yulie reports to Karthik Narain since Oct 2025.\" Still accurate per public record. Worth promoting.",
        },
        provenance: {
          voice: "perishable",
          by: "claude-opus-4-7",
          writtenAt: "2026-05-13T15:00:30Z",
          source: "perishable-audit weekly",
        },
      },
      needsReviewReason: "perishable claim aged past 14-day threshold",
      sourceNotes: ["Resources/People/yulie-kwon-kim.md"],
    },
    {
      id: "task-003",
      skillId: "skill-concept-graph-cleanup",
      title: "3 dup people detected",
      description: "Three person notes have near-identical content.",
      state: "review",
      scheduledFor: null,
      startedAt: "2026-05-13T14:00:00Z",
      completedAt: "2026-05-13T14:01:48Z",
      estimatedMinutes: 2,
      actualMinutes: 2,
      result: {
        artifact: {
          type: "concept-merge",
          surfaceText:
            "people notes \"Reid\", \"Reed\", and \"Reid (Google)\" all reference the same exec recruiter. Suggest merge.",
        },
        provenance: {
          voice: "perishable",
          by: "claude-opus-4-7",
          writtenAt: "2026-05-13T14:01:48Z",
          source: "concept-graph-cleanup run",
        },
      },
      needsReviewReason: "AI flagged near-duplicate people notes",
    },

    // Pending (12)
    {
      id: "task-101",
      skillId: "skill-journal-patterns",
      title: "weekly journal patterns",
      description: "Run journal pattern detection across the last 14 days.",
      state: "pending",
      scheduledFor: SOON,
      startedAt: null,
      completedAt: null,
      estimatedMinutes: 14,
      actualMinutes: null,
      result: null,
    },
    {
      id: "task-102",
      skillId: "skill-relationship-surface",
      title: "relationship surface",
      description: "People with overdue follow-ups + recent activity worth flagging.",
      state: "pending",
      scheduledFor: MONDAY,
      startedAt: null,
      completedAt: null,
      estimatedMinutes: 6,
      actualMinutes: null,
      result: null,
    },
    {
      id: "task-103",
      skillId: "skill-concept-graph-cleanup",
      title: "concept-graph cleanup",
      description: "Full sweep for duplicates / orphans / dead concepts.",
      state: "pending",
      scheduledFor: null,
      startedAt: null,
      completedAt: null,
      estimatedMinutes: 12,
      actualMinutes: null,
      result: null,
    },
    {
      id: "task-104",
      skillId: "skill-dormant-thread",
      title: "dormant thread surface",
      description: "Concepts with link density but no recent edits.",
      state: "pending",
      scheduledFor: MONDAY,
      startedAt: null,
      completedAt: null,
      estimatedMinutes: 8,
      actualMinutes: null,
      result: null,
    },
    {
      id: "task-105",
      skillId: "skill-perishable-audit",
      title: "perishable audit",
      description: "Sweep perishable-voiced claims older than 14 days.",
      state: "pending",
      scheduledFor: MONDAY,
      startedAt: null,
      completedAt: null,
      estimatedMinutes: 4,
      actualMinutes: null,
      result: null,
    },
    {
      id: "task-106",
      skillId: "skill-vault-health",
      title: "vault health check",
      description: "Orphans, broken wikilinks, missing frontmatter.",
      state: "pending",
      scheduledFor: MONDAY,
      startedAt: null,
      completedAt: null,
      estimatedMinutes: 10,
      actualMinutes: null,
      result: null,
    },
    {
      id: "task-107",
      skillId: "skill-daily-vault-review",
      title: "daily vault review",
      description: "Today's noteworthy patterns + dormant threads.",
      state: "pending",
      scheduledFor: SOON,
      startedAt: null,
      completedAt: null,
      estimatedMinutes: 14,
      actualMinutes: null,
      result: null,
    },

    // Cleared this week (8)
    {
      id: "task-201",
      skillId: "skill-daily-vault-review",
      title: "daily vault review",
      description: "Surfaced 7 patterns, 2 dormant threads.",
      state: "done",
      scheduledFor: null,
      startedAt: "2026-05-13T03:00:00Z",
      completedAt: "2026-05-13T03:14:21Z",
      estimatedMinutes: 14,
      actualMinutes: 14,
      result: {
        artifact: {
          type: "surface",
          surfaceText: "7 patterns surfaced; 2 dormant threads",
        },
        provenance: { voice: "perishable", by: "claude-opus-4-7", writtenAt: "2026-05-13T03:14:21Z" },
      },
    },
    {
      id: "task-202",
      skillId: "skill-journal-patterns",
      title: "weekly journal patterns",
      description: "Pattern: \"recovery from interview rejection\" recurs 4x this week.",
      state: "done",
      scheduledFor: null,
      startedAt: "2026-05-12T06:00:00Z",
      completedAt: "2026-05-12T06:09:11Z",
      estimatedMinutes: 9,
      actualMinutes: 9,
      result: {
        artifact: { type: "surface", surfaceText: "12 patterns identified" },
        provenance: { voice: "perishable", by: "claude-opus-4-7", writtenAt: "2026-05-12T06:09:11Z" },
      },
    },
    {
      id: "task-203",
      skillId: "skill-relationship-surface",
      title: "relationship surface",
      description: "8 people overdue for contact.",
      state: "done",
      scheduledFor: null,
      startedAt: "2026-05-11T13:00:00Z",
      completedAt: "2026-05-11T13:05:42Z",
      estimatedMinutes: 6,
      actualMinutes: 6,
      result: {
        artifact: { type: "surface", surfaceText: "8 people overdue, 3 worth reaching out today" },
        provenance: { voice: "perishable", by: "claude-opus-4-7", writtenAt: "2026-05-11T13:05:42Z" },
      },
    },
    {
      id: "task-204",
      skillId: "skill-daily-vault-review",
      title: "daily vault review",
      description: "Quiet day.",
      state: "done",
      scheduledFor: null,
      startedAt: "2026-05-12T03:00:00Z",
      completedAt: "2026-05-12T03:12:30Z",
      estimatedMinutes: 12,
      actualMinutes: 12,
      result: {
        artifact: { type: "surface", surfaceText: "3 patterns; no dormant threads worth surfacing" },
        provenance: { voice: "perishable", by: "claude-opus-4-7", writtenAt: "2026-05-12T03:12:30Z" },
      },
    },
    {
      id: "task-205",
      skillId: "skill-vault-health",
      title: "vault health check",
      description: "2 orphan notes, 1 broken wikilink fixed.",
      state: "done",
      scheduledFor: null,
      startedAt: "2026-05-10T13:00:00Z",
      completedAt: "2026-05-10T13:08:15Z",
      estimatedMinutes: 8,
      actualMinutes: 8,
      result: {
        artifact: { type: "note-change", notePath: "Resources/People/Stanley.md" },
        provenance: { voice: "durable", by: "claude-opus-4-7", writtenAt: "2026-05-10T13:08:15Z" },
      },
    },
  ];
}

// ─── In-memory store (module singleton; restart resets) ───────────────────

const mockStore = {
  tasks: buildInitialTasks(),
};

// ─── Throughput math (derived from task state) ────────────────────────────

function computeThroughput(): ThroughputView {
  const cleared7d = mockStore.tasks.filter(
    (t) => t.state === "done" && t.completedAt && t.completedAt >= "2026-05-06"
  ).length;
  const pending = mockStore.tasks.filter((t) => t.state === "pending" || t.state === "running").length;
  const rollingWeekVelocity = 18; // 4-week rolling average; mock-fixed for now
  const planCeiling = 25;

  const weeksToClear = pending / rollingWeekVelocity;
  const estimatedClearText =
    weeksToClear < 0.5
      ? "under a week at your pace"
      : weeksToClear < 1.5
      ? `≈1 week at your pace`
      : `≈${Math.round(weeksToClear)} weeks at your pace`;

  return {
    rollingWeekVelocity,
    cleared7d,
    pending,
    estimatedClearText,
    planCeiling,
    showCeiling: false, // hidden during first 14 days per D-7; mock-baseline behavior
  };
}

// ─── Public surface (matches grove-api.v2.live.ts signature contract) ────

export async function fetchBacklog(_vault: string): Promise<BacklogPayload> {
  return {
    reviewTasks: mockStore.tasks.filter((t) => t.state === "review"),
    pendingTasks: mockStore.tasks.filter((t) => t.state === "pending" || t.state === "running"),
    clearedTasks: mockStore.tasks
      .filter((t) => t.state === "done")
      .slice(0, 20),
    throughput: computeThroughput(),
    skills: MOCK_SKILLS,
    planTier: "free",
  };
}

export async function fetchTask(taskId: string): Promise<Task> {
  const task = mockStore.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`task ${taskId} not found in mock store`);
  return task;
}

export async function runTask(taskId: string): Promise<void> {
  const task = mockStore.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`task ${taskId} not found in mock store`);
  task.state = "done";
  task.startedAt = new Date().toISOString();
  task.completedAt = new Date().toISOString();
  task.actualMinutes = task.estimatedMinutes;
  task.result = {
    artifact: { type: "surface", surfaceText: "mock run output" },
    provenance: {
      voice: "perishable",
      by: "claude-opus-4-7",
      writtenAt: new Date().toISOString(),
      source: "mock-mode runTask",
    },
  };
}

export async function deferTask(taskId: string, until: string): Promise<void> {
  const task = mockStore.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`task ${taskId} not found in mock store`);
  task.scheduledFor = until;
}

export async function dismissTask(taskId: string): Promise<void> {
  const task = mockStore.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`task ${taskId} not found in mock store`);
  task.state = "dismissed";
}

export async function reviewTask(
  taskId: string,
  action:
    | { kind: "confirm-durable" }
    | { kind: "refine"; refinement: string }
    | { kind: "dismiss" }
    | { kind: "mark-stale" }
): Promise<void> {
  const task = mockStore.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`task ${taskId} not found in mock store`);
  if (action.kind === "dismiss") {
    task.state = "dismissed";
    return;
  }
  task.state = "done";
}

export async function fetchSkills(_vault: string): Promise<Skill[]> {
  return MOCK_SKILLS;
}

export async function fetchThroughput(_vault: string): Promise<ThroughputView> {
  return computeThroughput();
}

export async function configureSkill(slug: string, _cadence: Cadence): Promise<void> {
  if (!MOCK_SKILLS.find((s) => s.slug === slug)) throw new Error(`skill ${slug} not found`);
}

export async function enableSkill(slug: string): Promise<void> {
  const skill = MOCK_SKILLS.find((s) => s.slug === slug);
  if (!skill) throw new Error(`skill ${slug} not found`);
  skill.installState = "installed";
}

export async function disableSkill(slug: string): Promise<void> {
  const skill = MOCK_SKILLS.find((s) => s.slug === slug);
  if (!skill) throw new Error(`skill ${slug} not found`);
  skill.installState = "disabled";
}

// Test-only: reset the in-memory store. Not part of the public surface.
export function __resetMockStore(): void {
  mockStore.tasks = buildInitialTasks();
}
