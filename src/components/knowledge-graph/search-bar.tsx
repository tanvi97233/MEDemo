"use client";
import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchHit, TaxonomyNode } from "@/lib/kg/types";
export function KGSearchBar({
  value,
  onChange,
  hits,
  onPick,
  placeholder = "Search sectors or subsectors…",
}: {
  value: string;
  onChange: (value: string) => void;
  hits: SearchHit[];
  onPick: (node: TaxonomyNode) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const outside = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);
  const handleKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!hits.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIdx((index) => Math.min(index + 1, hits.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIdx((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = hits[activeIdx];
      if (hit) {
        onPick(hit.node);
        setOpen(false);
      }
    } else if (event.key === "Escape") setOpen(false);
  };
  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
        />
        <input
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setActiveIdx(0);
            setOpen(true);
          }}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-lg border border-[var(--border)] bg-[var(--input)] py-2.5 pl-9 pr-9 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30",
          )}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            aria-label="Clear"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {open && value && hits.length > 0 && (
        <div className="scroll-thin absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card)]/95 shadow-lg backdrop-blur-md">
          {hits.map((hit, index) => (
            <button
              key={hit.node.id}
              onMouseEnter={() => setActiveIdx(index)}
              onClick={() => {
                onPick(hit.node);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                index === activeIdx
                  ? "bg-[var(--muted)]"
                  : "hover:bg-[var(--muted)]/50",
              )}
            >
              <span className="truncate text-[var(--foreground)]">
                {hit.node.label}
              </span>
              <span
                className={cn(
                  "ml-3 shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
                  hit.node.type === "sector"
                    ? "bg-violet-500/20 text-violet-700"
                    : "bg-cyan-500/20 text-cyan-700",
                )}
              >
                {hit.node.type}
              </span>
            </button>
          ))}
        </div>
      )}
      {open && value && hits.length === 0 && (
        <div className="absolute z-30 mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--card)]/95 px-3 py-3 text-sm text-[var(--muted-foreground)] shadow-lg">
          No matches for &ldquo;{value}&rdquo;
        </div>
      )}
    </div>
  );
}
