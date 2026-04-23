import { NextRequest, NextResponse } from "next/server";

// Paths that never require auth
const PUBLIC_PATHS = ["/", "/login", "/api/auth"];
// `/@` covers every scoped resident route (/@handle, /@handle/s/<id>,
// /@handle/trails/<slug>, /@handle/<path>). The pages themselves decide
// whether content is public (profile, share, trail) or auth-gated
// (note viewer shows a sign-in prompt when signed out).
const PUBLIC_PREFIXES = ["/_next/", "/api/", "/s/", "/@"];
const PUBLIC_FILES = ["/favicon.ico", "/robots.txt", "/sitemap.xml"];

// Scoped share paths: /@<handle>/s/<id>. Next 16 pages cannot emit a 410
// status directly, so the proxy pre-checks share status and returns a
// minimal 410 response with `Cache-Control: no-store` when the link is
// expired or revoked. Active/unknown shares fall through to the page.
const SCOPED_SHARE_RE = /^\/@[^/]+\/s\/([^/]+)$/;
const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

// P8-B6 legacy user-scoped URL redirects.
//
// Before P8-B6, `profile` and `settings/vaults` lived under the vault-scoped
// subtree (`/@<h>/<v>/profile`, `/@<h>/<v>/settings/vaults`) even though
// both pages only read `/v1/me` — the `<v>` segment was never used. P8-B6
// hoisted those pages to `/@<h>/profile` and `/@<h>/settings/vaults`.
// This runs before auth so legacy bookmarks don't bounce through /login.
const LEGACY_USER_SCOPED =
  /^\/@([^/]+)\/([^/]+)\/(profile|settings\/vaults)\/?$/;
const BARE_SETTINGS = /^\/@([^/]+)\/settings\/?$/;
const REDIRECT_CACHE_CONTROL = "max-age=3600";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const shareMatch = pathname.match(SCOPED_SHARE_RE);
  if (shareMatch && request.method === "GET") {
    const gone = await checkShareGone(shareMatch[1]!);
    if (gone) {
      return new NextResponse(renderGoneHtml(gone.reason), {
        status: 410,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      });
    }
  }

  const legacyMatch = pathname.match(LEGACY_USER_SCOPED);
  if (legacyMatch) {
    const [, handle, , subpath] = legacyMatch;
    return redirect308(request, `/@${handle}/${subpath}`);
  }

  const settingsMatch = pathname.match(BARE_SETTINGS);
  if (settingsMatch) {
    const [, handle] = settingsMatch;
    return redirect308(request, `/@${handle}/settings/vaults`);
  }

  // Public exact paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Public prefixes
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Static files
  if (PUBLIC_FILES.includes(pathname) || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Check for grove_token cookie
  const token = request.cookies.get("grove_token");
  if (!token?.value) {
    const loginUrl = new URL("/login", request.url);
    // Preserve query string so /dashboard?tab=keys survives the login trip.
    loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Build an absolute URL from the incoming request and the target pathname,
// preserving search + hash. Explicitly constructed rather than cloned so no
// trailing-slash or pathname-normalization quirks from the original leak in.
function redirect308(request: NextRequest, targetPathname: string) {
  const target = new URL(targetPathname, request.nextUrl.origin);
  target.search = request.nextUrl.search;
  target.hash = request.nextUrl.hash;
  const res = NextResponse.redirect(target, 308);
  res.headers.set("Cache-Control", REDIRECT_CACHE_CONTROL);
  return res;
}

async function checkShareGone(id: string): Promise<{ reason: "expired" | "revoked" } | null> {
  try {
    const res = await fetch(`${API_URL}/v1/share/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (res.status !== 410) return null;
    const body = (await res.json().catch(() => ({}))) as { reason?: string };
    return { reason: body?.reason === "revoked" ? "revoked" : "expired" };
  } catch {
    return null;
  }
}

function renderGoneHtml(reason: "expired" | "revoked"): string {
  const subline = reason === "revoked" ? "This link was revoked." : "This link has expired.";
  const safeSubline = subline.replace(/[<>&]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;",
  );
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Expired link · Grove</title>
<meta name="robots" content="noindex, nofollow" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  body { font-family: ui-serif, Georgia, serif; background: #f7f3ea; color: #1a1a1a; margin: 0; }
  main { max-width: 560px; margin: 0 auto; padding: 5rem 1.5rem; }
  p.eyebrow { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(26,26,26,0.4); margin: 0 0 0.75rem; }
  h1 { font-size: 1.5rem; font-weight: 500; letter-spacing: -0.01em; margin: 0 0 0.5rem; }
  p.sub { color: rgba(26,26,26,0.7); margin: 0 0 2rem; }
  p.foot { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 0.875rem; color: rgba(26,26,26,0.6); }
  a { color: #4a6741; }
</style>
</head>
<body data-share-status="gone" data-share-reason="${reason}">
<main>
  <p class="eyebrow">Shared note</p>
  <h1>This link has expired</h1>
  <p class="sub">${safeSubline}</p>
  <p class="foot">Visit <a href="/">grove.md</a> to learn more.</p>
</main>
</body>
</html>`;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
