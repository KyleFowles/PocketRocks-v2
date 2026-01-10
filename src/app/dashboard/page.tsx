"use client";

// FILE: src/app/dashboard/page.tsx

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/useAuth";
import { listRocks } from "@/lib/rocks";
import type { Rock, RockStatus } from "@/types/rock";

type ListItem = Pick<Rock, "id" | "title" | "status" | "dueDate" | "updatedAt">;

function statusLabel(s: RockStatus) {
  return s === "on_track" ? "On Track" : "Off Track";
}

function statusPillClass(s: RockStatus) {
  return s === "on_track"
    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
    : "border-rose-500/25 bg-rose-500/10 text-rose-100";
}

function formatUpdated(ts: any) {
  try {
    if (ts?.toDate) return ts.toDate().toLocaleString();
    if (typeof ts === "string") return ts;
    if (ts instanceof Date) return ts.toLocaleString();
    return "";
  } catch {
    return "";
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { uid, loading, signOut } = useAuth();

  const [includeArchived, setIncludeArchived] = useState(false);
  const [q, setQ] = useState("");
  const [rocks, setRocks] = useState<ListItem[]>([]);
  const [loadingRocks, setLoadingRocks] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // Auth gate
  useEffect(() => {
    if (!loading && !uid) router.replace("/login");
  }, [loading, uid, router]);

  // Load rocks
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!uid) return;

      // ✅ Make uid a guaranteed string inside the async closure
      const uidStr: string = uid;

      setLoadingRocks(true);
      setLoadErr(null);

      try {
        const items = (await listRocks(uidStr, { includeArchived })) as any[];
        const cleaned: ListItem[] = (items || []).map((r: any) => ({
          id: String(r.id ?? ""),
          title: String(r.title ?? ""),
          status: (r.status as RockStatus) ?? "on_track",
          dueDate: String(r.dueDate ?? ""),
          updatedAt: r.updatedAt,
        }));
        if (!cancelled) setRocks(cleaned);
      } catch (e: any) {
        if (!cancelled) setLoadErr(e?.message || "Failed to load Rocks.");
      } finally {
        if (!cancelled) setLoadingRocks(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [uid, includeArchived]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rocks;
    return rocks.filter((r) => (r.title || "").toLowerCase().includes(needle));
  }, [rocks, q]);

  const heroText = useMemo(() => {
    if (loading) return "Checking sign-in…";
    if (!uid) return "Checking sign-in…";
    if (loadingRocks) return "Loading your Rocks…";
    if (loadErr) return loadErr;
    if (filtered.length === 0) return q ? "No matches." : "No Rocks yet.";
    return "";
  }, [loading, uid, loadingRocks, loadErr, filtered.length, q]);

  async function handleLogout() {
    try {
      await signOut();
      router.replace("/login");
    } catch {
      // ignore
    }
  }

  if (!uid) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="text-slate-300">{heroText}</div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="text-xs font-semibold tracking-widest text-slate-500">
            WORKSPACE
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Dashboard
          </h1>
          <p className="max-w-xl text-slate-300">
            Your Rocks. Clear next step. No noise.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/rocks/new"
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-orange-400"
          >
            + New Rock
          </Link>

          <button
            type="button"
            onClick={() => setIncludeArchived((v) => !v)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            {includeArchived ? "Hide archived" : "Show archived"}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/20"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-lg font-semibold">Your Rocks</div>
              <div className="text-sm text-slate-400">{filtered.length} shown</div>
            </div>

            <div className="flex items-center gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-orange-500/40 sm:w-72"
              />
              <button
                type="button"
                onClick={() => setQ("")}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
                disabled={!q}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {loadingRocks ? (
              <div className="text-slate-300">Loading…</div>
            ) : loadErr ? (
              <div className="text-rose-200">{loadErr}</div>
            ) : filtered.length === 0 ? (
              <div className="text-slate-300">
                {q ? "No matching Rocks." : "Create your first Rock to get going."}
              </div>
            ) : (
              filtered.map((r) => (
                <Link
                  key={r.id}
                  href={`/rocks/${encodeURIComponent(r.id)}`}
                  className="block rounded-2xl border border-white/10 bg-slate-950/30 p-4 transition hover:bg-slate-950/45"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold">
                        {r.title || "(Untitled Rock)"}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        {r.updatedAt ? `Updated: ${formatUpdated(r.updatedAt)}` : ""}
                        {r.dueDate ? ` • Due: ${r.dueDate}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusPillClass(
                          r.status
                        )}`}
                      >
                        {statusLabel(r.status)}
                      </span>
                      <span className="text-sm text-slate-300">Open →</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <aside className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold text-slate-200">Next step</div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            {!filtered.length ? (
              <div className="text-sm text-slate-300">
                Create a Rock to start making progress.
              </div>
            ) : (
              <>
                <div className="text-xs font-semibold tracking-widest text-slate-500">
                  RECOMMENDED
                </div>
                <div className="mt-1 text-base font-semibold">
                  Open your most recent Rock
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  Keep momentum by finishing the next field inside the Rock.
                </div>

                <Link
                  href={`/rocks/${encodeURIComponent(filtered[0].id)}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
                >
                  Continue →
                </Link>
              </>
            )}
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Tip: The Dashboard should point you to exactly one “next move.”
          </div>
        </aside>
      </div>
    </main>
  );
}
