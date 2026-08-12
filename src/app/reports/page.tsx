import Link from "next/link";
import { ArrowRight, FilePlus2 } from "lucide-react";
import { Card, PageHeader, StatusBadge, button } from "@/components/ui";
import { db } from "@/lib/db";
import { shortDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function ReportsPage() {
  const reports = await db.report.findMany({
    include: {
      programme: true,
      grant: { include: { funder: true, framework: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Evidence reports"
        description="Generate funder-ready reports from stored programme, grant, indicator and observation data—with methods and limitations made explicit."
        actions={
          <Link href="/reports/new" className={button}>
            <FilePlus2 size={16} />
            Generate report
          </Link>
        }
      />
      <div className="space-y-4">
        {reports.map((r) => (
          <Link href={`/reports/${r.id}`} key={r.id}>
            <Card className="mb-4 flex flex-col gap-4 p-5 hover:border-blue-300 sm:flex-row sm:items-center">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 font-bold text-blue-700">
                PDF
              </span>
              <div className="flex-1">
                <h2 className="font-bold">{r.title}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {r.programme.name} ·{" "}
                  {r.grant?.funder.name ?? "Internal report"} ·{" "}
                  {r.frameworkName}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Created {shortDate(r.createdAt)}
                </p>
              </div>
              <StatusBadge status={r.status} />
              <ArrowRight size={18} className="text-blue-600" />
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
