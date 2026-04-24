"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScopedLink } from "@/hooks/use-scoped-link";

const tabs = [
  { label: "Keys", sub: "/dashboard/access/keys" },
  { label: "Scoped Keys", sub: "/dashboard/access/trails" },
  { label: "Shares", sub: "/dashboard/access/shares" },
  { label: "Members", sub: "/dashboard/access/members" },
];

export default function AccessTabs() {
  const pathname = usePathname();
  const { link } = useScopedLink();

  return (
    <nav className="flex gap-1 border-b border-surface-border mb-8">
      {tabs.map((tab) => {
        const href = link(tab.sub);
        const isActive = pathname.startsWith(href);

        return (
          <Link
            key={tab.sub}
            href={href}
            prefetch={false}
            aria-current={isActive ? "page" : undefined}
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
