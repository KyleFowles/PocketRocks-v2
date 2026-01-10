"use client";

// FILE: src/app/rocks/new/page.tsx

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/useAuth";
import { saveRock } from "@/lib/rocks";
import type { Rock } from "@/types/rock";
import RockBuilder from "@/components/RockBuilder";

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `rock_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export default function NewRockPage() {
  const router = useRouter();
  const { uid, loading } = useAuth();

  const initialRock: Rock | null = useMemo(() => {
    if (!uid) return null;

    return {
      id: newId(),
      companyId: "default",
      ownerId: uid,

      title: "",
      finalStatement: "",

      draft: "",
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      timeBound: "",

      dueDate: "",
      status: "on_track",

      metrics: [],
      milestones: [],
    };
  }, [uid]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="text-slate-300">Checking sign-in…</div>
      </main>
    );
  }

  if (!uid || !initialRock) {
    router.replace("/login");
    return null;
  }

  // ✅ Make uid a guaranteed string for any nested callbacks
  const uidStr: string = uid;

  async function handleSave(rock: Rock) {
    await saveRock(uidStr, rock);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6">
        <div className="text-xs font-semibold tracking-widest text-slate-500">
          NEW ROCK
        </div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Create a Rock
        </h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Fill in one section at a time. The next step will always be clear.
        </p>
      </div>

      <RockBuilder
        initialRock={initialRock}
        onSave={handleSave}
        onCancel={() => router.push("/dashboard")}
      />
    </main>
  );
}
