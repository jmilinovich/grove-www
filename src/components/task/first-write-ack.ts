import type { TaskArtifactType } from "@/lib/grove-api.v2.types";

// Artifact types that write to the vault (vs surface-only output that
// doesn't touch any note). confirm-durable on a write artifact is what
// actually applies the diff / creates the note / wires the wikilink, so
// these need the one-time per-skill heads-up modal.
export const WRITE_ARTIFACT_TYPES: ReadonlySet<TaskArtifactType> = new Set([
  "note-change",
  "note-create",
  "note-link",
  "concept-merge",
]);

function firstWriteFlagKey(vaultSlug: string, skillId: string): string {
  return `grove.first-write-ack.${vaultSlug}.${skillId}`;
}

export function readFirstWriteAck(vaultSlug: string, skillId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.localStorage.getItem(firstWriteFlagKey(vaultSlug, skillId)) === "1"
    );
  } catch {
    // Private-mode Safari throws on localStorage access; treat as "not
    // acknowledged" so we err on the side of showing the heads-up modal.
    return false;
  }
}

export function writeFirstWriteAck(vaultSlug: string, skillId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(firstWriteFlagKey(vaultSlug, skillId), "1");
  } catch {
    // Same — silently ignore. Worst case the user sees the modal again
    // on the next confirm, which is benign.
  }
}
