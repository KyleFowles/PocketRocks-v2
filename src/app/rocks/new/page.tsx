"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import AppHeader from "@/components/AppHeader";
import RockBuilder from "@/components/RockBuilder";
import { useAuth } from "@/lib/useAuth";
import { createRock } from "@/lib/rocks";
import type { Rock } from "@/types/rock";

function newId() {
  return `rock_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function NewRockPage() {
  const router = useRouter();
  const { user, loading, error } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [loading, user, router]);

  const initialRock: Rock | null = useMemo(() => {
    if (!user) return null;

    return {
      id: newId(),

      // Required identity fields
      companyId: "personal",
      ownerId: user.uid,

      // Core fields
      title: "",
      finalStatement: "",

      // SMART fields (required by your Rock type)
      draft: "",
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      timeBound: "",

      // Planning fields
      dueDate: "",
      status: "on_track",

      // Arrays (required)
      metrics: [],
      milestones: [],
    };
  }, [user]);

  async function handleSave(rock: Rock) {
    if (!user) return;

    // Enforce required identity fields (safety)
    const toSave: Rock = {
      ...rock,
      ownerId: rock.ownerId || user.uid,
      companyId: rock.companyId || "personal",
    };

    await createRock(user.uid, toSave);
    router.replace(`/rocks/${toSave.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AppHeader
        title="Smart Rocks"
        right={{ active: "none", showDashboard: true, showLogout: true }}
      />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {error ? (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-5 text-red-100">
            <div className="text-sm font-semibold">Auth error</div>
            <div className="mt-1 text-sm opacity-90">{error}</div>
          </div>
        ) : loading ? (
          <div className="text-slate-400">Checking sign-in…</div>
        ) : !user ? (
          <div className="text-slate-400">Redirecting…</div>
        ) : !initialRock ? (
          <div className="text-slate-400">Preparing Rock…</div>
        ) : (
          <RockBuilder
            initialRock={initialRock}
            onSave={handleSave}
            onCancel={() => router.push("/dashboard")}
          />
        )}
      </main>
    </div>
  );
}
