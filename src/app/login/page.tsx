/* ============================================================
   FILE: src/app/login/page.tsx

   SCOPE:
   Polished Login page (Tailwind) for Smart Rocks.
   - If already signed in -> redirects to /dashboard
   - Supports Google sign-in (popup)
   - Clean, premium UI to match Dashboard / Rock / New Rock

   NOTES:
   - Requires Firebase Auth configured in /src/lib/firebase
   ============================================================ */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ------------------------------------------------------------
  // If already signed in, go to dashboard
  // ------------------------------------------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
        return;
      }
      setChecking(false);
    });

    return () => unsub();
  }, [router]);

  async function handleGoogle() {
    setBusy(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.replace("/dashboard");
    } catch (e: any) {
      setError(e?.message || "Sign-in failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_700px_at_20%_-10%,rgba(255,121,0,0.18),transparent_60%),radial-gradient(900px_600px_at_90%_10%,rgba(20,34,51,0.75),transparent_55%),linear-gradient(to_bottom,#07090f,#000)] text-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-4xl font-extrabold tracking-tight">
              Smart <span className="text-white/85">Rocks</span>
            </div>
            <div className="mt-2 text-sm text-white/70">
              Sign in to create, edit, and track your Rocks.
            </div>
          </div>

          <div className="text-xs text-white/45">
            {checking ? "Checking session…" : "Not signed in"}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-3xl border border-red-500/25 bg-red-500/10 p-5 text-sm animate-enter">
            <span className="font-extrabold">Error:</span> {error}
          </div>
        )}

        {/* Card */}
        <div className="mt-8 grid gap-4 sm:grid-cols-5">
          <div className="sm:col-span-3 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur animate-enter">
            <div className="text-lg font-extrabold tracking-tight">Welcome back</div>
            <div className="mt-2 text-sm text-white/70">
              One login. Everything autosaves. Archive and restore anytime.
            </div>

            <button
              onClick={() => void handleGoogle()}
              disabled={checking || busy}
              className={[
                "mt-5 w-full rounded-2xl border border-white/10 px-4 py-3 text-sm font-extrabold",
                "bg-[#FF7900]/20 hover:bg-[#FF7900]/26",
                "focus:outline-none focus:ring-2 focus:ring-[#FF7900]/45 transition",
                checking || busy ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {busy ? "Signing in…" : "Continue with Google"}
            </button>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-white/60">
              Tip: If the popup is blocked, allow popups for <span className="text-white/80 font-bold">localhost</span>{" "}
              and try again.
            </div>
          </div>

          <div className="sm:col-span-2 rounded-3xl border border-white/10 bg-black/20 p-6 animate-enter">
            <div className="text-sm font-extrabold">What you’ll get</div>

            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li className="flex gap-2">
                <span className="text-[#FF7900]">●</span>
                <span>Fast dashboard with clean cards</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#FF7900]">●</span>
                <span>Autosave while you type</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#FF7900]">●</span>
                <span>Archive + restore (no fear clicks)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#FF7900]">●</span>
                <span>Clean, consistent UX everywhere</span>
              </li>
            </ul>

            <div className="mt-5 text-xs text-white/45">
              You can upgrade this page later with email/password, magic links, or SSO.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
