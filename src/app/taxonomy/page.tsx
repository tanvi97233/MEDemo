import { Search } from "lucide-react";
import { updateProgrammeTaxonomyAction } from "@/app/actions";
import { Badge, Card, PageHeader, button, input } from "@/components/ui";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TaxonomyPage({ searchParams }: { searchParams: Promise<{ q?: string; programme?: string }> }) {
  const q = await searchParams;
  const [nodes, programmes] = await Promise.all([
    db.taxonomyNode.findMany({ include: { programmes: { include: { programme: { include: { indicators: { where: { archived: false } } } } } }, parent: true } }),
    db.programme.findMany({ orderBy: { name: "asc" } }),
  ]);
  const childrenOf = (id: string) => nodes.filter((node) => node.parentId === id);
  const linkedIds = new Set<string>();
  for (const node of nodes.filter((item) => item.programmes.length)) {
    linkedIds.add(node.id);
    if (node.parentId) linkedIds.add(node.parentId);
    const parent = nodes.find((item) => item.id === node.parentId);
    if (parent?.parentId) linkedIds.add(parent.parentId);
  }
  const sectors = nodes.filter((node) => node.level === "SECTOR" && linkedIds.has(node.id));
  const focusNodes = nodes.filter((node) => node.level === "SUB_SUB_SECTOR");
  const query = (q.q ?? "").toLowerCase();
  return <>
    <PageHeader eyebrow="Taxonomy Explorer" title="Programme-linked classification" description="Browse only persisted classifications connected to saved programmes, inspect linked KPIs, and correct a programme’s confirmed hierarchy." />
    <form className="mb-5 flex max-w-xl gap-2"><label className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input name="q" defaultValue={q.q} className={`${input} pl-9`} placeholder="Search linked taxonomy nodes…" /></label><button className={button}>Search</button></form>
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">{sectors.map((sector) => {
        const subsectors = childrenOf(sector.id).filter((child) => linkedIds.has(child.id));
        const visible = !query || sector.name.toLowerCase().includes(query) || subsectors.some((child) => child.name.toLowerCase().includes(query) || childrenOf(child.id).some((focus) => focus.name.toLowerCase().includes(query)));
        if (!visible) return null;
        return <details key={sector.id} open className="rounded-2xl border border-slate-200 bg-white"><summary className="cursor-pointer p-5 font-bold text-slate-950">{sector.name} <Badge tone="blue">Sector</Badge></summary><div className="space-y-3 border-t border-slate-100 p-5">{subsectors.map((subsector) => <details key={subsector.id} open className="rounded-xl border border-slate-200"><summary className="cursor-pointer p-4 font-semibold">{subsector.name} <Badge>Sub-sector</Badge></summary><div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2">{childrenOf(subsector.id).filter((focus) => linkedIds.has(focus.id)).map((focus) => <Card key={focus.id} className="p-4"><div className="flex justify-between gap-2"><h3 className="font-semibold">{focus.name}</h3><Badge>Sub-sub-sector</Badge></div><p className="mt-3 text-xs font-bold uppercase text-slate-400">Linked programmes</p>{focus.programmes.map((link) => <div className="mt-2" key={link.programmeId}><p className="text-sm font-medium">{link.programme.name}</p><p className="text-xs text-slate-500">{link.programme.indicators.length} linked indicators</p></div>)}</Card>)}</div></details>)}</div></details>;
      })}</div>
      <Card className="h-fit p-5"><h2 className="font-bold">Correct classification</h2><p className="mt-1 text-xs leading-5 text-slate-500">Choose a saved programme and an existing canonical sub-sub-sector. Saving replaces its hierarchy with that node and its parents.</p><form action={updateProgrammeTaxonomyAction} className="mt-4 space-y-4"><label className="block text-xs font-semibold">Programme<select name="programmeId" required className={`${input} mt-1`} defaultValue={q.programme}>{programmes.map((programme) => <option key={programme.id} value={programme.id}>{programme.name}</option>)}</select></label><label className="block text-xs font-semibold">Confirmed sub-sub-sector<select name="focusId" required className={`${input} mt-1`}><option value="">Select canonical node</option>{focusNodes.map((node) => <option key={node.id} value={node.id}>{node.parent?.name} → {node.name}</option>)}</select></label><button className={`${button} w-full`}>Save corrected classification</button></form><p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Custom taxonomy-node creation remains administrator-only and is not enabled in this demo, so no unconfirmed duplicate labels can be created.</p></Card>
    </div>
  </>;
}
