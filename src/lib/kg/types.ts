export type RawTaxonomy = Record<string, string[]>;
export type NodeKind = "sector" | "subsector" | "combination";
export interface TaxonomyNode {
  id: string;
  label: string;
  type: NodeKind;
  parentId?: string;
  memberIds?: string[];
}
export type EdgeKind = "belongs_to" | "related_to" | "combines_with";
export interface ParsedTaxonomy {
  nodes: Map<string, TaxonomyNode>;
  sectorIds: string[];
  subsectorsBySector: Map<string, string[]>;
  parentOf: Map<string, string>;
  labelById: Map<string, string>;
}
export interface RelationshipResult {
  selected: TaxonomyNode;
  parent?: TaxonomyNode;
  siblings: TaxonomyNode[];
  relatedSectors: TaxonomyNode[];
  relatedSubsectors: TaxonomyNode[];
}
export interface CombinationResult {
  pairs: TaxonomyNode[][];
  triples: TaxonomyNode[][];
}
export interface SearchHit {
  node: TaxonomyNode;
  score: number;
}
export interface GraphPayload {
  nodes: {
    id: string;
    type: "graphNode";
    position: { x: number; y: number };
    data: {
      label: string;
      kind: NodeKind | "selected";
      selected?: boolean;
      members?: string[];
    };
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    type: EdgeKind;
    animated?: boolean;
  }[];
}
