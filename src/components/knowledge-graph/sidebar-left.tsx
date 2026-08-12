"use client";
import * as React from "react";
import { Filter } from "lucide-react";
import { KGSearchBar } from "./search-bar";
import { KGCard, KGCardBody, KGCardHeader, KGPill, KGTag } from "./primitives";
import type { ParsedTaxonomy, SearchHit, TaxonomyNode } from "@/lib/kg/types";
export function SidebarLeft({
  query,
  setQuery,
  hits,
  parsed,
  selectedId,
  onPick,
  sectorFilter,
  setSectorFilter,
}: {
  query: string;
  setQuery: (value: string) => void;
  hits: SearchHit[];
  parsed: ParsedTaxonomy;
  selectedId: string | null;
  onPick: (node: TaxonomyNode) => void;
  sectorFilter: string | null;
  setSectorFilter: (id: string | null) => void;
}) {
  const selected = selectedId ? (parsed.nodes.get(selectedId) ?? null) : null;
  const sectors = React.useMemo(
    () => parsed.sectorIds.map((id) => parsed.nodes.get(id)!).filter(Boolean),
    [parsed],
  );
  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col gap-3 border-r border-[var(--border)] bg-[var(--background)] p-3">
      <KGSearchBar
        value={query}
        onChange={setQuery}
        hits={hits}
        onPick={onPick}
      />
      <KGCard>
        <KGCardHeader className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Filter size={12} />
            Sectors
          </span>
          {sectorFilter && (
            <button
              onClick={() => setSectorFilter(null)}
              className="text-[10px] text-[var(--primary)] hover:underline"
            >
              clear
            </button>
          )}
        </KGCardHeader>
        <KGCardBody className="scroll-thin max-h-[240px] overflow-auto">
          <div className="flex flex-col gap-1">
            {sectors.map((sector) => (
              <KGPill
                key={sector.id}
                active={sectorFilter === sector.id || selectedId === sector.id}
                onClick={() => {
                  setSectorFilter(
                    sector.id === sectorFilter ? null : sector.id,
                  );
                  onPick(sector);
                }}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate">{sector.label}</span>
                  <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">
                    {parsed.subsectorsBySector.get(sector.id)?.length ?? 0}
                  </span>
                </span>
              </KGPill>
            ))}
          </div>
        </KGCardBody>
      </KGCard>
      <KGCard className="min-h-0 flex-1">
        <KGCardHeader>Selected node</KGCardHeader>
        <KGCardBody>
          {selected ? (
            <div className="space-y-3">
              <div>
                <div className="text-base font-semibold text-[var(--foreground)]">
                  {selected.label}
                </div>
                <div className="mt-1 flex gap-1.5">
                  <KGTag
                    kind={selected.type === "sector" ? "sector" : "subsector"}
                  >
                    {selected.type}
                  </KGTag>
                  {selected.parentId && (
                    <KGTag kind="neutral">
                      under {parsed.nodes.get(selected.parentId)?.label}
                    </KGTag>
                  )}
                </div>
              </div>
              <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                Selection drives the graph, relationships, and intervention
                combinations on the right. Click any node in the graph to
                re-center.
              </p>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              Search for a sector or subsector to begin.
            </p>
          )}
        </KGCardBody>
      </KGCard>
    </aside>
  );
}
