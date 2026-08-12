import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, Card, PageHeader, StatusBadge, button } from "@/components/ui";
import { db } from "@/lib/db";
import { shortDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function DataCollectionPage() {
  const submissions = await db.submission.findMany({
    where: { source: "UniCollector" },
    include: { programme: true, submittedBy: true },
    orderBy: { submittedAt: "desc" },
    take: 8,
  });
  return (
    <>
      <PageHeader
        eyebrow="Data Collection"
        title="UniCollector"
        description="Launch indicator-specific forms, validate required data points, and send completed monitoring records into Unisheets."
        actions={
          <Link href="/data/collect" className={button}>
            <Plus size={16} />
            Start collecting data
          </Link>
        }
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <Badge tone="green">Available now</Badge>
          <h2 className="mt-3 text-lg font-bold">
            Indicator-linked collection
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Select a programme, approved indicator and reporting period.
            UniCollector displays only that KPI’s configured data points and
            validates the record before persistence.
          </p>
          <Link href="/data/collect" className={`${button} mt-5`}>
            Open UniCollector
          </Link>
        </Card>
        <Card className="p-5">
          <h2 className="font-bold">Collection status</h2>
          <p className="mt-3 text-3xl font-bold">{submissions.length}</p>
          <p className="text-xs text-slate-500">
            recent UniCollector submissions
          </p>
          <p className="mt-4 text-xs text-slate-600">
            Drafts remain in the form until submitted. Valid submissions
            immediately flow to Unisheets, KPI calculations and alert rules.
          </p>
        </Card>
      </div>
      <h2 className="mb-3 mt-6 font-bold">Recent submissions</h2>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Programme</th>
              <th>Period</th>
              <th>Location</th>
              <th>Submitted by</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id}>
                <td>{shortDate(s.submittedAt)}</td>
                <td className="font-semibold">{s.programme.name}</td>
                <td>{s.reportingPeriod}</td>
                <td>{s.location}</td>
                <td>{s.submittedBy.name}</td>
                <td>
                  <StatusBadge status={s.validationStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
