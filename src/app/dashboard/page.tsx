/* ============================================================
   FILE: src/app/dashboard/page.tsx

   SCOPE:
   Dashboard page
   - Uses semantic button styling via buttonClassName()
   - "+ New Rock" is a true primary button (theme-driven)
   - "Go to Login" uses secondary button style
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/lib/useAuth";
import { getDbClient } from "@/lib/firebase";
import { buttonClassName } from "@/components/Button";

import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

type RockRow = {
  id: string;
  title: string;
  dueDate?: string | null;
  status?: string | null;
  updatedAt?: any;
};

function safeText(v: any) {
  return typeof v === "string" ? v : "";
}

export default function DashboardPage() {
  const { uid, loading } = useAuth();

  const [rows, setRows] = useState<RockRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loadingRocks, setLoadingRocks] = useState(false);

  const canLoad = useMemo(() => !loading && Boolean(uid), [loading, uid]);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!canLoad || !uid) return;

      setLoadingRocks(true);
      setErr(null);

      try {
        const db = getDbClient();
        const ref = collection(db, "users", uid, "rocks");
        const q = query(ref, orderBy("updatedAt", "desc"), limit(50));
        const snap = await getDocs(q);

        const items: RockRow[] = snap.docs.map((d) => {
          const data: any = d.data();
          return {
            id: d.id,
            title: safeText(data?.title) || safeText(data?.draft) || "Rock",
            dueDate: safeText(data?.dueDate) || null,
            status: safeText(data?.status) || null,
            updatedAt: data?.updatedAt,
          };
        });

        if (alive) setRows(items);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Failed to load Rocks.");
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
          className={buttonClassName("primary")}
          aria-label="Create a new Rock"
        >
          <span className="text-base leading-none">+</span>
          <span>New Rock</span>
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        {loading && <p className="text-sm text-white/70">Checking sign-in…</p>}

        {!loading && !uid && (
          <div className="text-sm text-white/70">
            <p>You’re not signed in.</p>

            <Link href="/login" className={buttonClassName("secondary", "mt-2")}>
              Go to Login
            </Link>
          </div>
        )}

        {!loading && uid && (
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
                  <Link
                    key={r.id}
                    href={`/rocks/${r.id}`}
                    className="block p-4 hover:bg-white/5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">
                          {r.title}
                        </div>
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
