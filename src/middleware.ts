import { NextRequest, NextResponse } from "next/server";

// Paths that never require auth
const PUBLIC_PATHS = ["/", "/login", "/api/auth"];
const PUBLIC_PREFIXES = ["/_next/", "/api/"];
const PUBLIC_FILES = ["/favicon.ico", "/robots.txt", "/sitemap.xml"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
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
