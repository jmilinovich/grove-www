/**
 * API client for fetching notes from api.grove.md.
 * Used by server components during SSR.
 */

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

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
  const res = await fetch(`${API_URL}/v1/notes/${encodeURIComponent(path)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
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
}

export async function listNotes(
  prefix: string,
  apiKey: string,
): Promise<ListEntry[]> {
  const params = new URLSearchParams({ prefix });
  const res = await fetch(`${API_URL}/v1/list?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
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
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await fetch(`${API_URL}/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Grove API error: ${res.status}`);
  const data = await res.json();
  return data.results;
}
