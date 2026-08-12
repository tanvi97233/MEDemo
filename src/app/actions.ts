"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateStructuredProgramme } from "@/lib/groq";
import { cleanProgrammeTitle } from "@/lib/demo-generator";
import { evaluateIndicatorAlert, recalculateIndicator } from "@/lib/monitoring";
import {
  deriveProgrammeTaxonomy,
  validateTaxonomySelection,
} from "@/lib/programme-taxonomy";
import { verifySession } from "@/lib/session";

const structuredProgrammeSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(20),
  problemStatement: z.string().min(10),
  geography: z.string().min(2),
  targetPopulation: z.string().min(3),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  budget: z.coerce.number().nonnegative(),
  objectives: z.string().optional(),
  activities: z.string().optional(),
  entryMode: z.string().default("structured"),
  funderId: z.string().optional(),
  frameworkId: z.string().optional(),
  grantAmount: z.coerce.number().optional(),
});

export async function createProgrammeAction(formData: FormData) {
  await verifySession();
  const intakeKey = String(formData.get("intakeKey") || "").trim();
  if (intakeKey) {
    const existing = await db.programme.findUnique({ where: { intakeKey } });
    if (existing) redirect(`/programs/${existing.id}?created=1`);
  }
  const raw = Object.fromEntries(formData);
  const entryMode = String(formData.get("entryMode") || "structured");
  const defaultStart = new Date();
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setFullYear(defaultEnd.getFullYear() + 1);
  let p: z.infer<typeof structuredProgrammeSchema>;
  if (entryMode === "structured") {
    const parsed = structuredProgrammeSchema.safeParse(raw);
    if (!parsed.success)
      redirect("/programs/new?error=Please+complete+all+required+fields");
    p = parsed.data;
  } else if (entryMode === "narrative") {
    const narrative = String(formData.get("narrative") || "").trim();
    if (narrative.length < 20)
      redirect("/programs/new?error=Please+describe+the+programme");
    p = {
      name: cleanProgrammeTitle(narrative),
      description: narrative,
      problemStatement: narrative,
      geography: "To be confirmed during review",
      targetPopulation: "To be confirmed during review",
      startDate: defaultStart,
      endDate: defaultEnd,
      budget: 0,
      objectives: "",
      activities: "",
      entryMode,
      funderId: String(formData.get("funderId") || "") || undefined,
      frameworkId: String(formData.get("frameworkId") || "") || undefined,
      grantAmount: Number(formData.get("grantAmount") || 0),
    };
  } else {
    const document = formData.get("programmeDocument");
    if (!(document instanceof File) || !document.name)
      redirect("/programs/new?error=Please+choose+a+programme+document");
    const extractedContent = String(
      formData.get("extractedContent") || "",
    ).trim();
    if (extractedContent.length < 20)
      redirect(
        "/programs/new?error=No+readable+programme+content+was+extracted",
      );
    const documentName = document.name.replace(/\.[^.]+$/, "");
    const source = extractedContent;
    p = {
      name: cleanProgrammeTitle(`${documentName}. ${source}`),
      description: source,
      problemStatement: source,
      geography: "To be confirmed during review",
      targetPopulation: "To be confirmed during review",
      startDate: defaultStart,
      endDate: defaultEnd,
      budget: 0,
      objectives: "",
      activities: "",
      entryMode,
      funderId: String(formData.get("funderId") || "") || undefined,
      frameworkId: String(formData.get("frameworkId") || "") || undefined,
      grantAmount: Number(formData.get("grantAmount") || 0),
    };
  }
  const [selectedFunder, selectedFramework] = await Promise.all([
    p.funderId ? db.funder.findUnique({ where: { id: p.funderId } }) : null,
    p.frameworkId ? db.framework.findUnique({ where: { id: p.frameworkId }, include: { requirements: true } }) : null,
  ]);
  const programmeSource = `${p.name}. ${p.description}. ${p.problemStatement}. ${p.objectives ?? ""}\nFUNDER AND GRANT CONTEXT: ${selectedFunder?.name ?? "Not yet assigned"}. ${String(formData.get("grantRequirements") || "")}\nFRAMEWORK: ${selectedFramework?.name ?? "Standard M&E"}. ${selectedFramework?.requirements.map(requirement=>`${requirement.code}: ${requirement.description}`).join("; ") ?? ""}`;
  const reviewedTaxonomy = validateTaxonomySelection(
    parseJsonField(formData.get("taxonomySectors")),
    parseJsonField(formData.get("taxonomySubsectors")),
  );
  if (entryMode !== "structured" && !reviewedTaxonomy)
    redirect(
      "/programs/new?error=Please+analyze+and+confirm+the+programme+taxonomy",
    );
  const taxonomyDerivation = reviewedTaxonomy
    ? {
        ...reviewedTaxonomy,
        confidenceNotes: "Confirmed by the user during programme intake.",
        source: "AI_GROQ" as const,
      }
    : await deriveProgrammeTaxonomy(programmeSource);
  const generation = await generateStructuredProgramme(
    `${programmeSource}\n\nCONFIRMED TAXONOMY\nSectors: ${taxonomyDerivation.suggestedSectors.join(", ")}\nSub-sectors: ${taxonomyDerivation.suggestedSubsectors.map((item) => item.name).join(", ")}`,
  );
  const draft = generation.draft;
  const finalName =
    entryMode === "structured"
      ? cleanProgrammeTitle(p.name)
      : cleanProgrammeTitle(draft.title);
  const customFields = Object.fromEntries(
    [...formData.keys()]
      .filter((key) => key.startsWith("customFieldLabel_"))
      .map((key) => {
        const index = key.slice("customFieldLabel_".length);
        return [
          String(formData.get(key)),
          {
            type: String(formData.get(`customFieldType_${index}`) || "text"),
            value: String(formData.get(`customFieldValue_${index}`) || ""),
          },
        ];
      })
      .filter(([fieldLabel]) => Boolean(fieldLabel)),
  );
  const org = await db.organisation.findFirstOrThrow();
  const code = `${finalName
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase()}-${Date.now().toString().slice(-5)}`;
  const programme = await db.programme.create({
    data: {
      organisationId: org.id,
      intakeKey: intakeKey || null,
      name: finalName,
      code,
      description: draft.summary,
      problemStatement: p.problemStatement,
      geography: p.geography,
      targetPopulation: p.targetPopulation,
      startDate: p.startDate,
      endDate: p.endDate,
      budget: p.budget,
      objectives: p.objectives || draft.objectives,
      activities: p.activities || draft.activities,
      outputs: draft.outputs,
      outcomes: draft.outcomes,
      impact: draft.impact,
      assumptions: draft.assumptions.join("; "),
      risks:
        "Review delivery, safeguarding, participation, and data-quality risks before activation.",
      partners: "To be confirmed during review",
      reviewStatus: "DRAFT",
      generatorSource: generation.source,
      customFields: JSON.stringify(customFields),
    },
  });
  const levels = [
    ["INPUT", "Delivery resources and partner capacity", draft.assumptions[1]],
    ["ACTIVITY", draft.activities, draft.assumptions[0]],
    ["OUTPUT", draft.outputs, draft.assumptions[1]],
    ["OUTCOME", draft.outcomes, draft.assumptions[2]],
    ["IMPACT", draft.impact, draft.assumptions[2]],
  ] as const;
  await db.theoryOfChangeNode.createMany({
    data: levels.map((n, i) => ({
      programmeId: programme.id,
      level: n[0],
      title: n[1].slice(0, 100),
      description: n[1],
      assumptions: n[2],
      sortOrder: i + 1,
    })),
  });
  const sectorNodes = new Map<
    string,
    Awaited<ReturnType<typeof findOrCreateTaxonomyNode>>
  >();
  for (const sectorName of taxonomyDerivation.suggestedSectors) {
    sectorNodes.set(
      sectorName,
      await findOrCreateTaxonomyNode(sectorName, "SECTOR", null),
    );
  }
  const subSectorNodes = [];
  for (const pair of taxonomyDerivation.suggestedSubsectors) {
    const parent = sectorNodes.get(pair.sector);
    if (!parent) continue;
    subSectorNodes.push(
      await findOrCreateTaxonomyNode(pair.name, "SUB_SECTOR", parent.id),
    );
  }
  const primarySector = sectorNodes.values().next().value;
  const primarySubSector = subSectorNodes[0];
  const fallbackSubSector =
    primarySubSector ??
    (primarySector
      ? await findOrCreateTaxonomyNode(
          draft.subSector,
          "SUB_SECTOR",
          primarySector.id,
        )
      : null);
  const focus = fallbackSubSector
    ? await findOrCreateTaxonomyNode(
        draft.focus,
        "SUB_SUB_SECTOR",
        fallbackSubSector.id,
      )
    : null;
  const taxonomyNodes = [
    ...sectorNodes.values(),
    ...subSectorNodes,
    ...(focus ? [focus] : []),
  ];
  await db.programmeTaxonomy.createMany({
    data: taxonomyNodes.map((node, index) => ({
      programmeId: programme.id,
      taxonomyNodeId: node.id,
      confidence:
        taxonomyDerivation.source === "AI_GROQ"
          ? 0.85 - index * 0.03
          : 0.82 - index * 0.03,
    })),
  });
  let grantId: string | undefined;
  let requirementId: string | undefined;
  if (p.funderId) {
    if (!Number.isFinite(p.grantAmount) || (p.grantAmount ?? 0) <= 0)
      redirect(`/programs/new?error=Enter+a+valid+grant+amount+greater+than+zero`);
    const framework = p.frameworkId
      ? await db.framework.findUnique({
          where: { id: p.frameworkId },
          include: { requirements: true },
        })
      : null;
    const grant = await db.grant.create({
      data: {
        name: String(formData.get("grantName") || `${finalName} grant`),
        amount: p.grantAmount ?? 0,
        currency: String(formData.get("grantCurrency") || "INR"),
        startDate: p.startDate,
        endDate: p.endDate,
        reportingFrequency: String(formData.get("grantFrequency") || "Quarterly"),
        nextReportDate: formData.get("nextReportDate") ? new Date(String(formData.get("nextReportDate"))) : new Date(p.startDate.getTime() + 90 * 86400000),
        programmeId: programme.id,
        funderId: p.funderId,
        frameworkId: p.frameworkId || null,
        requirements: String(formData.get("grantRequirements") || "Draft requirements — confirm with funder before activation."),
      },
    });
    grantId = grant.id;
    requirementId = framework?.requirements[0]?.id;
  }
  for (const [i, suggestion] of draft.indicators.entries()) {
    const indicator = await db.indicator.create({
      data: {
        programmeId: programme.id,
        grantId,
        requirementId,
        name: suggestion.name,
        definition: `Measures ${suggestion.name.toLowerCase()} for the approved reporting period.`,
        resultLevel: suggestion.level,
        formula:
          suggestion.unit === "%"
            ? "(numerator / denominator) × 100"
            : "Count of unique valid records",
        calculationType: suggestion.unit === "%" ? "PERCENTAGE" : "COUNT",
        numerator:
          suggestion.unit === "%" ? "Participants meeting condition" : null,
        denominator: suggestion.unit === "%" ? "Eligible participants" : null,
        unit: suggestion.unit,
        baseline: 0,
        target: suggestion.target,
        frequency: "Quarterly",
        dataSource: "UniCollector",
        collectionMethod: "Structured digital form",
        responsiblePerson: "M&E Manager",
        disaggregation: "Gender, age, geography, disability",
        objective: draft.objectives,
        qualityRules: "Required fields; valid range; unique beneficiary-period",
        reviewStatus: "SUGGESTED",
        status: "NO_DATA",
      },
    });
    await db.dataField.create({
      data: {
        programmeId: programme.id,
        indicatorId: indicator.id,
        key: `generated_field_${i + 1}`,
        label: suggestion.name,
        definition: `Required evidence for ${suggestion.name.toLowerCase()}.`,
        question: suggestion.question,
        type: suggestion.unit === "%" ? "BOOLEAN" : "NUMBER",
        unit: suggestion.unit,
        validationRule:
          suggestion.unit === "%"
            ? "Yes or No response required"
            : "Number must be zero or greater",
        collectionFrequency: "Quarterly",
        calculationRole: suggestion.unit === "%" ? "NUMERATOR" : "SUPPORTING",
        disaggregation: "Gender, age, geography, disability",
        dataSource: "UniCollector",
        required: true,
      },
    });
  }
  revalidatePath("/");
  redirect(`/programs/${programme.id}?created=1`);
}

export async function approveProgrammeAction(formData: FormData) {
  await verifySession();
  const id = String(formData.get("id"));
  await db.programme.update({
    where: { id },
    data: { reviewStatus: "APPROVED" },
  });
  await db.indicator.updateMany({
    where: { programmeId: id, reviewStatus: "SUGGESTED" },
    data: { reviewStatus: "APPROVED" },
  });
  revalidatePath(`/programs/${id}`);
}

const programmeReviewSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().min(20),
  problemStatement: z.string().trim().min(10),
  geography: z.string().trim().min(2),
  targetPopulation: z.string().trim().min(3),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  budget: z.coerce.number().nonnegative(),
  objectives: z.string().trim().min(5),
  activities: z.string().trim().min(5),
  outputs: z.string().trim().min(5),
  outcomes: z.string().trim().min(5),
  impact: z.string().trim().min(5),
  assumptions: z.string().trim(),
  risks: z.string().trim(),
});

export async function saveProgrammeReviewAction(formData: FormData) {
  await verifySession();
  const parsed = programmeReviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    redirect(
      `/programs/${String(formData.get("id"))}?error=Please+correct+the+highlighted+programme+fields`,
    );
  if (parsed.data.endDate <= parsed.data.startDate)
    redirect(
      `/programs/${parsed.data.id}?error=End+date+must+be+after+the+start+date`,
    );
  const { id, ...data } = parsed.data;
  await db.programme.update({
    where: { id },
    data: { ...data, name: cleanProgrammeTitle(data.name) },
  });
  revalidatePath(`/programs/${id}`);
  revalidatePath("/programs");
  redirect(`/programs/${id}?saved=1`);
}
export async function indicatorDecisionAction(formData: FormData) {
  await verifySession();
  const id = String(formData.get("id"));
  const intent = String(formData.get("intent"));
  if (intent === "regenerate") {
    const current = await db.indicator.findUniqueOrThrow({ where: { id }, include: { programme: { include: { taxonomy: { include: { taxonomyNode: true } } } }, grant: { include: { funder: true, framework: true } }, requirement: true } });
    const generation = await generateStructuredProgramme(`${current.programme.name}. ${current.programme.description}. Objective: ${current.objective}. Taxonomy: ${current.programme.taxonomy.map(link=>link.taxonomyNode.name).join(" > ")}. Funder: ${current.grant?.funder.name ?? "Internal"}. Framework: ${current.grant?.framework?.name ?? "Standard M&E"}. Requirement: ${current.requirement?.description ?? "Programme results framework"}. Regenerate a SMART indicator suggestion.`);
    const suggestion = generation.draft.indicators[0];
    await db.indicator.update({ where: { id }, data: { name: suggestion.name, resultLevel: suggestion.level, unit: suggestion.unit, target: suggestion.target, formula: suggestion.unit === "%" ? "(numerator / denominator) × 100" : "Count of unique valid records", calculationType: suggestion.unit === "%" ? "PERCENTAGE" : "COUNT", reviewStatus: "SUGGESTED", actual: 0, status: "NO_DATA", lastUpdated: null } });
    const field = await db.dataField.findFirst({ where: { indicatorId: id } });
    if (field) await db.dataField.update({ where: { id: field.id }, data: { label: suggestion.name, question: suggestion.question, type: suggestion.unit === "%" ? "BOOLEAN" : "NUMBER", unit: suggestion.unit } });
  } else if (intent === "duplicate") {
    const current = await db.indicator.findUniqueOrThrow({ where: { id } });
    const copy = { ...current, id: undefined, lastUpdated: undefined };
    await db.indicator.create({
      data: {
        ...copy,
        name: `${current.name} (copy)`,
        reviewStatus: "DRAFT",
        actual: 0,
        status: "NO_DATA",
      },
    });
  } else if (intent === "archive")
    await db.indicator.update({ where: { id }, data: { archived: true } });
  else
    await db.indicator.update({
      where: { id },
      data: { reviewStatus: intent === "approve" ? "APPROVED" : "REJECTED" },
    });
  revalidatePath("/indicators");
}
export async function updateIndicatorAction(formData: FormData) {
  await verifySession();
  const id = String(formData.get("id"));
  const target = Number(formData.get("target"));
  await db.indicator.update({
    where: { id },
    data: {
      name: String(formData.get("name")),
      target,
      baseline: Number(formData.get("baseline")),
      unit: String(formData.get("unit")),
      frequency: String(formData.get("frequency")),
      responsiblePerson: String(formData.get("responsiblePerson")),
      reviewStatus: "APPROVED",
    },
  });
  revalidatePath(`/indicators/${id}`);
  redirect("/indicators?updated=1");
}

export async function createSubmissionAction(formData: FormData) {
  const user = await verifySession();
  const programmeId = String(formData.get("programmeId"));
  const indicatorId = String(formData.get("indicatorId") || "");
  const submissionKey = String(formData.get("submissionKey") || "");
  if (
    submissionKey &&
    (await db.submission.findUnique({ where: { submissionKey } }))
  )
    redirect("/data/connectors?tab=unisheets&submitted=1");
  const fields = await db.dataField.findMany({
    where: { programmeId, ...(indicatorId ? { indicatorId } : {}) },
  });
  if (!formData.get("consent") || !programmeId || !indicatorId)
    redirect(
      "/data/collect?error=Consent,+programme+and+indicator+are+required",
    );
  for (const field of fields.filter((field) => field.required)) {
    const raw = formData.get(`field_${field.id}`);
    if (raw === null || String(raw).trim() === "")
      redirect("/data/collect?error=Complete+all+required+indicator+fields");
    if (field.type === "NUMBER" && !Number.isFinite(Number(raw)))
      redirect(
        "/data/collect?error=Enter+a+valid+number+for+each+numeric+field",
      );
  }
  const submission = await db.submission.create({
    data: {
      programmeId,
      submissionKey: submissionKey || null,
      grantId: String(formData.get("grantId") || "") || null,
      submittedById: user.id,
      reportingPeriod: String(formData.get("reportingPeriod")),
      location: String(formData.get("location")),
      beneficiaryId: String(formData.get("beneficiaryId")),
      gender: String(formData.get("gender")),
      ageGroup: String(formData.get("ageGroup")),
      disability: String(formData.get("disability")),
      consent: true,
      source: "UniCollector",
      validationStatus: "VALID",
    },
  });
  const touched = new Set<string>();
  for (const field of fields) {
    const raw = formData.get(`field_${field.id}`);
    if (raw === null || raw === "") continue;
    await db.observation.create({
      data: {
        submissionId: submission.id,
        dataFieldId: field.id,
        indicatorId: field.indicatorId,
        numericValue:
          field.type === "NUMBER"
            ? Number(raw)
            : field.type === "BOOLEAN"
              ? raw === "yes"
                ? 100
                : 0
              : null,
        textValue: field.type === "NUMBER" ? null : String(raw),
      },
    });
    if (field.indicatorId) touched.add(field.indicatorId);
  }
  for (const id of touched) {
    await recalculateIndicator(id);
    await evaluateIndicatorAlert(id);
  }
  revalidatePath("/");
  revalidatePath("/data");
  revalidatePath("/indicators");
  redirect("/data/connectors?tab=unisheets&submitted=1");
}

export async function updateAlertAction(formData: FormData) {
  await verifySession();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  await db.alert.update({ where: { id }, data: { status } });
  revalidatePath("/alerts");
  revalidatePath("/");
}
export async function createReportAction(formData: FormData) {
  await verifySession();
  const programmeId = String(formData.get("programmeId"));
  const programme = await db.programme.findUniqueOrThrow({
    where: { id: programmeId },
    include: { indicators: true },
  });
  const grantId = String(formData.get("grantId") || "") || null;
  const period = String(formData.get("period"));
  const comparisonPeriod = String(formData.get("comparisonPeriod") || "None");
  const frameworkName = String(
    formData.get("framework") || "Standard M&E Report",
  );
  if (!["BRSR", "CSR-2", "Standard M&E Report"].includes(frameworkName))
    redirect("/reports/new?error=Select+a+supported+reporting+framework");
  if (
    grantId &&
    !(await db.grant.findFirst({ where: { id: grantId, programmeId } }))
  )
    redirect(
      "/reports/new?error=The+selected+grant+is+not+linked+to+this+programme",
    );
  const under = programme.indicators
    .filter((i) => i.status !== "ON_TRACK")
    .map((i) => i.name)
    .join(", ");
  const report = await db.report.create({
    data: {
      title: `${programme.name} — ${period} Progress Report`,
      programmeId,
      grantId,
      period,
      type: String(formData.get("type")),
      comparisonPeriod,
      frameworkName,
      executiveSummary: `${programme.name} is implementing its approved results chain. Evidence in this draft is drawn only from saved programme, grant, indicator and validated submission records; gaps are stated rather than inferred.`,
      achievements:
        programme.indicators
          .filter((i) => i.status === "ON_TRACK")
          .map((i) => `${i.name}: ${i.actual}${i.unit}`)
          .join("; ") || "Outcome evidence is still being collected.",
      risks: under
        ? `Indicators requiring corrective action: ${under}.`
        : "No material performance risks are currently flagged.",
      lessons:
        "Routine disaggregation review and rapid follow-up on missing records improve both learning and accountability.",
      status: "DRAFT",
    },
  });
  revalidatePath("/reports");
  redirect(`/reports/${report.id}`);
}

async function findOrCreateTaxonomyNode(
  name: string,
  level: string,
  parentId: string | null,
) {
  const normalized = name.trim();
  const existing = await db.taxonomyNode.findFirst({
    where: { name: { equals: normalized }, level, parentId },
  });
  return (
    existing ??
    db.taxonomyNode.create({ data: { name: normalized, level, parentId } })
  );
}

function parseJsonField(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string" || !value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function updateProgrammeTaxonomyAction(formData: FormData) {
  await verifySession();
  const programmeId = String(formData.get("programmeId"));
  const focusId = String(formData.get("focusId"));
  const focus = await db.taxonomyNode.findFirst({
    where: { id: focusId, level: "SUB_SUB_SECTOR" },
    include: { parent: { include: { parent: true } } },
  });
  if (!focus?.parent?.parent) return;
  await db.$transaction([
    db.programmeTaxonomy.deleteMany({ where: { programmeId } }),
    db.programmeTaxonomy.createMany({
      data: [focus.parent.parent.id, focus.parent.id, focus.id].map(
        (taxonomyNodeId) => ({ programmeId, taxonomyNodeId, confidence: 1 }),
      ),
    }),
  ]);
  revalidatePath("/taxonomy");
  revalidatePath(`/programs/${programmeId}`);
}

export type FunderActionState = { ok?: boolean; error?: string };

const moneyInput = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const normalized = value.replace(/[₹,$£€\s]/g, "").replace(/,/g, "");
  return normalized === "" ? Number.NaN : Number(normalized);
}, z.number().finite().positive());

const funderGrantSchema = z.object({
  name: z.string().trim().min(2),
  type: z.string().trim().min(2),
  primaryContact: z.string().trim().optional().default(""),
  contactEmail: z.union([z.literal(""), z.email()]).default(""),
  notes: z.string().trim().optional().default(""),
  grantName: z.string().trim().min(2),
  amount: moneyInput,
  currency: z.enum(["INR", "USD", "GBP", "EUR"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reportingFrequency: z.string().trim().min(2),
  nextReportDate: z.coerce.date(),
  programmeId: z.string().min(1),
  frameworkId: z.string().optional(),
  requirements: z.string().trim().min(3),
});

export async function createFunderGrantAction(
  _state: FunderActionState,
  formData: FormData,
): Promise<FunderActionState> {
  const user = await verifySession();
  const parsed = funderGrantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const amountIssue = parsed.error.issues.some(
      (issue) => issue.path[0] === "amount",
    );
    return {
      error: amountIssue
        ? "Enter a valid grant amount greater than zero; it was not saved as zero."
        : parsed.error.issues[0]?.message ||
          "Check the funder and grant fields.",
    };
  }
  const data = parsed.data;
  if (data.endDate <= data.startDate)
    return { error: "Grant end date must be after its start date." };
  const programme = await db.programme.findFirst({
    where: { id: data.programmeId, organisationId: user.organisationId },
  });
  if (!programme) return { error: "Select a programme in your organisation." };
  await db.$transaction(async (tx) => {
    const funder = await tx.funder.create({
      data: {
        organisationId: user.organisationId,
        name: data.name,
        type: data.type,
        website: "",
        primaryContact: data.primaryContact,
        contactEmail: data.contactEmail,
        notes: data.notes,
      },
    });
    await tx.grant.create({
      data: {
        name: data.grantName,
        amount: data.amount,
        currency: data.currency,
        startDate: data.startDate,
        endDate: data.endDate,
        reportingFrequency: data.reportingFrequency,
        nextReportDate: data.nextReportDate,
        programmeId: programme.id,
        funderId: funder.id,
        frameworkId: data.frameworkId || null,
        requirements: data.requirements,
      },
    });
  });
  revalidatePath("/funders");
  revalidatePath("/");
  return { ok: true };
}

const csvRecordSchema = z.object({
  beneficiaryId: z.string().trim().min(1),
  location: z.string().trim().min(1),
  reportingPeriod: z.string().trim().min(3),
  value: z.coerce.number().finite(),
  gender: z.string().trim().optional().default("Not provided"),
});

export async function importCsvAction(formData: FormData) {
  const user = await verifySession();
  const programmeId = String(formData.get("programmeId") || "");
  const indicatorId = String(formData.get("indicatorId") || "");
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("recordsJson") || "[]"));
  } catch {
    redirect(
      "/data/connectors?tab=import&error=The+CSV+preview+could+not+be+read",
    );
  }
  const parsed = z.array(csvRecordSchema).min(1).max(500).safeParse(raw);
  if (!parsed.success)
    redirect(
      "/data/connectors?tab=import&error=Fix+invalid+CSV+rows+before+importing",
    );
  const indicator = await db.indicator.findFirst({
    where: { id: indicatorId, programmeId },
    include: { dataFields: true },
  });
  const field =
    indicator?.dataFields.find(
      (item) => item.type === "NUMBER" || item.type === "BOOLEAN",
    ) ?? indicator?.dataFields[0];
  if (!indicator || !field)
    redirect(
      "/data/connectors?tab=import&error=Select+an+indicator+with+a+configured+data+point",
    );
  await db.$transaction(async (tx) => {
    for (const row of parsed.data) {
      const submission = await tx.submission.create({
        data: {
          programmeId,
          submittedById: user.id,
          reportingPeriod: row.reportingPeriod,
          location: row.location,
          beneficiaryId: row.beneficiaryId,
          gender: row.gender,
          ageGroup: "Not provided",
          disability: "Not provided",
          consent: true,
          source: "CSV Import",
          validationStatus: "VALID",
        },
      });
      await tx.observation.create({
        data: {
          submissionId: submission.id,
          indicatorId: indicator.id,
          dataFieldId: field.id,
          numericValue: row.value,
        },
      });
    }
  });
  await recalculateIndicator(indicator.id);
  await evaluateIndicatorAlert(indicator.id);
  revalidatePath("/");
  revalidatePath("/indicators");
  revalidatePath("/data/connectors");
  redirect(`/data/connectors?tab=unisheets&imported=${parsed.data.length}`);
}
