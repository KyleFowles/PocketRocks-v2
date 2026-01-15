/* ============================================================
   FILE: src/app/dashboard/page.tsx

   SCOPE:
   Dashboard page (CHARTER SCRUB — FINAL)
   - Queries canonical collection: `rocks` (top-level)
   - User-scoped query: where("userId", "==", uid)
   - Stable fallback: if orderBy("updatedAt") fails, retry without orderBy
   - Safe loading + alive guard
   - Uses semantic button styling via buttonClassName()
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/lib/useAuth";
import { db, getFirebaseConfigStatus } from "@/lib/firebase";
import { buttonClassName } from "@/components/Button";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from "firebase/firestore";

type RockRow = {
  id: string;
  title: string;
  dueDate?: string | null;
  status?: string | null;
};

function safeText(v: any) {
  return typeof v === "string" ? v : "";
}

function devError(...args: any[]) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
}

export default function DashboardPage() {
  const { uid, loading } = useAuth();

  const [rows, setRows] = useState<RockRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loadingRocks, setLoadingRocks] = useState(false);

  const configStatus = useMemo(() => getFirebaseConfigStatus(), []);
  const firebaseReady = configStatus.ok;

  const canLoad = useMemo(
    () => !loading && Boolean(uid) && firebaseReady,
    [loading, uid, firebaseReady]
  );

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!canLoad || !uid) return;

      setLoadingRocks(true);
      setErr(null);

      try {
        if (!db) {
          setErr("init: Firebase not initialized (db is null).");
          return;
        }

        const base = collection(db, "rocks");

        // Primary plan: ordered by updatedAt
        const ordered: QueryConstraint[] = [
          where("userId", "==", uid),
          orderBy("updatedAt", "desc"),
          limit(50),
        ];

        try {
          const snap = await getDocs(query(base, ...ordered));

          const items: RockRow[] = snap.docs.map((d) => {
            const data: any = d.data();
            return {
              id: d.id,
              title: safeText(data?.title) || safeText(data?.draft) || "Rock",
              dueDate: safeText(data?.dueDate) || null,
              status: safeText(data?.status) || null,
            };
          });

          if (alive) setRows(items);
          return;
        } catch (e: any) {
          // Charter: never die on “nice-to-have sort”
          devError("[Dashboard] ordered query failed, retrying without orderBy:", e);
        }

        // Fallback plan: no orderBy (most compatible)
        const fallback: QueryConstraint[] = [
          where("userId", "==", uid),
          limit(50),
        ];

        const snap2 = await getDocs(query(base, ...fallback));

        const items2: RockRow[] = snap2.docs.map((d) => {
          const data: any = d.data();
          return {
            id: d.id,
            title: safeText(data?.title) || safeText(data?.draft) || "Rock",
            dueDate: safeText(data?.dueDate) || null,
            status: safeText(data?.status) || null,
          };
        });

        if (alive) setRows(items2);

        // Optional: explain why the list may look unsorted
        if (alive) {
          setErr(
            "Note: Sorting is unavailable right now (missing index or updatedAt). Showing up to 50 Rocks."
          );
        }
      } catch (e: any) {
        devError("[Dashboard] load failed:", e);
        const msg = typeof e?.message === "string" ? e.message : "Failed to load Rocks.";
        if (alive) setErr(msg);
      } finally {
        if (alive) setLoadingRocks(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [canLoad, uid]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-white/70">
            Your Rocks live here. Create a new Rock or open an existing one.
          </p>
        </div>

        <Link
          href="/rocks/new"
          className={buttonClassName({ variant: "primary" })}
          aria-label="Create a new Rock"
        >
          <span className="text-base leading-none">+</span>
          <span>New Rock</span>
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        {!firebaseReady && (
          <div className="rounded-xl border border-amber-400/25 bg-amber-300/10 p-3 text-sm text-amber-100">
            <div className="font-extrabold">Config needed</div>
            <div className="mt-1 opacity-90">
              Firebase env vars are missing: <b>{configStatus.missing.join(", ")}</b>
            </div>
          </div>
        )}

        {loading && <p className="text-sm text-white/70">Checking sign-in…</p>}

        {!loading && !uid && (
          <div className="text-sm text-white/70">
            <p>You’re not signed in.</p>

            <Link
              href="/login"
              className={buttonClassName({ variant: "secondary", className: "mt-2" })}
            >
              Go to Login
            </Link>
          </div>
        )}

        {!loading && uid && firebaseReady && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/70">
                Signed in as <span className="text-white/90">{uid}</span>
              </p>
              {loadingRocks && <p className="text-xs text-white/60">Loading…</p>}
            </div>

            {err && (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {err}
              </div>
            )}

            <div className="mt-4 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
              {rows.length === 0 && !loadingRocks ? (
                <div className="p-4 text-sm text-white/70">
                  No Rocks yet. Click <b>New Rock</b> to make your first one.
                </div>
              ) : (
                rows.map((r) => (
                  <Link key={r.id} href={`/rocks/${r.id}`} className="block p-4 hover:bg-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">{r.title}</div>
                        <div className="mt-1 text-xs text-white/60">
                          {r.status ? `Status: ${r.status}` : "Status: —"}
                          {" · "}
                          {r.dueDate ? `Due: ${r.dueDate}` : "Due: —"}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-white/50">Open →</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
