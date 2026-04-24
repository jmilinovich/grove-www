import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
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
