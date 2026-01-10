// FILE: src/app/login/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/useAuth";
import { signInWithGoogle } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // If already signed in, go straight to dashboard.
  useMemo(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  async function handleGoogle() {
    setErr(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      router.replace("/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mx-auto mt-6 w-full max-w-xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="mb-2 text-xs font-semibold tracking-[0.22em] text-slate-400">
            WELCOME
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Sign in
          </h1>

          <p className="mt-2 text-slate-300">
            Use Google to access your saved Rocks.
          </p>

          {err ? (
            <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {err}
            </div>
          ) : null}

          <button
            onClick={handleGoogle}
            disabled={busy || loading}
            className="mt-6 w-full rounded-2xl border border-orange-400/20 bg-orange-500/15 px-5 py-3 text-sm font-semibold text-orange-50 shadow-[0_10px_30px_rgba(255,121,0,0.10)] transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Continue with Google"}
          </button>

          <p className="mt-4 text-xs text-slate-500">
            By signing in, your Rocks are stored in your account.
          </p>
        </div>
      </div>
    </main>
  );
}
