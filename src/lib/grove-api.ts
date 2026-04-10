/**
 * API client for fetching notes from api.grove.md.
 * Used by server components during SSR.
 */

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

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
    next: { revalidate: 300 }, // 5 min cache
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Grove API error: ${res.status}`);
  return res.json();
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
