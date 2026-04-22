import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import GraphExplorer from "./graph-explorer";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

export const metadata = {
  title: "Graph — Grove",
};

interface GraphAnalysis {
  nodes: number;
  edges: number;
  avg_links_per_note: number;
  orphan_count: number;
  cluster_count: number;
  most_connected: { name: string; path: string; links: number }[];
}

async function fetchGraphData(apiKey: string): Promise<GraphAnalysis | null> {
  try {
    const res = await fetch(`${API_URL}/v1/status/graph`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function GraphPage() {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect("/login?redirect=/dashboard/graph");

  const data = await fetchGraphData(apiKey);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif font-medium text-title text-ink">Knowledge graph</h1>
        {data && (
          <p className="text-label text-ink/40 mt-1 font-sans">
            {data.nodes.toLocaleString()} notes &middot; {data.edges.toLocaleString()} links &middot; {data.cluster_count} clusters &middot; {data.orphan_count} orphans
          </p>
        )}
      </div>

      {!data ? (
        <div className="border border-surface-border bg-surface rounded-lg p-10 text-center">
          <p className="text-ink/40 font-sans text-label">Graph data unavailable — stats may still be computing.</p>
        </div>
      ) : (
        <GraphExplorer data={data} />
      )}
    </div>
  );
}
