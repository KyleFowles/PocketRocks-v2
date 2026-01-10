"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppHeader from "@/components/AppHeader";
import RockCard from "@/components/RockCard";
import { useAuth } from "@/lib/useAuth";
import { listRocks } from "@/lib/rocks";

type RockListItem = {
  id: string;
  title?: string;
  status?: string;
  updatedAt?: any;
  archived?: boolean;
  dueDate?: string;
  finalStatement?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, error: authError } = useAuth();

  const [rocks, setRocks] = useState<RockListItem[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const title = useMemo(() => "Smart Rocks", []);

  useEffect(() => {
    // stable loading while auth is checking
    if (authLoading) {
      setLoading(true);
      return;
    }

    // auth error (rare, but keep UX clean)
    if (authError) {
      setLoading(false);
      setLoadErr(authError);
      return;
    }

    // if signed out, go to login
    if (!user) {
      router.replace("/login");
      return;
    }

    // IMPORTANT: capture uid so TS knows it's non-null inside async code
    const uid = user.uid;

    let cancelled = false;

    async function run() {
      setLoading(true);
      setLoadErr(null);
      try {
        const items = await listRocks(uid, { includeArchived });
        if (!cancelled) setRocks((items || []) as RockListItem[]);
      } catch (e: any) {
        if (!cancelled) setLoadErr(e?.message || "Failed to load Rocks.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [authLoading, authError, user, includeArchived, router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AppHeader title={title} right={{ active: "dashboard", showDashboard: true, showLogout: true }} />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs tracking-widest text-slate-400">WORKSPACE</div>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Dashboard</h1>
              <p className="mt-2 text-slate-300">
                Your Rocks, organized and always saved.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIncludeArchived((v) => !v)}
                className="rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={authLoading || !user}
              >
                {includeArchived ? "Hide archived" : "Show archived"}
              </button>

              <button
                onClick={() => router.push("/rocks/new")}
                className="rounded-xl border border-orange-500/25 bg-orange-500/15 px-4 py-2 text-sm font-semibold text-orange-100 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={authLoading || !user}
              >
                + New Rock
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/4 p-6">
            {loadErr && (
              <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">
                {loadErr}
              </div>
            )}

            {loading ? (
              <div className="text-slate-400">Loading Rocks…</div>
            ) : rocks.length === 0 ? (
              <div className="flex flex-col gap-3">
                <div className="font-semibold text-slate-200">No Rocks yet.</div>
                <div className="text-sm text-slate-400">
                  Create your first Rock and we’ll guide you to the next step.
                </div>
                <div>
                  <button
                    onClick={() => router.push("/rocks/new")}
                    className="rounded-xl border border-orange-500/25 bg-orange-500/15 px-4 py-2 text-sm font-semibold text-orange-100 transition hover:bg-orange-500/20"
                  >
                    + New Rock
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {rocks.map((r) => (
                  <RockCard key={r.id} rock={r as any} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
