"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/lib/useAuth";
import { signInWithGoogle } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, error } = useAuth();

  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (user) router.replace("/dashboard");
  }, [loading, user, router]);

  async function handleGoogle() {
    setLocalErr(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      router.replace("/dashboard");
    } catch (e: any) {
      setLocalErr(e?.message || "Login failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AppHeader
        title="Smart Rocks"
        right={{ active: "none", showDashboard: false, showLogout: false }}
      />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8">
          <div className="text-xs tracking-widest text-slate-400">WELCOME</div>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            Sign in
          </h1>

          <p className="mt-2 text-slate-300">
            Use Google to access your saved Rocks.
          </p>

          {(error || localErr) && (
            <div className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">
              {localErr || error}
            </div>
          )}

          {loading ? (
            <div className="mt-6 text-slate-400">Checking sign-in…</div>
          ) : (
            <button
              onClick={handleGoogle}
              disabled={busy}
              className={[
                "mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold transition",
                "disabled:cursor-not-allowed disabled:opacity-60",
                "border border-orange-500/25 bg-orange-500/15 text-orange-100 hover:bg-orange-500/20",
              ].join(" ")}
            >
              {busy ? "Signing in…" : "Continue with Google"}
            </button>
          )}

          <div className="mt-6 text-xs text-slate-500">
            By signing in, your Rocks are stored in your account.
          </div>
        </div>
      </main>
    </div>
  );
}
