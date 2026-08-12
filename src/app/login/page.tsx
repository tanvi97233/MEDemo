import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-9">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white">
            <ShieldCheck size={23} />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Welcome to EvalCanvas
            </h1>
            <p className="text-xs text-slate-500">
              Sign in to your NGO workspace
            </p>
          </div>
        </div>
        <p className="mt-7 text-sm leading-6 text-slate-600">
          Your programmes, beneficiary evidence and funder reporting workspace
          are protected by an encrypted session.
        </p>
        <LoginForm next={next} />
        <div className="mt-6 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">
          <strong>Demo account</strong>
          <br />
          asha@demo.evalcanvas.org · EvalCanvas!2026
        </div>
      </div>
    </main>
  );
}
