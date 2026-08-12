import { createReportAction } from "@/app/actions";
import { Card, PageHeader, button, input } from "@/components/ui";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, programmes] = await Promise.all([
    searchParams,
    db.programme.findMany({
      include: { grants: { include: { funder: true, framework: true } } },
    }),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="Reports / Builder"
        title="Generate an evidence report"
        description="Configure the programme, period, comparison and supported framework. The draft uses stored evidence and states data gaps."
      />
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <Card className="mx-auto max-w-3xl p-6">
        <form action={createReportAction} className="space-y-5">
          <label className="block text-xs font-semibold">
            Programme
            <select name="programmeId" className={`${input} mt-1`} required>
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold">
            Funder / grant
            <select name="grantId" className={`${input} mt-1`}>
              <option value="">Internal / cross-funder</option>
              {programmes
                .flatMap((p) => p.grants)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.funder.name} · {g.name} ·{" "}
                    {g.framework?.name ?? "Standard M&E"}
                  </option>
                ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold">
              Reporting period
              <select name="period" className={`${input} mt-1`}>
                <option>2026 Q3</option>
                <option>2026 Q2</option>
                <option>2026 Q1</option>
                <option>2026 YTD</option>
              </select>
            </label>
            <label className="text-xs font-semibold">
              Report type
              <select name="type" className={`${input} mt-1`}>
                <option>Standard M&amp;E Report</option>
                <option>Programme Summary</option>
                <option>Funder progress report</option>
              </select>
            </label>
            <label className="text-xs font-semibold">
              Comparison period
              <select name="comparisonPeriod" className={`${input} mt-1`}>
                <option>None</option>
                <option>2026 Q2</option>
                <option>2026 Q1</option>
                <option>Baseline</option>
              </select>
            </label>
            <label className="text-xs font-semibold">
              Framework
              <select name="framework" className={`${input} mt-1`}>
                <option>Standard M&amp;E Report</option>
                <option>BRSR</option>
                <option>CSR-2</option>
              </select>
            </label>
          </div>
          <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
            <strong>Included from saved data:</strong> programme and grant
            context, target versus actual, reach, KPI status, data quality,
            risks, corrective actions and framework alignment. Comparisons are
            shown only where the selected periods contain evidence.
          </div>
          <button className={`${button} w-full`}>Generate report draft</button>
        </form>
      </Card>
    </>
  );
}
