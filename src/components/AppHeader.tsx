"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/useAuth";
import { logout } from "@/lib/auth";
import { Button } from "@/components/Button";

type HeaderRight = {
  active?: "dashboard" | "none";
  showDashboard?: boolean;
  showLogout?: boolean;
};

type Props = {
  title?: string; // small label to the right of PocketRocks, optional
  right?: HeaderRight;
};

export default function AppHeader({ title = "Smart Rocks", right }: Props) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const showDashboard = right?.showDashboard ?? true;
  const showLogout = right?.showLogout ?? true;
  const active = right?.active ?? "none";

  const statusLabel = useMemo(() => {
    if (loggingOut) return "Logging out…";
    if (loading) return "Checking…";
    return null;
  }, [loading, loggingOut]);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* LEFT: Brand (Hero) */}
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="flex items-baseline gap-2">
            {/* Make PocketRocks the hero on every screen */}
            <span className="leading-none font-extrabold tracking-tight text-4xl sm:text-5xl">
              <span className="text-orange-500">Pocket</span>
              <span className="text-white">Rocks</span>
            </span>
          </Link>

          {/* subtle page/product label */}
          <span className="hidden sm:inline text-sm text-slate-400">{title}</span>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-2">
          {showDashboard && (
            <Button
              onClick={() => router.push("/dashboard")}
              disabled={!user || loading || loggingOut}
            >
              Dashboard
            </Button>
          )}

          {showLogout && (
            <Button
              onClick={handleLogout}
              disabled={!user || loading || loggingOut}
              title={statusLabel ?? "Logout"}
            >
              {statusLabel ?? "Logout"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
