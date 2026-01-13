"use client";

/* ============================================================
   FILE: src/app/login/page.tsx

   FIX:
   - Remove router.replace() from useMemo (render-time side effect)
   - Redirect logged-in users using useEffect instead
   - Keep a simple, reliable login UI

   NOTES:
   - Uses Firebase client auth directly (Google popup + optional anonymous)
   - Assumes getAuthClient() is configured in src/lib/firebase.ts
   ============================================================ */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { GoogleAuthProvider, signInAnonymously, signInWithPopup } from "firebase/auth";

import { useAuth } from "@/lib/useAuth";
import { getAuthClient } from "@/lib/firebase";
import { Button } from "@/components/Button";

export default function LoginPage() {
  const router = useRouter();
  const { uid, loading } = useAuth();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ✅ Redirect must happen in an effect (NOT during render / useMemo)
  useEffect(() => {
    if (!loading && uid) {
      router.replace("/dashboard");
    }
  }, [loading, uid, router]);

  async function handleGoogle() {
    setErr(null);
    setBusy(true);

    try {
      const auth = getAuthClient();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);

      // useEffect will redirect once uid is present
    } catch (e: any) {
      const msg =
        typeof e?.message === "string"
          ? e.message
          : "Google sign-in failed. Please try again.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleAnonymous() {
    setErr(null);
    setBusy(true);

    try {
      const auth = getAuthClient();
      await signInAnonymously(auth);

      // useEffect will redirect once uid is present
    } catch (e: any) {
      const msg =
        typeof e?.message === "string"
          ? e.message
          : "Guest sign-in failed. Please try again.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="mb-8">
        <div className="text-xs font-semibold tracking-widest text-slate-500">
          LOGIN
        </div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Sign in
        </h1>
        <p className="mt-2 text-slate-300">
          Sign in to create and manage your Rocks.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        {loading && (
          <div className="text-slate-300">Checking sign-in…</div>
        )}

        {!loading && uid && (
          <div className="text-slate-300">Signed in. Redirecting…</div>
        )}

        {!loading && !uid && (
          <>
            {err && (
              <div className="mb-4 rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-red-200">
                {err}
              </div>
            )}

            <div className="grid gap-3">
              <Button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="rounded-xl px-4 py-3 text-sm font-extrabold text-slate-950 hover: disabled:opacity-60"
              >
                {busy ? "Working…" : "Continue with Google"}
              </Button>

              <Button
                type="button"
                onClick={handleAnonymous}
                disabled={busy}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60" variant="secondary"
              >
                {busy ? "Working…" : "Continue as Guest"}
              </Button>
            </div>

            <div className="mt-4 text-xs text-slate-400">
              Tip: If Google popup is blocked, allow popups for this site and try
              again.
            </div>
          </>
        )}
      </div>
    </main>
  );
}
