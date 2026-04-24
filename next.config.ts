import type { NextConfig } from "next";

/**
 * Global security response headers. Defense-in-depth on top of the
 * per-route checks; keeps the blast radius of any future sanitizer
 * bypass small.
 *
 * - `Strict-Transport-Security`: HSTS with 1-year max, includeSubDomains
 * - `X-Frame-Options: DENY`: no framing; share page + note viewer
 *   can't be clickjacked
 * - `X-Content-Type-Options: nosniff`: browsers must honor our
 *   Content-Type; blocks MIME-sniffing attacks
 * - `Referrer-Policy: strict-origin-when-cross-origin`: don't leak
 *   note paths to third parties in the Referer header
 * - `Permissions-Policy`: no camera/microphone/geolocation from this app
 * - `Content-Security-Policy`: see directive-by-directive notes below
 */

/**
 * Static CSP. Chosen over middleware-nonce because nonces would force
 * every page through middleware on every request and turn the static
 * marketing routes dynamic, which kills caching. The trade-offs we
 * accept here, and the path to tightening them later:
 *
 * - `script-src 'self' 'unsafe-inline'`
 *   Next.js 16 App Router emits ~13 inline `<script>` tags per page
 *   that push the streaming RSC payload onto a global queue
 *   (`self.__next_f.push(...)`). They contain serialized component
 *   data, not arbitrary JS — the framework's bundle is the only
 *   thing that consumes them. Blocking them would break hydration on
 *   every page. `'unsafe-inline'` here permits those data-pushes;
 *   external scripts are still confined to `'self'`. No
 *   `'unsafe-eval'`, no third-party origins. Tightening path: route
 *   responses through middleware that mints a per-request nonce and
 *   pin `script-src 'self' 'nonce-<n>' 'strict-dynamic'`. Cost: every
 *   page becomes dynamic.
 *
 * - `style-src 'self' 'unsafe-inline'`
 *   shiki's `codeToHtml` emits one `style` attribute per syntax span;
 *   client-side mermaid renders SVG with inline styles; the
 *   middleware-rendered 410 share page (`src/proxy.ts`) carries a
 *   `<style>` block. The markdown sanitizer already strips
 *   author-supplied inline styles before shiki runs (so a malicious
 *   note can't smuggle in `style="background:url(beacon)"`), which
 *   is the actual attack we cared about. Tightening path: switch
 *   shiki to its `cssVariablePrefix` mode and ship one stylesheet of
 *   token classes; convert the 410 page to a CSS class on the
 *   stylesheet; rely on mermaid's strict mode + a class-only theme.
 *
 * - `img-src 'self' data: https:`
 *   Vault notes embed external image URLs (Wikipedia, S3, etc.) and
 *   KaTeX uses `data:` SVGs in some glyphs. `https:` is the loose
 *   bound; tightening would require an allowlist per vault, which is
 *   out of scope here.
 *
 * - `connect-src 'self'`
 *   All client fetches hit `/api/*` on the same origin; the
 *   api.grove.md backend is only reached server-side from Next route
 *   handlers, which CSP doesn't apply to.
 *
 * - `frame-ancestors 'none'` redundant with X-Frame-Options: DENY
 *   above but CSP is the modern equivalent and is what newer browsers
 *   honor first.
 *
 * - `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`
 *   Standard hardening. No legitimate use of `<object>`/`<embed>`
 *   here; `<base>` injection and form re-targeting are common XSS
 *   amplifiers worth blocking.
 *
 * No `report-uri` / `report-to` — we don't have a reporting
 * endpoint, and standing one up just for this is more code than the
 * directive earns. Add when there's somewhere to send reports.
 */
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: cspDirectives },
];

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        source: "/@:atHandle/:vaultSlug/dashboard/keys",
        destination: "/@:atHandle/:vaultSlug/dashboard/access/keys",
        permanent: true,
      },
      {
        source: "/@:atHandle/:vaultSlug/dashboard/trails",
        destination: "/@:atHandle/:vaultSlug/dashboard/access/trails",
        permanent: true,
      },
      {
        source: "/@:atHandle/:vaultSlug/dashboard/shares",
        destination: "/@:atHandle/:vaultSlug/dashboard/access/shares",
        permanent: true,
      },
      {
        source: "/@:atHandle/:vaultSlug/dashboard/users",
        destination: "/@:atHandle/:vaultSlug/dashboard/access/members",
        permanent: true,
      },
      {
        source: "/@:atHandle/:vaultSlug/dashboard/graph",
        destination: "/@:atHandle/:vaultSlug/dashboard",
        permanent: true,
      },
      {
        source: "/@:atHandle/:vaultSlug/dashboard/lifecycle",
        destination: "/@:atHandle/:vaultSlug/dashboard",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
