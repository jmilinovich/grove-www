/**
 * Resident context — resolves an `@handle` route segment against the Grove
 * API and exposes the public profile shape to server components nested under
 * `/(resident)/[atHandle]/*`.
 *
 * The API endpoint is `GET /v1/residents/:handle` (unauthenticated).
 */

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

export interface ResidentProfile {
  handle: string;
  display_name: string | null;
  bio: string | null;
  public_trail_slugs: string[];
  note_count: number;
}

/** Strip the leading `@` from a dynamic segment. Returns null if the segment
 *  is not in `@handle` shape. Empty segments, missing `@`, or an `@` with no
 *  handle body all fail. */
export function parseAtHandle(atHandle: string): string | null {
  if (typeof atHandle !== "string") return null;
  const decoded = decodeURIComponent(atHandle);
  if (!decoded.startsWith("@")) return null;
  const handle = decoded.slice(1);
  if (handle.length === 0) return null;
  return handle;
}

export async function fetchResident(handle: string): Promise<ResidentProfile | null> {
  try {
    const res = await fetch(
      `${API_URL}/v1/residents/${encodeURIComponent(handle)}`,
      { next: { revalidate: 60 } },
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as ResidentProfile;
  } catch {
    return null;
  }
}
