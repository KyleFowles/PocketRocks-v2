"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import AppHeader from "@/components/AppHeader";
import RockBuilder from "@/components/RockBuilder";
import { useAuth } from "@/lib/useAuth";
import { getRock, updateRock } from "@/lib/rocks";
import type { Rock } from "@/types/rock";

export default function RockDetailPage() {
  const router = useRouter();
  const params = useParams<{ rockId: string }>();
  const rockId = params?.rockId;

  const { user, loading: authLoading, error: authError } = useAuth();

  const [rock, setRock] = useState<Rock | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const headerRight = useMemo(
    () => ({
      active: "none" as const,
      showDashboard: true,
      showLogout: true,
    }),
    []
  );

  useEffect(() => {
    if (authLoading) return;

    if (authError) {
      setLoadErr(authError);
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!rockId) {
      setLoadErr("Missing Rock ID.");
      return;
    }

    // Capture uid so TS knows it's non-null inside async code
    const uid = user.uid;

    let cancelled = false;

    async function run() {
      setBusy(true);
      setLoadErr(null);
      try {
        const r = await getRock(uid, rockId);
        if (!cancelled) setRock(r);
        if (!r && !cancelled) setLoadErr("Rock not found.");
      } catch (e: any) {
        if (!cancelled) setLoadErr(e?.message || "Failed to load Rock.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [authLoading, authError, user, rockId, router]);

  async function handleSave(updated: Rock) {
    if (!user) return;
    const uid = user.uid;

    // Patch the whole rock minus id
    const { id, ...rest } = updated as any;
    await updateRock(uid, updated.id, rest);
    setRock(updated);
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <AppHeader title="Smart Rocks" right={headerRight} />
        <main className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-5 text-red-100">
            <div className="text-sm font-semibold">Auth error</div>
            <div className="mt-1 text-sm opacity-90">{authError}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AppHeader title="Smart Rocks" right={headerRight} />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {authLoading ? (
          <div className="text-slate-400">Checking sign-in…</div>
        ) : !user ? (
          <div className="text-slate-400">Redirecting…</div>
        ) : busy ? (
          <div className="text-slate-400">Loading Rock…</div>
        ) : loadErr ? (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-5 text-red-100">
            <div className="text-sm font-semibold">Load error</div>
            <div className="mt-1 text-sm opacity-90">{loadErr}</div>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Back to Dashboard
            </button>
          </div>
        ) : rock ? (
          <RockBuilder
            initialRock={rock}
            onSave={handleSave}
            onCancel={() => router.push("/dashboard")}
          />
        ) : (
          <div className="text-slate-400">Rock not found.</div>
        )}
      </main>
    </div>
  );
}
