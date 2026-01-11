"use client";

// FILE: src/app/rocks/[rockId]/page.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAuth } from "@/lib/useAuth";
import { getRock, saveRock } from "@/lib/rocks";
import type { Rock } from "@/types/rock";
import RockBuilder from "@/components/RockBuilder";

export default function RockDetailPage() {
  const router = useRouter();
  const params = useParams<{ rockId: string }>();
  const rockId = params?.rockId;

  const { uid, loading } = useAuth();

  const [rock, setRock] = useState<Rock | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loadingRock, setLoadingRock] = useState<boolean>(true);

  // Auth gate
  useEffect(() => {
    if (!loading && !uid) router.replace("/login");
  }, [loading, uid, router]);

  // Load rock
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!uid || !rockId) return;

      setLoadingRock(true);
      setLoadErr(null);

      try {
        const r = (await getRock(uid, rockId)) as Rock | null;

        if (cancelled) return;

        if (!r) {
          setRock(null);
          setLoadErr("Rock not found.");
        } else {
          setRock(r);
        }
      } catch (e: any) {
        if (cancelled) return;
        setLoadErr(e?.message || "Failed to load Rock.");
      } finally {
        if (cancelled) return;
        setLoadingRock(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [uid, rockId]);

  const title = useMemo(() => {
    const t = rock?.title?.trim();
    return t ? t : "Rock";
  }, [rock?.title]);

  // Guard: waiting for auth
  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="text-slate-300">Checking sign-in…</div>
      </main>
    );
  }

  // Guard: missing uid or rockId
  if (!uid) return null;

  if (!rockId) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-4 text-xs font-semibold tracking-widest text-slate-500">
          ROCK
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Rock</h1>
        <p className="mt-2 text-slate-300">Missing Rock ID in the URL.</p>

        <div className="mt-6">
          <button
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  // Loading rock data
  if (loadingRock) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="text-slate-300">Loading Rock…</div>
      </main>
    );
  }

  // Load error / not found
  if (loadErr || !rock) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-4 text-xs font-semibold tracking-widest text-slate-500">
          ROCK
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Rock</h1>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <div className="text-slate-200">{loadErr ?? "Rock not found."}</div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </button>

            <button
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              onClick={() => router.refresh()}
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ✅ Make uid a guaranteed string for any nested callbacks
  const uidStr: string = uid;

  async function handleSave(updated: Rock) {
    // Save to Firestore (source of truth)
    await saveRock(uidStr, updated);

    // Keep local state in sync so header/title etc update instantly
    setRock(updated);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold tracking-widest text-slate-500">
            ROCK
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-slate-300">
            Update your Rock below. Your changes will save as you work.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            onClick={() => router.push("/dashboard")}
          >
            Back
          </button>
        </div>
      </div>

      <RockBuilder
        initialRock={rock}
        onSave={handleSave}
        onCancel={() => router.push("/dashboard")}
      />
    </main>
  );
}
