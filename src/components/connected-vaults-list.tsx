"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { VaultEntry } from "./vault-switcher";

interface Props {
  vaults: VaultEntry[];
  apiBaseUrl?: string;
  viewerHandle: string;
}

/**
 * Connected-vaults list (P8-B5).
 *
 * Renders one row per vault the viewer belongs to. Shows role, joined date,
 * last-active date, and two CTAs: open the dashboard, and "Add to Claude.ai"
 * via a deep-link to claude.ai's connector-add flow. Owners see a
 * "Manage members" placeholder — full member management is v2 per PLAN.md.
 */
export function ConnectedVaultsList({
  vaults,
  apiBaseUrl = "https://api.grove.md",
  viewerHandle,
}: Props) {
  if (vaults.length === 0) {
    return (
      <p className="text-sm text-ink/60">
        You don't belong to any vaults yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-ink/15">
      {vaults.map((v) => {
        const dashboardUrl = `/@${v.owner_handle}/${v.slug}/dashboard`;
        const connectorUrl = `${apiBaseUrl}/v/${v.slug}/mcp`;
        const claudeDeepLink = `https://claude.ai/add-connector?url=${encodeURIComponent(connectorUrl)}`;
        const joinedDisplay = v.joined_at
          ? new Date(v.joined_at).toLocaleDateString()
          : "—";
        const lastActiveDisplay = v.last_active_at
          ? new Date(v.last_active_at).toLocaleDateString()
          : "never";

        return (
          <li key={v.id} className="py-4 flex items-start justify-between gap-4">
            <div>
              <Link
                href={dashboardUrl}
                className="font-mono text-sm text-ink hover:underline"
              >
                @{v.owner_handle}/{v.slug}
              </Link>
              <p className="mt-1 text-sm text-ink/60">
                {v.name} · <span className="font-medium text-ink">{v.role}</span>
              </p>
              <p className="mt-0.5 text-xs text-ink/60">
                joined {joinedDisplay} · last active {lastActiveDisplay}
              </p>
              {v.role === "owner" && (
                <span className="mt-1 inline-block text-xs text-ink/60">
                  Manage members <span className="opacity-60">(coming soon)</span>
                </span>
              )}
            </div>
            <a
              href={claudeDeepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink hover:bg-white"
            >
              Add to Claude.ai
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
