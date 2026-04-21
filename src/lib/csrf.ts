import type { NextRequest } from "next/server";

/**
 * Same-origin check for mutating API requests.
 *
 * Browsers attach an `Origin` header to cross-origin POST/DELETE/etc.
 * Rejecting when it does not match the request host blocks CSRF even if a
 * session cookie is exfiltrated by a subdomain or confused-deputy flow.
 *
 * Returns `null` when the request is same-origin (allow), otherwise returns
 * the reason string (reject with 403).
 */
export function checkSameOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin");
  if (!origin) return "missing_origin";

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return "invalid_origin";
  }

  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost ?? req.headers.get("host");
  if (!host) return "missing_host";

  if (originHost !== host) return "origin_mismatch";
  return null;
}
