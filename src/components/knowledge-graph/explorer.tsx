"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import taxonomyRaw from "@/data/taxonomy.json";
import { SidebarLeft } from "./sidebar-left";
import { SidebarRight } from "./panels";
import { parseTaxonomy, statsFor } from "@/lib/kg/taxonomy-parser";
import { buildSearchIndex, searchNodes } from "@/lib/kg/search-engine";
import { resolveRelationships } from "@/lib/kg/relationship-engine";
import { generateCombinations } from "@/lib/kg/combination-engine";
import { buildGraph } from "@/lib/kg/graph-builder";
import type { RawTaxonomy, TaxonomyNode } from "@/lib/kg/types";
const GraphView = dynamic(
  () => import("./graph-view").then((module) => module.GraphView),
  { ssr: false },
);

export function DataNexusTaxonomyExplorer() {
  const parsed = React.useMemo(
    () => parseTaxonomy(taxonomyRaw as RawTaxonomy),
    [],
  );
  const index = React.useMemo(() => buildSearchIndex(parsed), [parsed]);
  const stats = React.useMemo(() => statsFor(parsed), [parsed]);
  const defaultSelectedId = React.useMemo(() => {
    for (const node of parsed.nodes.values())
      if (node.label.toLowerCase() === "primary education") return node.id;
    return parsed.sectorIds[0] ?? null;
  }, [parsed]);
  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(
    defaultSelectedId,
  );
  const [sectorFilter, setSectorFilter] = React.useState<string | null>(null);
  const hits = React.useMemo(
    () => searchNodes(index, query, 12),
    [index, query],
  );
  const relationships = React.useMemo(
    () => (selectedId ? resolveRelationships(parsed, index, selectedId) : null),
    [parsed, index, selectedId],
  );
  const combinations = React.useMemo(
    () => (relationships ? generateCombinations(relationships) : null),
    [relationships],
  );
  const graph = React.useMemo(
    () =>
      relationships && combinations
        ? buildGraph(relationships, combinations)
        : { nodes: [], edges: [] },
    [relationships, combinations],
  );
  const pick = React.useCallback(
    (node: TaxonomyNode) => setSelectedId(node.id),
    [],
  );
  const graphPick = React.useCallback(
    (id: string) => {
      if (id.startsWith("combo:")) return;
      const node = parsed.nodes.get(id);
      if (node) setSelectedId(node.id);
    },
    [parsed],
  );
  return (
    <div className="flex h-[760px] min-w-[1050px] flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <SidebarLeft
        query={query}
        setQuery={setQuery}
        hits={hits}
        parsed={parsed}
        selectedId={selectedId}
        onPick={pick}
        sectorFilter={sectorFilter}
        setSectorFilter={setSectorFilter}
      />
      <main className="relative min-w-[420px] flex-1 overflow-hidden">
        <GraphView payload={graph} onNodeClick={graphPick} />
        {!selectedId && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/80 px-4 py-3 text-sm text-[var(--muted-foreground)]">
              Search for a sector or subsector to render the graph.
            </div>
          </div>
        )}
      </main>
      <SidebarRight
        relationships={relationships}
        combinations={combinations}
        graphNodeCount={graph.nodes.length}
        graphEdgeCount={graph.edges.length}
        totalSectors={stats.totalSectors}
        totalSubsectors={stats.totalSubsectors}
        onPick={pick}
      />
    </div>
  );
}
