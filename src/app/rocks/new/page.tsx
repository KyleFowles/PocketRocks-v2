/* ============================================================
   FILE: src/app/rocks/new/page.tsx

   SCOPE:
   Create Rock (Step 1) — CHARTER HARDENED (FINAL SCRUB)
   - Guards inside the action handler (not just UI)
   - Never uses non-null assertions (no user!)
   - No unnecessary casting
   - Clean success flow: Save now shows message, Continue routes
   - Prevents setState after route/unmount
   - Uses shared Button component (keeps hover/halo)
   - Self-styled layout (no pr-* dependencies)
   - Sticky footer (no overlap) with clean spacing
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { saveRock } from "@/lib/rocks";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/Button";

function safeTrim(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

type BannerMsg = { kind: "error" | "ok"; text: string } | null;

export default function NewRockPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<BannerMsg>(null);

  // prevent state updates after route/unmount
  const aliveRef = useRef(true);
  const didRouteRef = useRef(false);

  useEffect(() => {
    aliveRef.current = true;
    didRouteRef.current = false;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const uid = user?.uid ?? null;

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (!uid) return false;
    return true;
  }, [loading, uid]);

  async function onSave(opts: { thenRoute: boolean }) {
    // Charter: guard inside the handler too
    if (loading) {
      setMessage({ kind: "error", text: "Still loading. Try again in a moment." });
      return;
    }
    if (!uid) {
      setMessage({ kind: "error", text: "You’re not signed in. Please log in and try again." });
      return;
    }
    if (saving) return;

    setMessage(null);
    setSaving(true);

    try {
      const rock = {
        title: safeTrim(title),
        draft: safeTrim(draft),
        step: 1,
      };

      const id = await saveRock(rock, uid);

      // If we’re routing, avoid extra UI updates.
      if (opts.thenRoute) {
        didRouteRef.current = true;
        router.push(`/rocks/${id}`);
        return;
      }

      if (!aliveRef.current) return;
      setMessage({ kind: "ok", text: `Saved. Rock ID: ${id}` });
    } catch (e: any) {
      const text = typeof e?.message === "string" ? e.message : "Save failed.";
      if (!aliveRef.current) return;
      setMessage({ kind: "error", text });
    } finally {
      // If we routed away, skip state updates.
      if (!aliveRef.current) return;
      if (didRouteRef.current) return;
      setSaving(false);
    }
  }

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 980,
        margin: "0 auto",
        // reserve space so the sticky footer never covers content
        paddingBottom: 120,
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: 18 }}>
        <div style={{ opacity: 0.6, fontSize: 12, letterSpacing: 2, marginBottom: 6 }}>DRAFT</div>
        <h1 style={{ fontSize: 54, lineHeight: 1.05, margin: "0 0 10px", fontWeight: 800 }}>
          Start your Rock
        </h1>
        <p style={{ opacity: 0.8, margin: 0, fontSize: 18 }}>
          Capture the goal in plain language. You can refine it later.
        </p>
      </header>

      {/* Message banner */}
      {message && (
        <div
          style={{
            marginBottom: 18,
            padding: "12px 14px",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.18)",
            background:
              message.kind === "error"
                ? "rgba(240, 78, 35, 0.14)"
                : "rgba(0, 200, 120, 0.12)",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 4 }}>
            {message.kind === "error" ? "Save failed" : "Saved"}
          </div>
          <div style={{ opacity: 0.92 }}>{message.text}</div>
        </div>
      )}

      {/* Not signed in banner */}
      {!loading && !uid && (
        <div
          style={{
            marginBottom: 18,
            padding: "12px 14px",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 4 }}>You’re not signed in.</div>
          <div style={{ opacity: 0.9 }}>Please log in, then come back to create a Rock.</div>
        </div>
      )}

      {/* Form panel */}
      <section
        style={{
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.04)",
          padding: 18,
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontWeight: 800, marginBottom: 8, opacity: 0.95 }}>
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Clean the spas"
            style={{
              width: "100%",
              padding: "14px 14px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(0,0,0,0.20)",
              color: "inherit",
              outline: "none",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 800, marginBottom: 8, opacity: 0.95 }}>
            Draft Rock statement
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g., Clean all the spas in Traverse City by March 31st."
            rows={6}
            style={{
              width: "100%",
              padding: "14px 14px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(0,0,0,0.20)",
              color: "inherit",
              outline: "none",
              resize: "vertical",
            }}
          />
        </div>
      </section>

      {/* Sticky footer */}
      <footer
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 18,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: "min(980px, calc(100% - 48px))",
            pointerEvents: "auto",
            borderRadius: 22,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(12px)",
            padding: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ opacity: 0.8 }}>Draft · Step 1 of 5</div>

          <div style={{ display: "flex", gap: 10 }}>
            <Button
              variant="secondary"
              onClick={() => onSave({ thenRoute: false })}
              disabled={!canSubmit || saving}
            >
              {saving ? "Saving…" : "Save now"}
            </Button>

            <Button
              variant="primary"
              onClick={() => onSave({ thenRoute: true })}
              disabled={!canSubmit || saving}
            >
              {saving ? "Saving…" : "Continue"}
            </Button>
          </div>
        </div>
      </footer>
    </main>
  );
}
