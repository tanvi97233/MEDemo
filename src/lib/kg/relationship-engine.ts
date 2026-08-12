import type { ParsedTaxonomy, RelationshipResult, TaxonomyNode } from "./types";
import type { SearchIndex } from "./search-engine";
function overlap(a: Set<string>, b: Set<string>) {
  let value = 0;
  for (const token of a) if (b.has(token)) value++;
  return value;
}
export function resolveRelationships(
  parsed: ParsedTaxonomy,
  index: SearchIndex,
  selectedId: string,
): RelationshipResult | null {
  const selected = parsed.nodes.get(selectedId);
  if (!selected) return null;
  const selectedTokens = index.tokens.get(selectedId) ?? new Set<string>();
  const parentId =
    selected.type === "subsector" ? parsed.parentOf.get(selectedId) : undefined;
  const parent = parentId ? parsed.nodes.get(parentId) : undefined;
  let siblings: TaxonomyNode[] = [];
  if (parentId)
    siblings = (parsed.subsectorsBySector.get(parentId) ?? [])
      .filter((id) => id !== selectedId)
      .map((id) => ({
        node: parsed.nodes.get(id)!,
        score: overlap(selectedTokens, index.tokens.get(id) ?? new Set()),
      }))
      .sort(
        (a, b) => b.score - a.score || a.node.label.localeCompare(b.node.label),
      )
      .slice(0, 10)
      .map((item) => item.node);
  else if (selected.type === "sector")
    siblings = (parsed.subsectorsBySector.get(selectedId) ?? [])
      .slice(0, 10)
      .map((id) => parsed.nodes.get(id)!)
      .filter(Boolean);
  const relatedSectors = parsed.sectorIds
    .filter((id) => id !== parentId && id !== selectedId)
    .map((id) => ({
      node: parsed.nodes.get(id)!,
      score: overlap(selectedTokens, index.tokens.get(id) ?? new Set()),
    }))
    .sort(
      (a, b) => b.score - a.score || a.node.label.localeCompare(b.node.label),
    )
    .slice(0, 8)
    .map((item) => item.node);
  const ownSiblings = new Set(
    parentId ? (parsed.subsectorsBySector.get(parentId) ?? []) : [],
  );
  const candidates: { node: TaxonomyNode; score: number }[] = [];
  if (selectedTokens.size)
    for (const node of parsed.nodes.values()) {
      if (
        node.type !== "subsector" ||
        node.id === selectedId ||
        ownSiblings.has(node.id)
      )
        continue;
      const score = overlap(
        selectedTokens,
        index.tokens.get(node.id) ?? new Set(),
      );
      if (score > 0) candidates.push({ node, score });
    }
  const relatedSubsectors = candidates
    .sort(
      (a, b) => b.score - a.score || a.node.label.localeCompare(b.node.label),
    )
    .slice(0, 12)
    .map((item) => item.node);
  return { selected, parent, siblings, relatedSectors, relatedSubsectors };
}
