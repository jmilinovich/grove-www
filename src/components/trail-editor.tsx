"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./primitives/button";
import { useScopedLink } from "@/hooks/use-scoped-link";

// ── Types ────────────────────────────────────────────────────────────

export interface TrailEditorInitial {
  id: string; // "new" for create mode, or real trail id
  name: string;
  description: string;
  allow_tags: string[];
  deny_tags: string[];
  allow_types: string[];
  deny_types: string[];
  allow_paths: string[];
  deny_paths: string[];
  rate_limit_reads: number | null;
  rate_limit_writes: number | null;
}

type Mode = "unset" | "allow" | "deny";

interface PreviewResponse {
  total_notes: number;
  match_count: number;
  samples: { path: string; name: string; type: string | null; tags: string[] }[];
  all_tags: string[];
  all_types: string[];
}

interface TestResponse {
  path: string;
  visible: boolean;
  reason: string;
  note: { type: string | null; tags: string[]; private: boolean };
}

// ── Helpers ──────────────────────────────────────────────────────────

function cycleMode(current: Mode): Mode {
  if (current === "unset") return "allow";
  if (current === "allow") return "deny";
  return "unset";
}

/**
 * Build the list of unique folder prefixes from note paths.
 * Each folder path ends with "/" (matching trail path-prefix semantics).
 * Sorted for stable rendering; children follow their parent.
 */
function deriveFolders(paths: string[]): string[] {
  const folders = new Set<string>();
  for (const p of paths) {
    const parts = p.split("/");
    for (let i = 1; i < parts.length; i++) {
      folders.add(parts.slice(0, i).join("/") + "/");
    }
  }
  return [...folders].sort();
}

// ── Path tree node ───────────────────────────────────────────────────

interface TreeNode {
  name: string;
  path: string; // with trailing "/"
  children: TreeNode[];
  depth: number;
}

function buildTree(folders: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  const byPath = new Map<string, TreeNode>();

  for (const folder of folders) {
    const parts = folder.slice(0, -1).split("/"); // strip trailing /
    const node: TreeNode = {
      name: parts[parts.length - 1],
      path: folder,
      children: [],
      depth: parts.length - 1,
    };
    byPath.set(folder, node);

    if (parts.length === 1) {
      root.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join("/") + "/";
      const parent = byPath.get(parentPath);
      if (parent) parent.children.push(node);
      else root.push(node); // orphan — surface at top level
    }
  }

  return root;
}

// ── Tri-state chip ───────────────────────────────────────────────────

function ChipButton({
  label,
  mode,
  onClick,
}: {
  label: string;
  mode: Mode;
  onClick: () => void;
}) {
  const styles = {
    unset: "bg-surface text-ink/60 border-surface-border hover:bg-surface/60",
    allow: "bg-moss/15 text-moss border-moss/40",
    deny: "bg-harvest/15 text-harvest border-harvest/40 line-through",
  }[mode];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-md border px-2 py-1 text-detail font-medium transition-colors ${styles}`}
    >
      {label}
    </button>
  );
}

// ── Path tree row ────────────────────────────────────────────────────

function PathTreeRow({
  node,
  mode,
  onCycle,
}: {
  node: TreeNode;
  mode: Mode;
  onCycle: () => void;
}) {
  const indent = node.depth * 16;
  const styles = {
    unset: "text-ink/60 hover:bg-surface/60",
    allow: "bg-moss/15 text-moss",
    deny: "bg-harvest/15 text-harvest line-through",
  }[mode];

  const marker = mode === "allow" ? "+" : mode === "deny" ? "−" : "·";

  return (
    <button
      type="button"
      onClick={onCycle}
      className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded-md text-label transition-colors font-mono ${styles}`}
      style={{ paddingLeft: 8 + indent }}
    >
      <span className="w-3 text-center text-detail opacity-60">{marker}</span>
      <span>{node.name}</span>
    </button>
  );
}

function flattenTree(nodes: TreeNode[], acc: TreeNode[] = []): TreeNode[] {
  for (const n of nodes) {
    acc.push(n);
    flattenTree(n.children, acc);
  }
  return acc;
}

// ── Component ────────────────────────────────────────────────────────

export default function TrailEditor({ initial }: { initial: TrailEditorInitial }) {
  const router = useRouter();
  const { link } = useScopedLink();
  const trailsHref = link("/dashboard/trails");
  const isCreate = initial.id === "new";

  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [rateReads, setRateReads] = useState(
    initial.rate_limit_reads != null ? String(initial.rate_limit_reads) : ""
  );
  const [rateWrites, setRateWrites] = useState(
    initial.rate_limit_writes != null ? String(initial.rate_limit_writes) : ""
  );

  // Scope — each as a Map for stable O(1) lookup
  const [tagModes, setTagModes] = useState<Map<string, Mode>>(() => {
    const m = new Map<string, Mode>();
    for (const t of initial.allow_tags) m.set(t, "allow");
    for (const t of initial.deny_tags) m.set(t, "deny");
    return m;
  });
  const [typeModes, setTypeModes] = useState<Map<string, Mode>>(() => {
    const m = new Map<string, Mode>();
    for (const t of initial.allow_types) m.set(t, "allow");
    for (const t of initial.deny_types) m.set(t, "deny");
    return m;
  });
  const [pathModes, setPathModes] = useState<Map<string, Mode>>(() => {
    const m = new Map<string, Mode>();
    for (const p of initial.allow_paths) m.set(p, "allow");
    for (const p of initial.deny_paths) m.set(p, "deny");
    return m;
  });

  const [newTag, setNewTag] = useState("");
  const [testPath, setTestPath] = useState("");
  const [testResult, setTestResult] = useState<TestResponse | null>(null);
  const [testError, setTestError] = useState("");

  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);

  const [folders, setFolders] = useState<string[]>([]);

  // ── Derived arrays ──
  const scope = useMemo(() => {
    const pick = (m: Map<string, Mode>, mode: Mode) =>
      [...m.entries()].filter(([, v]) => v === mode).map(([k]) => k);
    return {
      allow_tags: pick(tagModes, "allow"),
      deny_tags: pick(tagModes, "deny"),
      allow_types: pick(typeModes, "allow"),
      deny_types: pick(typeModes, "deny"),
      allow_paths: pick(pathModes, "allow"),
      deny_paths: pick(pathModes, "deny"),
    };
  }, [tagModes, typeModes, pathModes]);

  // ── Load vault folder list (once) ──
  useEffect(() => {
    fetch("/api/list?prefix=")
      .then((r) => r.json())
      .then((data: { entries?: { path: string }[] }) => {
        setFolders(deriveFolders((data.entries ?? []).map((e) => e.path)));
      })
      .catch(() => setFolders([]));
  }, []);

  // ── Debounced live preview ──
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPreviewLoading(true);
      setPreviewError("");
      const qs = new URLSearchParams();
      if (scope.allow_tags.length) qs.set("allow_tags", scope.allow_tags.join(","));
      if (scope.deny_tags.length) qs.set("deny_tags", scope.deny_tags.join(","));
      if (scope.allow_types.length) qs.set("allow_types", scope.allow_types.join(","));
      if (scope.deny_types.length) qs.set("deny_types", scope.deny_types.join(","));
      if (scope.allow_paths.length) qs.set("allow_paths", scope.allow_paths.join(","));
      if (scope.deny_paths.length) qs.set("deny_paths", scope.deny_paths.join(","));
      qs.set("sample_limit", "8");

      fetch(`/api/admin/trails/${encodeURIComponent(initial.id)}/preview?${qs}`)
        .then(async (r) => {
          if (!r.ok) {
            const data = await r.json().catch(() => ({}));
            throw new Error(data.error ?? `Preview failed (${r.status})`);
          }
          return r.json() as Promise<PreviewResponse>;
        })
        .then(setPreview)
        .catch((err) => setPreviewError(err.message))
        .finally(() => setPreviewLoading(false));
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [scope, initial.id]);

  // ── Handlers ──

  const cycleTag = useCallback((tag: string) => {
    setTagModes((prev) => {
      const next = new Map(prev);
      const cur = next.get(tag) ?? "unset";
      const nxt = cycleMode(cur);
      if (nxt === "unset") next.delete(tag);
      else next.set(tag, nxt);
      return next;
    });
  }, []);

  const cycleType = useCallback((t: string) => {
    setTypeModes((prev) => {
      const next = new Map(prev);
      const cur = next.get(t) ?? "unset";
      const nxt = cycleMode(cur);
      if (nxt === "unset") next.delete(t);
      else next.set(t, nxt);
      return next;
    });
  }, []);

  const cyclePath = useCallback((p: string) => {
    setPathModes((prev) => {
      const next = new Map(prev);
      const cur = next.get(p) ?? "unset";
      const nxt = cycleMode(cur);
      if (nxt === "unset") next.delete(p);
      else next.set(p, nxt);
      return next;
    });
  }, []);

  const addNewTag = useCallback(() => {
    const t = newTag.trim();
    if (!t) return;
    setTagModes((prev) => {
      if (prev.has(t)) return prev;
      const next = new Map(prev);
      next.set(t, "allow");
      return next;
    });
    setNewTag("");
  }, [newTag]);

  const runTest = useCallback(async () => {
    const p = testPath.trim();
    if (!p) return;
    setTestError("");
    setTestResult(null);
    const qs = new URLSearchParams();
    qs.set("test_path", p);
    if (scope.allow_tags.length) qs.set("allow_tags", scope.allow_tags.join(","));
    if (scope.deny_tags.length) qs.set("deny_tags", scope.deny_tags.join(","));
    if (scope.allow_types.length) qs.set("allow_types", scope.allow_types.join(","));
    if (scope.deny_types.length) qs.set("deny_types", scope.deny_types.join(","));
    if (scope.allow_paths.length) qs.set("allow_paths", scope.allow_paths.join(","));
    if (scope.deny_paths.length) qs.set("deny_paths", scope.deny_paths.join(","));

    const res = await fetch(
      `/api/admin/trails/${encodeURIComponent(initial.id)}/preview?${qs}`
    );
    if (res.status === 404) {
      setTestError("Note not found in vault");
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setTestError(data.error ?? "Test failed");
      return;
    }
    setTestResult((await res.json()) as TestResponse);
  }, [testPath, scope, initial.id]);

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setSaveError("");

      try {
        const payload: Record<string, unknown> = {
          name: name.trim(),
          description: description.trim(),
          allow_tags: scope.allow_tags,
          deny_tags: scope.deny_tags,
          allow_types: scope.allow_types,
          deny_types: scope.deny_types,
          allow_paths: scope.allow_paths,
          deny_paths: scope.deny_paths,
          rate_limit_reads: rateReads ? parseInt(rateReads, 10) : null,
          rate_limit_writes: rateWrites ? parseInt(rateWrites, 10) : null,
        };

        if (isCreate) {
          payload.action = "create";
        } else {
          payload.action = "update";
          payload.id = initial.id;
        }

        const res = await fetch("/api/admin/trails", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "save failed" }));
          setSaveError(data.error ?? "Save failed");
          return;
        }

        const data = await res.json();
        if (isCreate && data.token) {
          setNewToken(data.token);
        } else {
          router.push(trailsHref);
          router.refresh();
        }
      } catch {
        setSaveError("Network error");
      } finally {
        setSaving(false);
      }
    },
    [name, description, scope, rateReads, rateWrites, isCreate, initial.id, router]
  );

  const tree = useMemo(() => flattenTree(buildTree(folders)), [folders]);

  const NOTE_TYPES = useMemo(() => {
    const set = new Set<string>(preview?.all_types ?? []);
    // Keep any types the user has explicitly set even if not in vault
    for (const t of typeModes.keys()) set.add(t);
    return [...set].sort();
  }, [preview, typeModes]);

  const existingTags = useMemo(() => {
    const set = new Set<string>(preview?.all_tags ?? []);
    for (const t of tagModes.keys()) set.add(t);
    return [...set].sort();
  }, [preview, tagModes]);

  // ── Token reveal (create only) ──
  if (newToken) {
    return (
      <div className="max-w-xl">
        <h1 className="font-serif text-title font-medium tracking-[-0.015em] mb-4">
          Trail created
        </h1>
        <div className="rounded-lg border border-surface-border bg-surface/60 p-6 mb-4">
          <p className="text-label font-medium text-foreground mb-1">
            Consumer API key
          </p>
          <p className="text-detail text-harvest mb-3">
            Save this now — it won&apos;t be shown again.
          </p>
          <code className="block bg-surface font-mono text-label p-3 rounded-md break-all mb-3">
            {newToken}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(newToken);
            }}
            className="text-label text-moss hover:text-moss/60 transition-colors font-medium mr-4"
          >
            Copy token
          </button>
          <button
            onClick={() => router.push(trailsHref)}
            className="text-label text-ink/60 hover:text-ink transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
      {/* ── LEFT: editor ── */}
      <div>
        <h1 className="font-serif text-title font-medium tracking-[-0.015em] mb-1">
          {isCreate ? "Create trail" : "Edit trail"}
        </h1>
        <p className="text-label text-ink/60 mb-6">
          Shape the slice of your vault this trail exposes. Changes preview live.
        </p>

        {/* Name / description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Field label="Name" value={name} onChange={setName} placeholder="e.g. public-recipes" />
          <Field
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Shared recipe notes"
          />
        </div>

        {/* Paths */}
        <Section title="Paths" hint="Click a folder to cycle: allow → deny → unset.">
          {tree.length === 0 ? (
            <p className="text-label text-ink/40">Loading folders…</p>
          ) : (
            <div className="rounded-md border border-surface-border bg-surface/40 max-h-80 overflow-y-auto p-1">
              {tree.map((node) => (
                <PathTreeRow
                  key={node.path}
                  node={node}
                  mode={pathModes.get(node.path) ?? "unset"}
                  onCycle={() => cyclePath(node.path)}
                />
              ))}
            </div>
          )}
        </Section>

        {/* Types */}
        <Section title="Types" hint="Click a type to cycle its state.">
          {NOTE_TYPES.length === 0 ? (
            <p className="text-label text-ink/40">No types found in vault.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {NOTE_TYPES.map((t) => (
                <ChipButton
                  key={t}
                  label={t}
                  mode={typeModes.get(t) ?? "unset"}
                  onClick={() => cycleType(t)}
                />
              ))}
            </div>
          )}
        </Section>

        {/* Tags */}
        <Section title="Tags" hint="Click an existing tag or add a custom one.">
          <div className="flex flex-wrap gap-2 mb-3">
            {existingTags.map((t) => (
              <ChipButton
                key={t}
                label={t}
                mode={tagModes.get(t) ?? "unset"}
                onClick={() => cycleTag(t)}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNewTag();
                }
              }}
              placeholder="Add a tag that doesn't exist yet"
              className="flex-1 bg-cream border border-ink/15 rounded-md px-3 py-1.5 text-label focus:outline-none focus:border-moss transition-colors"
            />
            <button
              type="button"
              onClick={addNewTag}
              disabled={!newTag.trim()}
              className="text-detail text-moss hover:text-moss/60 transition-colors font-medium disabled:opacity-30"
            >
              Add
            </button>
          </div>
        </Section>

        {/* Rate limits */}
        <Section title="Rate limits" hint="Per minute. Leave blank for defaults.">
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <Field
              label="Reads / min"
              type="number"
              value={rateReads}
              onChange={setRateReads}
              placeholder="60"
            />
            <Field
              label="Writes / min"
              type="number"
              value={rateWrites}
              onChange={setRateWrites}
              placeholder="0"
            />
          </div>
        </Section>

        {/* Save */}
        <div className="mt-8 flex items-center gap-3">
          <Button
            type="submit"
            disabled={!name.trim()}
            loading={saving}
            loadingLabel="Saving…"
            size="md"
          >
            {isCreate ? "Create trail" : "Save changes"}
          </Button>
          <button
            type="button"
            onClick={() => router.push(trailsHref)}
            className="text-label text-ink/60 hover:text-ink transition-colors"
          >
            Cancel
          </button>
          {saveError && <span className="text-label text-harvest">{saveError}</span>}
        </div>
      </div>

      {/* ── RIGHT: preview panel ── */}
      <aside className="lg:sticky lg:top-6 self-start">
        <div className="rounded-lg border border-surface-border bg-surface/40 p-6">
          <p className="text-ink/40 text-detail tracking-[0.15em] uppercase font-medium mb-3">
            Scope preview
          </p>

          {previewError ? (
            <p className="text-label text-harvest">{previewError}</p>
          ) : !preview ? (
            <p className="text-label text-ink/40">Calculating…</p>
          ) : (
            <>
              <p className="text-heading font-serif font-medium text-foreground">
                {preview.match_count.toLocaleString()}
                <span className="text-base text-ink/40 font-sans font-normal ml-1">
                  / {preview.total_notes.toLocaleString()} notes
                </span>
              </p>
              <p className="text-detail text-ink/60 mt-1 mb-4">
                {previewLoading ? "Refreshing…" : "match this scope"}
              </p>

              {preview.samples.length > 0 ? (
                <>
                  <p className="text-ink/40 text-detail tracking-[0.15em] uppercase font-medium mb-2">
                    Sample notes
                  </p>
                  <ul className="space-y-1 text-detail">
                    {preview.samples.map((s) => (
                      <li key={s.path} className="truncate">
                        <code className="text-ink/60 font-mono">{s.path}</code>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-detail text-ink/40">No notes match this scope.</p>
              )}
            </>
          )}
        </div>

        {/* Test mode */}
        <div className="rounded-lg border border-surface-border bg-surface/40 p-6 mt-4">
          <p className="text-ink/40 text-detail tracking-[0.15em] uppercase font-medium mb-2">
            Test a note
          </p>
          <p className="text-detail text-ink/60 mb-3">
            Paste a vault path to see whether it&apos;s visible under this scope.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={testPath}
              onChange={(e) => setTestPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  runTest();
                }
              }}
              placeholder="Resources/Concepts/RAG.md"
              className="flex-1 bg-cream border border-ink/15 rounded-md px-2 py-1.5 text-detail font-mono focus:outline-none focus:border-moss"
            />
            <button
              type="button"
              onClick={runTest}
              disabled={!testPath.trim()}
              className="text-detail text-moss hover:text-moss/60 transition-colors font-medium disabled:opacity-30"
            >
              Test
            </button>
          </div>

          {testError && (
            <p className="text-detail text-harvest mt-2">{testError}</p>
          )}
          {testResult && (
            <div className="mt-3 rounded-md bg-surface p-2.5">
              <p
                className={`text-detail font-medium ${testResult.visible ? "text-moss" : "text-harvest"}`}
              >
                {testResult.visible ? "Visible" : "Hidden"}
              </p>
              <p className="text-detail text-ink/60 mt-1">{testResult.reason}</p>
            </div>
          )}
        </div>
      </aside>
    </form>
  );
}

// ── Small bits ───────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-detail uppercase tracking-[0.1em] text-ink/40 mb-1 font-medium">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-cream border border-ink/15 rounded-md px-3 py-2 text-label focus:outline-none focus:border-moss transition-colors"
      />
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-label font-medium text-foreground">{title}</h2>
        {hint && <p className="text-detail text-ink/40">{hint}</p>}
      </div>
      {children}
    </section>
  );
}
