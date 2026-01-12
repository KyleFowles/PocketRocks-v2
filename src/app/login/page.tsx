/* ============================================================
   FILE: src/app/login/page.tsx

   FIX:
   - "Continue with Google" now actually signs in using Firebase
     (signInWithPopup + GoogleAuthProvider).
   - Shows clear error text if popup is blocked or auth fails.
   - Disables buttons while working and routes to /dashboard on success.
   ============================================================ */

"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getAuthClient } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const helpText = useMemo(() => {
    return err ?? "Tip: If the Google popup is blocked, allow popups for this site and try again.";
  }, [err]);

  async function handleGoogle() {
    setErr(null);
    setBusy(true);

    try {
      const auth = getAuthClient();
      const provider = new GoogleAuthProvider();

      // Optional: keep it simple, no extra scopes.
      await signInWithPopup(auth, provider);

      router.push("/dashboard");
    } catch (e: any) {
      const code = String(e?.code ?? "");
      // Common “nothing happens” causes:
      // - popup blocked
      // - closed by user
      // - unauthorized domain / config issue
      if (code.includes("auth/popup-blocked")) {
        setErr("Popup blocked. Please allow popups for this site, then try again.");
      } else if (code.includes("auth/popup-closed-by-user")) {
        setErr("Popup closed. Please try again.");
      } else if (code.includes("auth/unauthorized-domain")) {
        setErr("Unauthorized domain. Add this domain to Firebase Auth → Authorized domains.");
      } else {
        setErr(e?.message ? String(e.message) : "Sign-in failed. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  function handleGuest() {
    router.push("/rocks/new");
  }

  return (
    <main className="min-h-dvh w-full bg-[#05070b]">
      {/* Subtle backdrop */}
      <div className="pointer-events-none fixed inset-0 opacity-90">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(240,78,35,0.18),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(20,34,51,0.75),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(255,121,0,0.08),transparent_40%)]" />
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4 py-10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[22px] font-extrabold tracking-tight">
              <span className="text-[#FF7900]">Pocket</span>
              <span className="text-white">Rocks</span>
            </div>
            <div className="mt-1 text-sm text-white/70">Sign in to create and manage your Rocks.</div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)]">
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="w-full rounded-xl bg-[#FF7900] px-4 py-3 text-base font-bold text-white shadow-[0_10px_30px_rgba(255,121,0,0.25)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Continue with Google"}
            </button>

            <button
              type="button"
              onClick={handleGuest}
              disabled={busy}
              className="w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-base font-semibold text-white/90 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue as Guest
            </button>

            <div className="pt-1 text-xs text-white/55">{helpText}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
