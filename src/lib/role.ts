const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

export interface WhoamiResponse {
  key_id: string;
  key_name: string;
  scopes: string[];
  vault_id: string | null;
  trail: { id: string; name: string } | null;
}

export type Role = "owner" | "non-owner";

export async function fetchWhoami(apiKey: string): Promise<WhoamiResponse | null> {
  try {
    const res = await fetch(`${API_URL}/v1/whoami`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as WhoamiResponse;
  } catch {
    return null;
  }
}

export function roleFromWhoami(whoami: WhoamiResponse | null): Role {
  return whoami?.trail ? "non-owner" : "owner";
}
