import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { Badge, Card, PageHeader, StatusBadge } from "@/components/ui";
import { db } from "@/lib/db";
import { money, shortDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function ReportDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = await db.report.findUnique({
    where: { id },
    include: {
      programme: {
        include: {
          indicators: { include: { requirement: true } },
          submissions: true,
          taxonomy: { include: { taxonomyNode: true } },
        },
      },
      grant: {
        include: {
          funder: true,
          framework: { include: { requirements: true } },
        },
      },
    },
  });
  if (!r) notFound();
  const p = r.programme;
  const on = p.indicators.filter((i) => i.status === "ON_TRACK");
  const under = p.indicators.filter(
    (i) => i.status === "AT_RISK" || i.status === "OFF_TRACK",
  );
  const periodSubmissions = p.submissions.filter((submission) =>
    r.period.endsWith("YTD")
      ? submission.reportingPeriod.startsWith(r.period.slice(0, 4))
      : submission.reportingPeriod === r.period,
  );
  const beneficiaries = new Set(periodSubmissions.map((submission) => submission.beneficiaryId)).size;
  const comparisonCount = r.comparisonPeriod === "None" || r.comparisonPeriod === "Baseline" ? 0 : p.submissions.filter((submission)=>submission.reportingPeriod===r.comparisonPeriod).length;
  return (
    <>
      <div className="no-print">
        <PageHeader
          eyebrow="Report preview"
          title={r.title}
          description="A print-ready report assembled from stored EvalCanvas evidence."
          actions={<PrintButton />}
        />
      </div>
      <article className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none sm:p-10">
        <header className="border-b border-slate-200 pb-7">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.16em] text-blue-600">
                EvalCanvas Evidence Report
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                {r.title}
              </h1>
              <p className="mt-3 text-slate-600">
                Prepared for{" "}
                {r.grant?.funder.name ?? "Sankalp Community Foundation"}
              </p>
            </div>
            <StatusBadge status={r.status} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <Fact n="Programme" v={p.name} />
            <Fact
              n="Grant value"
              v={
                r.grant
                  ? money(r.grant.amount, r.grant.currency)
                  : "Cross-funder"
              }
            />
            <Fact n="Period" v={r.period} />
            <Fact
              n="Framework"
              v={r.frameworkName}
            />
          </div>
        </header>
        <Section title="1. Executive summary">
          <p>{r.executiveSummary}</p>
        </Section>
        <Section title="2. Programme and grant overview">
          <p>{p.description}</p>
          <p className="mt-3">
            <strong>Objective:</strong> {p.objectives}
          </p>
          <p className="mt-2">
            <strong>Geography and population:</strong> {p.geography};{" "}
            {p.targetPopulation}.
          </p>
        </Section>
        <Section title="3. Progress against objectives">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Indicator</th>
                  <th>Result level</th>
                  <th>Baseline</th>
                  <th>Target</th>
                  <th>Actual</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {p.indicators.map((i) => (
                  <tr key={i.id}>
                    <td className="font-semibold">{i.name}</td>
                    <td>{i.resultLevel}</td>
                    <td>
                      {i.baseline} {i.unit}
                    </td>
                    <td>
                      {i.target} {i.unit}
                    </td>
                    <td>
                      {i.actual} {i.unit}
                    </td>
                    <td>
                      <StatusBadge status={i.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
        <Section title="4. Beneficiary reach and equity">
          <p>
            {periodSubmissions.length} validated records covering {beneficiaries}
            unique beneficiary or respondent identifiers inform this reporting period.
            Monitoring is disaggregated by gender, age group, geography and
            disability status. Small-cell suppression should be applied before
            external publication where re-identification risk exists.
          </p>
        </Section>
        <Section title="5. Period comparison">
          <p>{r.comparisonPeriod === "None" ? "No comparison period was selected." : r.comparisonPeriod === "Baseline" ? "Baseline values are shown in the KPI table. A separate historical actual series is not available, so no period-on-period achievement is inferred." : comparisonCount > 0 ? `${comparisonCount} validated records exist for ${r.comparisonPeriod}. Indicator snapshot history is not yet stored, so this report does not invent a target-versus-actual trend.` : `Insufficient data: no validated submissions exist for ${r.comparisonPeriod}.`}</p>
        </Section>
        <Section title="6. Achievements">
          <p>{r.achievements}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {on.map((i) => (
              <Badge tone="green" key={i.id}>
                {i.name}
              </Badge>
            ))}
          </div>
        </Section>
        <Section title="7. Underperformance, risks and corrective action">
          <p>{r.risks}</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            {under.map((i) => (
              <li key={i.id}>
                <strong>{i.name}:</strong> review implementation bottlenecks,
                validate the latest denominator and assign a time-bound
                corrective action to {i.responsiblePerson}.
              </li>
            ))}
          </ul>
        </Section>
        <Section title="8. Data quality">
          <p>
            Completeness, timeliness, validity, integrity, precision and
            reliability are reviewed for each reporting cycle. Known limitations
            include uneven submission volume across locations, limited
            qualitative evidence in the current period, and actuals based on
            available validated records rather than causal attribution.
          </p>
        </Section>
        <Section title="9. Learning">
          <p>{r.lessons}</p>
        </Section>
        <Section title="10. Funder-framework alignment">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Linked indicator</th>
                  <th>Evidence source</th>
                  <th>Assessment</th>
                </tr>
              </thead>
              <tbody>
                {p.indicators
                  .filter((i) => !r.grant || i.grantId === r.grant.id)
                  .map((i) => (
                    <tr key={i.id}>
                      <td>
                        {i.requirement
                          ? `${i.requirement.code} · ${i.requirement.title}`
                          : "Programme results framework"}
                      </td>
                      <td>{i.name}</td>
                      <td>{i.dataSource}</td>
                      <td>
                        <StatusBadge status={i.status} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Section>
        <Section title="11. Methodology and limitations">
          <p>
            This monitoring report summarizes routine programme records
            collected through structured forms and reviewed under documented
            validation rules. Results describe observed programme performance
            and should not be interpreted as causal impact. Consent,
            confidentiality, safeguarding and do-no-harm principles govern
            collection and use. Any funder submission should receive a final
            human quality and disclosure review.
          </p>
        </Section>
        <footer className="mt-10 border-t border-slate-200 pt-5 text-xs text-slate-500">
          Generated {shortDate(r.createdAt)} · Sankalp Community Foundation ·
          EvalCanvas demonstration workspace
        </footer>
      </article>
    </>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold text-slate-950">{title}</h2>
      <div className="text-sm leading-7 text-slate-700">{children}</div>
    </section>
  );
}
function Fact({ n, v }: { n: string; v: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-400">{n}</p>
      <p className="mt-1 font-semibold">{v}</p>
    </div>
  );
}
