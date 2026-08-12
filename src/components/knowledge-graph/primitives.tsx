import * as React from "react";
import { cn } from "@/lib/utils";
export function KGCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
export function KGCardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-4 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]",
        className,
      )}
      {...props}
    />
  );
}
export function KGCardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 pb-3", className)} {...props} />;
}
export function KGTag({
  kind = "neutral",
  className,
  ...props
}: {
  kind?: "sector" | "subsector" | "combo" | "neutral";
} & React.HTMLAttributes<HTMLSpanElement>) {
  const tone = {
    sector: "bg-violet-500/15 text-violet-700 border-violet-500/30",
    subsector: "bg-cyan-500/15 text-cyan-700 border-cyan-500/30",
    combo: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    neutral:
      "bg-[var(--muted)] text-[var(--foreground)] border-[var(--border)]",
  }[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
        tone,
        className,
      )}
      {...props}
    />
  );
}
export function KGPill({
  active,
  className,
  ...props
}: { active?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "w-full rounded-lg border border-transparent px-3 py-2 text-left text-sm transition-colors",
        active
          ? "border-violet-500/40 bg-violet-500/15 text-[var(--foreground)]"
          : "text-[var(--foreground)] hover:bg-[var(--muted)]",
        className,
      )}
      {...props}
    />
  );
}
