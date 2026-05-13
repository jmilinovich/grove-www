// v2 grove-api entry. Routes via mock or live based on GROVE_API_MODE env.
//
// Default mode: `mock` (during v2 build-out). Set GROVE_API_MODE=live to call
// the real api.grove.md once W0-PROBE-1 confirms backend readiness.
//
// See SPEC.md §14.1 for types, PLAN.md "W0-MOCK-1" for context.

import * as mock from "./grove-api.v2.mock";

// Live module is a stub for now — api.grove.md endpoints are still being
// stood up (per W0-PROBE-1). When the backend lands, fill these in with
// real fetch calls (Bearer GROVE_TOKEN, base GROVE_API_URL).
const liveStub = {
  fetchBacklog: async () => {
    throw new Error("live grove-api mode not yet implemented — see W0-PROBE-1");
  },
  fetchTask: async () => {
    throw new Error("live grove-api mode not yet implemented — see W0-PROBE-1");
  },
  runTask: async () => {
    throw new Error("live grove-api mode not yet implemented — see W0-PROBE-1");
  },
  deferTask: async () => {
    throw new Error("live grove-api mode not yet implemented — see W0-PROBE-1");
  },
  dismissTask: async () => {
    throw new Error("live grove-api mode not yet implemented — see W0-PROBE-1");
  },
  reviewTask: async () => {
    throw new Error("live grove-api mode not yet implemented — see W0-PROBE-1");
  },
  fetchSkills: async () => {
    throw new Error("live grove-api mode not yet implemented — see W0-PROBE-1");
  },
  fetchThroughput: async () => {
    throw new Error("live grove-api mode not yet implemented — see W0-PROBE-1");
  },
  configureSkill: async () => {
    throw new Error("live grove-api mode not yet implemented — see W0-PROBE-1");
  },
  enableSkill: async () => {
    throw new Error("live grove-api mode not yet implemented — see W0-PROBE-1");
  },
  disableSkill: async () => {
    throw new Error("live grove-api mode not yet implemented — see W0-PROBE-1");
  },
};

const mode = process.env.GROVE_API_MODE === "live" ? "live" : "mock";

const impl = mode === "live" ? liveStub : mock;

export const fetchBacklog = impl.fetchBacklog;
export const fetchTask = impl.fetchTask;
export const runTask = impl.runTask;
export const deferTask = impl.deferTask;
export const dismissTask = impl.dismissTask;
export const reviewTask = impl.reviewTask;
export const fetchSkills = impl.fetchSkills;
export const fetchThroughput = impl.fetchThroughput;
export const configureSkill = impl.configureSkill;
export const enableSkill = impl.enableSkill;
export const disableSkill = impl.disableSkill;

// Re-export types for consumer convenience.
export type {
  BacklogPayload,
  Cadence,
  GroveProvenance,
  Skill,
  Task,
  TaskArtifactType,
  TaskResult,
  TaskState,
  ThroughputView,
} from "./grove-api.v2.types";

export const GROVE_API_MODE = mode;
