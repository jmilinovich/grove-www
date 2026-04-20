"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

// ── Types ────────────────────────────────────────────────────────────────────

interface GraphAnalysis {
  nodes: number;
  edges: number;
  density: number;
  most_connected: { name: string; path: string; links: number }[];
  orphans: string[];
  clusters: { id: number; size: number; members: string[] }[];
  bridges: { name: string; path: string; score: number }[];
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  path: string;
  links: number;
  type: NodeType;
  clusterId: number | null;
  isBridge: boolean;
  isOrphan: boolean;
}

interface GraphEdge extends d3.SimulationLinkDatum<GraphNode> {
  source: GraphNode | string;
  target: GraphNode | string;
}

type NodeType = "concept" | "person" | "project" | "recipe" | "company" | "place" | "journal" | "other";

// ── Colors ───────────────────────────────────────────────────────────────────

const NODE_COLORS: Record<NodeType, string> = {
  concept: "#7A8B5C",   // moss
  person: "#D4890A",    // harvest
  project: "#2C2416",   // ink
  recipe: "#D4890A",    // harvest
  company: "#3D3524",   // earth
  place: "#7A8B5C",     // moss (lighter)
  journal: "#2C241680", // ink/50
  other: "rgba(44,36,22,0.25)", // surface-border
};

const NODE_STROKE: Record<NodeType, string> = {
  concept: "#5a6b3c",
  person: "#a0670a",
  project: "#2C2416",
  recipe: "#a0670a",
  company: "#2C2416",
  place: "#5a6b3c",
  journal: "#2C241650",
  other: "rgba(44,36,22,0.15)",
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

function buildGraph(data: GraphAnalysis): { nodes: GraphNode[]; edges: GraphEdge[] } {
  // Build a name→clusterId map
  const nameToCluster = new Map<string, number>();
  for (const cluster of data.clusters) {
    for (const member of cluster.members) {
      nameToCluster.set(member, cluster.id);
    }
  }

  const bridgeNames = new Set(data.bridges.map((b) => b.name));
  const orphanPaths = new Set(data.orphans);

  // Collect all unique names from most_connected + bridges
  const nodeMap = new Map<string, GraphNode>();

  const addNode = (name: string, path: string, links: number) => {
    if (nodeMap.has(name)) return;
    nodeMap.set(name, {
      id: name,
      name,
      path,
      links,
      type: inferType(path),
      clusterId: nameToCluster.get(name) ?? null,
      isBridge: bridgeNames.has(name),
      isOrphan: orphanPaths.has(path),
    });
  };

  for (const n of data.most_connected) addNode(n.name, n.path, n.links);
  for (const b of data.bridges) addNode(b.name, b.path, 0);

  // Build edges: connect nodes that share a cluster
  // Group nodes by cluster
  const clusterGroups = new Map<number, string[]>();
  for (const [name, node] of nodeMap) {
    if (node.clusterId !== null) {
      const g = clusterGroups.get(node.clusterId) ?? [];
      g.push(name);
      clusterGroups.set(node.clusterId, g);
    }
  }

  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  for (const [, members] of clusterGroups) {
    // Star topology: connect all members to the highest-degree node in the group
    const sorted = [...members].sort((a, b) => {
      const la = nodeMap.get(a)?.links ?? 0;
      const lb = nodeMap.get(b)?.links ?? 0;
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
    // Also connect bridges to the hub
    for (const member of members) {
      if (nodeMap.get(member)?.isBridge && member !== hub) {
        // already handled above
      }
    }
  }

  return { nodes: [...nodeMap.values()], edges };
}

// ── Filter state ─────────────────────────────────────────────────────────────

interface FilterState {
  types: Set<NodeType>;
  clusters: Set<number>;
  showBridgesOnly: boolean;
  showOrphansOnly: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SelectedNode {
  name: string;
  type: NodeType;
  links: number;
  path: string;
  clusterId: number | null;
  isBridge: boolean;
  isOrphan: boolean;
}

export default function GraphExplorer({ data }: { data: GraphAnalysis }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    types: new Set<NodeType>(["concept", "person", "project", "recipe", "company", "place", "journal", "other"]),
    clusters: new Set<number>(data.clusters.map((c) => c.id)),
    showBridgesOnly: false,
    showOrphansOnly: false,
  });
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);

  const { nodes: allNodes, edges: allEdges } = buildGraph(data);

  const filteredNodes = allNodes.filter((n) => {
    if (!filters.types.has(n.type)) return false;
    if (n.clusterId !== null && !filters.clusters.has(n.clusterId)) return false;
    if (filters.showBridgesOnly && !n.isBridge) return false;
    if (filters.showOrphansOnly && !n.isOrphan) return false;
    return true;
  });

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = allEdges.filter(
    (e) =>
      filteredNodeIds.has(typeof e.source === "string" ? e.source : (e.source as GraphNode).id) &&
      filteredNodeIds.has(typeof e.target === "string" ? e.target : (e.target as GraphNode).id),
  );

  const nodeRadius = useCallback(
    (n: GraphNode) => {
      const maxLinks = Math.max(...filteredNodes.map((x) => x.links), 1);
      const minR = 4;
      const maxR = 20;
      return minR + ((n.links / maxLinks) * (maxR - minR));
    },
    [filteredNodes],
  );

  useEffect(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear previous
    d3.select(svg).selectAll("*").remove();
    if (simulationRef.current) simulationRef.current.stop();

    const root = d3
      .select(svg)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    // Zoom layer
    const g = root.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    root.call(zoom);

    // Clone node data for simulation
    const simNodes: GraphNode[] = filteredNodes.map((n) => ({ ...n }));
    const simEdges: GraphEdge[] = filteredEdges.map((e) => ({
      source: typeof e.source === "string" ? e.source : (e.source as GraphNode).id,
      target: typeof e.target === "string" ? e.target : (e.target as GraphNode).id,
    }));

    // Draw edges
    const link = g
      .append("g")
      .attr("class", "edges")
      .selectAll("line")
      .data(simEdges)
      .enter()
      .append("line")
      .attr("stroke", "rgba(44,36,22,0.08)")
      .attr("stroke-width", 1);

    // Draw nodes
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(simNodes)
      .enter()
      .append("g")
      .attr("cursor", "pointer")
      .on("click", (_event, d) => {
        setSelected({
          name: d.name,
          type: d.type,
          links: d.links,
          path: d.path,
          clusterId: d.clusterId,
          isBridge: d.isBridge,
          isOrphan: d.isOrphan,
        });
      });

    node
      .append("circle")
      .attr("r", (d) => nodeRadius(d))
      .attr("fill", (d) => NODE_COLORS[d.type])
      .attr("stroke", (d) => (d.isBridge ? "#D4890A" : NODE_STROKE[d.type]))
      .attr("stroke-width", (d) => (d.isBridge ? 2 : 1))
      .attr("opacity", 0.85);

    // Hover tooltip label (SVG text, appears on hover)
    const label = node
      .append("text")
      .text((d) => d.name)
      .attr("font-family", "Georgia, serif")
      .attr("font-size", "10px")
      .attr("fill", "#2C2416")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => -nodeRadius(d) - 4)
      .attr("pointer-events", "none")
      .attr("opacity", 0);

    node
      .on("mouseenter", function (_event, d) {
        d3.select(this).select("text").attr("opacity", 1);
        d3.select(this).select("circle")
          .attr("opacity", 1)
          .attr("stroke-width", d.isBridge ? 3 : 2);
      })
      .on("mouseleave", function (_event, d) {
        d3.select(this).select("text").attr("opacity", 0);
        d3.select(this).select("circle")
          .attr("opacity", 0.85)
          .attr("stroke-width", d.isBridge ? 2 : 1);
      });

    // Drag
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

    // Force simulation
    const simulation = d3
      .forceSimulation<GraphNode>(simNodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphEdge>(simEdges)
          .id((d) => d.id)
          .distance(60)
          .strength(0.4),
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

    // Suppress label variable unused warning
    void label;

    return () => {
      simulation.stop();
    };
  }, [filteredNodes, filteredEdges, nodeRadius]);

  const allTypes: NodeType[] = ["concept", "person", "project", "recipe", "company", "place", "journal", "other"];
  const presentTypes = new Set(allNodes.map((n) => n.type));

  const toggleType = (type: NodeType) => {
    setFilters((prev) => {
      const next = new Set(prev.types);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return { ...prev, types: next };
    });
  };

  const toggleCluster = (id: number) => {
    setFilters((prev) => {
      const next = new Set(prev.clusters);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, clusters: next };
    });
  };

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

  return (
    <div className="flex gap-4" style={{ height: "calc(100vh - 240px)", minHeight: "520px" }}>
      {/* Graph canvas */}
      <div
        ref={containerRef}
        className="flex-1 border border-surface-border bg-cream rounded-lg overflow-hidden relative"
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ background: "transparent" }}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 pointer-events-none">
          <div className="flex items-center gap-2">
            <svg width="12" height="12">
              <circle cx="6" cy="6" r="5" fill="#D4890A" stroke="#a0670a" strokeWidth="2" />
            </svg>
            <span className="text-xs font-sans text-ink/50">bridge node</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-sans text-ink/40">size = connection count</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-sans text-ink/40">scroll to zoom · drag to pan</span>
          </div>
        </div>

        {filteredNodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-ink/40 font-sans">No nodes match current filters.</p>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-56 flex flex-col gap-4 shrink-0">
        {/* Node detail */}
        {selected ? (
          <div className="border border-surface-border bg-surface rounded-lg p-4">
            <p className="font-serif font-medium text-ink text-sm mb-1 break-words leading-snug">
              {selected.name}
            </p>
            <p className="text-xs text-ink/40 font-sans capitalize mb-3">{selected.type}</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-ink/50">Links</span>
                <span className="text-ink font-medium">{selected.links}</span>
              </div>
              {selected.clusterId !== null && (
                <div className="flex justify-between text-xs font-sans">
                  <span className="text-ink/50">Cluster</span>
                  <span className="text-ink font-medium">#{selected.clusterId}</span>
                </div>
              )}
              {selected.isBridge && (
                <div className="text-xs font-sans text-harvest font-medium mt-1">Bridge node</div>
              )}
              {selected.isOrphan && (
                <div className="text-xs font-sans text-ink/40 mt-1">Orphan</div>
              )}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="mt-3 text-xs text-ink/30 hover:text-ink/60 transition-colors font-sans"
            >
              dismiss
            </button>
          </div>
        ) : (
          <div className="border border-surface-border bg-surface rounded-lg p-4">
            <p className="text-xs text-ink/40 font-sans">Click a node to inspect it.</p>
          </div>
        )}

        {/* Filter panel */}
        <div className="border border-surface-border bg-surface rounded-lg p-4 flex-1 overflow-y-auto">
          <p className="text-ink/40 text-xs tracking-[0.15em] uppercase font-sans mb-3">Filter</p>

          {/* Type filters */}
          <p className="text-xs text-ink/40 font-sans mb-2">Type</p>
          <div className="space-y-1.5 mb-4">
            {allTypes.filter((t) => presentTypes.has(t)).map((type) => {
              const active = filters.types.has(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={[
                    "flex items-center gap-2 w-full text-left text-xs font-sans transition-opacity",
                    active ? "opacity-100" : "opacity-30",
                  ].join(" ")}
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: NODE_COLORS[type] }}
                  />
                  <span className="text-ink">{TYPE_LABELS[type]}</span>
                </button>
              );
            })}
          </div>

          {/* Cluster filters */}
          {data.clusters.length > 1 && (
            <>
              <p className="text-xs text-ink/40 font-sans mb-2">Cluster</p>
              <div className="space-y-1.5 mb-4">
                {data.clusters.map((cluster) => {
                  const active = filters.clusters.has(cluster.id);
                  return (
                    <button
                      key={cluster.id}
                      onClick={() => toggleCluster(cluster.id)}
                      className={[
                        "flex items-center justify-between w-full text-xs font-sans transition-opacity",
                        active ? "opacity-100" : "opacity-30",
                      ].join(" ")}
                    >
                      <span className="text-ink">#{cluster.id}</span>
                      <span className="text-ink/40">{cluster.size} notes</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Special filters */}
          <div className="space-y-1.5">
            <button
              onClick={() => setFilters((prev) => ({ ...prev, showBridgesOnly: !prev.showBridgesOnly, showOrphansOnly: false }))}
              className={[
                "flex items-center gap-2 w-full text-left text-xs font-sans transition-opacity",
                filters.showBridgesOnly ? "opacity-100" : "opacity-50 hover:opacity-80",
              ].join(" ")}
            >
              <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0 border-2 border-harvest bg-transparent" />
              <span className="text-ink">Bridges only</span>
            </button>
          </div>

          {/* Stats summary */}
          <div className="mt-4 pt-4 border-t border-surface-border space-y-1">
            <div className="flex justify-between text-xs font-sans">
              <span className="text-ink/40">Showing</span>
              <span className="text-ink">{filteredNodes.length} nodes</span>
            </div>
            <div className="flex justify-between text-xs font-sans">
              <span className="text-ink/40">Edges</span>
              <span className="text-ink">{filteredEdges.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
