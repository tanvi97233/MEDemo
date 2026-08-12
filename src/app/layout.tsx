import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import "./globals.css";

export const metadata: Metadata = {
  title: "EvalCanvas",
  description: "From programme intent to funder-ready evidence.",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // In development, show a demo fallback user so the app shell/menu is visible
  // even when no session cookie is present. In production, keep original
  // behaviour and hide the shell for unauthenticated requests.
  const devFallbackUser =
    process.env.NODE_ENV !== "production" && !user
      ? { name: "Demo User", email: "demo@local", role: "ADMIN" }
      : null;
  const activeUser = user ?? devFallbackUser;

  const shellData: [{id:string;name:string}[], {id:string;name:string}[], number] = activeUser
    ? await Promise.all([
        db.programme.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        db.funder.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        db.alert.count({ where: { status: { not: "RESOLVED" } } }),
      ])
    : [[], [], 0];
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
          <AppShell
            user={activeUser}
            programmes={shellData[0]}
            funders={shellData[1]}
            alertCount={shellData[2]}
          >
            {children}
          </AppShell>
        </Suspense>
      </body>
    </html>
  );
}
