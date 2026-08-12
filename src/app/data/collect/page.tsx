import { CollectorForm } from "@/components/collector-form";
import { Card, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
export const dynamic="force-dynamic";
export default async function CollectPage({searchParams}:{searchParams:Promise<{error?:string}>}) {
  const [{error},programmes]=await Promise.all([searchParams,db.programme.findMany({where:{reviewStatus:"APPROVED"},include:{grants:{include:{funder:true}},indicators:{where:{archived:false},include:{dataFields:true}}}})]);
  return <><PageHeader eyebrow="Data Collection / UniCollector" title="New monitoring submission" description="Select one approved KPI and reporting period, then submit the exact data points required for its calculation."/>{error&&<p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<Card className="mx-auto max-w-4xl p-5 sm:p-7"><CollectorForm programmes={programmes}/></Card></>;
}
