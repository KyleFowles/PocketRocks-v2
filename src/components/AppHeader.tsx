// src/components/AppHeader.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Props = {
  title?: string; // small label to the right of PocketRocks, optional
};

export default function AppHeader({ title = "Smart Rocks" }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [logoutBusy, setLogoutBusy] = useState(false);

  useEffect(() => {
    // Make sure we always exit the "checking" state.
    let safety = window.setTimeout(() => {
      setAuthChecked(true);
    }, 2500);

    const unsub = onAuthStateChanged(auth, (u) => {
      window.clearTimeout(safety);
      setUser(u);
      setAuthChecked(true);
    });

    return () => {
      window.clearTimeout(safety);
      unsub();
    };
  }, []);

  const atDashboard = useMemo(() => {
    return pathname === "/dashboard";
  }, [pathname]);

  const btnBase =
    "rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
  const btnQuiet =
    "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/8";
  const btnDanger =
    "border border-red-500/25 bg-red-500/10 text-red-100 hover:bg-red-500/15";

  async function doLogout() {
    try {
      setLogoutBusy(true);
      await signOut(auth);
      router.replace("/login");
    } finally {
      setLogoutBusy(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Left: Brand (hero) */}
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="flex items-baseline gap-3">
            <span className="leading-none font-extrabold tracking-tight text-4xl sm:text-5xl">
              <span className="text-orange-500">Pocket</span>
              <span className="text-white">Rocks</span>
            </span>
          </Link>

          <span className="hidden sm:inline text-sm text-slate-400">{title}</span>
        </div>

        {/* Right: Nav */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className={`${btnBase} ${btnQuiet} ${atDashboard ? "opacity-80" : ""}`}
            aria-current={atDashboard ? "page" : undefined}
          >
            Dashboard
          </Link>

          {/* Auth status */}
          {!authChecked ? (
            <button className={`${btnBase} ${btnDanger}`} disabled title="Checking sign-in…">
              Checking…
            </button>
          ) : user ? (
            <button
              onClick={doLogout}
              disabled={logoutBusy}
              className={`${btnBase} ${btnDanger}`}
              title="Sign out"
            >
              {logoutBusy ? "Signing out…" : "Logout"}
            </button>
          ) : (
            <Link href="/login" className={`${btnBase} ${btnQuiet}`}>
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
