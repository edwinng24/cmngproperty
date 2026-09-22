"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-brand-900/10 bg-white p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
        Sign in
      </h1>
      <p className="mt-2 text-sm text-ink-600">
        This tool manages properties and shows every submitted application.
      </p>

      <form action={action} className="mt-7 space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-900" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            autoFocus
            className="mt-1.5 block w-full rounded-lg border border-brand-900/15 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-900" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1.5 block w-full rounded-lg border border-brand-900/15 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
          />
        </div>

        {state?.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-xs leading-relaxed text-ink-500">
        Accounts are created on the server with{" "}
        <code className="font-mono">node scripts/create-admin.mjs &quot;Name&quot; email</code>.
      </p>
    </div>
  );
}
