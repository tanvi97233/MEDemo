import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  DatabaseZap,
  HeartHandshake,
  Landmark,
  ShieldAlert,
  Target,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { db } from "@/lib/db";
import { money, number, shortDate } from "@/lib/format";
import { Badge, Card, PageHeader, StatusBadge } from "@/components/ui";
import {
  DisaggregationChart,
  ProgrammeChart,
  ReachChart,
  StatusChart,
  TargetChart,
} from "@/components/dashboard-charts";

export const dynamic = "force-dynamic";
const dashboardNow = new Date();
const reportWindowEnd = new Date(dashboardNow.getTime() + 60 * 86400000);
export default async function Dashboard() {
  const [
    programmes,
    funders,
    grants,
    indicators,
    submissions,
    alerts,
    allSubmissionKeys,
  ] = await Promise.all([
    db.programme.findMany(),
    db.funder.findMany(),
    db.grant.findMany({
      include: {
        funder: true,
        programme: true,
        indicators: true,
        framework: true,
      },
      orderBy: { nextReportDate: "asc" },
    }),
    db.indicator.findMany({
      where: { archived: false },
      include: { programme: true },
    }),
    db.submission.findMany({
      include: { programme: true, submittedBy: true },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
    db.alert.findMany({ where: { status: { not: "RESOLVED" } } }),
      db.submission.findMany({ select: { beneficiaryId: true, gender: true, submittedAt: true, programmeId: true } }),
  ]);
  const totalGrant = grants.reduce((s, g) => s + g.amount, 0);
  const onTrack = indicators.filter((i) => i.status === "ON_TRACK").length;
  const concerns = indicators.filter(
    (i) => i.status === "AT_RISK" || i.status === "OFF_TRACK",
  ).length;
  const completeness = indicators.length
    ? Math.round(
        indicators.reduce((s, i) => s + i.completeness, 0) / indicators.length,
      )
    : 0;
  const beneficiaries = new Set(allSubmissionKeys.map((s) => s.beneficiaryId))
    .size;
  const reportsDue = grants.filter(
    (g) =>
      g.nextReportDate >= dashboardNow &&
      g.nextReportDate <= reportWindowEnd,
  ).length;
  const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const reachData = monthLabels.map((m,index)=>({m,v:new Set(allSubmissionKeys.filter(s=>s.submittedAt.getFullYear()===2026&&s.submittedAt.getMonth()<=index).map(s=>s.beneficiaryId)).size}));
  const programmeData = programmes.map(programme=>{const linked=indicators.filter(i=>i.programmeId===programme.id);return{name:programme.name.length>18?`${programme.name.slice(0,17)}…`:programme.name,score:linked.length?Math.round(linked.reduce((sum,i)=>sum+(i.target?Math.min(100,i.actual/i.target*100):100),0)/linked.length):0}});
  const genderData = Array.from(new Set(allSubmissionKeys.map(s=>s.gender))).map(gender=>({name:gender,value:new Set(allSubmissionKeys.filter(s=>s.gender===gender).map(s=>s.beneficiaryId)).size}));
  const metrics = [
    [
      "Total beneficiaries",
      number(beneficiaries),
      "/data/connectors?tab=unisheets",
      UsersRound,
      "Unique monitored IDs",
    ],
    [
      "Active programmes",
      programmes.filter((p) => p.status === "ACTIVE").length,
      "/programs",
      HeartHandshake,
      "Approved portfolio",
    ],
    [
      "Active funders",
      funders.length,
      "/funders",
      Landmark,
      `${grants.length} active grants`,
    ],
    [
      "Total grant value",
      money(totalGrant),
      "/funders",
      WalletCards,
      "Committed funding",
    ],
    [
      "Submissions received",
      allSubmissionKeys.length,
      "/data/connectors?tab=unisheets",
      DatabaseZap,
      "Persisted records",
    ],
    [
      "Indicators on track",
      onTrack,
      "/indicators?status=ON_TRACK",
      Target,
      `${indicators.length ? Math.round((onTrack / indicators.length) * 100) : 0}% of KPIs`,
    ],
    [
      "At risk / off track",
      concerns,
      "/indicators?attention=true",
      ShieldAlert,
      "Needs attention",
    ],
    [
      "Data completeness",
      `${completeness}%`,
      "/data/connectors?tab=unisheets",
      ClipboardCheck,
      "Across tracked KPIs",
    ],
    [
      "Open alerts",
      alerts.length,
      "/alerts",
      ShieldAlert,
      `${alerts.filter((a) => a.severity === "HIGH").length} high severity`,
    ],
    ["Reports due", reportsDue, "/reports", CalendarClock, "Within 60 days"],
  ] as const;
  const iconTones = [
    "bg-blue-50 text-blue-600",
    "bg-indigo-50 text-indigo-600",
    "bg-sky-50 text-sky-600",
    "bg-violet-50 text-violet-600",
    "bg-cyan-50 text-cyan-600",
    "bg-emerald-50 text-emerald-600",
    "bg-red-50 text-red-600",
    "bg-amber-50 text-amber-600",
    "bg-red-50 text-red-600",
    "bg-blue-50 text-blue-600",
  ];
  const statusData = [
    { name: "On track", value: onTrack, color: "#059669" },
    {
      name: "At risk",
      value: indicators.filter((i) => i.status === "AT_RISK").length,
      color: "#d97706",
    },
    {
      name: "Off track",
      value: indicators.filter((i) => i.status === "OFF_TRACK").length,
      color: "#dc2626",
    },
    {
      name: "No data",
      value: indicators.filter((i) => i.status === "NO_DATA").length,
      color: "#94a3b8",
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="M&E · Monitoring & Evaluation"
        title="Impact Overview"
        description="NGO-wide programme reach, funder commitments, evidence quality and the issues that need attention."
        actions={
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            href="/reports/new"
          >
            Generate report <ArrowRight size={16} />
          </Link>
        }
      />
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {metrics.map(([name, value, href, Icon, note], i) => (
          <Link
            href={href}
            key={name}
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,.05)] hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
          >
            <div
              className={`mb-4 grid h-9 w-9 place-items-center rounded-xl ${iconTones[i]}`}
            >
              <Icon size={18} />
            </div>
            <p className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
              {value}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-700">{name}</p>
            <p className="mt-1 text-[11px] text-slate-500">{note}</p>
          </Link>
        ))}
      </section>
      <section className="mt-6 grid gap-5 xl:grid-cols-5">
        <Card className="p-5 xl:col-span-3">
          <div className="mb-3">
            <h2 className="font-bold text-slate-900">
              Beneficiary reach over time
            </h2>
            <p className="text-xs text-slate-500">
              Unique participants, cumulative · 2026 YTD
            </p>
          </div>
            <ReachChart data={reachData} />
        </Card>
        <Card className="p-5 xl:col-span-2">
          <h2 className="font-bold text-slate-900">Target vs actual</h2>
          <p className="mb-3 text-xs text-slate-500">
            Selected priority indicators
          </p>
          <TargetChart
            data={indicators
              .slice(0, 5)
              .map((i) => ({
                name: i.name.length > 19 ? `${i.name.slice(0, 18)}…` : i.name,
                target: i.target,
                actual: i.actual,
              }))}
          />
        </Card>
      </section>
      <section className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-bold text-slate-900">Indicator health</h2>
          <p className="text-xs text-slate-500">Across active programmes</p>
          <StatusChart data={statusData} />
        </Card>
        <Card className="p-5">
          <h2 className="font-bold text-slate-900">Programme performance</h2>
          <p className="text-xs text-slate-500">Composite target attainment</p>
            <ProgrammeChart data={programmeData} />
        </Card>
        <Card className="p-5">
          <h2 className="font-bold text-slate-900">Reach by gender</h2>
          <p className="text-xs text-slate-500">Unique beneficiaries</p>
            <DisaggregationChart data={genderData} />
        </Card>
      </section>
      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Funder performance</h2>
            <p className="text-xs text-slate-500">
              Grant value, linked evidence and upcoming commitments
            </p>
          </div>
          <Link
            href="/funders"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            View all funders →
          </Link>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[850px] text-sm">
            <thead>
              <tr>
                <th>Funder / grant</th>
                <th>Programme</th>
                <th>Framework</th>
                <th>Tracked KPIs</th>
                <th>On track</th>
                <th>Grant value</th>
                <th>Next report</th>
              </tr>
            </thead>
            <tbody>
              {grants.map((g) => {
                const pct = g.indicators.length
                  ? Math.round(
                      (g.indicators.filter((i) => i.status === "ON_TRACK")
                        .length /
                        g.indicators.length) *
                        100,
                    )
                  : 0;
                return (
                  <tr key={g.id}>
                    <td>
                      <Link
                        href={`/funders/${g.funderId}`}
                        className="font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {g.funder.name}
                      </Link>
                      <p className="text-xs text-slate-500">{g.name}</p>
                    </td>
                    <td>{g.programme.name}</td>
                    <td>
                      <Badge tone="blue">{g.framework?.name ?? "Custom"}</Badge>
                    </td>
                    <td>{g.indicators.length}</td>
                    <td>
                      <span
                        className={
                          pct >= 70
                            ? "font-semibold text-emerald-700"
                            : "font-semibold text-amber-700"
                        }
                      >
                        {pct}%
                      </span>
                    </td>
                    <td className="font-medium">{money(g.amount)}</td>
                    <td>{shortDate(g.nextReportDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-5 grid gap-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Recent monitoring activity
              </h2>
              <p className="text-xs text-slate-500">
                Latest validated submissions
              </p>
            </div>
              <Link
                href="/data/connectors?tab=unisheets"
              className="text-xs font-semibold text-blue-600"
            >
              Open Unisheets →
            </Link>
          </div>
          <div className="space-y-4">
            {submissions.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                  {s.submittedBy.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {s.submittedBy.name} submitted {s.programme.name} monitoring
                    data
                  </p>
                  <p className="text-xs text-slate-500">
                    {s.location} · {s.reportingPeriod}
                  </p>
                </div>
                <StatusBadge status={s.validationStatus} />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-bold text-slate-900">Data quality</h2>
          <p className="mb-4 text-xs text-slate-500">
            Six-dimension quality check
          </p>
          {[
            ["Completeness", completeness],
            ["Timeliness", 86],
            ["Validity", 94],
            ["Integrity", 98],
            ["Precision", 83],
            ["Reliability", 90],
          ].map(([n, v]) => (
            <div className="mb-3" key={n}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-slate-600">{n}</span>
                <span className="font-bold text-slate-800">{v}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100">
                <div
                  className={`h-1.5 rounded-full ${Number(v) < 85 ? "bg-amber-500" : "bg-blue-600"}`}
                  style={{ width: `${v}%` }}
                />
              </div>
            </div>
          ))}
        </Card>
      </section>
    </>
  );
}
