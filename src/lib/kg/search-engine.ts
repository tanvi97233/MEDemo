import type { ParsedTaxonomy, SearchHit, TaxonomyNode } from "./types";
const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "of",
  "and",
  "or",
  "for",
  "to",
  "in",
  "on",
  "at",
  "with",
  "by",
  "from",
  "as",
  "is",
  "are",
]);
export function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}
export interface SearchIndex {
  items: TaxonomyNode[];
  lower: Map<string, string>;
  tokens: Map<string, Set<string>>;
}
export function buildSearchIndex(parsed: ParsedTaxonomy): SearchIndex {
  const items: TaxonomyNode[] = [];
  const lower = new Map<string, string>();
  const tokens = new Map<string, Set<string>>();
  for (const node of parsed.nodes.values()) {
    items.push(node);
    lower.set(node.id, node.label.toLowerCase());
    tokens.set(node.id, new Set(tokenize(node.label)));
  }
  return { items, lower, tokens };
}
export function searchNodes(
  index: SearchIndex,
  query: string,
  limit = 12,
): SearchHit[] {
  const value = query.trim().toLowerCase();
  if (!value) return [];
  const queryTokens = tokenize(value);
  const hits: SearchHit[] = [];
  for (const node of index.items) {
    const label = index.lower.get(node.id)!;
    let score =
      label === value
        ? 100
        : label.startsWith(value)
          ? 50
          : label.includes(value)
            ? 25
            : 0;
    const nodeTokens = index.tokens.get(node.id)!;
    for (const token of queryTokens) if (nodeTokens.has(token)) score += 8;
    if (score > 0)
      hits.push({ node, score: score + (node.type === "subsector" ? 2 : 0) });
  }
  return hits
    .sort(
      (a, b) => b.score - a.score || a.node.label.localeCompare(b.node.label),
    )
    .slice(0, limit);
}
