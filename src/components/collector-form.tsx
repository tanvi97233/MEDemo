"use client";

import { useMemo, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";
import { createSubmissionAction } from "@/app/actions";
import { Badge, button, input } from "./ui";

type DataField = {
  id: string;
  indicatorId: string | null;
  label: string;
  question: string;
  type: string;
  options: string | null;
  required: boolean;
  unit: string;
  validationRule: string;
};
type Programme = {
  id: string;
  name: string;
  grants: { id: string; name: string; funder: { name: string } }[];
  indicators: {
    id: string;
    name: string;
    unit: string;
    frequency: string;
    reviewStatus: string;
    dataFields: DataField[];
  }[];
};

export function CollectorForm({ programmes }: { programmes: Programme[] }) {
  const [programmeId, setProgrammeId] = useState(programmes[0]?.id ?? "");
  const current = useMemo(
    () => programmes.find((p) => p.id === programmeId),
    [programmeId, programmes],
  );
  const approved =
    current?.indicators.filter((i) => i.reviewStatus === "APPROVED") ?? [];
  const [indicatorId, setIndicatorId] = useState(approved[0]?.id ?? "");
  const submissionKeyRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const selectedIndicatorId = approved.some((i) => i.id === indicatorId)
    ? indicatorId
    : (approved[0]?.id ?? "");
  const indicator = approved.find((i) => i.id === selectedIndicatorId);
  return (
    <form
      action={createSubmissionAction}
      onSubmit={() => {
        if (submissionKeyRef.current && !submissionKeyRef.current.value)
          submissionKeyRef.current.value = window.crypto.randomUUID();
        setPending(true);
      }}
      className="space-y-6"
    >
      <input ref={submissionKeyRef} type="hidden" name="submissionKey" />
      <div className="rounded-xl bg-blue-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
          <LockKeyhole size={16} />
          Privacy and safeguarding
        </div>
        <p className="mt-1 text-xs leading-5 text-blue-800">
          Collect only necessary information. Obtain informed consent, protect
          respondent confidentiality, and pause collection where participation
          could create harm.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          name="programmeId"
          label="Programme"
          value={programmeId}
          onChange={(e) => { setProgrammeId(e.target.value); setIndicatorId(""); }}
          required
        >
          <option value="">Select programme</option>
          {programmes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Select
          name="indicatorId"
          label="Indicator / collection form"
          value={selectedIndicatorId}
          onChange={(e) => setIndicatorId(e.target.value)}
          required
        >
          <option value="">Select approved indicator</option>
          {approved.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </Select>
        <Select name="reportingPeriod" label="Reporting period" required>
          <option>2026 Q3</option>
          <option>2026 Q2</option>
          <option>2026 Q1</option>
        </Select>
        <Select name="grantId" label="Funder / grant">
          <option value="">Internal / not grant-specific</option>
          {current?.grants.map((g) => (
            <option key={g.id} value={g.id}>
              {g.funder.name} · {g.name}
            </option>
          ))}
        </Select>
        <Field
          name="location"
          label="Location"
          placeholder="Village / block / district"
          required
        />
        <Field
          name="beneficiaryId"
          label="Beneficiary / respondent ID"
          placeholder="Use a non-identifying unique code"
          required
        />
        <Select name="gender" label="Gender" required>
          <option value="">Select</option>
          <option>Woman</option>
          <option>Man</option>
          <option>Non-binary</option>
          <option>Prefer not to say</option>
        </Select>
        <Select name="ageGroup" label="Age group" required>
          <option value="">Select</option>
          <option>Under 18</option>
          <option>18–24</option>
          <option>25–34</option>
          <option>35–49</option>
          <option>50+</option>
        </Select>
        <Select name="disability" label="Person with disability?" required>
          <option>No</option>
          <option>Yes</option>
          <option>Prefer not to say</option>
        </Select>
      </div>
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-bold">Required indicator data points</h2>
          <Badge tone="blue">{indicator?.dataFields.length ?? 0} fields</Badge>
          {indicator && <Badge>{indicator.frequency}</Badge>}
        </div>
        {indicator?.dataFields.length ? (
          <div className="space-y-4">
            {indicator.dataFields.map((f, i) => (
              <div
                key={f.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <label className="text-sm font-semibold text-slate-800">
                  <span className="mr-2 text-blue-600">{i + 1}.</span>
                  {f.question}
                  {f.required && <span className="ml-1 text-red-500">*</span>}
                  {f.type === "SELECT" ? (
                    <select
                      className={`${input} mt-2`}
                      name={`field_${f.id}`}
                      required={f.required}
                    >
                      <option value="">Select response</option>
                      {f.options?.split("|").map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : f.type === "BOOLEAN" ? (
                    <select
                      className={`${input} mt-2`}
                      name={`field_${f.id}`}
                      required={f.required}
                    >
                      <option value="">Select response</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  ) : (
                    <input
                      className={`${input} mt-2`}
                      name={`field_${f.id}`}
                      type="number"
                      min="0"
                      step="any"
                      required={f.required}
                    />
                  )}
                </label>
                <p className="mt-2 text-xs text-slate-500">
                  {f.label}
                  {f.unit ? ` · ${f.unit}` : ""} ·{" "}
                  {f.validationRule || "Valid response required"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            This indicator has no configured data points and cannot be
            submitted.
          </p>
        )}
      </div>
      <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm">
        <input
          type="checkbox"
          name="consent"
          className="mt-1 h-4 w-4 accent-blue-600"
          required
        />
        <span>
          <strong>Informed consent confirmed</strong>
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            The respondent understands the purpose, voluntary nature,
            confidentiality safeguards and intended use of this monitoring data.
          </span>
        </span>
      </label>
      <button
        disabled={pending || !indicator?.dataFields.length}
        className={`${button} w-full sm:w-auto`}
      >
        {pending ? (
          <LoaderCircle className="animate-spin" size={17} />
        ) : (
          <CheckCircle2 size={17} />
        )}{" "}
        {pending ? "Validating and saving…" : "Validate and submit record"}
      </button>
    </form>
  );
}
function Field(p: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="text-xs font-semibold">
      {p.label}
      <input {...p} className={`${input} mt-1`} />
    </label>
  );
}
function Select({
  label,
  children,
  ...props
}: {
  label: string;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="text-xs font-semibold">
      {label}
      <select {...props} className={`${input} mt-1`}>
        {children}
      </select>
    </label>
  );
}
