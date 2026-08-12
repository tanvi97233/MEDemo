"use client";

import { useActionState, useState } from "react";
import { LoaderCircle, Plus, X } from "lucide-react";
import { createFunderGrantAction, type FunderActionState } from "@/app/actions";
import { button, input, secondaryButton } from "./ui";

const initialState: FunderActionState = {};

export function AddFunder({
  programmes,
  frameworks,
}: {
  programmes: { id: string; name: string }[];
  frameworks: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    createFunderGrantAction,
    initialState,
  );
  return (
    <>
      <button className={button} onClick={() => setOpen(true)}>
        <Plus size={16} />
        Add funder
      </button>
      {state.ok && !open && (
        <span role="status" className="text-sm font-semibold text-emerald-700">
          Funder and grant saved
        </span>
      )}
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-funder-title"
        >
          <form
            action={action}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 id="add-funder-title" className="text-xl font-bold">
                  Add funder and grant
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  The funder is the organization; the grant stores its financial
                  and reporting relationship.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <h3 className="mt-6 text-sm font-bold text-blue-700">
              Funder information
            </h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field name="name" label="Funder name" required />
              <Select name="type" label="Funder type">
                <option>FOUNDATION</option>
                <option>CORPORATE_CSR</option>
                <option>GOVERNMENT</option>
                <option>MULTILATERAL</option>
                <option>OTHER</option>
              </Select>
              <Field name="primaryContact" label="Primary contact" />
              <Field name="contactEmail" label="Contact email" type="email" />
              <Area name="notes" label="Notes" />
            </div>
            <h3 className="mt-6 text-sm font-bold text-blue-700">
              Grant information
            </h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field name="grantName" label="Grant / programme name" required />
              <Field
                name="amount"
                label="Grant amount"
                placeholder="12,500,000"
                inputMode="decimal"
                required
              />
              <Select name="currency" label="Currency">
                <option>INR</option>
                <option>USD</option>
                <option>GBP</option>
                <option>EUR</option>
              </Select>
              <Select name="programmeId" label="Linked NGO programme">
                <option value="">Select programme</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <Field
                name="startDate"
                label="Grant start date"
                type="date"
                required
              />
              <Field
                name="endDate"
                label="Grant end date"
                type="date"
                required
              />
              <Select name="reportingFrequency" label="Reporting frequency">
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Half-yearly</option>
                <option>Annual</option>
              </Select>
              <Field
                name="nextReportDate"
                label="Next reporting deadline"
                type="date"
                required
              />
              <Select name="frameworkId" label="Applicable framework">
                <option value="">Standard M&E</option>
                {frameworks.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>
              <Area
                name="requirements"
                label="Reporting requirements / notes"
                required
              />
            </div>
            {state.ok && (
              <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                Funder and grant saved. Close this dialog to view the refreshed list.
              </p>
            )}
            {state.error && (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {state.error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button disabled={pending} className={button}>
                {pending ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <Plus size={16} />
                )}{" "}
                {pending ? "Saving…" : "Save funder & grant"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Field(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string },
) {
  const { label, ...rest } = props;
  return (
    <label className="text-xs font-semibold">
      {label}
      <input {...rest} className={`${input} mt-1`} />
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
      <select {...props} required className={`${input} mt-1`}>
        {children}
      </select>
    </label>
  );
}
function Area({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="text-xs font-semibold sm:col-span-2">
      {label}
      <textarea {...props} className={`${input} mt-1 min-h-20`} />
    </label>
  );
}
