import type {
  CombinationResult,
  GraphPayload,
  RelationshipResult,
} from "./types";
import { combinationId, combinationLabel } from "./combination-engine";
export function buildGraph(
  relationships: RelationshipResult,
  combinations: CombinationResult,
): GraphPayload {
  const nodes: GraphPayload["nodes"] = [];
  const edges: GraphPayload["edges"] = [];
  const seen = new Set<string>();
  const pushNode = (
    id: string,
    label: string,
    kind: "sector" | "subsector" | "combination" | "selected",
    position: { x: number; y: number },
    members?: string[],
  ) => {
    if (seen.has(id)) return;
    seen.add(id);
    nodes.push({
      id,
      type: "graphNode",
      position,
      data: { label, kind, selected: kind === "selected", members },
    });
  };
  const pushEdge = (
    source: string,
    target: string,
    type: "belongs_to" | "related_to" | "combines_with",
    animated = false,
  ) =>
    edges.push({
      id: `${type}:${source}->${target}`,
      source,
      target,
      type,
      animated,
    });
  const { selected, parent, siblings, relatedSectors } = relationships;
  pushNode(selected.id, selected.label, "selected", { x: 0, y: 0 });
  if (parent) {
    pushNode(parent.id, parent.label, "sector", { x: 0, y: -260 });
    pushEdge(selected.id, parent.id, "belongs_to", true);
  }
  siblings.forEach((sibling, index) => {
    const angle =
      siblings.length === 1
        ? -Math.PI / 2
        : -Math.PI + (index / (siblings.length - 1)) * Math.PI;
    pushNode(sibling.id, sibling.label, "subsector", {
      x: Math.cos(angle) * 220,
      y: Math.sin(angle) * 220,
    });
    pushEdge(selected.id, sibling.id, "related_to");
    if (parent) pushEdge(parent.id, sibling.id, "belongs_to");
  });
  relatedSectors.forEach((sector, index) => {
    const angle =
      (index / Math.max(relatedSectors.length, 1)) * Math.PI * 2 - Math.PI / 2;
    pushNode(sector.id, sector.label, "sector", {
      x: Math.cos(angle) * 420,
      y: Math.sin(angle) * 420,
    });
    pushEdge(selected.id, sector.id, "related_to", true);
  });
  const all = [...combinations.pairs, ...combinations.triples];
  all.forEach((combo, index) => {
    const id = combinationId(combo);
    const angle = (index / Math.max(all.length, 1)) * Math.PI * 2 - Math.PI / 2;
    pushNode(
      id,
      combinationLabel(combo),
      "combination",
      { x: Math.cos(angle) * 680, y: Math.sin(angle) * 680 },
      combo.map((node) => node.id),
    );
    for (const member of combo)
      if (seen.has(member.id)) pushEdge(member.id, id, "combines_with");
  });
  return { nodes, edges };
}
