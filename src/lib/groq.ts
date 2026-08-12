import "server-only";
import {
  generateProgrammeDraft,
  generatedProgrammeSchema,
  cleanProgrammeTitle,
  type GeneratedProgramme,
} from "./demo-generator";

type GenerationResult = {
  draft: GeneratedProgramme;
  source: "AI_GROQ" | "DEMO_GENERATED";
};

export async function generateStructuredProgramme(
  programmeText: string,
): Promise<GenerationResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey)
    return {
      draft: generateProgrammeDraft(programmeText),
      source: "DEMO_GENERATED",
    };
  try {
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
          max_completion_tokens: 3500,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are a senior NGO Monitoring, Evaluation and Learning specialist. Convert programme narratives into credible draft measurement plans. Never claim facts absent from the source. Return JSON only. Keep sectors distinct from results-chain levels, indicators, data fields and collection questions. Every suggestion is a human-review draft.",
            },
            {
              role: "user",
              content: `Structure the programme below. Return exactly these JSON keys: title, summary, sector, subSector, focus, objectives, activities, outputs, outcomes, impact, assumptions, indicators. The title must be professional Title Case, no more than 8 words, contain no quotation marks or instruction verbs (generate/create/make/develop), and must summarize the subject rather than copy the prompt. assumptions must contain 3-6 strings. indicators must contain 3-8 objects with name, level (INPUT|ACTIVITY|OUTPUT|OUTCOME|IMPACT), unit, numeric target, and question. Prefer SMART indicators and ethical, minimally necessary data collection.\n\nPROGRAMME SOURCE:\n${programmeText.slice(0, 24000)}`,
            },
          ],
        }),
        signal: AbortSignal.timeout(45000),
        cache: "no-store",
      },
    );
    if (!response.ok)
      throw new Error(`Groq request failed with status ${response.status}`);
    const result = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq returned no structured content");
    const parsed = generatedProgrammeSchema.parse(JSON.parse(content));
    return {
      draft: { ...parsed, title: cleanProgrammeTitle(parsed.title) },
      source: "AI_GROQ",
    };
  } catch (error) {
    console.error(
      "Groq programme generation failed; using deterministic fallback.",
      error instanceof Error ? error.message : "Unknown provider error",
    );
    return {
      draft: generateProgrammeDraft(programmeText),
      source: "DEMO_GENERATED",
    };
  }
}
