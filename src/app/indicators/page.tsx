import { PageHeader, input } from "@/components/ui";
import { IndicatorTable } from "@/components/indicator-table";
import { db } from "@/lib/db";

export const dynamic="force-dynamic";
export default async function IndicatorsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const q=await searchParams;
  const [programmes,funders,indicators]=await Promise.all([
    db.programme.findMany(),db.funder.findMany(),
    db.indicator.findMany({where:{archived:false,...(q.status?{status:q.status}:{}),...(q.attention?{status:{in:["AT_RISK","OFF_TRACK"]}}:{}),...(q.programme?{programmeId:q.programme}:{}),...(q.funder?{grant:{funderId:q.funder}}:{}),...(q.level?{resultLevel:q.level}:{}),...(q.review?{reviewStatus:q.review}:{})},include:{programme:{select:{name:true}},grant:{include:{funder:{select:{name:true}},framework:{select:{name:true}}}},requirement:{select:{code:true}},dataFields:true},orderBy:[{reviewStatus:"desc"},{name:"asc"}]})
  ]);
  const rows=indicators.map(i=>({...i,lastUpdated:i.lastUpdated?.toISOString()??null}));
  return <><PageHeader eyebrow="Indicators" title="Indicator registry" description="Expand any KPI to inspect its formula, required data points, questions, validation and calculation roles."/>
    {q.updated&&<p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Indicator updated successfully.</p>}
    <form className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-6"><select className={input} name="programme" defaultValue={q.programme}><option value="">All programmes</option>{programmes.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><select className={input} name="funder" defaultValue={q.funder}><option value="">All funders</option>{funders.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select><select className={input} name="level" defaultValue={q.level}><option value="">All result levels</option>{["INPUT","ACTIVITY","OUTPUT","OUTCOME","IMPACT"].map(x=><option key={x}>{x}</option>)}</select><select className={input} name="status" defaultValue={q.status}><option value="">All statuses</option>{["ON_TRACK","AT_RISK","OFF_TRACK","NO_DATA"].map(x=><option key={x}>{x.replaceAll("_"," ")}</option>)}</select><select className={input} name="review" defaultValue={q.review}><option value="">All review states</option><option>SUGGESTED</option><option>APPROVED</option><option>REJECTED</option></select><button className="rounded-lg border border-slate-300 bg-slate-50 text-sm font-semibold hover:bg-slate-100">Apply filters</button></form>
    <IndicatorTable indicators={rows}/>
  </>;
}
