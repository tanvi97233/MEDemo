"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { importCsvAction } from "@/app/actions";
import { Badge, button, input } from "./ui";

type Programme = {
  id: string;
  name: string;
  indicators: { id: string; name: string; dataFields: { id: string }[] }[];
};
const fields = [
  "ignore",
  "beneficiaryId",
  "location",
  "reportingPeriod",
  "value",
  "gender",
] as const;
export function CsvImport({ programmes }: { programmes: Programme[] }) {
  const [rows, setRows] = useState<string[][]>([]);
  const [name, setName] = useState("");
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [programmeId, setProgrammeId] = useState(programmes[0]?.id ?? "");
  const [indicatorId, setIndicatorId] = useState("");
  const programme = programmes.find((p) => p.id === programmeId);
  const available =
    programme?.indicators.filter((i) => i.dataFields.length) ?? [];
  const load = async (f?: File) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setRows([]);
      setName("Only CSV files can be imported.");
      return;
    }
    setName(f.name);
    const text = await f.text();
    const parsed = text
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) =>
        line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")),
      );
    setRows(parsed);
    const headers = parsed[0] ?? [];
    setMapping(Object.fromEntries(headers.map((h, i) => [i, guess(h)])));
  };
  const records = useMemo(
    () =>
      rows.slice(1).map((row) =>
        Object.fromEntries(
          Object.entries(mapping)
            .filter(([, field]) => field !== "ignore")
            .map(([index, field]) => [field, row[Number(index)] ?? ""]),
        ),
      ),
    [rows, mapping],
  );
  const valid = records.filter(
    (r) =>
      r.beneficiaryId &&
      r.location &&
      r.reportingPeriod &&
      r.value !== "" &&
      Number.isFinite(Number(r.value)),
  );
  const invalid = records.length - valid.length;
  const required = [
    "beneficiaryId",
    "location",
    "reportingPeriod",
    "value",
  ].every((field) => Object.values(mapping).includes(field));
  return (
    <form action={importCsvAction} className="space-y-5">
      <input type="hidden" name="recordsJson" value={JSON.stringify(valid)} />
      <div className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center">
        <FileSpreadsheet className="mx-auto text-slate-400" size={34} />
        <label className="mt-3 inline-flex cursor-pointer font-semibold text-blue-600">
          Select CSV file
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => load(e.target.files?.[0])}
          />
        </label>
        <p className="mt-1 text-xs text-slate-500">
          CSV only · up to 500 previewed rows. Required mappings: respondent ID,
          location, reporting period and numeric value.
        </p>
        {name && <p className="mt-2 text-xs font-semibold">{name}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold">
          Programme
          <select
            name="programmeId"
            value={programmeId}
            onChange={(e) => {
              setProgrammeId(e.target.value);
              setIndicatorId("");
            }}
            required
            className={`${input} mt-1`}
          >
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold">
          Indicator
          <select
            name="indicatorId"
            value={indicatorId}
            onChange={(e) => setIndicatorId(e.target.value)}
            required
            className={`${input} mt-1`}
          >
            <option value="">Select indicator</option>
            {available.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Column mapping</h3>
              <p className="text-xs text-slate-500">
                {records.length} rows detected
              </p>
            </div>
            <div className="flex gap-2">
              <Badge tone="green">{valid.length} valid</Badge>
              {invalid > 0 && <Badge tone="red">{invalid} invalid</Badge>}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {rows[0].map((header, i) => (
              <label key={i} className="text-xs font-semibold">
                {header}
                <select
                  className={`${input} mt-1`}
                  value={mapping[i] ?? "ignore"}
                  onChange={(e) =>
                    setMapping((current) => ({
                      ...current,
                      [i]: e.target.value,
                    }))
                  }
                >
                  {fields.map((field) => (
                    <option key={field} value={field}>
                      {label(field)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <tbody>
                {rows.slice(0, 6).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td
                        className={i === 0 ? "bg-slate-50 font-bold" : ""}
                        key={j}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {invalid > 0 && (
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              {invalid} invalid row(s) will not be imported. Correct missing
              IDs, periods, locations or numeric values in the source file.
            </p>
          )}
          <button
            disabled={!required || !indicatorId || valid.length === 0}
            className={button}
          >
            <Upload size={16} />
            Confirm import of {valid.length} records
          </button>
        </>
      )}
    </form>
  );
}
function guess(header: string) {
  const h = header.toLowerCase();
  if (/beneficiary|respondent|student.*id|^id$/.test(h)) return "beneficiaryId";
  if (/location|school|village/.test(h)) return "location";
  if (/period|quarter/.test(h)) return "reportingPeriod";
  if (/value|actual|score|attendance/.test(h)) return "value";
  if (/gender|sex/.test(h)) return "gender";
  return "ignore";
}
function label(field: string) {
  return (
    {
      ignore: "Ignore column",
      beneficiaryId: "Beneficiary / respondent ID",
      location: "Location",
      reportingPeriod: "Reporting period",
      value: "Indicator value",
      gender: "Gender",
    } as Record<string, string>
  )[field];
}
