// src/app/rocks/[rockId]/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc, type DocumentData } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

type RockStatus = "Draft" | "On Track" | "At Risk" | "Off Track" | "Complete";

type RockDoc = {
  title: string;
  status: RockStatus;
  dueDate: string;
  finalStatement: string;
  archived: boolean;
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

export default function RockDetailPage() {
  const router = useRouter();
  const params = useParams<{ rockId: string }>();
  const rockId = params?.rockId;

  const [uid, setUid] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [rock, setRock] = useState<RockDoc>({
    title: "",
    status: "Draft",
    dueDate: "",
    finalStatement: "",
    archived: false,
  });

  // AI
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [applied, setApplied] = useState<string | null>(null);

  const saveTimer = useRef<number | null>(null);

  // Auth guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u ? u.uid : null);
      setAuthLoading(false);

      if (!u) router.replace("/login");
    });

    return () => unsub();
  }, [router]);

  const rockRef = useMemo(() => {
    if (!uid || !rockId) return null;
    return doc(db, "users", uid, "rocks", rockId);
  }, [uid, rockId]);

  // Load Rock doc
  useEffect(() => {
    if (authLoading) return;
    if (!rockRef) return;

    let alive = true;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const snap = await getDoc(rockRef);
        if (!alive) return;

        if (!snap.exists()) {
          setError("Rock not found.");
          setLoading(false);
          return;
        }

        const data = snap.data() as DocumentData;

        setRock({
          title: safeString(data.title, ""),
          status: safeStatus(data.status, "Draft"),
          dueDate: safeString(data.dueDate, ""),
          finalStatement: safeString(data.finalStatement, ""),
          archived: safeBool(data.archived, false),
        });

        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to load Rock.");
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [authLoading, rockRef]);

  const flushSave = useCallback(async () => {
    if (!rockRef) return;

    setSaving(true);
    setSaveNote(null);
    setError(null);

    try {
      await updateDoc(rockRef, {
        title: rock.title,
        status: rock.status,
        dueDate: rock.dueDate,
        finalStatement: rock.finalStatement,
        archived: rock.archived,
        updatedAt: serverTimestamp(),
      });

      setSaveNote("Saved ✓");
      window.setTimeout(() => setSaveNote(null), 1200);
    } catch (e: any) {
      setError(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }, [rockRef, rock]);

  const scheduleAutosave = useCallback(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void flushSave();
    }, 650);
  }, [flushSave]);

  const setField = useCallback(
    <K extends keyof RockDoc>(key: K, value: RockDoc[K]) => {
      setRock((prev) => ({ ...prev, [key]: value }));
      setApplied(null);
      scheduleAutosave();
    },
    [scheduleAutosave]
  );

  const toggleArchive = useCallback(async () => {
    setRock((prev) => ({ ...prev, archived: !prev.archived }));
    window.setTimeout(() => void flushSave(), 0);
  }, [flushSave]);

  const callAI = useCallback(async () => {
    if (!rockRef) return;

    setAiLoading(true);
    setAiError(null);
    setSuggestions([]);
    setApplied(null);

    try {
      // ✅ MUST match your actual route folder: src/app/api/rock-suggest/route.ts
      const res = await fetch("/api/rock-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: rock.title,
          finalStatement: rock.finalStatement,
          dueDate: rock.dueDate,
          status: rock.status,
          count: 4,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`AI route failed (${res.status}). ${text.slice(0, 180)}…`);
      }

      const json = (await res.json()) as any;

      if (!json?.ok || !Array.isArray(json?.suggestions)) {
        throw new Error("AI returned an unexpected response.");
      }

      setSuggestions(json.suggestions);
    } catch (e: any) {
      setAiError(e?.message || "AI generation failed.");
    } finally {
      setAiLoading(false);
    }
  }, [rockRef, rock]);

  const applySuggestion = useCallback(
    (s: string) => {
      setRock((prev) => ({ ...prev, finalStatement: s }));
      setApplied(s);
      window.setTimeout(() => void flushSave(), 0);
    },
    [flushSave]
  );

  const surface =
    "rounded-2xl border border-white/12 bg-white/[0.045] shadow-[0_14px_55px_rgba(0,0,0,0.45)]";
  const btnBase =
    "rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
  const btnQuiet = "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/8";
  const btnPrimary =
    "border border-orange-500/25 bg-orange-500 text-slate-950 hover:brightness-105";

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="text-sm text-slate-400">
            {authLoading ? "Checking sign-in…" : "Loading Rock…"}
          </div>
        </div>
      </div>
    );
  }

  if (!uid) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 opacity-45">
        <div className="absolute inset-0 bg-[radial-gradient(1100px_520px_at_18%_0%,rgba(255,121,0,0.06),transparent_60%),radial-gradient(920px_520px_at_92%_8%,rgba(56,189,248,0.05),transparent_58%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/25 to-black/45" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-widest text-slate-500">ROCK</div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">
              {rock.title.trim() ? rock.title : "Untitled Rock"}
            </h1>
            <div className="mt-1 text-sm text-slate-400">
              One clear next step: generate → apply → move on.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => router.push("/dashboard")} className={`${btnBase} ${btnQuiet}`}>
              ← Dashboard
            </button>

            <button onClick={() => void flushSave()} className={`${btnBase} ${btnPrimary}`}>
              {saving ? "Saving…" : "Save"}
            </button>

            <button onClick={() => void toggleArchive()} className={`${btnBase} ${btnQuiet}`}>
              {rock.archived ? "Restore" : "Archive"}
            </button>

            {saveNote ? (
              <span className="ml-1 text-sm font-semibold text-orange-300">{saveNote}</span>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Work */}
          <div className={`lg:col-span-2 ${surface} p-6`}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <div className="text-xs font-semibold tracking-widest text-slate-500">TITLE</div>
                <input
                  value={rock.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="Name this Rock"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-white/20"
                />
              </label>

              <label className="block">
                <div className="text-xs font-semibold tracking-widest text-slate-500">STATUS</div>
                <select
                  value={rock.status}
                  onChange={(e) => setField("status", e.target.value as RockStatus)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-100 outline-none focus:border-white/20"
                >
                  <option>Draft</option>
                  <option>On Track</option>
                  <option>At Risk</option>
                  <option>Off Track</option>
                  <option>Complete</option>
                </select>
              </label>

              <label className="block sm:col-span-2">
                <div className="text-xs font-semibold tracking-widest text-slate-500">DUE DATE</div>
                <input
                  value={rock.dueDate}
                  onChange={(e) => setField("dueDate", e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-white/20"
                />
              </label>
            </div>

            <div className="mt-6">
              <div className="text-xs font-semibold tracking-widest text-slate-500">
                FINAL ROCK STATEMENT
              </div>
              <div className="mt-1 text-sm text-slate-400">
                One sentence. Measurable. Outcome-based.
              </div>

              <textarea
                value={rock.finalStatement}
                onChange={(e) => setField("finalStatement", e.target.value)}
                placeholder="Example: By March 31, deliver X that results in Y measured by Z."
                rows={4}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-4 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-white/20"
              />
            </div>
          </div>

          {/* Right: One clear next step */}
          <div className={`lg:col-span-1 ${surface} p-6`}>
            <div className="text-xs font-semibold tracking-widest text-slate-500">NEXT STEP</div>

            <div className="mt-3">
              <div className="text-base font-semibold text-slate-100">Generate better options</div>
              <p className="mt-1 text-sm text-slate-400">
                Then apply the best one with one click.
              </p>
            </div>

            <div className="mt-4">
              <button
                onClick={() => void callAI()}
                className={`${btnBase} ${btnPrimary} w-full`}
                disabled={aiLoading}
              >
                {aiLoading ? "Generating…" : suggestions.length ? "Regenerate" : "Generate"}
              </button>
            </div>

            {aiError ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {aiError}
              </div>
            ) : null}

            {suggestions.length ? (
              <div className="mt-5 space-y-3">
                {suggestions.map((s, idx) => {
                  const isRecommended = idx === 0;
                  const isApplied = applied === s;

                  return (
                    <div
                      key={`${idx}-${s}`}
                      className="rounded-2xl border border-white/10 bg-white/4 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm text-slate-100">{s}</div>

                          <div className="mt-2 flex items-center gap-2">
                            {isRecommended ? (
                              <span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-100">
                                Recommended
                              </span>
                            ) : null}

                            {isApplied ? (
                              <span className="text-xs font-semibold text-emerald-200">
                                Applied ✓
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <button onClick={() => applySuggestion(s)} className={`${btnBase} ${btnQuiet}`}>
                          Apply
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 text-sm text-slate-500">
                Tip: A due date helps the AI write cleaner, measurable statements.
              </div>
            )}
          </div>
        </div>

        <div className="h-10" />
      </div>
    </div>
  );
}
