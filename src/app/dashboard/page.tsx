/* ============================================================
   FILE: src/app/dashboard/page.tsx

   SCOPE:
   Dashboard page (Client Component)
   - Fixes Next.js build error caused by mixed Server/Client usage
   - Auth-guarded: redirects to /login if not signed in
   - Uses existing PocketRocks global styles (pr-page, pr-panel, pr-primary-button)
   ============================================================ */

"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/useAuth";

export default function DashboardPage() {
  const router = useRouter();
  const { uid, user, loading, signOut } = useAuth() as any;

  // Auth guard: if not signed in, go to login
  useEffect(() => {
    if (!loading && !uid) {
      router.replace("/login");
    }
  }, [loading, uid, router]);

  return (
    <div className="pr-page">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="pt-8 pb-5">
          <div className="text-[34px] leading-tight">
            <span className="pr-header-accent font-extrabold">Pocket</span>
            <span className="font-black tracking-tight">Rocks</span>
          </div>

          <div
            className="mt-1 text-xs tracking-widest uppercase"
            style={{ color: "var(--pr-muted)" }}
          >
            Dashboard
          </div>
        </div>

        {/* Body */}
        <div className="pb-10">
          <div className="pr-panel p-6">
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-lg font-semibold">Welcome back</div>
                <div className="mt-1 text-sm" style={{ color: "var(--pr-muted)" }}>
                  {loading
                    ? "Loading your account..."
                    : uid
                    ? `Signed in as ${user?.email ?? "user"}`
                    : "Redirecting to login..."}
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.10)" }} />

              <div className="flex flex-wrap gap-12">
                <div>
                  <div className="pr-label mb-2">Next action</div>
                  <Link href="/rocks/new" className="pr-primary-button inline-flex items-center justify-center">
                    Create a new Rock
                  </Link>
                </div>

                <div>
                  <div className="pr-label mb-2">Quick links</div>
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/rocks/new"
                      className="text-sm underline"
                      style={{ color: "var(--pr-text)" }}
                    >
                      Start Rock Builder
                    </Link>
                    <Link
                      href="/"
                      className="text-sm underline"
                      style={{ color: "var(--pr-text)" }}
                    >
                      Home
                    </Link>
                  </div>
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.10)" }} />

              <div className="flex items-center justify-between gap-4">
                <div className="text-sm" style={{ color: "var(--pr-muted)" }}>
                  {uid ? "You’re signed in." : "Not signed in."}
                </div>

                <button
                  type="button"
                  className="pr-primary-button"
                  disabled={!uid || loading}
                  onClick={async () => {
                    try {
                      if (typeof signOut === "function") {
                        await signOut();
                      }
                    } finally {
                      router.replace("/login");
                    }
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>

          {/* Hint */}
          <div className="mt-4 text-xs" style={{ color: "var(--pr-muted)" }}>
            If this page loads locally but Vercel fails, it’s usually because a page is being treated as both Server + Client.
            This file is now strictly Client-only.
          </div>
        </div>
      </div>
    </div>
  );
}
