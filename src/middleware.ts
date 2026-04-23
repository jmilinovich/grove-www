import { NextResponse, type NextRequest } from "next/server";

/**
 * Legacy user-scoped URL redirects (P8-B6).
 *
 * Before P8-B6, `profile` and `settings/vaults` lived under the vault-scoped
 * subtree (`/@<h>/<v>/profile`, `/@<h>/<v>/settings/vaults`) even though both
 * pages only read `/v1/me` — the `<v>` segment was never used and the URL
 * lied about the resource. P8-B6 hoisted those pages up to `/@<h>/profile`
 * and `/@<h>/settings/vaults`.
 *
 * This middleware emits 308 redirects from the legacy paths to the new
 * canonical ones, stripping the vault segment but preserving query string
 * and fragment. Runs before any RSC work so legacy bookmarks don't spin up
 * a server component just to 301 onward.
 *
 * `/@<h>/settings` also 308s to `/@<h>/settings/vaults` — the user-scoped
 * settings area has a single page today, and we want bare `/@<h>/settings`
 * to land there rather than a 404.
 */

// /@<handle>/<vault-slug>/profile
// /@<handle>/<vault-slug>/settings/vaults
const LEGACY_USER_SCOPED =
  /^\/@([^/]+)\/([^/]+)\/(profile|settings\/vaults)\/?$/;

// /@<handle>/settings → /@<handle>/settings/vaults
const BARE_SETTINGS = /^\/@([^/]+)\/settings\/?$/;

const REDIRECT_CACHE_CONTROL = "max-age=3600";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  return NextResponse.next();
}

// Build an absolute URL from the incoming request and the target pathname,
// preserving search + hash. Explicitly constructed rather than cloned so
// no trailing-slash or pathname-normalization quirks from the original URL
// leak through into the redirect target.
function redirect308(request: NextRequest, targetPathname: string) {
  const target = new URL(targetPathname, request.nextUrl.origin);
  target.search = request.nextUrl.search;
  target.hash = request.nextUrl.hash;
  const res = NextResponse.redirect(target, 308);
  res.headers.set("Cache-Control", REDIRECT_CACHE_CONTROL);
  return res;
}

export const config = {
  // Only run on `/@<handle>/...` paths. The two redirect rules above match
  // legacy user-scoped URLs and the bare `/@<h>/settings` index; all other
  // `/@...` paths fall through to `NextResponse.next()`. Static assets,
  // API routes, and the bare `/profile` / `/settings` shims are outside
  // this matcher — the bare shims stay as page-level redirects so they
  // can check auth cookies before redirecting.
  matcher: ["/@:path*"],
};
