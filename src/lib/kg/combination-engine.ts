import type {
  CombinationResult,
  RelationshipResult,
  TaxonomyNode,
} from "./types";
export function generateCombinations(
  relationships: RelationshipResult,
): CombinationResult {
  const pool = relationships.relatedSectors.slice(0, 6);
  const pairs = pool
    .slice(0, 8)
    .map((sector) => [relationships.selected, sector]);
  const triples: TaxonomyNode[][] = [];
  outer: for (let i = 0; i < pool.length; i++)
    for (let j = i + 1; j < pool.length; j++) {
      triples.push([relationships.selected, pool[i], pool[j]]);
      if (triples.length >= 8) break outer;
    }
  return { pairs, triples };
}
export const combinationLabel = (combo: TaxonomyNode[]) =>
  combo.map((node) => node.label).join("  +  ");
export const combinationId = (combo: TaxonomyNode[]) =>
  `combo:${combo.map((node) => node.id).join("|")}`;
