"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Overview", href: "/dashboard" },
  { label: "Keys", href: "/dashboard/keys" },
  { label: "Shares", href: "/dashboard/shares" },
  { label: "Trails", href: "/dashboard/trails" },
  { label: "Users", href: "/dashboard/users" },
  { label: "Usage", href: "/dashboard/usage" },
  { label: "Graph", href: "/dashboard/graph" },
  { label: "Health", href: "/dashboard/health" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-surface-border mb-8">
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
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
