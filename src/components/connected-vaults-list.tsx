"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import type { VaultEntry } from "./vault-switcher";

interface Props {
  vaults: VaultEntry[];
  apiBaseUrl?: string;
  viewerHandle: string;
}

// Claude.ai opens the "Add custom connector" modal when you land on this URL.
// It does NOT accept a `?url=` pre-fill parameter — the old
// `claude.ai/add-connector?url=<mcp>` shape 404s. Users must paste the MCP
// URL themselves, so the button copies it to their clipboard on click.
const CLAUDE_ADD_CONNECTOR_URL =
  "https://claude.ai/settings/connectors?modal=add-custom-connector";

/**
 * Connected-vaults list (P8-B5).
 *
 * Renders one row per vault the viewer belongs to. Shows role, joined date,
 * last-active date, and two CTAs: open the dashboard, and "Add to Claude.ai"
 * — which copies the MCP URL to the clipboard and opens claude.ai's
 * add-connector modal in a new tab. Owners see a "Manage members"
 * placeholder — full member management is v2 per PLAN.md.
 */
export function ConnectedVaultsList({
  vaults,
  apiBaseUrl = "https://api.grove.md",
  viewerHandle,
}: Props) {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const handleAddToClaude = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>, slug: string, url: string) => {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(url);
          setCopiedSlug(slug);
          setTimeout(() => {
            setCopiedSlug((s) => (s === slug ? null : s));
          }, 4000);
        } catch {
          // Clipboard write can fail (permissions, insecure context). Fall
          // through to the normal link navigation so the user still gets
          // to the modal.
          window.open(CLAUDE_ADD_CONNECTOR_URL, "_blank", "noopener,noreferrer");
          return;
        }
        window.open(CLAUDE_ADD_CONNECTOR_URL, "_blank", "noopener,noreferrer");
      }
    },
    [],
  );

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
        const joinedDisplay = v.joined_at
          ? new Date(v.joined_at).toLocaleDateString()
          : "—";
        const lastActiveDisplay = v.last_active_at
          ? new Date(v.last_active_at).toLocaleDateString()
          : "never";
        const copied = copiedSlug === v.slug;

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
              <p className="mt-1 font-mono text-xs text-ink/40 break-all">
                {connectorUrl}
              </p>
            </div>
            <a
              href={CLAUDE_ADD_CONNECTOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => handleAddToClaude(e, v.slug, connectorUrl)}
              aria-label={`Copy MCP URL for ${v.name} and open Claude.ai`}
              className="inline-flex items-center gap-1 rounded-md border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink hover:bg-white whitespace-nowrap"
            >
              {copied ? "URL copied — paste in Claude" : "Add to Claude.ai"}
              {copied ? (
                <Copy className="size-3.5" aria-hidden="true" />
              ) : (
                <ExternalLink className="size-3.5" aria-hidden="true" />
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
