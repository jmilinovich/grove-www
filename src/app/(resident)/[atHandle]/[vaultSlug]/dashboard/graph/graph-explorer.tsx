"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { useScopedLink } from "@/hooks/use-scoped-link";
import { bareHandle } from "@/lib/vault-context";

// ── Types ────────────────────────────────────────────────────────────────────

interface GraphAnalysis {
  nodes: number;
  edges: number;
  avg_links_per_note: number;
  orphan_count: number;
  cluster_count: number;
  most_connected: { name: string; path: string; links: number }[];
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  path: string;
  links: number;
  type: NodeType;
  folder: string;
}

interface GraphEdge extends d3.SimulationLinkDatum<GraphNode> {
  source: GraphNode | string;
  target: GraphNode | string;
}

type NodeType = "concept" | "person" | "project" | "recipe" | "company" | "place" | "journal" | "other";

// ── Colors ───────────────────────────────────────────────────────────────────

const NODE_COLORS: Record<NodeType, string> = {
  concept: "var(--moss)",
  person: "var(--harvest)",
  project: "var(--ink)",
  recipe: "var(--harvest)",
  company: "var(--earth)",
  place: "var(--moss)",
  journal: "var(--muted)",
  other: "var(--muted-light)",
};

const NODE_STROKE: Record<NodeType, string> = {
  concept: "var(--earth)",
  person: "var(--earth)",
  project: "var(--ink)",
  recipe: "var(--earth)",
  company: "var(--ink)",
  place: "var(--earth)",
  journal: "var(--muted-light)",
  other: "var(--surface-border)",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function inferType(path: string): NodeType {
  const lower = path.toLowerCase();
  if (lower.includes("resources/concepts")) return "concept";
  if (lower.includes("resources/people")) return "person";
  if (lower.includes("resources/projects")) return "project";
  if (lower.includes("resources/recipes")) return "recipe";
  if (lower.includes("resources/companies")) return "company";
  if (lower.includes("resources/places")) return "place";
  if (lower.includes("journal/")) return "journal";
  return "other";
}

function inferFolder(path: string): string {
  const parts = path.split("/");
  return parts.length >= 2 ? parts.slice(0, 2).join("/") : parts[0];
}

function buildGraph(data: GraphAnalysis): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = data.most_connected.map((n) => ({
    id: n.name,
    name: n.name,
    path: n.path,
    links: n.links,
    type: inferType(n.path),
    folder: inferFolder(n.path),
  }));

  // Build edges: connect nodes that share a folder (implicit cluster)
  const folderGroups = new Map<string, string[]>();
  for (const node of nodes) {
    const g = folderGroups.get(node.folder) ?? [];
    g.push(node.id);
    folderGroups.set(node.folder, g);
  }

  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  for (const [, members] of folderGroups) {
    if (members.length < 2) continue;
    // Star topology: connect all to the highest-link node
    const sorted = [...members].sort((a, b) => {
      const la = nodes.find((n) => n.id === a)?.links ?? 0;
      const lb = nodes.find((n) => n.id === b)?.links ?? 0;
      return lb - la;
    });
    const hub = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      const key = [hub, sorted[i]].sort().join("→");
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({ source: hub, target: sorted[i] });
      }
    }
  }

  // Also connect top nodes cross-folder (top 5 by links get edges to each other)
  const top5 = [...nodes].sort((a, b) => b.links - a.links).slice(0, 5);
  for (let i = 0; i < top5.length; i++) {
    for (let j = i + 1; j < top5.length; j++) {
      const key = [top5[i].id, top5[j].id].sort().join("→");
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({ source: top5[i].id, target: top5[j].id });
      }
    }
  }

  return { nodes, edges };
}

// ── Filter state ─────────────────────────────────────────────────────────────

interface FilterState {
  types: Set<NodeType>;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SelectedNode {
  name: string;
  type: NodeType;
  links: number;
  path: string;
  folder: string;
}

const TYPE_LABELS: Record<NodeType, string> = {
  concept: "Concepts",
  person: "People",
  project: "Projects",
  recipe: "Recipes",
  company: "Companies",
  place: "Places",
  journal: "Journal",
  other: "Other",
};

export default function GraphExplorer({ data }: { data: GraphAnalysis }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const { atHandle } = useScopedLink();
  const notePrefix = atHandle ? `/@${bareHandle(atHandle)}` : "";
  const [filters, setFilters] = useState<FilterState>({
    types: new Set<NodeType>(["concept", "person", "project", "recipe", "company", "place", "journal", "other"]),
  });
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);

  const { nodes: allNodes, edges: allEdges } = buildGraph(data);

  const filteredNodes = allNodes.filter((n) => filters.types.has(n.type));
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = allEdges.filter(
    (e) =>
      filteredNodeIds.has(typeof e.source === "string" ? e.source : (e.source as GraphNode).id) &&
      filteredNodeIds.has(typeof e.target === "string" ? e.target : (e.target as GraphNode).id),
  );

  const nodeRadius = useCallback(
    (n: GraphNode) => {
      const maxLinks = Math.max(...filteredNodes.map((x) => x.links), 1);
      return 4 + ((n.links / maxLinks) * 16);
    },
    [filteredNodes],
  );

  useEffect(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    d3.select(svg).selectAll("*").remove();
    if (simulationRef.current) simulationRef.current.stop();

    const root = d3
      .select(svg)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    const g = root.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    root.call(zoom);

    const simNodes: GraphNode[] = filteredNodes.map((n) => ({ ...n }));
    const simEdges: GraphEdge[] = filteredEdges.map((e) => ({
      source: typeof e.source === "string" ? e.source : (e.source as GraphNode).id,
      target: typeof e.target === "string" ? e.target : (e.target as GraphNode).id,
    }));

    const link = g
      .append("g")
      .selectAll("line")
      .data(simEdges)
      .enter()
      .append("line")
      .attr("stroke", "rgba(44,36,22,0.08)")
      .attr("stroke-width", 1);

    const node = g
      .append("g")
      .selectAll("g")
      .data(simNodes)
      .enter()
      .append("g")
      .attr("cursor", "pointer")
      .on("click", (_event, d) => {
        setSelected({ name: d.name, type: d.type, links: d.links, path: d.path, folder: d.folder });
      });

    node
      .append("circle")
      .attr("r", (d) => nodeRadius(d))
      .attr("fill", (d) => NODE_COLORS[d.type])
      .attr("stroke", (d) => NODE_STROKE[d.type])
      .attr("stroke-width", 1)
      .attr("opacity", 0.85);

    node
      .append("text")
      .text((d) => d.name)
      .attr("font-family", "Lora, Georgia, serif")
      .attr("font-size", "10px")
      .attr("fill", "var(--ink)")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => -nodeRadius(d) - 4)
      .attr("pointer-events", "none")
      .attr("opacity", 0);

    node
      .on("mouseenter", function () {
        d3.select(this).select("text").attr("opacity", 1);
        d3.select(this).select("circle").attr("opacity", 1).attr("stroke-width", 2);
      })
      .on("mouseleave", function () {
        d3.select(this).select("text").attr("opacity", 0);
        d3.select(this).select("circle").attr("opacity", 0.85).attr("stroke-width", 1);
      });

    const drag = d3
      .drag<SVGGElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag);

    const simulation = d3
      .forceSimulation<GraphNode>(simNodes)
      .force(
        "link",
        d3.forceLink<GraphNode, GraphEdge>(simEdges).id((d) => d.id).distance(60).strength(0.4),
      )
      .force("charge", d3.forceManyBody<GraphNode>().strength(-120))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<GraphNode>().radius((d) => nodeRadius(d) + 6))
      .on("tick", () => {
        link
          .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
          .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
          .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
          .attr("y2", (d) => (d.target as GraphNode).y ?? 0);
        node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });

    simulationRef.current = simulation as unknown as d3.Simulation<GraphNode, GraphEdge>;

    return () => { simulation.stop(); };
  }, [filteredNodes, filteredEdges, nodeRadius]);

  const presentTypes = new Set(allNodes.map((n) => n.type));

  const toggleType = (type: NodeType) => {
    setFilters((prev) => {
      const next = new Set(prev.types);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return { ...prev, types: next };
    });
  };

  return (
    <div className="flex gap-4" style={{ height: "calc(100vh - 240px)", minHeight: "520px" }}>
      <div ref={containerRef} className="flex-1 border border-surface-border bg-cream rounded-lg overflow-hidden relative">
        <svg ref={svgRef} className="w-full h-full" style={{ background: "transparent" }} />

        <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 pointer-events-none">
          <span className="text-detail font-sans text-ink/40">size = connection count</span>
          <span className="text-detail font-sans text-ink/40">scroll to zoom · drag to pan</span>
        </div>

        {filteredNodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-label text-ink/40 font-sans">No nodes match current filters.</p>
          </div>
        )}
      </div>

      <div className="w-56 flex flex-col gap-4 shrink-0">
        {selected ? (
          <div className="border border-surface-border bg-surface rounded-lg p-6">
            <p className="font-serif font-medium text-ink text-label mb-1 break-words leading-snug">{selected.name}</p>
            <p className="text-detail text-ink/40 font-sans capitalize mb-3">{selected.type}</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-detail font-sans">
                <span className="text-ink/40">Links</span>
                <span className="text-ink font-medium">{selected.links}</span>
              </div>
              <div className="flex justify-between text-detail font-sans">
                <span className="text-ink/40">Folder</span>
                <span className="text-ink font-medium">{selected.folder}</span>
              </div>
            </div>
            <a
              href={`${notePrefix}/${selected.path.replace(/\.md$/, "")}`}
              className="mt-3 block text-detail text-moss hover:text-ink transition-colors font-sans"
            >
              Open note →
            </a>
            <button
              onClick={() => setSelected(null)}
              className="mt-2 text-detail text-ink/40 hover:text-ink/60 transition-colors font-sans"
            >
              dismiss
            </button>
          </div>
        ) : (
          <div className="border border-surface-border bg-surface rounded-lg p-6">
            <p className="text-detail text-ink/40 font-sans">Click a node to inspect it.</p>
          </div>
        )}

        <div className="border border-surface-border bg-surface rounded-lg p-6 flex-1 overflow-y-auto">
          <p className="text-ink/40 text-detail tracking-[0.15em] uppercase font-sans mb-3">Filter</p>
          <div className="space-y-1.5 mb-4">
            {(["concept", "person", "project", "recipe", "company", "place", "journal", "other"] as NodeType[])
              .filter((t) => presentTypes.has(t))
              .map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`flex items-center gap-2 w-full text-left text-detail font-sans transition-opacity ${filters.types.has(type) ? "opacity-100" : "opacity-30"}`}
                >
                  <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: NODE_COLORS[type] }} />
                  <span className="text-ink">{TYPE_LABELS[type]}</span>
                </button>
              ))}
          </div>

          <div className="mt-4 pt-4 border-t border-surface-border space-y-1">
            <div className="flex justify-between text-detail font-sans">
              <span className="text-ink/40">Showing</span>
              <span className="text-ink">{filteredNodes.length} nodes</span>
            </div>
            <div className="flex justify-between text-detail font-sans">
              <span className="text-ink/40">Edges</span>
              <span className="text-ink">{filteredEdges.length}</span>
            </div>
            <div className="flex justify-between text-detail font-sans">
              <span className="text-ink/40">Vault total</span>
              <span className="text-ink">{data.nodes.toLocaleString()} notes</span>
            </div>
            <div className="flex justify-between text-detail font-sans">
              <span className="text-ink/40">Orphans</span>
              <span className="text-ink">{data.orphan_count}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
