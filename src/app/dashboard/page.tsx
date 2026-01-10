"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";

import { auth, db, ensureAuthPersistence } from "@/lib/firebase";
import { waitForAuthUser } from "@/lib/authGate";

type RockStatus = "Draft" | "On Track" | "At Risk" | "Off Track" | "Complete";

type RockRow = {
  id: string;
  title: string;
  status: RockStatus;
  dueDate: string;
  archived: boolean;
  updatedAtMs: number;
};

function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function safeBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function safeStatus(v: unknown, fallback: RockStatus = "Draft"): RockStatus {
  const allowed: RockStatus[] = ["Draft", "On Track", "At Risk", "Off Track", "Complete"];
  return allowed.includes(v as RockStatus) ? (v as RockStatus) : fallback;
}
function formatDateTime(ms: number) {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return "";
  }
}
function statusPill(status: RockStatus) {
  switch (status) {
    case "Complete":
      return "border border-emerald-500/20 bg-emerald-500/8 text-emerald-100";
    case "On Track":
      return "border border-sky-500/20 bg-sky-500/8 text-sky-100";
    case "At Risk":
      return "border border-amber-500/20 bg-amber-500/8 text-amber-100";
    case "Off Track":
      return "border border-red-500/20 bg-red-500/8 text-red-100";
    default:
      return "border border-white/12 bg-white/5 text-slate-200";
  }
}

export default function DashboardPage() {
  const router = useRouter();

  const [authLoading, setAuthLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RockRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");

  // Auth (never hang)
  useEffect(() => {
    let alive = true;

    // Persistence in background
    ensureAuthPersistence().catch(() => {});

    (async () => {
      const u = await waitForAuthUser(auth, 1200);
      if (!alive) return;

      if (!u) {
        setUid(null);
        setAuthLoading(false);
        router.replace("/login");
        return;
      }

      setUid(u.uid);
      setAuthLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  // Load rocks
  useEffect(() => {
    if (authLoading) return;
    if (!uid) return;

    setLoading(true);
    setError(null);

    const rocksRef = collection(db, "users", uid, "rocks");
    const constraints: QueryConstraint[] = [orderBy("updatedAt", "desc")];
    if (!showArchived) constraints.unshift(where("archived", "==", false));

    const q = query(rocksRef, ...constraints);

    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: RockRow[] = snap.docs.map((d) => {
          const data = d.data() as DocumentData;

          const title = safeString(data.title, "").trim() || "Untitled Rock";
          const status = safeStatus(data.status, "Draft");
          const dueDate = safeString(data.dueDate, "");
          const archived = safeBool(data.archived, false);

          let updatedAtMs = 0;
          const ua = data.updatedAt as any;
          if (ua && typeof ua.toMillis === "function") updatedAtMs = ua.toMillis();
          else updatedAtMs = Date.now();

          return { id: d.id, title, status, dueDate, archived, updatedAtMs };
        });

        setRows(next);
        setLoading(false);
      },
      (e) => {
        setError(e?.message || "Failed to load Rocks.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [authLoading, uid, showArchived]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.title.toLowerCase().includes(q));
  }, [rows, search]);

  const mostRecent = useMemo(() => (rows.length ? rows[0] : null), [rows]);

  const counts = useMemo(() => {
    const total = rows.length;
    const atRisk = rows.filter((r) => r.status === "At Risk" || r.status === "Off Track").length;
    const complete = rows.filter((r) => r.status === "Complete").length;
    return { total, atRisk, complete };
  }, [rows]);

  const createRock = useCallback(async () => {
    if (!uid) return;
    setError(null);

    try {
      const rocksRef = collection(db, "users", uid, "rocks");
      const docRef = await addDoc(rocksRef, {
        title: "",
        status: "Draft",
        dueDate: "",
        finalStatement: "",
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push(`/rocks/${docRef.id}`);
    } catch (e: any) {
      setError(e?.message || "Could not create a new Rock.");
    }
  }, [uid, router]);

  const surfaceStrong =
    "rounded-2xl border border-white/12 bg-white/[0.045] shadow-[0_12px_50px_rgba(0,0,0,0.40)]";

  const btnBase =
    "rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";
  const btnQuiet =
    "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/8";
  const btnPrimary =
    "border border-orange-500/25 bg-orange-500 text-slate-950 hover:brightness-105";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="text-sm text-slate-400">Checking sign-in…</div>
        </div>
      </div>
    );
  }

  if (!uid) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="text-sm text-slate-400">Redirecting to login…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 opacity-45">
        <div className="absolute inset-0 bg-[radial-gradient(1100px_520px_at_18%_0%,rgba(255,121,0,0.06),transparent_60%),radial-gradient(920px_520px_at_92%_8%,rgba(56,189,248,0.05),transparent_58%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/25 to-black/45" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Dashboard</h1>
            <div className="mt-2 text-sm text-slate-400">
              {loading ? "Loading…" : `${counts.total} total · ${counts.atRisk} at risk · ${counts.complete} complete`}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setShowArchived((v) => !v)} className={`${btnBase} ${btnQuiet}`}>
              {showArchived ? "Hide archived" : "Show archived"}
            </button>
            <button onClick={() => void createRock()} className={`${btnBase} ${btnPrimary}`}>
              + New Rock
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className={`${surfaceStrong} mt-8 p-5`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-widest text-slate-500">CONTINUE</div>

              {loading ? (
                <div className="mt-2 text-sm text-slate-400">Loading your most recent Rock…</div>
              ) : mostRecent ? (
                <>
                  <div className="mt-2 text-base font-semibold text-slate-100 truncate">
                    {mostRecent.title}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    Last updated: {formatDateTime(mostRecent.updatedAtMs)}
                  </div>
                </>
              ) : (
                <div className="mt-2 text-sm text-slate-300">
                  No Rocks yet. Create your first Rock to get started.
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {mostRecent ? (
                <Link
                  href={`/rocks/${mostRecent.id}`}
                  className="inline-flex items-center rounded-xl border border-white/12 bg-white/6 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10"
                >
                  Open most recent →
                </Link>
              ) : (
                <button onClick={() => void createRock()} className={`${btnBase} ${btnPrimary}`}>
                  + New Rock
                </button>
              )}

              <button
                onClick={() => setSearch("")}
                disabled={!search}
                className={`${btnBase} ${btnQuiet}`}
              >
                Clear search
              </button>
            </div>
          </div>
        </div>

        <div className={`${surfaceStrong} mt-6 p-6`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-100">Your Rocks</div>
              <div className="text-sm text-slate-400">{loading ? "Loading…" : `${filtered.length} shown`}</div>
            </div>

            <div className="w-full sm:max-w-sm">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Rocks…"
                className="w-full rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-white/20"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <>
                <div className="h-20 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
                <div className="h-20 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
                <div className="h-20 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
              </>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/4 p-6">
                <div className="text-base font-semibold">No Rocks found</div>
                <p className="mt-1 text-sm text-slate-400">Try a different search, or create a new Rock.</p>
              </div>
            ) : (
              filtered.map((r) => (
                <Link
                  key={r.id}
                  href={`/rocks/${r.id}`}
                  className="block rounded-2xl border border-white/10 bg-white/4 p-5 hover:bg-white/6 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate text-lg font-semibold text-slate-100">{r.title}</div>
                        <span className={`rounded-full px-3 py-1 text-xs ${statusPill(r.status)}`}>{r.status}</span>
                        {r.archived ? (
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                            Archived
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
                        <span>Updated: {formatDateTime(r.updatedAtMs)}</span>
                        {r.dueDate ? <span>Due: {r.dueDate}</span> : null}
                      </div>
                    </div>

                    <div className="shrink-0 text-sm text-slate-400">Open →</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="h-10" />
      </div>
    </div>
  );
}
