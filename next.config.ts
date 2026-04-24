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
 *
 * `Content-Security-Policy` is intentionally NOT set here — a tight
 * CSP needs nonces for the shiki/katex inline styles the note
 * renderer emits, and rolling that out requires a separate pass.
 * Tracked as a follow-up.
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
