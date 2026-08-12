"use client";
import { Sparkles } from "lucide-react";
import { KGCard, KGCardBody, KGCardHeader, KGTag } from "./primitives";
import type {
  CombinationResult,
  RelationshipResult,
  TaxonomyNode,
} from "@/lib/kg/types";
import { combinationLabel } from "@/lib/kg/combination-engine";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        {title}
      </div>
      {children}
    </div>
  );
}
function Chip({
  node,
  kind,
  onPick,
}: {
  node: TaxonomyNode;
  kind: "sector" | "subsector";
  onPick: (node: TaxonomyNode) => void;
}) {
  return (
    <button
      onClick={() => onPick(node)}
      className="group inline-flex max-w-full items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--muted)]/50 px-2 py-1 text-left text-xs text-[var(--foreground)] transition hover:border-violet-500/40 hover:bg-violet-500/10"
    >
      <KGTag kind={kind} className="!py-0">
        {kind}
      </KGTag>
      <span className="truncate">{node.label}</span>
    </button>
  );
}
function ChipRow({
  nodes,
  kind,
  onPick,
}: {
  nodes: TaxonomyNode[];
  kind: "sector" | "subsector";
  onPick: (node: TaxonomyNode) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {nodes.map((node) => (
        <Chip key={node.id} node={node} kind={kind} onPick={onPick} />
      ))}
    </div>
  );
}
export function RelationshipPanel({
  relationships,
  onPick,
}: {
  relationships: RelationshipResult | null;
  onPick: (node: TaxonomyNode) => void;
}) {
  if (!relationships) return null;
  const { parent, siblings, relatedSectors, relatedSubsectors } = relationships;
  if (
    !parent &&
    !siblings.length &&
    !relatedSectors.length &&
    !relatedSubsectors.length
  )
    return null;
  return (
    <KGCard>
      <KGCardHeader>Relationships</KGCardHeader>
      <KGCardBody className="space-y-3">
        {parent && (
          <Section title="Parent sector">
            <Chip node={parent} kind="sector" onPick={onPick} />
          </Section>
        )}
        {siblings.length > 0 && (
          <Section title="Sibling subsectors">
            <ChipRow nodes={siblings} kind="subsector" onPick={onPick} />
          </Section>
        )}
        {relatedSectors.length > 0 && (
          <Section title="Related sectors">
            <ChipRow nodes={relatedSectors} kind="sector" onPick={onPick} />
          </Section>
        )}
        {relatedSubsectors.length > 0 && (
          <Section title="Related subsectors (cross-sector)">
            <ChipRow
              nodes={relatedSubsectors}
              kind="subsector"
              onPick={onPick}
            />
          </Section>
        )}
      </KGCardBody>
    </KGCard>
  );
}
function ComboGroup({
  title,
  combos,
}: {
  title: string;
  combos: TaxonomyNode[][];
}) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        {title}
        <span className="ml-2">{combos.length}</span>
      </div>
      {combos.length === 0 ? (
        <div className="text-xs italic text-[var(--muted-foreground)]">
          No combinations available — pick a node with related sectors.
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {combos.map((combo, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-md border border-amber-400/30 bg-amber-500/[0.06] px-2.5 py-1.5 text-[12px] text-amber-800"
            >
              <span className="text-amber-600">×{combo.length}</span>
              <span className="truncate">{combinationLabel(combo)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export function CombinationPanel({
  combinations,
}: {
  combinations: CombinationResult | null;
}) {
  if (!combinations) return null;
  return (
    <KGCard>
      <KGCardHeader className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Sparkles size={12} className="text-amber-600" />
          Intervention combinations
        </span>
        <span className="text-[10px] text-[var(--muted-foreground)]">
          {combinations.pairs.length + combinations.triples.length} generated
        </span>
      </KGCardHeader>
      <KGCardBody className="space-y-3">
        <ComboGroup title="Pairs" combos={combinations.pairs} />
        <ComboGroup title="Triples" combos={combinations.triples} />
      </KGCardBody>
    </KGCard>
  );
}
export function StatsPanel({
  totalSectors,
  totalSubsectors,
  graphNodeCount,
  graphEdgeCount,
  selectedLabel,
  combinationCount,
}: {
  totalSectors: number;
  totalSubsectors: number;
  graphNodeCount: number;
  graphEdgeCount: number;
  selectedLabel: string | null;
  combinationCount: number;
}) {
  const stats: [string, string | number][] = [
    ["Total sectors", totalSectors],
    ["Total subsectors", totalSubsectors.toLocaleString()],
    ["Graph nodes", graphNodeCount],
    ["Graph edges", graphEdgeCount],
    ["Combinations", combinationCount],
    ["Selected", selectedLabel ?? "—"],
  ];
  return (
    <KGCard>
      <KGCardHeader>Statistics</KGCardHeader>
      <KGCardBody>
        <dl className="grid grid-cols-2 gap-2">
          {stats.map(([key, value]) => (
            <div
              key={key}
              className="rounded-md border border-[var(--border)] bg-[var(--muted)]/50 px-2.5 py-1.5"
            >
              <dt className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                {key}
              </dt>
              <dd className="mt-0.5 truncate text-sm font-medium text-[var(--foreground)]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </KGCardBody>
    </KGCard>
  );
}
export function SidebarRight({
  relationships,
  combinations,
  graphNodeCount,
  graphEdgeCount,
  totalSectors,
  totalSubsectors,
  onPick,
}: {
  relationships: RelationshipResult | null;
  combinations: CombinationResult | null;
  graphNodeCount: number;
  graphEdgeCount: number;
  totalSectors: number;
  totalSubsectors: number;
  onPick: (node: TaxonomyNode) => void;
}) {
  const count =
    (combinations?.pairs.length ?? 0) + (combinations?.triples.length ?? 0);
  return (
    <aside className="scroll-thin flex h-full w-[380px] shrink-0 flex-col gap-3 overflow-auto border-l border-[var(--border)] bg-[var(--background)] p-3">
      <StatsPanel
        totalSectors={totalSectors}
        totalSubsectors={totalSubsectors}
        graphNodeCount={graphNodeCount}
        graphEdgeCount={graphEdgeCount}
        combinationCount={count}
        selectedLabel={relationships?.selected.label ?? null}
      />
      {relationships ? (
        <RelationshipPanel relationships={relationships} onPick={onPick} />
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/50 p-4 text-sm text-[var(--muted-foreground)]">
          Pick a sector or subsector from the left panel — or search — to
          populate relationships and intervention combinations here.
        </div>
      )}
      {combinations && <CombinationPanel combinations={combinations} />}
    </aside>
  );
}
