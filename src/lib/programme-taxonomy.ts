import "server-only";

import { z } from "zod";
import taxonomyJson from "@/data/taxonomy.json";

const taxonomy = taxonomyJson as Record<string, string[]>;
const sectors = Object.keys(taxonomy);

export const derivedTaxonomySchema = z.object({
  suggestedSectors: z.array(z.string()).min(1).max(3),
  suggestedSubsectors: z
    .array(
      z.object({
        sector: z.string(),
        name: z.string(),
      }),
    )
    .max(8),
  confidenceNotes: z.string(),
  source: z.enum(["AI_GROQ", "DEMO_GENERATED"]),
});

export type DerivedTaxonomy = z.infer<typeof derivedTaxonomySchema>;
export type TaxonomySelection = Pick<
  DerivedTaxonomy,
  "suggestedSectors" | "suggestedSubsectors"
>;

const normalize = (value: string) =>
  value.toLowerCase().trim().replace(/\s+/g, " ");

const words = (value: string) =>
  new Set(
    normalize(value)
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3),
  );

const sectorByNormalized = new Map(
  sectors.map((sector) => [normalize(sector), sector]),
);

const parentPairs = new Map<string, { sector: string; name: string }[]>();
for (const [sector, children] of Object.entries(taxonomy)) {
  for (const name of children) {
    const key = normalize(name);
    const pairs = parentPairs.get(key) ?? [];
    pairs.push({ sector, name });
    parentPairs.set(key, pairs);
  }
}

const sectorCues: Record<string, RegExp> = {
  Education:
    /(educat|school|literac|learn|teacher|student|classroom|scholarship)/i,
  "Health Care":
    /(health|clinic|hospital|medical|maternal|pregnan|antenatal|vaccin|disease)/i,
  Malnutrition: /(nutrition|malnutrition|stunting|wasting|undernourish)/i,
  "Gender Equality":
    /(gender|women|girl|female|empower|domestic violence|equality)/i,
  "Environmental Sustainability":
    /(environment|climate|forest|waste|renewable|conservation|biodivers)/i,
  "Rural Development Projects":
    /(rural|livelihood|farmer|agricultur|village|self.help|income)/i,
  "Socio-Economic Inequalities":
    /(livelihood|employ|skill|vocational|income|enterprise|inequal)/i,
  Poverty: /(poverty|ultra.poor|economic vulnerability)/i,
  Sanitation: /(sanitation|toilet|hygiene|wash)/i,
  "Safe Drinking Water": /(drinking water|clean water|water access)/i,
  "Training To Promote Sports": /(sport|athlet|physical education)/i,
  "Art And Culture": /(art|culture|heritage|museum|music|craft)/i,
  "Animal Welfare": /(animal|veterinary|livestock welfare)/i,
  "Technology Incubators": /(technology|digital|incubat|startup|innovation)/i,
};

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function rankSectors(text: string, limit = 2) {
  const sourceWords = words(text);
  const ranked = sectors
    .map((sector) => {
      let score = sectorCues[sector]?.test(text) ? 25 : 0;
      for (const word of words(sector)) if (sourceWords.has(word)) score += 8;

      // Cap child-label evidence so very large taxonomy branches do not win
      // simply because they contain more terms.
      const childScores = (taxonomy[sector] ?? [])
        .map((child) => {
          let childScore = 0;
          for (const word of words(child)) {
            if (sourceWords.has(word)) childScore += 1;
          }
          return childScore;
        })
        .sort((a, b) => b - a)
        .slice(0, 8);
      score += childScores.reduce((sum, value) => sum + value, 0);
      return { sector, score };
    })
    .sort((a, b) => b.score - a.score || a.sector.localeCompare(b.sector));

  const matched = ranked
    .filter((item) => item.score > 0)
    .slice(0, limit)
    .map((item) => item.sector);
  return matched.length ? matched : ["Socio-Economic Inequalities"];
}

function resolveSubsector(
  suggestion: string,
  selectedSectors: string[],
): { sector: string; name: string } | undefined {
  const allowed = new Set(selectedSectors);
  return (parentPairs.get(normalize(suggestion)) ?? []).find((pair) =>
    allowed.has(pair.sector),
  );
}

function rankSubsectors(text: string, selectedSectors: string[], limit = 6) {
  const sourceWords = words(text);
  const candidates = selectedSectors.flatMap((sector) =>
    (taxonomy[sector] ?? []).map((name) => ({ sector, name })),
  );
  const documentFrequency = new Map<string, number>();
  for (const candidate of candidates) {
    for (const word of words(candidate.name)) {
      documentFrequency.set(word, (documentFrequency.get(word) ?? 0) + 1);
    }
  }
  const ranked: { sector: string; name: string; score: number }[] = [];
  for (const { sector, name } of candidates) {
    let score = 0;
    const candidateWords = words(name);
    const normalizedName = normalize(name);
    if (normalize(text).includes(normalizedName) && normalizedName.length > 4)
      score += 12;
    for (const word of candidateWords) {
      if (!sourceWords.has(word)) continue;
      const frequency = documentFrequency.get(word) ?? 1;
      score += 1 + Math.log((candidates.length + 1) / (frequency + 1));
    }
    score /= Math.sqrt(Math.max(1, candidateWords.size));
    if (score > 0) ranked.push({ sector, name, score });
  }
  ranked.sort((a, b) => b.score - a.score || a.name.length - b.name.length);
  const seen = new Set<string>();
  const result = [];
  for (const item of ranked) {
    const key = `${item.sector}\u0000${item.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ sector: item.sector, name: item.name });
    if (result.length >= limit) break;
  }
  if (result.length) return result;
  return selectedSectors.flatMap((sector) =>
    (taxonomy[sector] ?? []).slice(0, 2).map((name) => ({ sector, name })),
  );
}

function sanitize(
  input: {
    suggestedSectors?: unknown;
    suggestedSubsectors?: unknown;
    confidenceNotes?: unknown;
  },
  text: string,
  source: DerivedTaxonomy["source"],
): DerivedTaxonomy {
  const suggestedSectorValues = Array.isArray(input.suggestedSectors)
    ? input.suggestedSectors
    : [];
  let suggestedSectors = unique(
    suggestedSectorValues
      .filter((value): value is string => typeof value === "string")
      .map((value) => sectorByNormalized.get(normalize(value)))
      .filter((value): value is string => Boolean(value)),
  ).slice(0, 3);
  if (!suggestedSectors.length) suggestedSectors = rankSectors(text);

  const rawSubsectors = Array.isArray(input.suggestedSubsectors)
    ? input.suggestedSubsectors.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const resolved = rawSubsectors
    .map((value) => resolveSubsector(value, suggestedSectors))
    .filter((value): value is { sector: string; name: string } =>
      Boolean(value),
    );
  // Exact AI labels remain useful evidence, but ranking stays grounded in the
  // submitted programme text. This prevents generic AI suggestions such as a
  // disability-specific employment label from entering an unrelated programme.
  void resolved;
  const groundedRanking = rankSubsectors(text, suggestedSectors, 8);
  const deduped = groundedRanking.slice(0, 8);

  return derivedTaxonomySchema.parse({
    suggestedSectors,
    suggestedSubsectors: deduped,
    confidenceNotes:
      typeof input.confidenceNotes === "string" && input.confidenceNotes.trim()
        ? input.confidenceNotes.trim()
        : source === "AI_GROQ"
          ? "AI suggestions were matched back to exact EvalCanvas taxonomy entries. Review before continuing."
          : "Matched deterministically against the EvalCanvas taxonomy. Review and adjust before continuing.",
    source,
  });
}

async function deriveWithGroq(text: string, apiKey: string) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You classify NGO programmes. Return valid JSON only. Use exact sector names from the supplied fixed taxonomy. Suggest specific sub-sector phrases; they will be resolved to canonical taxonomy entries.",
          },
          {
            role: "user",
            content: `Classify this NGO programme into 1-3 sectors and 3-8 sub-sectors.\n\nAvailable sectors:\n${sectors.join(", ")}\n\nReturn exactly: {"suggestedSectors": string[], "suggestedSubsectors": string[], "confidenceNotes": string}.\n\nPROGRAMME:\n${text.slice(0, 24000)}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
      cache: "no-store",
    },
  );
  if (!response.ok)
    throw new Error(`Groq taxonomy request failed (${response.status})`);
  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned no taxonomy classification");
  const initial = sanitize(JSON.parse(content), text, "AI_GROQ");
  const candidates = rankSubsectors(text, initial.suggestedSectors, 100);
  if (candidates.length < 3) return initial;

  try {
    const refinementResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "Select only genuinely relevant NGO programme taxonomy entries. Return valid JSON only and copy sector/name values exactly from the candidate list. Do not infer populations or interventions absent from the programme.",
            },
            {
              role: "user",
              content: `Choose 3-8 of the most relevant canonical sub-sectors for this programme. Reject candidates that merely share a generic word such as rural, income, support, health, or access but introduce an unstated intervention or population. Return exactly {"selected":[{"sector":string,"name":string}]}.\n\nPROGRAMME:\n${text.slice(0, 16000)}\n\nCANDIDATES:\n${candidates.map((item) => `${item.sector} :: ${item.name}`).join("\n")}`,
            },
          ],
        }),
        signal: AbortSignal.timeout(30000),
        cache: "no-store",
      },
    );
    if (!refinementResponse.ok) return initial;
    const refinementPayload = (await refinementResponse.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const refinementContent = refinementPayload.choices?.[0]?.message?.content;
    if (!refinementContent) return initial;
    const parsed = JSON.parse(refinementContent) as { selected?: unknown };
    if (!Array.isArray(parsed.selected)) return initial;
    const candidateMap = new Map(
      candidates.map((item) => [
        `${normalize(item.sector)}\u0000${normalize(item.name)}`,
        item,
      ]),
    );
    const selected = Array.from(
      new Map(
        parsed.selected
          .filter(
            (value): value is { sector: string; name: string } =>
              Boolean(value) &&
              typeof value === "object" &&
              typeof (value as { sector?: unknown }).sector === "string" &&
              typeof (value as { name?: unknown }).name === "string",
          )
          .map((item) =>
            candidateMap.get(
              `${normalize(item.sector)}\u0000${normalize(item.name)}`,
            ),
          )
          .filter((item): item is { sector: string; name: string } =>
            Boolean(item),
          )
          .map((item) => [`${item.sector}\u0000${item.name}`, item]),
      ).values(),
    ).slice(0, 8);
    return selected.length >= 3
      ? { ...initial, suggestedSubsectors: selected }
      : initial;
  } catch {
    return initial;
  }
}

export async function deriveProgrammeTaxonomy(
  text: string,
): Promise<DerivedTaxonomy> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (apiKey) {
    try {
      return await deriveWithGroq(text, apiKey);
    } catch (error) {
      console.error(
        "Groq taxonomy derivation failed; using deterministic matching.",
        error instanceof Error ? error.message : "Unknown provider error",
      );
    }
  }
  return sanitize({}, text, "DEMO_GENERATED");
}

export function validateTaxonomySelection(
  sectorsInput: unknown,
  subsectorsInput: unknown,
): TaxonomySelection | null {
  if (!Array.isArray(sectorsInput) || !Array.isArray(subsectorsInput))
    return null;
  const suggestedSectors = unique(
    sectorsInput
      .filter((value): value is string => typeof value === "string")
      .map((value) => sectorByNormalized.get(normalize(value)))
      .filter((value): value is string => Boolean(value)),
  );
  if (!suggestedSectors.length) return null;
  const allowed = new Set(suggestedSectors);
  const suggestedSubsectors = subsectorsInput
    .filter(
      (value): value is { sector: string; name: string } =>
        Boolean(value) &&
        typeof value === "object" &&
        typeof (value as { sector?: unknown }).sector === "string" &&
        typeof (value as { name?: unknown }).name === "string",
    )
    .map((value) => {
      const sector = sectorByNormalized.get(normalize(value.sector));
      if (!sector || !allowed.has(sector)) return null;
      return (taxonomy[sector] ?? []).find(
        (name) => normalize(name) === normalize(value.name),
      )
        ? { sector, name: value.name }
        : null;
    })
    .filter((value): value is { sector: string; name: string } =>
      Boolean(value),
    );
  return { suggestedSectors, suggestedSubsectors };
}

export function taxonomySectorNames() {
  return sectors;
}

export function searchTaxonomySubsectors(
  selectedSectors: string[],
  query: string,
  limit = 40,
) {
  const validSectors = selectedSectors
    .map((sector) => sectorByNormalized.get(normalize(sector)))
    .filter((sector): sector is string => Boolean(sector));
  const normalizedQuery = normalize(query);
  const results: { sector: string; name: string }[] = [];
  for (const sector of validSectors) {
    for (const name of taxonomy[sector] ?? []) {
      if (normalizedQuery && !normalize(name).includes(normalizedQuery))
        continue;
      results.push({ sector, name });
      if (results.length >= limit) return results;
    }
  }
  return results;
}
