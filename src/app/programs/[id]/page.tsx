import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, Database, Network, Sparkles } from "lucide-react";
import { approveProgrammeAction, saveProgrammeReviewAction } from "@/app/actions";
import { Badge, button, Card, input, PageHeader, StatusBadge } from "@/components/ui";
import { db } from "@/lib/db";
import { money, shortDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function ProgrammeDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const p = await db.programme.findUnique({
    where: { id },
    include: {
      grants: { include: { funder: true, framework: true } },
      taxonomy: {
        include: {
          taxonomyNode: {
            include: { parent: { include: { parent: true } } },
          },
        },
      },
      tocNodes: { orderBy: { sortOrder: "asc" } },
      indicators: true,
      dataFields: true,
    },
  });
  if (!p) notFound();
  const customFields = parseCustomFields(p.customFields);
  return (
    <>
      <PageHeader
        eyebrow="Programme review"
        title={p.name}
        description={`${p.code} · ${p.geography} · ${shortDate(p.startDate)} to ${shortDate(p.endDate)}`}
        actions={
          <>
            {p.reviewStatus !== "APPROVED" && (
              <form action={approveProgrammeAction}>
                <input type="hidden" name="id" value={p.id} />
                <button className={button}>
                  <Check size={16} />
                  Approve & activate
                </button>
              </form>
            )}
            <Link
              href="/data/collect"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"
            >
              <Database size={16} />
              Collect data
            </Link>
          </>
        }
      />
      {q.created && (
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <strong>Draft generated.</strong> Review and edit every suggestion
          before activation. This result is{" "}
          {p.generatorSource === "DEMO_GENERATED"
            ? "deterministically demo-generated"
            : "AI-assisted"}
          .
        </div>
      )}
      {q.saved && <p className="mb-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Programme review changes saved.</p>}
      {q.error && <p className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{q.error}</p>}
      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="flex items-center gap-2">
            <h2 className="font-bold">Structured programme</h2>
            <StatusBadge status={p.reviewStatus} />
            {p.generatorSource === "DEMO_GENERATED" && (
              <Badge tone="amber">
                <Sparkles size={12} className="mr-1" />
                Demo-generated
              </Badge>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">Every generated field remains editable until you are satisfied. Save changes before approving and activating the programme.</p>
          <form action={saveProgrammeReviewAction} className="mt-5 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={p.id}/>
            <ReviewField name="name" label="Programme title" value={p.name} required />
            <ReviewField name="geography" label="Geography" value={p.geography} required />
            <ReviewField name="targetPopulation" label="Target population" value={p.targetPopulation} required />
            <ReviewField name="budget" label="Budget (INR)" value={String(p.budget)} type="number" required />
            <ReviewField name="startDate" label="Start date" value={p.startDate.toISOString().slice(0,10)} type="date" required />
            <ReviewField name="endDate" label="End date" value={p.endDate.toISOString().slice(0,10)} type="date" required />
            {[
              ["description", "Summary", p.description],
              ["problemStatement", "Problem statement", p.problemStatement],
              ["objectives", "Objectives", p.objectives],
              ["activities", "Activities", p.activities],
              ["outputs", "Outputs", p.outputs],
              ["outcomes", "Outcomes", p.outcomes],
              ["impact", "Intended impact", p.impact],
              ["assumptions", "Assumptions", p.assumptions],
              ["risks", "Risks", p.risks],
            ].map(([name, label, value]) => <ReviewArea key={name} name={name} label={label} value={value} />)}
            <div className="sm:col-span-2"><button className={button}>Save review changes</button></div>
          </form>
          {Object.keys(customFields).length > 0 && (
            <div className="mt-5 border-t border-slate-100 pt-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Custom programme fields
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(customFields).map(([fieldLabel, field]) => (
                  <div className="rounded-lg bg-slate-50 p-3" key={fieldLabel}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {fieldLabel} · {field.type}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {field.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="font-bold">Programme facts</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Budget</dt>
              <dd className="font-bold">{money(p.budget)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Classification</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {p.taxonomy.map((t) => (
                  <Badge key={t.taxonomyNodeId}>
                    {t.taxonomyNode.name} · {Math.round(t.confidence * 100)}%
                  </Badge>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Grants & frameworks</dt>
              {p.grants.map((g) => (
                <dd className="mt-2 rounded-lg bg-slate-50 p-3" key={g.id}>
                  <p className="font-semibold">{g.funder.name}</p>
                  <p className="text-xs text-slate-500">
                    {g.framework?.name ?? "Framework pending"}
                  </p>
                </dd>
              ))}
            </div>
          </dl>
        </Card>
      </div>
      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Network size={18} className="text-blue-600" />
          <div>
            <h2 className="font-bold">Extracted programme taxonomy</h2>
            <p className="text-xs text-slate-500">
              These confirmed classifications drive indicator generation and the
              Taxonomy Explorer.
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["Sectors", "SECTOR"],
            ["Sub-sectors", "SUB_SECTOR"],
            ["Sub-sub-sector focus", "SUB_SUB_SECTOR"],
          ].map(([label, level], groupIndex) => (
            <Card key={level} className="relative p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {label}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.taxonomy
                  .filter((item) => item.taxonomyNode.level === level)
                  .map((item) => (
                    <Badge key={item.taxonomyNodeId} tone="blue">
                      {item.taxonomyNode.name}
                    </Badge>
                  ))}
                {!p.taxonomy.some(
                  (item) => item.taxonomyNode.level === level,
                ) && <span className="text-xs text-slate-400">Not set</span>}
              </div>
              {groupIndex < 2 && (
                <span className="absolute -right-3 top-1/2 z-10 hidden text-blue-400 md:block">
                  →
                </span>
              )}
            </Card>
          ))}
        </div>
      </section>
      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Network size={18} className="text-blue-600" />
          <h2 className="font-bold">Theory of Change / results chain</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {p.tocNodes.map((n, i) => (
            <Card key={n.id} className="relative p-4">
              <Badge tone="blue">{n.level}</Badge>
              <h3 className="mt-3 text-sm font-bold">{n.title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                <strong>Assumption:</strong> {n.assumptions}
              </p>
              {i < p.tocNodes.length - 1 && (
                <span className="absolute -right-3 top-1/2 z-10 hidden text-blue-400 md:block">
                  →
                </span>
              )}
            </Card>
          ))}
        </div>
      </section>
      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-bold">Suggested indicator plan</h2>
            <p className="text-xs text-slate-500">
              Edit, approve or reject in the Indicator Registry before field
              use.
            </p>
          </div>
          <Link
            href={`/indicators?programme=${p.id}`}
            className="text-sm font-semibold text-blue-600"
          >
            Open registry →
          </Link>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Level</th>
                <th>Target</th>
                <th>Data field / question</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {p.indicators.map((i) => (
                <tr key={i.id}>
                  <td>
                    <Link
                      href={`/indicators/${i.id}`}
                      className="font-semibold text-slate-900 hover:text-blue-600"
                    >
                      {i.name}
                    </Link>
                    <p className="max-w-sm text-xs text-slate-500">
                      {i.definition}
                    </p>
                  </td>
                  <td>
                    <Badge>{i.resultLevel}</Badge>
                  </td>
                  <td>
                    {i.target} {i.unit}
                  </td>
                  <td className="max-w-xs text-xs text-slate-600">
                    {p.dataFields.find((f) => f.indicatorId === i.id)
                      ?.question ?? "Configure after approval"}
                  </td>
                  <td>
                    <StatusBadge status={i.reviewStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function parseCustomFields(value: string) {
  try {
    return JSON.parse(value) as Record<string, { type: string; value: string }>;
  } catch {
    return {};
  }
}

function ReviewField({name,label,value,type="text",required=false}:{name:string;label:string;value:string;type?:string;required?:boolean}) {
  return <label className="text-xs font-semibold text-slate-700">{label}<input name={name} type={type} defaultValue={value} required={required} min={type==="number"?0:undefined} className={`${input} mt-1`}/></label>;
}

function ReviewArea({name,label,value}:{name:string;label:string;value:string}) {
  return <label className="text-xs font-semibold text-slate-700 sm:col-span-2">{label}<textarea name={name} defaultValue={value} required={!['assumptions','risks'].includes(name)} className={`${input} mt-1 min-h-24 resize-y`}/></label>;
}
