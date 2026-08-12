import Link from "next/link";
import { ArrowRight, Calendar, Mail } from "lucide-react";
import { AddFunder } from "@/components/funder-form";
import { Badge, Card, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { money, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FundersPage() {
  const [funders, programmes, frameworks] = await Promise.all([
    db.funder.findMany({
      include: {
        grants: {
          include: {
            programme: true,
            framework: true,
            indicators: true,
            alerts: { where: { status: { not: "RESOLVED" } } },
          },
        },
      },
    }),
    db.programme.findMany({ select: { id: true, name: true } }),
    db.framework.findMany({ select: { id: true, name: true } }),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="Funders"
        title="Funding partners"
        description="Manage each funder as an organization, with grant-specific programmes, frameworks, KPIs and deadlines."
        actions={<AddFunder programmes={programmes} frameworks={frameworks} />}
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {funders.map((f) => {
          const value = f.grants.reduce((sum, grant) => sum + grant.amount, 0);
          const indicators = f.grants.flatMap((grant) => grant.indicators);
          const onTrack = indicators.filter(
            (indicator) => indicator.status === "ON_TRACK",
          ).length;
          const next = [...f.grants].sort(
            (a, b) => +a.nextReportDate - +b.nextReportDate,
          )[0];
          return (
            <Card key={f.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white">
                  {f.name
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </span>
                <Badge tone="blue">{f.type.replaceAll("_", " ")}</Badge>
              </div>
              <h2 className="mt-4 text-lg font-bold">{f.name}</h2>
              {f.contactEmail ? (
                <a
                  href={`mailto:${f.contactEmail}`}
                  className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600"
                >
                  <Mail size={12} />
                  {f.primaryContact || f.contactEmail}
                </a>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Contact not provided
                </p>
              )}
              <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
                <Metric value={f.grants.length} label="Active grants" />
                <Metric value={money(value)} label="Total grant value" />
                <Metric
                  value={new Set(f.grants.map((g) => g.programmeId)).size}
                  label="Linked programmes"
                />
                <Metric
                  value={`${onTrack}/${indicators.length}`}
                  label="KPIs on track"
                />
                <Metric
                  value={f.grants.reduce((sum, g) => sum + g.alerts.length, 0)}
                  label="Open alerts"
                />
                <Metric value={indicators.length} label="KPIs tracked" />
              </div>
              <div className="mt-4 flex flex-wrap gap-1">
                {f.grants.map((g) => (
                  <Badge key={g.id}>{g.programme.name}</Badge>
                ))}
                {[
                  ...new Set(
                    f.grants.map((g) => g.framework?.name).filter(Boolean),
                  ),
                ].map((name) => (
                  <Badge tone="blue" key={name}>
                    {name}
                  </Badge>
                ))}
              </div>
              {next && (
                <p className="mt-4 flex items-center gap-2 text-xs text-slate-600">
                  <Calendar size={14} className="text-amber-600" />
                  Next report {shortDate(next.nextReportDate)}
                </p>
              )}
              <Link
                href={`/funders/${f.id}`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
              >
                View funder workspace <ArrowRight size={15} />
              </Link>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
