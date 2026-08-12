import type { ParsedTaxonomy, RawTaxonomy, TaxonomyNode } from "./types";
export function toId(scope: "sector" | "subsector", label: string) {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${scope}:${slug}`;
}
export function parseTaxonomy(raw: RawTaxonomy): ParsedTaxonomy {
  const nodes = new Map<string, TaxonomyNode>();
  const sectorIds: string[] = [];
  const subsectorsBySector = new Map<string, string[]>();
  const parentOf = new Map<string, string>();
  const labelById = new Map<string, string>();
  for (const [sectorRaw, subs] of Object.entries(raw)) {
    const sectorLabel = sectorRaw.trim();
    const sectorId = toId("sector", sectorLabel);
    if (!nodes.has(sectorId)) {
      nodes.set(sectorId, { id: sectorId, label: sectorLabel, type: "sector" });
      sectorIds.push(sectorId);
      labelById.set(sectorId, sectorLabel);
      subsectorsBySector.set(sectorId, []);
    }
    const list = subsectorsBySector.get(sectorId)!;
    for (const rawLabel of subs ?? []) {
      const label = rawLabel.trim();
      if (!label) continue;
      const id = toId("subsector", `${sectorLabel}__${label}`);
      if (!nodes.has(id)) {
        nodes.set(id, { id, label, type: "subsector", parentId: sectorId });
        labelById.set(id, label);
        list.push(id);
        parentOf.set(id, sectorId);
      }
    }
  }
  return { nodes, sectorIds, subsectorsBySector, parentOf, labelById };
}
export function statsFor(parsed: ParsedTaxonomy) {
  const totalSubsectors = Array.from(parsed.subsectorsBySector.values()).reduce(
    (sum, values) => sum + values.length,
    0,
  );
  return {
    totalSectors: parsed.sectorIds.length,
    totalSubsectors,
    totalNodes: parsed.nodes.size,
  };
}
