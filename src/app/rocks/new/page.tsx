/* ============================================================
   FILE: src/app/rocks/new/page.tsx

   SCOPE:
   Create Rock (Step 1)
   - Hero header
   - Flex shell + sticky footer (no overlap)
   - Shorter textareas
   ============================================================ */

"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/useAuth";
import { saveRock } from "@/lib/rocks";
import type { Rock } from "@/types/rock";

export default function NewRockPage() {
  const router = useRouter();
  const { uid, loading } = useAuth();

  const [draft, setDraft] = useState("");
  const [details, setDetails] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canContinue = useMemo(() => {
    return draft.trim().length >= 3 && !saving && !loading;
  }, [draft, saving, loading]);

  async function onContinue() {
    setErr(null);

    const cleaned = draft.trim();
    if (cleaned.length < 3) {
      setErr("Please enter your Rock first.");
      return;
    }
    if (!uid) {
      setErr("You are not signed in. Please log in again.");
      return;
    }

    try {
      setSaving(true);

      const newRock: Partial<Rock> = {
        title: cleaned,
        // @ts-ignore
        details: details.trim() || "",
        // @ts-ignore
        status: "draft",
      };

      const result: any = await saveRock(uid, newRock as Rock);

      const rockId =
        typeof result === "string"
          ? result
          : result?.id || result?.rockId || result?.docId;

      if (!rockId) throw new Error("saveRock did not return a rock id.");

      router.push(`/rocks/${rockId}`);
    } catch (e) {
      console.error(e);
      setErr("Could not continue. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pr-page pr-shell">
      {/* Content */}
      <div className="flex-1">
        <div className="max-w-3xl mx-auto px-6">
          {/* HERO HEADER */}
          <div className="pt-8 pb-4">
            <div className="text-[34px] leading-tight">
              <span className="pr-header-accent font-extrabold">Pocket</span>
              <span className="font-black tracking-tight">Rocks</span>
            </div>
            <div
              className="mt-1 text-xs tracking-widest uppercase"
              style={{ color: "var(--pr-muted)" }}
            >
              Create Rock · Draft
            </div>
          </div>

          {/* Main */}
          <div className="pt-6 pb-10">
            {err && <div className="pr-alert mb-3">{err}</div>}

            <div className="pr-panel p-6">
              <div className="pr-label mb-2">Draft Rock (one sentence)</div>

              <textarea
                className="pr-textarea"
                style={{ minHeight: 160 }}
                placeholder="Enter text here."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />

              <div className="mt-5 pr-label mb-2">Add details (optional)</div>

              <textarea
                className="pr-textarea"
                style={{ minHeight: 110 }}
                placeholder="Add a few notes that help you clarify the Rock."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer (short + never overlaps content) */}
      <div className="pr-footer-dock">
        <div className="pr-footer-inner">
          <div className="text-xs" style={{ color: "var(--pr-muted)" }}>
            Draft · Step 1 of 5
          </div>

          <button
            type="button"
            className="pr-primary-button"
            disabled={!canContinue}
            onClick={onContinue}
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
