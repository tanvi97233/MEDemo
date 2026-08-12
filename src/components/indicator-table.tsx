"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Copy, Pencil, Trash2 } from "lucide-react";
import { indicatorDecisionAction } from "@/app/actions";
import { Badge, StatusBadge } from "./ui";

type Row = {
  id: string;
  name: string;
  definition: string;
  resultLevel: string;
  formula: string;
  numerator: string | null;
  denominator: string | null;
  unit: string;
  baseline: number;
  target: number;
  actual: number;
  completeness: number;
  status: string;
  reviewStatus: string;
  frequency: string;
  lastUpdated: string | null;
  programme: { name: string };
  grant: {
    funder: { name: string };
    framework: { name: string } | null;
  } | null;
  requirement: { code: string } | null;
  dataFields: {
    id: string;
    label: string;
    definition: string;
    type: string;
    unit: string;
    required: boolean;
    validationRule: string;
    collectionFrequency: string;
    disaggregation: string;
    calculationRole: string;
    dataSource: string;
    question: string;
  }[];
};

export function IndicatorTable({ indicators }: { indicators: Row[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[1050px] text-sm">
        <thead>
          <tr>
            <th className="w-12">
              <span className="sr-only">Expand</span>
            </th>
            <th>Indicator</th>
            <th>Programme</th>
            <th>Funder / framework</th>
            <th>Target</th>
            <th>Actual</th>
            <th>Status</th>
            <th>Frequency</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {indicators.map((i) => (
            <RowItem
              key={i.id}
              item={i}
              open={expanded.has(i.id)}
              toggle={() => toggle(i.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RowItem({
  item: i,
  open,
  toggle,
}: {
  item: Row;
  open: boolean;
  toggle: () => void;
}) {
  return (
    <>
      <tr>
        <td>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={`indicator-${i.id}`}
            aria-label={`${open ? "Collapse" : "Expand"} ${i.name}`}
            className="rounded-lg border border-slate-200 p-2 text-blue-700 hover:bg-blue-50"
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </td>
        <td className="max-w-xs">
          <button
            type="button"
            onClick={toggle}
            className="text-left font-semibold text-slate-900 hover:text-blue-600"
          >
            {i.name}
          </button>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
            {i.definition}
          </p>
        </td>
        <td>
          {i.programme.name}
          <p className="text-xs text-slate-500">{i.resultLevel}</p>
        </td>
        <td>
          {i.grant?.funder.name ?? "Internal"}
          <p className="text-xs text-slate-500">
            {i.grant?.framework?.name ?? "Standard M&E"}
          </p>
        </td>
        <td>
          <strong>
            {i.target} {i.unit}
          </strong>
        </td>
        <td>
          <strong>
            {i.actual} {i.unit}
          </strong>
        </td>
        <td>
          <StatusBadge status={i.status} />
        </td>
        <td>{i.frequency}</td>
        <td>
          <div className="flex gap-1">
            <Link
              title="Edit"
              href={`/indicators/${i.id}`}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            >
              <Pencil size={15} />
            </Link>
            <form action={indicatorDecisionAction}>
              <input type="hidden" name="id" value={i.id} />
              <button
                title="Duplicate"
                name="intent"
                value="duplicate"
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
              >
                <Copy size={15} />
              </button>
            </form>
            <form action={indicatorDecisionAction}>
              <input type="hidden" name="id" value={i.id} />
              <button
                title="Archive"
                name="intent"
                value="archive"
                className="rounded-md p-2 text-red-500 hover:bg-red-50"
              >
                <Trash2 size={15} />
              </button>
            </form>
          </div>
          {i.reviewStatus === "SUGGESTED" && (
            <div className="mt-1 flex gap-1">
              <Decision id={i.id} intent="regenerate" label="Regenerate" />
              <span>·</span>
              <Decision id={i.id} intent="approve" label="Approve" />
              <span>·</span>
              <Decision id={i.id} intent="reject" label="Reject" />
            </div>
          )}
        </td>
      </tr>
      {open && (
        <tr id={`indicator-${i.id}`}>
          <td colSpan={9} className="bg-slate-50 p-5">
            <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Calculation
                </p>
                <p className="mt-2 font-semibold">{i.formula}</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {i.numerator && <>Numerator: {i.numerator}. </>}
                  {i.denominator && <>Denominator: {i.denominator}. </>}Only
                  valid observations for the selected reporting context
                  contribute.
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    Required data points
                  </p>
                  <Badge tone="blue">{i.dataFields.length} fields</Badge>
                </div>
                {i.dataFields.length ? (
                  <div className="mt-2 grid gap-3 lg:grid-cols-2">
                    {i.dataFields.map((f) => (
                      <div
                        key={f.id}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex justify-between gap-2">
                          <p className="font-semibold">{f.label}</p>
                          <Badge>{f.calculationRole}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          {f.definition || f.question}
                        </p>
                        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <Fact label="Field type" value={f.type} />
                          <Fact
                            label="Unit"
                            value={f.unit || "Not applicable"}
                          />
                          <Fact
                            label="Requirement"
                            value={f.required ? "Required" : "Optional"}
                          />
                          <Fact
                            label="Frequency"
                            value={f.collectionFrequency}
                          />
                          <Fact
                            label="Validation"
                            value={f.validationRule || "Configured on form"}
                          />
                          <Fact label="Source" value={f.dataSource} />
                          <Fact
                            label="Disaggregation"
                            value={f.disaggregation || "None"}
                          />
                          <Fact label="Question" value={f.question} />
                        </dl>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                    No data points are configured; this indicator cannot yet be
                    collected.
                  </p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
function Decision({
  id,
  intent,
  label,
}: {
  id: string;
  intent: string;
  label: string;
}) {
  return (
    <form action={indicatorDecisionAction}>
      <input type="hidden" name="id" value={id} />
      <button
        name="intent"
        value={intent}
        className={
          intent === "approve"
            ? "text-xs font-semibold text-emerald-700"
            : intent === "regenerate"
              ? "text-xs font-semibold text-blue-700"
              : "text-xs font-semibold text-red-600"
        }
      >
        {label}
      </button>
    </form>
  );
}
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-700">{value}</dd>
    </div>
  );
}
