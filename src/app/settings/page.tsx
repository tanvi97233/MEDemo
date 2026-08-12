import {
  Bell,
  Building2,
  Info,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge, Card, PageHeader, input } from "@/components/ui";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const [org, users, frameworks] = await Promise.all([
    db.organisation.findFirst(),
    db.user.findMany(),
    db.framework.findMany({ include: { requirements: true } }),
  ]);
  const sections = [
    {
      id: "organisation",
      icon: Building2,
      title: "Organisation profile",
      body: (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Organisation name" value={org?.name} />
          <Field label="Country" value={org?.country} />
          <div className="sm:col-span-2">
            <Field label="Mission" value={org?.mission} />
          </div>
        </div>
      ),
    },
    {
      id: "users",
      icon: Users,
      title: "Users & roles",
      body: (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
            >
              <div>
                <p className="text-sm font-semibold">{u.name}</p>
                <p className="text-xs text-slate-500">{u.email}</p>
              </div>
              <Badge tone="blue">{u.role.replaceAll("_", " ")}</Badge>
            </div>
          ))}
          <button
            title="User invitations are not enabled in this demo"
            disabled
            className="text-sm font-semibold text-slate-400"
          >
            + Invite user · Coming soon
          </button>
        </div>
      ),
    },
    {
      id: "permissions",
      icon: ShieldCheck,
      title: "Roles & permissions",
      body: (
        <p className="text-sm leading-6 text-slate-600">
          Admins manage organisation settings and approvals; M&E Managers
          configure programmes, indicators, quality and reports; Data Collectors
          submit and review assigned records. Enforcement is data-model-ready;
          production authentication is deferred.
        </p>
      ),
    },
    {
      id: "frameworks",
      icon: Settings2,
      title: "Framework registry",
      body: (
        <div className="space-y-3">
          {frameworks.map((f: any) => (
            <div key={f.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex justify-between">
                <p className="text-sm font-semibold">{f.name}</p>
                <Badge>{f.requirements.length} requirements</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">{f.description}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "notifications",
      icon: Bell,
      title: "Notification preferences",
      body: (
        <div className="space-y-3">
          {[
            "High-severity indicator alerts",
            "Missing submission reminders",
            "Report deadline reminders",
            "Weekly evidence digest",
          ].map((x, i) => (
            <label
              className="flex items-center justify-between text-sm"
              key={x}
            >
              {x}
              <input
                type="checkbox"
                defaultChecked={i < 3}
                disabled
                title="Displayed policy; preference editing is coming soon"
                className="h-4 w-4 accent-blue-600"
              />
            </label>
          ))}
        </div>
      ),
    },
    {
      id: "profile",
      icon: LockKeyhole,
      title: "Profile & security",
      body: (
        <div id="security" className="grid gap-4 sm:grid-cols-2">
          <Field label="Display name" value="Asha Mehta" />
          <Field label="Email" value="asha@demo.evalcanvas.org" />
          <button
            title="Password changes are not enabled in this demo"
            disabled
            className="w-fit rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-400"
          >
            Change password · Coming soon
          </button>
        </div>
      ),
    },
    {
      id: "about",
      icon: Info,
      title: "About",
      body: (
        <p className="text-sm leading-6 text-slate-600">
          EvalCanvas Greenfield MVP · local SQLite demonstration. Built for
          credible Monitoring, Evaluation and Learning workflows, with
          transparent draft generation and human approval.
        </p>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Workspace configuration"
        description="Manage the NGO workspace, people, frameworks, notification rules and security preferences."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {sections.map((s) => (
          <Card className="p-5" key={s.id}>
            <div id={s.id} className="mb-4 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <s.icon size={17} />
              </span>
              <h2 className="font-bold">{s.title}</h2>
            </div>
            {s.body}
          </Card>
        ))}
      </div>
    </>
  );
}
function Field({ label, value }: { label: string; value?: string }) {
  return (
    <label className="text-xs font-semibold">
      {label}
      <input className={`${input} mt-1 bg-slate-50`} defaultValue={value} readOnly aria-readonly="true" />
    </label>
  );
}
