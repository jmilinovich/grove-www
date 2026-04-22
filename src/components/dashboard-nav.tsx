"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScopedLink } from "@/hooks/use-scoped-link";

const tabs = [
  { label: "Overview", sub: "/dashboard" },
  { label: "Keys", sub: "/dashboard/keys" },
  { label: "Shares", sub: "/dashboard/shares" },
  { label: "Trails", sub: "/dashboard/trails" },
  { label: "Users", sub: "/dashboard/users" },
  { label: "Usage", sub: "/dashboard/usage" },
  { label: "Graph", sub: "/dashboard/graph" },
  { label: "Health", sub: "/dashboard/health" },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const { link } = useScopedLink();

  return (
    <nav className="flex gap-1 border-b border-surface-border mb-8">
      {tabs.map((tab) => {
        const href = link(tab.sub);
        const isActive =
          tab.sub === "/dashboard"
            ? pathname.endsWith("/dashboard")
            : pathname.startsWith(href) || pathname.endsWith(tab.sub);

        return (
          <Link
            key={tab.sub}
            href={href}
            className={[
              "px-4 py-2.5 text-label font-medium transition-colors relative",
              isActive
                ? "text-ink border-b-2 border-moss -mb-px"
                : "text-ink/40 hover:text-ink/60",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
