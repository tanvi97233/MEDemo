"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileUp,
  ListChecks,
  LoaderCircle,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { createProgrammeAction } from "@/app/actions";
import { Badge, button, input, secondaryButton } from "./ui";

type Mode = "structured" | "narrative" | "upload";
type TaxonomyPair = { sector: string; name: string };
type TaxonomyAnalysis = {
  suggestedSectors: string[];
  suggestedSubsectors: TaxonomyPair[];
  confidenceNotes: string;
  source: "AI_GROQ" | "DEMO_GENERATED";
};

export function ProgrammeForm({
  funders,
  frameworks,
  taxonomySectors,
}: {
  funders: { id: string; name: string }[];
  frameworks: { id: string; name: string }[];
  taxonomySectors: string[];
}) {
  const [mode, setMode] = useState<Mode>("narrative");
  const [step, setStep] = useState<1 | 2>(1);
  const [narrative, setNarrative] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [stepError, setStepError] = useState("");
  const [analysis, setAnalysis] = useState<TaxonomyAnalysis | null>(null);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedSubsectors, setSelectedSubsectors] = useState<TaxonomyPair[]>(
    [],
  );
  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [extractionNote, setExtractionNote] = useState<string | null>(null);
  const [extractedContent, setExtractedContent] = useState("");
  const intakeKeyRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  const clearAnalysis = () => {
    setAnalysis(null);
    setSelectedSectors([]);
    setSelectedSubsectors([]);
    setExtractionNote(null);
    setExtractedContent("");
  };
  const chooseMode = (next: Mode) => {
    setMode(next);
    setStep(1);
    setStepError("");
    clearAnalysis();
  };

  const analyzeProgramme = async () => {
    if (mode === "narrative" && narrative.trim().length < 20)
      return setStepError("Describe the programme in at least 20 characters.");
    if (mode === "upload" && !file)
      return setStepError("Choose a PDF, PPTX or DOCX before continuing.");

    setAnalysisBusy(true);
    setStepError("");
    try {
      const request =
        mode === "upload" && file
          ? (() => {
              const body = new FormData();
              body.append("file", file);
              return { method: "POST", body };
            })()
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ description: narrative.trim() }),
            };
      const response = await fetch("/api/programs/derive-taxonomy", request);
      const payload = (await response.json()) as {
        error?: string;
        derived?: TaxonomyAnalysis;
        description?: string;
        extractionNote?: string | null;
      };
      if (!response.ok || !payload.derived)
        throw new Error(payload.error || "Programme analysis failed.");
      setAnalysis(payload.derived);
      setSelectedSectors(payload.derived.suggestedSectors);
      setSelectedSubsectors(payload.derived.suggestedSubsectors);
      setExtractionNote(payload.extractionNote ?? null);
      setExtractedContent(payload.description ?? narrative.trim());
    } catch (error) {
      setStepError(
        error instanceof Error ? error.message : "Programme analysis failed.",
      );
    } finally {
      setAnalysisBusy(false);
    }
  };

  const continueToFunder = () => {
    if (mode === "narrative" && narrative.trim().length < 20)
      return setStepError("Describe the programme in at least 20 characters.");
    if (mode === "upload" && !file)
      return setStepError("Choose a PDF, PPTX or DOCX before continuing.");
    if (!analysis || selectedSectors.length === 0)
      return setStepError(
        "Analyze the programme and confirm at least one sector before continuing.",
      );
    setStepError("");
    setStep(2);
  };
  const modes = [
    { id: "narrative" as const, label: "Describe with AI", icon: Sparkles },
    { id: "structured" as const, label: "Structured form", icon: ListChecks },
    { id: "upload" as const, label: "Upload document", icon: FileUp },
  ];
  return (
    <form
      action={createProgrammeAction}
      onSubmit={(event) => {
        if (mode !== "structured" && step !== 2) {
          event.preventDefault();
          setStepError(
            "Confirm the extracted taxonomy before entering funder information.",
          );
        } else {
          if (intakeKeyRef.current && !intakeKeyRef.current.value)
            intakeKeyRef.current.value = window.crypto.randomUUID();
          setSubmitting(true);
        }
      }}
      className="space-y-6"
      encType="multipart/form-data"
    >
      <input type="hidden" name="entryMode" value={mode} />
      <input ref={intakeKeyRef} type="hidden" name="intakeKey" />
      <input type="hidden" name="extractedContent" value={extractedContent} />
      <input
        type="hidden"
        name="taxonomySectors"
        value={JSON.stringify(selectedSectors)}
      />
      <input
        type="hidden"
        name="taxonomySubsectors"
        value={JSON.stringify(selectedSubsectors)}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {modes.map((m) => (
          <button
            type="button"
            key={m.id}
            onClick={() => chooseMode(m.id)}
            className={`rounded-xl border p-4 text-left ${mode === m.id ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"}`}
          >
            <m.icon
              size={19}
              className={mode === m.id ? "text-blue-600" : "text-slate-500"}
            />
            <span className="mt-2 block text-sm font-semibold">{m.label}</span>
          </button>
        ))}
      </div>

      {mode !== "structured" && (
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span
            className={`grid h-7 w-7 place-items-center rounded-full ${step === 1 ? "bg-blue-600 text-white" : "bg-emerald-100 text-emerald-700"}`}
          >
            1
          </span>
          <span className={step === 1 ? "text-blue-700" : "text-slate-500"}>
            {mode === "narrative"
              ? "Programme description"
              : "Programme document"}
          </span>
          <span className="h-px flex-1 bg-slate-200" />
          <span
            className={`grid h-7 w-7 place-items-center rounded-full ${step === 2 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}
          >
            2
          </span>
          <span className={step === 2 ? "text-blue-700" : "text-slate-500"}>
            Funder information
          </span>
        </div>
      )}

      {mode === "narrative" && (
        <section
          className={step === 1 ? "block" : "hidden"}
          aria-hidden={step !== 1}
        >
          <label className="block text-sm font-semibold text-slate-800">
            Describe your programme
            <textarea
              name="narrative"
              value={narrative}
              onChange={(event) => {
                setNarrative(event.target.value);
                clearAnalysis();
              }}
              className={`${input} mt-2 min-h-56 resize-y text-base leading-7`}
              placeholder="Describe who the programme serves, the problem it addresses, where it works, the activities it will deliver, and the change it hopes to create…"
              required={step === 1}
            />
          </label>
          <p className="mt-2 text-xs text-slate-500">
            This is the only programme input required. The structured draft will
            be generated for your review.
          </p>
        </section>
      )}

      {mode === "upload" && (
        <section
          className={step === 1 ? "block" : "hidden"}
          aria-hidden={step !== 1}
        >
          <div className="rounded-xl border-2 border-dashed border-slate-300 p-10 text-center">
            <FileUp className="mx-auto text-slate-400" size={32} />
            <label className="mt-4 inline-block cursor-pointer text-sm font-semibold text-blue-600">
              Choose PDF, DOCX, PPTX, TXT or MD
              <input
                name="programmeDocument"
                className="sr-only"
                type="file"
                accept=".pdf,.pptx,.docx,.txt,.md"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  clearAnalysis();
                }}
                required={step === 1}
              />
            </label>
            <p className="mt-2 text-xs text-slate-500">
              {file?.name || "Maximum file size 10 MB"}
            </p>
          </div>
          {file && (
            <p className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
              {file.name} is ready. EvalCanvas will extract readable content
              where supported and clearly mark metadata-only fallback results.
            </p>
          )}
        </section>
      )}

      {mode !== "structured" && step === 1 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={analyzeProgramme}
              disabled={analysisBusy}
              className={button}
            >
              {analysisBusy ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {analysisBusy
                ? "Analyzing programme…"
                : analysis
                  ? "Regenerate classification"
                  : "Analyze programme"}
            </button>
          </div>
          {analysis && (
            <TaxonomyReview
              analysis={analysis}
              selectedSectors={selectedSectors}
              selectedSubsectors={selectedSubsectors}
              taxonomySectors={taxonomySectors}
              extractionNote={extractionNote}
              onSectorsChange={(next) => {
                setSelectedSectors(next);
                setSelectedSubsectors((current) =>
                  current.filter((item) => next.includes(item.sector)),
                );
              }}
              onSubsectorsChange={setSelectedSubsectors}
              onConfirm={continueToFunder}
            />
          )}
        </div>
      )}

      {mode === "structured" && <StructuredFields />}
      {(mode === "structured" || step === 2) && (
        <FunderStep funders={funders} frameworks={frameworks} />
      )}
      {stepError && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {stepError}
        </p>
      )}
      <div className="flex justify-end gap-3">
        {mode !== "structured" && step === 2 && (
          <button
            type="button"
            onClick={() => setStep(1)}
            className={secondaryButton}
          >
            <ArrowLeft size={16} />
            Back
          </button>
        )}
        {(mode === "structured" || step === 2) && (
          <button className={button} disabled={submitting}>
            {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {submitting ? "Creating review draft…" : "Structure programme draft"}
          </button>
        )}
      </div>
    </form>
  );
}

function TaxonomyReview({
  analysis,
  selectedSectors,
  selectedSubsectors,
  taxonomySectors,
  extractionNote,
  onSectorsChange,
  onSubsectorsChange,
  onConfirm,
}: {
  analysis: TaxonomyAnalysis;
  selectedSectors: string[];
  selectedSubsectors: TaxonomyPair[];
  taxonomySectors: string[];
  extractionNote: string | null;
  onSectorsChange: (value: string[]) => void;
  onSubsectorsChange: (value: TaxonomyPair[]) => void;
  onConfirm: () => void;
}) {
  const [subsectorQuery, setSubsectorQuery] = useState("");
  const [subsectorOptions, setSubsectorOptions] = useState<TaxonomyPair[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (!selectedSectors.length) return setSubsectorOptions([]);
      setSearching(true);
      const params = new URLSearchParams({ q: subsectorQuery });
      selectedSectors.forEach((sector) => params.append("sector", sector));
      try {
        const response = await fetch(
          `/api/programs/derive-taxonomy?${params.toString()}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as { results?: TaxonomyPair[] };
        setSubsectorOptions(payload.results ?? []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          setSubsectorOptions([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [selectedSectors, subsectorQuery]);

  const removePair = (pair: TaxonomyPair) =>
    onSubsectorsChange(
      selectedSubsectors.filter(
        (item) => item.sector !== pair.sector || item.name !== pair.name,
      ),
    );
  const addPair = (pair: TaxonomyPair) => {
    if (
      selectedSubsectors.some(
        (item) => item.sector === pair.sector && item.name === pair.name,
      )
    )
      return;
    onSubsectorsChange([...selectedSubsectors, pair]);
  };

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <h3 className="font-bold text-slate-900">
              Review extracted sectors and sub-sectors
            </h3>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">
            {analysis.confidenceNotes}
          </p>
        </div>
        <Badge tone={analysis.source === "AI_GROQ" ? "blue" : "amber"}>
          {analysis.source === "AI_GROQ" ? "Groq AI" : "Deterministic demo"}
        </Badge>
      </div>
      {extractionNote && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          {extractionNote}
        </p>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Sectors
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedSectors.map((sector) => (
              <span
                key={sector}
                className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700"
              >
                {sector}
                <button
                  type="button"
                  onClick={() =>
                    onSectorsChange(
                      selectedSectors.filter((value) => value !== sector),
                    )
                  }
                  aria-label={`Remove ${sector}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <label className="mt-3 block text-xs font-semibold text-slate-700">
            Add sector
            <select
              className={`${input} mt-1`}
              value=""
              onChange={(event) => {
                const value = event.target.value;
                if (value && !selectedSectors.includes(value))
                  onSectorsChange([...selectedSectors, value]);
              }}
            >
              <option value="">Select from taxonomy…</option>
              {taxonomySectors
                .filter((sector) => !selectedSectors.includes(sector))
                .map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Sub-sectors
          </p>
          <div className="mt-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
            {selectedSubsectors.map((pair) => (
              <span
                key={`${pair.sector}:${pair.name}`}
                title={pair.sector}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
              >
                {pair.name}
                <button
                  type="button"
                  onClick={() => removePair(pair)}
                  aria-label={`Remove ${pair.name}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="relative mt-3">
            <Search
              size={15}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              className={`${input} pl-9`}
              value={subsectorQuery}
              onChange={(event) => setSubsectorQuery(event.target.value)}
              placeholder="Search sub-sectors under selected sectors…"
            />
          </div>
          <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white">
            {searching && (
              <p className="p-3 text-xs text-slate-500">Searching taxonomy…</p>
            )}
            {!searching &&
              subsectorOptions
                .filter(
                  (pair) =>
                    !selectedSubsectors.some(
                      (selected) =>
                        selected.sector === pair.sector &&
                        selected.name === pair.name,
                    ),
                )
                .slice(0, 20)
                .map((pair) => (
                  <button
                    type="button"
                    key={`${pair.sector}:${pair.name}`}
                    onClick={() => addPair(pair)}
                    className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left text-xs hover:bg-blue-50"
                  >
                    <span className="font-medium text-slate-700">
                      {pair.name}
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-400">
                      {pair.sector}
                    </span>
                  </button>
                ))}
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Confirmed selections feed the programme structure, KPI suggestions, and
        the Taxonomy Explorer. Nothing is activated until programme approval.
      </p>
      <div className="mt-4 flex justify-end border-t border-blue-100 pt-4">
        <button
          type="button"
          onClick={onConfirm}
          disabled={selectedSectors.length === 0}
          className={button}
        >
          Confirm taxonomy & continue to funder
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}

function StructuredFields() {
  const [customFields, setCustomFields] = useState<
    { id: number; label: string; type: string }[]
  >([]);
  const addField = () =>
    setCustomFields((fields) => [
      ...fields,
      { id: Date.now(), label: "", type: "text" },
    ]);
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field
        name="name"
        label="Programme name"
        placeholder="e.g. Community Nutrition Initiative"
        required
      />
      <Field
        name="geography"
        label="Geography"
        placeholder="District, state or country"
        required
      />
      <div className="sm:col-span-2">
        <Text
          name="description"
          label="Programme description"
          placeholder="Who does the programme serve, what does it do, and what change should it create?"
          required
        />
      </div>
      <div className="sm:col-span-2">
        <Text
          name="problemStatement"
          label="Problem statement and rationale"
          placeholder="What problem exists, for whom, and why does it matter?"
          required
        />
      </div>
      <Field
        name="targetPopulation"
        label="Target population"
        placeholder="Population and planned reach"
        required
      />
      <Field
        name="budget"
        label="Programme budget (INR)"
        type="number"
        placeholder="5000000"
        required
      />
      <Field name="startDate" label="Start date" type="date" required />
      <Field name="endDate" label="End date" type="date" required />
      <div className="sm:col-span-2">
        <Text
          name="objectives"
          label="Objectives (optional — can be generated)"
          placeholder="What measurable change should the programme achieve?"
        />
      </div>
      <div className="sm:col-span-2">
        <Text
          name="activities"
          label="Key activities (optional — can be generated)"
          placeholder="What will the programme deliver?"
        />
      </div>
      <div className="rounded-xl border border-dashed border-slate-300 p-5 sm:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Custom programme fields
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Add organisation-specific information that is not covered above.
            </p>
          </div>
          <button type="button" onClick={addField} className={secondaryButton}>
            <Plus size={15} />
            Add field
          </button>
        </div>
        {customFields.length === 0 ? (
          <p className="mt-4 rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500">
            No custom fields added.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {customFields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-[1fr_150px_1fr_auto]"
              >
                <input
                  className={input}
                  name={`customFieldLabel_${index}`}
                  value={field.label}
                  onChange={(event) =>
                    setCustomFields((fields) =>
                      fields.map((item) =>
                        item.id === field.id
                          ? { ...item, label: event.target.value }
                          : item,
                      ),
                    )
                  }
                  placeholder="Field label"
                  required
                />
                <select
                  className={input}
                  name={`customFieldType_${index}`}
                  value={field.type}
                  onChange={(event) =>
                    setCustomFields((fields) =>
                      fields.map((item) =>
                        item.id === field.id
                          ? { ...item, type: event.target.value }
                          : item,
                      ),
                    )
                  }
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="url">URL</option>
                </select>
                <input
                  className={input}
                  name={`customFieldValue_${index}`}
                  type={field.type}
                  placeholder="Field value"
                  required
                />
                <button
                  type="button"
                  aria-label={`Remove ${field.label || "custom field"}`}
                  onClick={() =>
                    setCustomFields((fields) =>
                      fields.filter((item) => item.id !== field.id),
                    )
                  }
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function FunderStep({
  funders,
  frameworks,
}: {
  funders: { id: string; name: string }[];
  frameworks: { id: string; name: string }[];
}) {
  return (
    <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
      <div className="flex items-center gap-2">
        <h3 className="font-bold text-slate-900">Funder information</h3>
        <Badge tone="blue">Step 2</Badge>
      </div>
      <p className="mt-1 text-xs text-slate-600">
        Select and review the grant details below. The programme is not created
        until you press “Structure programme draft”.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs font-semibold text-slate-700">
          Funder
          <select name="funderId" className={`${input} mt-1`}>
            <option value="">Assign later</option>
            {funders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Framework
          <select name="frameworkId" className={`${input} mt-1`}>
            <option value="">Confirm later</option>
            {frameworks.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <Field
          name="grantAmount"
          label="Grant amount (INR)"
          type="number"
          placeholder="0"
        />
        <Field name="grantName" label="Grant name" placeholder="Grant or award name" />
        <label className="text-xs font-semibold text-slate-700">Currency<select name="grantCurrency" className={`${input} mt-1`}><option>INR</option><option>USD</option><option>GBP</option><option>EUR</option></select></label>
        <label className="text-xs font-semibold text-slate-700">Reporting frequency<select name="grantFrequency" className={`${input} mt-1`}><option>Monthly</option><option>Quarterly</option><option>Half-yearly</option><option>Annual</option></select></label>
        <Field name="nextReportDate" label="Next reporting deadline" type="date" />
        <div className="sm:col-span-2 lg:col-span-3"><Text name="grantRequirements" label="Reporting requirements / notes" placeholder="What does this grant require the programme to report?" /></div>
      </div>
    </section>
  );
}
function Field({
  name,
  label,
  type = "text",
  placeholder,
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="text-xs font-semibold text-slate-700">
      {label}
      <input
        className={`${input} mt-1`}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
function Text({
  name,
  label,
  placeholder,
  required = false,
}: {
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="text-xs font-semibold text-slate-700">
      {label}
      <textarea
        className={`${input} mt-1 min-h-24 resize-y`}
        name={name}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
