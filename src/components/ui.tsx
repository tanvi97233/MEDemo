import { clsx } from "clsx";
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={clsx("rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,.05)]", className)}>{children}</div>;
}
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "green"|"amber"|"red"|"blue"|"neutral" }) {
  const tones = { green: "bg-emerald-50 text-emerald-700 ring-emerald-200", amber: "bg-amber-50 text-amber-700 ring-amber-200", red: "bg-red-50 text-red-700 ring-red-200", blue: "bg-blue-50 text-blue-700 ring-blue-200", neutral: "bg-slate-100 text-slate-600 ring-slate-200" };
  return <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset whitespace-nowrap", tones[tone])}>{children}</span>;
}
export function StatusBadge({ status }: { status: string }) {
  const tone = status === "ON_TRACK" || status === "VALID" || status === "APPROVED" || status === "FINAL" ? "green" : status === "AT_RISK" || status === "ACKNOWLEDGED" || status === "DRAFT" ? "amber" : status === "OFF_TRACK" || status === "OPEN" || status === "REJECTED" ? "red" : "neutral";
  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}
export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: ReactNode }) {
  return <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-blue-600">{eyebrow}</p>}<h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p></div>{actions && <div className="flex shrink-0 gap-2">{actions}</div>}</div>;
}
export function EmptyState({ title, detail }: { title: string; detail: string }) { return <Card className="p-10 text-center"><p className="font-semibold text-slate-900">{title}</p><p className="mt-1 text-sm text-slate-500">{detail}</p></Card>; }
export const button = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500";
export const input = "min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
export const tableWrap = "overflow-x-auto rounded-2xl border border-slate-200 bg-white";
