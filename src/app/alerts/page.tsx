import { updateAlertAction } from "@/app/actions";
import { Badge, Card, PageHeader, StatusBadge } from "@/components/ui";
import { db } from "@/lib/db";
import { shortDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function AlertsPage() {
  const alerts = await db.alert.findMany({
    include: {
      programme: true,
      grant: { include: { funder: true } },
      indicator: true,
    },
    orderBy: [{ status: "asc" }, { triggeredAt: "desc" }],
  });
  return (
    <>
      <PageHeader
        eyebrow="Alerts"
        title="Early-warning rules"
        description="Transparent, data-driven signals for underperformance, incomplete or late data, and upcoming reporting commitments."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          ["Open", alerts.filter((a) => a.status === "OPEN").length, "red"],
          [
            "Acknowledged",
            alerts.filter((a) => a.status === "ACKNOWLEDGED").length,
            "amber",
          ],
          [
            "Resolved",
            alerts.filter((a) => a.status === "RESOLVED").length,
            "green",
          ],
        ].map(([n, v, t]) => (
          <Card className="p-4" key={n}>
            <Badge tone={t as "red" | "amber" | "green"}>{n}</Badge>
            <p className="mt-2 text-2xl font-bold">{v}</p>
          </Card>
        ))}
      </div>
      <div className="space-y-3">
        {alerts.map((a) => (
          <Card
            className={`border-l-4 p-5 ${a.severity === "HIGH" ? "border-l-red-500" : a.severity === "MEDIUM" ? "border-l-amber-500" : "border-l-blue-500"}`}
            key={a.id}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    tone={
                      a.severity === "HIGH"
                        ? "red"
                        : a.severity === "MEDIUM"
                          ? "amber"
                          : "blue"
                    }
                  >
                    {a.severity}
                  </Badge>
                  <Badge>{a.type.replaceAll("_", " ")}</Badge>
                  <StatusBadge status={a.status} />
                </div>
                <h2 className="mt-3 font-bold">{a.reason}</h2>
                <p className="mt-2 text-xs text-slate-500">
                  {a.programme.name} · {a.grant?.funder.name ?? "Internal"}
                  {a.indicator ? ` · ${a.indicator.name}` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Triggered {shortDate(a.triggeredAt)} · Owner {a.owner}
                </p>
              </div>
              {a.status !== "RESOLVED" && (
                <div className="flex gap-2">
                  {a.status === "OPEN" && (
                    <form action={updateAlertAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        name="status"
                        value="ACKNOWLEDGED"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                      >
                        Acknowledge
                      </button>
                    </form>
                  )}
                  <form action={updateAlertAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button
                      name="status"
                      value="RESOLVED"
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Resolve
                    </button>
                  </form>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      <Card className="mt-5 p-5">
        <h2 className="font-bold">Active rule definitions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [
              "Indicator below target",
              "Actual below 75% of target creates a high-severity signal.",
            ],
            [
              "Indicator at risk",
              "Actual is between 75% and 99% of target and needs attention.",
            ],
            [
              "Missing / overdue submission",
              "Expected programme-location record absent after period close.",
            ],
            ["Low completeness", "Required-field completeness below 80%."],
            [
              "Reporting deadline",
              "Grant report due within the configured warning window.",
            ],
          ].map(([t, d]) => (
            <div className="rounded-xl bg-slate-50 p-4" key={t}>
              <p className="text-sm font-semibold">{t}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{d}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
