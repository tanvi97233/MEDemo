import Link from "next/link";
import { Download } from "lucide-react";
import { CsvImport } from "@/components/csv-import";
import { Badge, Card, PageHeader, StatusBadge, button } from "@/components/ui";
import { db } from "@/lib/db";
import { shortDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function ConnectorsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    submitted?: string;
    imported?: string;
    error?: string;
  }>;
}) {
  const { tab = "overview", submitted, imported, error } = await searchParams;
  const [submissions, programmes] = await Promise.all([
    db.submission.findMany({
      include: {
        programme: true,
        grant: { include: { funder: true } },
        submittedBy: true,
        observations: { include: { dataField: true, indicator: true } },
      },
      orderBy: { submittedAt: "desc" },
    }),
    db.programme.findMany({
      include: {
        indicators: {
          where: { archived: false, reviewStatus: "APPROVED" },
          include: { dataFields: true },
        },
      },
    }),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="Data Connectors"
        title="Imports & Unisheets"
        description="Bring external records into the same validated destination as UniCollector and inspect the unified evidence table."
        actions={
          tab === "unisheets" ? (
            <a href="/api/export" className={button}>
              <Download size={16} />
              Export CSV
            </a>
          ) : undefined
        }
      />
      {submitted && (
        <Notice>
          Submission saved. Unisheets, the linked KPI and alert rules were
          refreshed.
        </Notice>
      )}
      {imported && (
        <Notice>
          {imported} CSV records imported and calculations refreshed.
        </Notice>
      )}
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200">
        <Tab href="?tab=overview" active={tab === "overview"}>
          Connectors
        </Tab>
        <Tab href="?tab=import" active={tab === "import"}>
          CSV Import
        </Tab>
        <Tab href="?tab=unisheets" active={tab === "unisheets"}>
          Unisheets
        </Tab>
      </div>
      {tab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Connector
            name="CSV Import"
            status="Available now"
            href="?tab=import"
          >
            Preview, map, validate and persist accepted rows.
          </Connector>
          <Connector name="Google Sheets" status="Coming soon">
            No account is connected and no synchronization is claimed.
          </Connector>
          <Connector name="Custom Connector" status="Coming soon">
            The connector contract is deferred beyond this demo.
          </Connector>
          <Card className="p-5 lg:col-span-3">
            <Badge tone="blue">Unified destination</Badge>
            <h2 className="mt-3 text-lg font-bold">Unisheets</h2>
            <p className="mt-2 text-sm text-slate-600">
              Consolidates validated UniCollector and CSV records with source
              provenance.
            </p>
            <Link
              href="?tab=unisheets"
              className="mt-4 inline-block text-sm font-semibold text-blue-600"
            >
              Open Unisheets →
            </Link>
          </Card>
        </div>
      )}
      {tab === "import" && (
        <Card className="p-5 sm:p-7">
          <CsvImport programmes={programmes} />
        </Card>
      )}
      {tab === "unisheets" && (
        <>
          <div className="mb-4 flex gap-2">
            <Badge tone="blue">{submissions.length} records</Badge>
            <Badge tone="green">
              {submissions.filter((s) => s.validationStatus === "VALID").length}{" "}
              valid
            </Badge>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[1350px] text-xs">
              <thead>
                <tr>
                  <th>Submission date</th>
                  <th>Period</th>
                  <th>Programme</th>
                  <th>Indicator</th>
                  <th>Location</th>
                  <th>Respondent ID</th>
                  <th>Source</th>
                  <th>Submitted by</th>
                  <th>Validation</th>
                  <th>Collected fields</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td>{shortDate(s.submittedAt)}</td>
                    <td>{s.reportingPeriod}</td>
                    <td className="font-semibold">{s.programme.name}</td>
                    <td>
                      {[
                        ...new Set(
                          s.observations
                            .map((o) => o.indicator?.name)
                            .filter(Boolean),
                        ),
                      ].join(", ") || "Supporting record"}
                    </td>
                    <td>{s.location}</td>
                    <td className="font-mono">{s.beneficiaryId}</td>
                    <td>
                      <Badge
                        tone={s.source === "CSV Import" ? "amber" : "blue"}
                      >
                        {s.source}
                      </Badge>
                    </td>
                    <td>{s.submittedBy.name}</td>
                    <td>
                      <StatusBadge status={s.validationStatus} />
                    </td>
                    <td>
                      {s.observations.map((o) => (
                        <p key={o.id}>
                          <span className="text-slate-500">
                            {o.dataField.label}:
                          </span>{" "}
                          <strong>{o.numericValue ?? o.textValue}</strong>
                        </p>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${active ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500"}`}
    >
      {children}
    </Link>
  );
}
function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
      <strong>Success.</strong> {children}
    </p>
  );
}
function Connector({
  name,
  status,
  href,
  children,
}: {
  name: string;
  status: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={`p-5 ${href ? "" : "opacity-75"}`}>
      <Badge tone={href ? "green" : undefined}>{status}</Badge>
      <h2 className="mt-3 text-lg font-bold">{name}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{children}</p>
      {href && (
        <Link
          href={href}
          className="mt-4 inline-block text-sm font-semibold text-blue-600"
        >
          Open connector →
        </Link>
      )}
    </Card>
  );
}
