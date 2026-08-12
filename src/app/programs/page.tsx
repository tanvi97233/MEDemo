import Link from "next/link";
import { ArrowRight, MapPin, Plus, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { money, shortDate } from "@/lib/format";
import { Badge, Card, PageHeader, StatusBadge, button } from "@/components/ui";
export const dynamic = "force-dynamic";
export default async function ProgramsPage() {
  const programmes = await db.programme.findMany({
    where: { status: "ACTIVE" },
    include: {
      grants: { include: { funder: true } },
      indicators: true,
      taxonomy: { include: { taxonomyNode: true } },
      submissions: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PageHeader
        eyebrow="Programs"
        title="Programme portfolio"
        description="Structure programme intent, connect funder obligations and turn the results chain into approved evidence plans."
        actions={
          <Link href="/programs/new" className={button}>
            <Plus size={16} /> Create programme
          </Link>
        }
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {programmes.map((p) => {
          const on = p.indicators.filter((i) => i.status === "ON_TRACK").length;
          return (
            <Card key={p.id} className="group p-5 hover:border-blue-300">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge tone="blue">{p.code}</Badge>
                    <StatusBadge status={p.reviewStatus} />
                    {p.generatorSource === "DEMO_GENERATED" && (
                      <Badge tone="amber">
                        <Sparkles size={11} className="mr-1" /> Demo-generated
                        draft
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-950">{p.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                    {p.description}
                  </p>
                </div>
                <Link
                  href={`/programs/${p.id}`}
                  className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                >
                  <ArrowRight size={19} />
                </Link>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <MapPin size={14} />
                {p.geography}
                <span>·</span>
                {shortDate(p.startDate)}–{shortDate(p.endDate)}
              </div>
              <div className="mt-5 grid grid-cols-4 gap-3 border-t border-slate-100 pt-4">
                <div>
                  <p className="text-lg font-bold">{p.grants.length}</p>
                  <p className="text-[11px] text-slate-500">Funders</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{p.indicators.length}</p>
                  <p className="text-[11px] text-slate-500">Indicators</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-700">{on}</p>
                  <p className="text-[11px] text-slate-500">On track</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{p.submissions.length}</p>
                  <p className="text-[11px] text-slate-500">Submissions</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {p.taxonomy.map((t) => (
                  <Badge key={t.taxonomyNodeId}>{t.taxonomyNode.name}</Badge>
                ))}
                {p.grants.map((g) => (
                  <Badge key={g.id} tone="blue">
                    {g.funder.name}
                  </Badge>
                ))}
              </div>
              <p className="mt-4 text-xs font-medium text-slate-600">
                Budget {money(p.budget)}
              </p>
            </Card>
          );
        })}
      </div>
    </>
  );
}
