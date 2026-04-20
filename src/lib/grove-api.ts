/**
 * API client for fetching notes from api.grove.md.
 * Used by server components during SSR.
 */

import { createHash } from "node:crypto";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

/** Short hash of the API key, used as a cache-busting query param so
 *  different users get independent Next.js fetch cache entries. */
function cacheKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex").slice(0, 8);
}

export class AuthError extends Error {
  constructor() { super("unauthorized"); this.name = "AuthError"; }
}

export interface NoteLink {
  path: string | null;
  exists: boolean;
}

export interface NoteResponse {
  path: string;
  frontmatter: Record<string, unknown>;
  content: string;
  content_hash: string;
  links: Record<string, NoteLink>;
  backlinks: string[];
  resolved_from?: string;
}

export interface SearchResult {
  path: string;
  title: string;
  snippet: string;
  score: number;
}

export async function fetchNote(
  path: string,
  apiKey: string,
): Promise<NoteResponse | null> {
  const ck = cacheKey(apiKey);
  const res = await fetch(`${API_URL}/v1/notes/${encodeURIComponent(path)}?_ck=${ck}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 300 },
  });
  if (res.status === 404) return null;
  if (res.status === 401) throw new AuthError();
  if (!res.ok) throw new Error(`Grove API error: ${res.status}`);
  return res.json();
}

export interface ListEntry {
  path: string;
  name: string;
  type: string | null;
  tags: string[];
  modified_at: string;
  // Image-specific (populated only for notes with type: image)
  thumbnail_url?: string;
  image_url?: string;
  dimensions?: { width: number; height: number };
  description?: string;
}

export async function listNotes(
  prefix: string,
  apiKey: string,
  type?: string,
): Promise<ListEntry[]> {
  const ck = cacheKey(apiKey);
  const params = new URLSearchParams({ prefix, _ck: ck });
  if (type) params.set("type", type);
  const res = await fetch(`${API_URL}/v1/list?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 300 },
  });
  if (res.status === 401) throw new AuthError();
  if (!res.ok) throw new Error(`Grove API error: ${res.status}`);
  const data = await res.json();
  return data.entries;
}

export async function searchNotes(
  query: string,
  apiKey: string,
  limit = 10,
): Promise<SearchResult[]> {
  const ck = cacheKey(apiKey);
  const params = new URLSearchParams({ q: query, limit: String(limit), _ck: ck });
  const res = await fetch(`${API_URL}/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Grove API error: ${res.status}`);
  const data = await res.json();
  return data.results;
}
