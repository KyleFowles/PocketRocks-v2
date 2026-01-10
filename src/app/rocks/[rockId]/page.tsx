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
  const [loadingRock, setLoadingRock] = useState(true);

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
        if (!cancelled) setRock(r);
        if (!r && !cancelled) setLoadErr("Rock not found.");
      } catch (e: any) {
        if (!cancelled) setLoadErr(e?.message || "Failed to load Rock.");
      } finally {
        if (!cancelled) setLoadingRock(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [uid, rockId]);

  const title = useMemo(() => {
    if (loading) return "Checking sign-in…";
    if (loadingRock) return "Loading Rock…";
    if (loadErr) return loadErr;
    return rock?.title || "Rock";
  }, [loading, loadingRock, loadErr, rock?.title]);

  if (loading || loadingRock) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="text-slate-300">{title}</div>
      </main>
    );
  }

  if (loadErr || !rock) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg font-semibold text-slate-100">
            {loadErr || "Rock not found."}
          </div>
          <div className="mt-2 text-sm text-slate-300">
            Go back to your Dashboard and try again.
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  // ✅ Make uid a guaranteed string for any nested callbacks
  if (!uid) return null;
  const uidStr: string = uid;

  async function handleSave(next: Rock) {
    await saveRock(uidStr, next);
    setRock(next);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="text-xs font-semibold tracking-widest text-slate-500">
            ROCK
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {rock.title || "(Untitled Rock)"}
          </h1>
          <p className="max-w-2xl text-slate-300">
            Work one step at a time. The next best action stays obvious.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          Back to Dashboard
        </button>
      </div>

      <RockBuilder initialRock={rock} onSave={handleSave} />
    </main>
  );
}
