import { z } from "zod";

const narrativeField = (minimum: number, maximum: number) =>
  z.preprocess(
    (value) =>
      Array.isArray(value)
        ? value
            .filter((item): item is string => typeof item === "string")
            .join("; ")
        : value,
    z.string().min(minimum).max(maximum),
  );

const labelField = (maximum: number) =>
  z.preprocess(
    (value) =>
      Array.isArray(value)
        ? value.find((item) => typeof item === "string")
        : value,
    z.string().min(2).max(maximum),
  );

const numericTarget = z.preprocess((value) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}, z.number().nonnegative());

export const generatedProgrammeSchema = z.object({
  title: z.string().min(3).max(80),
  summary: narrativeField(20, 1200),
  sector: labelField(100),
  subSector: labelField(120),
  focus: labelField(180),
  objectives: narrativeField(10, 1200),
  activities: narrativeField(10, 1200),
  outputs: narrativeField(10, 1200),
  outcomes: narrativeField(10, 1200),
  impact: narrativeField(10, 800),
  assumptions: z.array(z.string().min(5).max(300)).min(3).max(6),
  indicators: z
    .array(
      z.object({
        name: z.string().min(5).max(180),
        level: z.preprocess(
          (value) => (typeof value === "string" ? value.toUpperCase() : value),
          z.enum(["INPUT", "ACTIVITY", "OUTPUT", "OUTCOME", "IMPACT"]),
        ),
        unit: z.string().min(1).max(40),
        target: numericTarget,
        question: z.string().min(8).max(300),
      }),
    )
    .min(3)
    .max(8),
});

export type GeneratedProgramme = z.infer<typeof generatedProgrammeSchema>;

const instructionWords = /\b(generate|create|make|develop|design|write|prepare|build)\b/gi;

export function cleanProgrammeTitle(input: string) {
  const lower = input.toLowerCase();
  if (/girl|female/.test(lower) && /educat|school|learn/.test(lower))
    return "Girls’ Education and Empowerment Programme";
  if (/maternal|pregnan/.test(lower)) return "Maternal Health and Wellbeing Programme";
  if (/livelihood|skill|employ|enterprise/.test(lower)) return "Inclusive Livelihoods Programme";
  const cleaned = input
    .split(/[.!?\n]/)[0]
    .replace(instructionWords, "")
    .replace(/\b(a|an|the) programme (for|on|about)\b/gi, "")
    .replace(/\b(programme|program) (for|on|about)\b/gi, "")
    .replace(/[^a-zA-Z0-9&'’ -]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 8)
    .map((word) => word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word)
    .join(" ");
  const safe = cleaned.length >= 3 ? cleaned : "Community Impact";
  return /programme$/i.test(safe) ? safe : `${safe} Programme`;
}

export function generateProgrammeDraft(text: string): GeneratedProgramme {
  const lower = text.toLowerCase();
  const health = /health|maternal|pregnan|clinic|nutrition/.test(lower);
  const education = /school|education|teacher|student|learning/.test(lower);
  const girlsEducation = education && /girl|female/.test(lower);
  const sector = health
    ? "Health"
    : education
      ? "Education"
      : "Economic Empowerment";
  const subSector = health
    ? "Maternal Health"
    : girlsEducation
      ? "Girls’ Education"
      : education
        ? "Foundational Learning"
      : "Skills & Employment";
  const focus = health
    ? "Antenatal Care"
    : girlsEducation
      ? "Secondary-School Retention"
      : education
        ? "Learning Outcomes"
      : "Enterprise Development";
  const population = health
    ? "women accessing essential services"
    : girlsEducation
      ? "girls enrolling in and completing secondary school"
      : education
        ? "learners completing supported instruction"
      : "participants completing skills or enterprise pathways";
  return {
    title: cleanProgrammeTitle(text),
    summary: text.trim().slice(0, 400),
    sector,
    subSector,
    focus,
    objectives: `Improve equitable access, participation and measurable outcomes for ${population}.`,
    activities:
      "Community outreach; structured service delivery; capacity strengthening; referral and follow-up.",
    outputs:
      "Participants reached; services completed; local partners trained.",
    outcomes: "Improved access, adoption and continuity of quality services.",
    impact: `Sustained improvements in ${health ? "health and wellbeing" : education ? "learning and opportunity" : "income security and agency"}.`,
    assumptions: [
      "Target groups can participate safely.",
      "Delivery partners retain adequate capacity.",
      "Services remain accessible and responsive.",
    ],
    indicators: [
      {
        name: `Number of ${population}`,
        level: "OUTPUT",
        unit: "people",
        target: 500,
        question:
          "Was the participant reached by a programme-supported service?",
      },
      {
        name: "Participants achieving the intended outcome",
        level: "OUTCOME",
        unit: "%",
        target: 70,
        question: "Did the participant achieve the defined programme outcome?",
      },
      {
        name: "Participant-reported service quality",
        level: "OUTCOME",
        unit: "%",
        target: 80,
        question:
          "How would the participant rate the quality of support received?",
      },
    ],
  };
}
