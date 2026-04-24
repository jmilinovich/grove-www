"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScopedLink } from "@/hooks/use-scoped-link";

export default function DashboardNav() {
  const pathname = usePathname();
  const { link } = useScopedLink();

  const homeHref = link("/dashboard");
  const accessHref = link("/dashboard/access");
  const homeActive = pathname === homeHref;
  const accessActive = pathname.startsWith(accessHref);

  return (
    <nav className="flex gap-1 border-b border-surface-border mb-8">
      <Link
        href={homeHref}
        prefetch={false}
        aria-current={homeActive ? "page" : undefined}
        className={[
          "px-4 py-2.5 text-label font-medium transition-colors relative",
          homeActive
            ? "text-ink border-b-2 border-moss -mb-px"
            : "text-ink/40 hover:text-ink/60",
        ].join(" ")}
      >
        Home
      </Link>
      <Link
        href={accessHref}
        prefetch={false}
        aria-current={accessActive ? "page" : undefined}
        className={[
          "px-4 py-2.5 text-label font-medium transition-colors relative",
          accessActive
            ? "text-ink border-b-2 border-moss -mb-px"
            : "text-ink/40 hover:text-ink/60",
        ].join(" ")}
      >
        Access
      </Link>
    </nav>
  );
}
