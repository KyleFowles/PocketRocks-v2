/* ============================================================
   FILE: src/app/rocks/new/page.tsx

   SCOPE:
   Client-side Create New Rock page.
   - Auth-guarded (redirects to /login if signed out)
   - Creates a new Rock in: users/{uid}/rocks/{rockId}
   - Routes to /rocks/{rockId} after creation
   - Polished Tailwind UX consistent with Dashboard

   NOTES:
   - Requires Firebase Authentication + Firestore
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export default function NewRockPage() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);
      setCheckingAuth(false);
    });

    return () => unsub();
  }, [router]);

  const canSubmit = useMemo(() => {
    if (!uid || checkingAuth) return false;
    if (busy) return false;
    return true;
  }, [uid, checkingAuth, busy]);

  async function createRock() {
    if (!uid) return;

    setBusy(true);
    setError(null);

    try {
      const ref = collection(db, "users", uid, "rocks");

      const docRef = await addDoc(ref, {
        title: title.trim() || "Untitled Rock",
        owner: owner.trim() || "",
        status: "On Track",
        dueDate: "",
        finalStatement: "",
        archived: false,
        archivedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push(`/rocks/${docRef.id}`);
    } catch (e: any) {
      setError(e?.message || "Failed to create Rock.");
      setBusy(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[radial-gradient(1200px_700px_at_20%_-10%,rgba(255,121,0,0.18),transparent_60%),radial-gradient(900px_600px_at_90%_10%,rgba(20,34,51,0.75),transparent_55%),linear-gradient(to_bottom,#07090f,#000)] text-white">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="text-3xl font-extrabold tracking-tight">Create New Rock</div>
          <div className="mt-3 text-sm text-white/70">Checking sign-in…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_700px_at_20%_-10%,rgba(255,121,0,0.18),transparent_60%),radial-gradient(900px_600px_at_90%_10%,rgba(20,34,51,0.75),transparent_55%),linear-gradient(to_bottom,#07090f,#000)] text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-4xl font-extrabold tracking-tight">Create New Rock</div>
            <div className="mt-2 text-sm text-white/70">
              Start simple. You can refine it inside the Rock.
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-2xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-extrabold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF7900]/40 transition"
          >
            Back
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-3xl border border-red-500/25 bg-red-500/10 p-5 text-sm animate-enter">
            <span className="font-extrabold">Error:</span> {error}
          </div>
        )}

        {/* Card */}
        <div className="mt-7 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur animate-enter">
          <div className="grid gap-5">
            {/* Title */}
            <div>
              <div className="text-sm font-extrabold text-white/85">Rock Title</div>
              <div className="mt-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Example: Launch Q1 Scorecard"
                  className="w-full rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:ring-2 focus:ring-[#FF7900]/35"
                />
              </div>
              <div className="mt-2 text-xs text-white/50">
                Tip: Keep it short. You’ll write the full statement next.
              </div>
            </div>

            {/* Owner */}
            <div>
              <div className="text-sm font-extrabold text-white/85">Owner (optional)</div>
              <div className="mt-2">
                <input
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="Example: Kyle"
                  className="w-full rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:ring-2 focus:ring-[#FF7900]/35"
                />
              </div>
              <div className="mt-2 text-xs text-white/50">
                You can remove or change this anytime.
              </div>
            </div>

            {/* CTA row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-white/50">
                A Rock is created immediately and autosaves from there.
              </div>

              <button
                type="button"
                onClick={() => void createRock()}
                disabled={!canSubmit}
                className={[
                  "rounded-2xl border border-white/10 px-5 py-3 text-sm font-extrabold",
                  "bg-[#FF7900]/20 hover:bg-[#FF7900]/28",
                  "focus:outline-none focus:ring-2 focus:ring-[#FF7900]/45 transition",
                  !canSubmit ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
              >
                {busy ? "Creating…" : "Create Rock"}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom helper */}
        <div className="mt-6 text-xs text-white/40">
          Next up: we’ll make the Rock detail page match this same look and feel.
        </div>
      </div>
    </div>
  );
}
