"use client";
import { useActionState } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { loginAction } from "@/app/auth-actions";
import { button, input } from "./ui";

export function LoginForm({ next = "/" }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="mt-7 space-y-5">
      <input type="hidden" name="next" value={next} />
      <label className="block text-xs font-semibold text-slate-700">
        Email address
        <input
          className={`${input} mt-1.5`}
          type="email"
          name="email"
          autoComplete="email"
          defaultValue="asha@demo.evalcanvas.org"
          required
        />
      </label>
      <label className="block text-xs font-semibold text-slate-700">
        Password
        <input
          className={`${input} mt-1.5`}
          type="password"
          name="password"
          autoComplete="current-password"
          defaultValue="EvalCanvas!2026"
          required
        />
      </label>
      {state?.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}
      <button disabled={pending} className={`${button} w-full`}>
        {pending ? (
          <LoaderCircle className="animate-spin" size={17} />
        ) : (
          <LockKeyhole size={17} />
        )}
        Sign in securely
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
