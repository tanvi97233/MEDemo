"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Landmark,
  Gauge,
  Database,
  Network,
  FileText,
  BellRing,
  Settings,
  Menu,
  X,
  ChevronDown,
  Bell,
  ShieldCheck,
} from "lucide-react";
import { clsx } from "clsx";
import { logoutAction } from "@/app/auth-actions";

const nav = [
  ["Impact Overview", "/", LayoutDashboard],
  ["Programs", "/programs", FolderKanban],
  ["Funders", "/funders", Landmark],
  ["Indicators", "/indicators", Gauge],
  ["Taxonomy Explorer", "/taxonomy", Network],
  ["Reports", "/reports", FileText],
  ["Alerts", "/alerts", BellRing],
  ["Settings", "/settings", Settings],
] as const;

function GlobalSelect({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <label className="hidden lg:block">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={params.get(name) ?? "all"}
        onChange={(e) => {
          const p = new URLSearchParams(params);
          if (e.target.value === "all") p.delete(name);
          else p.set(name, e.target.value);
          router.push(`?${p}`);
        }}
        className="max-w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
      >
        <option value="all">{label}: All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AppShell({
  children,
  user,
  programmes,
  funders,
  alertCount,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role: string } | null;
  programmes: { id: string; name: string }[];
  funders: { id: string; name: string }[];
  alertCount: number;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(false);
  if (path === "/login" || !user) return children;
  const initials = user.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2);
  return (
    <div className="min-h-screen bg-slate-50">
      {open && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={clsx(
          "no-print fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-blue-900 bg-[#0b2b52] text-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-18 items-center justify-between border-b border-white/10 px-5">
          <Link
            href="/"
            className="flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500">
              <ShieldCheck size={20} />
            </span>
            <span>
              <strong className="block text-lg tracking-tight">
                EvalCanvas
              </strong>
              <small className="text-[10px] uppercase tracking-[.18em] text-blue-200">
                Evidence with purpose
              </small>
            </span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="mx-4 mt-5 rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200">
            Monitoring & Evaluation
          </p>
          <p className="mt-1 truncate text-sm font-semibold">
            Sankalp Community Foundation
          </p>
        </div>
        <nav className="mt-5 flex-1 space-y-1 px-3">
          {nav.slice(0, 4).map(([name, href, Icon]) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <NavLink
                key={href}
                name={name}
                href={href}
                Icon={Icon}
                active={active}
                close={() => setOpen(false)}
              />
            );
          })}
          <div>
            <div
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                path.startsWith("/data")
                  ? "bg-blue-500 text-white"
                  : "text-blue-100",
              )}
            >
              <Database size={18} />
              Data
              <ChevronDown size={14} className="ml-auto" />
            </div>
            <div className="ml-7 mt-1 space-y-1 border-l border-white/15 pl-2">
              <Link
                onClick={() => setOpen(false)}
                href="/data"
                className={clsx(
                  "block rounded-md px-3 py-2 text-xs",
                  path === "/data" || path === "/data/collect"
                    ? "bg-white/10 text-white"
                    : "text-blue-200 hover:text-white",
                )}
              >
                Data Collection
              </Link>
              <Link
                onClick={() => setOpen(false)}
                href="/data/connectors"
                className={clsx(
                  "block rounded-md px-3 py-2 text-xs",
                  path.startsWith("/data/connectors")
                    ? "bg-white/10 text-white"
                    : "text-blue-200 hover:text-white",
                )}
              >
                Data Connectors
              </Link>
            </div>
          </div>
          {nav.slice(4).map(([name, href, Icon]) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link
                onClick={() => setOpen(false)}
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  active
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-blue-100 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon size={18} />
                {name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs text-blue-200">
          <p>Demo workspace</p>
          <p className="mt-1 text-white">Local · Persistent · Seeded</p>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-20 flex h-18 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            aria-label="Open navigation"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu size={21} />
          </button>
          <div className="flex flex-1 items-center gap-2">
            <GlobalSelect
              name="programme"
              label="Programme"
              options={[
                ...programmes.map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              ]}
            />
            <GlobalSelect
              name="funder"
              label="Funder"
              options={funders.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
            />
            <GlobalSelect
              name="period"
              label="Period"
              options={[
                { value: "q3", label: "2026 Q3" },
                { value: "q2", label: "2026 Q2" },
                { value: "ytd", label: "2026 YTD" },
              ]}
            />
          </div>
          <Link
            href="/alerts"
            aria-label="Notifications"
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <Bell size={20} />
            {alertCount > 0 && (
              <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {alertCount > 99 ? "99+" : alertCount}
              </span>
            )}
          </Link>
          <div className="relative">
            <button
              onClick={() => setProfile(!profile)}
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                {initials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-semibold text-slate-900">
                  {user.name}
                </span>
                <span className="block text-[10px] text-slate-500">
                  {user.role.replaceAll("_", " ")}
                </span>
              </span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>
            {profile && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 text-sm shadow-xl">
                <Link
                  href="/settings#profile"
                  className="block rounded-lg px-3 py-2 hover:bg-slate-50"
                >
                  Profile
                </Link>
                <Link
                  href="/settings#security"
                  className="block rounded-lg px-3 py-2 hover:bg-slate-50"
                >
                  Change password
                </Link>
                <form action={logoutAction}>
                  <button className="w-full rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50">
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        </header>
        <main className="print-full mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({
  name,
  href,
  Icon,
  active,
  close,
}: {
  name: string;
  href: string;
  Icon: React.ComponentType<{ size?: number }>;
  active: boolean;
  close: () => void;
}) {
  return (
    <Link
      onClick={close}
      href={href}
      className={clsx(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
        active
          ? "bg-blue-500 text-white shadow-sm"
          : "text-blue-100 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon size={18} />
      {name}
    </Link>
  );
}
