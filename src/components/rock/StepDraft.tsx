/* ============================================================
   FILE: src/components/rock/StepDraft.tsx

   SCOPE:
   Step 1 (Draft) — Button + UX cleanup (World-class, responsive)
   - Remove ALL bottom "Improve with AI" button usage (was cluttering footer)
   - Desktop:
     - BEFORE AI: show single "Improve with AI" button (in AI panel only)
     - AFTER AI: hide "Improve with AI" and show ONLY:
        - "Replace draft with suggestion" (primary) above
        - AI suggestion box
   - Footer expectation:
     - Step 1 should be driven by the main page footer in RockBuilder:
       only "Continue to SMART" (no Back; no Improve in footer).
     - This component does NOT add any footer buttons.
   - Keep:
     - Desktop teaser (shimmer) before typing
     - Mobile: trigger after typing + drawer
     - Space bar fix (no trimming during typing)
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/Button";

type BannerMsg = { kind: "error" | "ok"; text: string } | null;

type Props = {
  rock: any;
  onChange: (next: any) => void;

  saving: boolean;
  saved: boolean;

  banner: BannerMsg;
  canInteract: boolean;

  onImproveWithAI: () => Promise<void> | void;

  aiSuggestionText: string;
  onApplyAiSuggestionToDraft: () => Promise<void> | void;
};

export default function StepDraft({
  rock,
  onChange,
  saving,
  saved,
  banner,
  canInteract,
  onImproveWithAI,
  aiSuggestionText,
  onApplyAiSuggestionToDraft,
}: Props) {
  // IMPORTANT: do not trim values bound to inputs
  const title = useMemo(() => rock?.title ?? "", [rock?.title]);
  const draft = useMemo(() => rock?.draft ?? "", [rock?.draft]);
  const ai = useMemo(() => aiSuggestionText ?? "", [aiSuggestionText]);

  const disabled = !!saving;
  const hasAnyInput = (title?.length ?? 0) > 0 || (draft?.length ?? 0) > 0;
  const hasAi = (ai?.length ?? 0) > 0;

  // Breakpoint (self-contained)
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 960px)");
    const apply = () => setIsNarrow(mq.matches);
    apply();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    } else {
      // @ts-ignore
      mq.addListener(apply);
      return () => {
        // @ts-ignore
        mq.removeListener(apply);
      };
    }
  }, []);

  // Drawer (mobile)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  function openDrawer() {
    if (disabled) return;
    lastFocusRef.current = (document.activeElement as HTMLElement) || null;
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setTimeout(() => {
      try {
        lastFocusRef.current?.focus?.();
      } catch {
        // ignore
      }
    }, 0);
  }

  // ESC closes drawer
  useEffect(() => {
    if (!drawerOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen]);

  // Lock body scroll while drawer open
  useEffect(() => {
    if (!drawerOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [drawerOpen]);

  // If we resize to desktop while drawer is open, close it
  useEffect(() => {
    if (!isNarrow && drawerOpen) setDrawerOpen(false);
  }, [isNarrow, drawerOpen]);

  // Layout
  const layoutStyle: React.CSSProperties = useMemo(() => {
    return {
      display: "grid",
      gridTemplateColumns: isNarrow ? "1fr" : "1.25fr 0.75fr",
      gap: 18,
      alignItems: "start",
    };
  }, [isNarrow]);

  const rightSlotStyle: React.CSSProperties = useMemo(() => {
    return {
      position: "sticky",
      top: 12,
    };
  }, []);

  // AI card base
  const cardBaseStyle: React.CSSProperties = useMemo(() => {
    return {
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.09)",
      background: "rgba(255,255,255,0.02)",
      padding: 14,
      height: "fit-content",
      boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
    };
  }, []);

  // Teaser card (calm)
  const teaserCardShellStyle: React.CSSProperties = useMemo(() => {
    return {
      position: "relative",
      borderRadius: 16,
      overflow: "hidden",
      opacity: 0.74,
      transform: "translateZ(0)",
    };
  }, []);

  const teaserCardStyle: React.CSSProperties = useMemo(() => {
    return {
      ...cardBaseStyle,
      border: "1px solid rgba(255,255,255,0.07)",
      background: "rgba(255,255,255,0.015)",
      boxShadow: "0 12px 34px rgba(0,0,0,0.22)",
      position: "relative",
      zIndex: 2,
    };
  }, [cardBaseStyle]);

  const shimmerLayerBaseStyle: React.CSSProperties = useMemo(() => {
    return {
      position: "absolute",
      inset: -2,
      zIndex: 1,
      pointerEvents: "none",
      opacity: 0,
      transition: "opacity 220ms ease",
      background:
        "conic-gradient(from 180deg at 50% 50%, rgba(120,170,255,0.00), rgba(120,170,255,0.18), rgba(255,255,255,0.10), rgba(120,170,255,0.14), rgba(120,170,255,0.00))",
      filter: "blur(10px)",
      transform: "translateX(-35%)",
    };
  }, []);

  const shimmerSweepStyle: React.CSSProperties = useMemo(() => {
    return {
      position: "absolute",
      inset: 0,
      zIndex: 1,
      pointerEvents: "none",
      opacity: 0,
      transition: "opacity 220ms ease",
      background:
        "linear-gradient(110deg, rgba(255,255,255,0.00) 35%, rgba(140,190,255,0.18) 50%, rgba(255,255,255,0.00) 65%)",
      transform: "translateX(-30%)",
    };
  }, []);

  const aiHeaderRowStyle: React.CSSProperties = useMemo(() => {
    return {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 10,
    };
  }, []);

  const subtlePillStyle = useMemo(() => {
    const bg = hasAi ? "rgba(70,200,140,0.16)" : "rgba(255,255,255,0.06)";
    const bd = hasAi ? "rgba(70,200,140,0.26)" : "rgba(255,255,255,0.10)";
    return {
      fontSize: 11,
      padding: "4px 8px",
      borderRadius: 999,
      border: `1px solid ${bd}`,
      background: bg,
      color: hasAi ? "rgba(190,255,225,0.92)" : "rgba(255,255,255,0.65)",
      whiteSpace: "nowrap" as const,
    };
  }, [hasAi]);

  const aiExplainStyle: React.CSSProperties = useMemo(() => {
    return {
      fontSize: 12,
      lineHeight: 1.45,
      opacity: 0.75,
      marginBottom: 12,
    };
  }, []);

  const aiSuggestionBoxStyle: React.CSSProperties = useMemo(() => {
    return {
      marginTop: 10,
      padding: 12,
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(0,0,0,0.22)",
      whiteSpace: "pre-wrap",
      lineHeight: 1.45,
      fontSize: 13,
      opacity: 0.95,
    };
  }, []);

  // A slightly more "hero" replace button (keeps your Button component)
  const replaceWrapStyle: React.CSSProperties = useMemo(() => {
    return {
      marginTop: 12,
      display: "grid",
      gap: 10,
    };
  }, []);

  // Mobile trigger (only opens drawer, no Improve button here)
  const mobileAiTriggerStyle: React.CSSProperties = useMemo(() => {
    return {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      width: "100%",
      marginTop: 12,
      padding: "12px 12px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.03)",
      boxShadow: "0 14px 34px rgba(0,0,0,0.22)",
      color: "rgba(255,255,255,0.9)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      userSelect: "none" as const,
    };
  }, [disabled]);

  // Drawer visuals
  const backdropStyle: React.CSSProperties = useMemo(() => {
    return {
      position: "fixed",
      inset: 0,
      zIndex: 50,
      background: "rgba(0,0,0,0.55)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      opacity: drawerOpen ? 1 : 0,
      transition: "opacity 180ms ease",
      pointerEvents: drawerOpen ? "auto" : "none",
    };
  }, [drawerOpen]);

  const drawerStyle: React.CSSProperties = useMemo(() => {
    return {
      position: "fixed",
      top: 0,
      right: 0,
      height: "100vh",
      width: "min(420px, 92vw)",
      zIndex: 60,
      transform: drawerOpen ? "translateX(0)" : "translateX(110%)",
      transition: "transform 220ms ease",
      borderLeft: "1px solid rgba(255,255,255,0.10)",
      background:
        "radial-gradient(1200px 700px at 20% 0%, rgba(90,140,255,0.20), transparent 55%), rgba(10,14,20,0.92)",
      boxShadow: "-24px 0 60px rgba(0,0,0,0.55)",
      display: "flex",
      flexDirection: "column" as const,
    };
  }, [drawerOpen]);

  const drawerHeaderStyle: React.CSSProperties = useMemo(() => {
    return {
      padding: "14px 14px 10px 14px",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    };
  }, []);

  const drawerBodyStyle: React.CSSProperties = useMemo(() => {
    return {
      padding: 14,
      overflow: "auto",
      flex: 1,
    };
  }, []);

  // Shimmer state (only for teaser on desktop)
  const [teaserHot, setTeaserHot] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    } else {
      // @ts-ignore
      mq.addListener(apply);
      return () => {
        // @ts-ignore
        mq.removeListener(apply);
      };
    }
  }, []);

  const shimmerOn = !reduceMotion && teaserHot;

  function renderAiTeaser() {
    return (
      <div
        style={teaserCardShellStyle}
        onMouseEnter={() => setTeaserHot(true)}
        onMouseLeave={() => setTeaserHot(false)}
        onFocusCapture={() => setTeaserHot(true)}
        onBlurCapture={() => setTeaserHot(false)}
      >
        <div
          style={{
            ...shimmerLayerBaseStyle,
            opacity: shimmerOn ? 0.18 : 0,
            animation: shimmerOn ? "pr_shimmer_spin 2.8s linear infinite" : undefined,
          }}
        />
        <div
          style={{
            ...shimmerSweepStyle,
            opacity: shimmerOn ? 0.12 : 0,
            animation: shimmerOn ? "pr_shimmer_sweep 1.9s ease-in-out infinite" : undefined,
          }}
        />

        <div style={teaserCardStyle}>
          <div style={aiHeaderRowStyle}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <div style={{ fontWeight: 850, fontSize: 13, letterSpacing: 0.25, opacity: 0.95 }}>
                AI helper <span style={{ opacity: 0.55, fontWeight: 700 }}>(optional)</span>
              </div>
              <div style={{ fontSize: 11, opacity: 0.65 }}>It unlocks after you start typing.</div>
            </div>

            <div style={subtlePillStyle}>Optional</div>
          </div>

          <div style={{ fontSize: 12, lineHeight: 1.45, opacity: 0.72 }}>
            Start on the left. Once you’ve written anything, AI can tighten your draft in one click.
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            <div style={{ fontSize: 11, opacity: 0.62, lineHeight: 1.35 }}>
              <div>1) Type a title or draft</div>
              <div>2) Generate a tighter draft</div>
              <div>3) Replace only if you like it</div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes pr_shimmer_spin {
            0%   { transform: translateX(-35%) rotate(0deg); }
            100% { transform: translateX(-35%) rotate(360deg); }
          }
          @keyframes pr_shimmer_sweep {
            0%   { transform: translateX(-35%); }
            50%  { transform: translateX(35%); }
            100% { transform: translateX(-35%); }
          }
        `}</style>
      </div>
    );
  }

  function renderAiInner() {
    return (
      <div style={cardBaseStyle}>
        <div style={aiHeaderRowStyle}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <div style={{ fontWeight: 850, fontSize: 13, letterSpacing: 0.25, opacity: 0.95 }}>
              AI helper <span style={{ opacity: 0.55, fontWeight: 700 }}>(optional)</span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.65 }}>Use this only when you want a tighter draft.</div>
          </div>

          <div style={subtlePillStyle}>{hasAi ? "Ready" : "Optional"}</div>
        </div>

        {/* BEFORE AI: show Improve button here */}
        {!hasAi && (
          <>
            <div style={aiExplainStyle}>
              Click to generate a stronger version of your draft. You can keep yours or replace it.
            </div>

            <Button type="button" onClick={onImproveWithAI} disabled={disabled || !hasAnyInput}>
              Improve with AI
            </Button>

            <div style={{ marginTop: 10, fontSize: 11, opacity: 0.62, lineHeight: 1.35 }}>
              You’re in control: your draft stays as-is unless you choose “Replace.”
            </div>
          </>
        )}

        {/* AFTER AI: hide Improve button and show Replace only */}
        {hasAi && (
          <>
            <div style={aiSuggestionBoxStyle}>{ai}</div>

            <div style={replaceWrapStyle}>
              <Button type="button" onClick={onApplyAiSuggestionToDraft} disabled={disabled}>
                Replace draft with suggestion
              </Button>

              <div style={{ fontSize: 11, opacity: 0.65, lineHeight: 1.35 }}>
                Tip: “Replace” updates your Draft box so you can still edit before continuing.
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <div style={layoutStyle}>
        {/* LEFT: inputs */}
        <div>
          {banner && (
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 12,
                border:
                  banner.kind === "error"
                    ? "1px solid rgba(255,120,120,0.35)"
                    : "1px solid rgba(120,255,190,0.25)",
                background:
                  banner.kind === "error" ? "rgba(255,80,80,0.10)" : "rgba(70,200,140,0.10)",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                {banner.kind === "error" ? "Fix this first" : "Done"}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>{banner.text}</div>
            </div>
          )}

          <div style={{ display: "grid", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.2, opacity: 0.85 }}>
                Rock title
              </div>
              <input
                value={title}
                disabled={disabled}
                onChange={(e) => onChange({ ...(rock || {}), title: e.target.value })}
                placeholder="Example: Improve hiring speed"
                style={{
                  width: "100%",
                  padding: "12px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  color: "white",
                  outline: "none",
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.2, opacity: 0.85 }}>
                Draft (plain-English goal)
              </div>
              <textarea
                value={draft}
                disabled={disabled}
                onChange={(e) => onChange({ ...(rock || {}), draft: e.target.value })}
                placeholder="Write it messy. We’ll sharpen it next."
                rows={6}
                style={{
                  width: "100%",
                  padding: "12px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  color: "white",
                  outline: "none",
                  resize: "vertical",
                  lineHeight: 1.4,
                }}
              />
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: 0.75,
                fontSize: 12,
                minHeight: 16,
              }}
            >
              {saving ? "Saving…" : saved ? "Saved" : " "}
            </div>

            {/* MOBILE: AI trigger appears only after typing */}
            {isNarrow && hasAnyInput && (
              <button
                type="button"
                onClick={openDrawer}
                disabled={disabled}
                style={mobileAiTriggerStyle}
                aria-haspopup="dialog"
                aria-expanded={drawerOpen}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <div style={{ fontWeight: 850, letterSpacing: 0.2 }}>
                    AI helper <span style={{ opacity: 0.6, fontWeight: 700 }}>(optional)</span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.8,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {hasAi ? "Suggestion ready — tap to view" : "Tap when you want help tightening your draft"}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={subtlePillStyle}>{hasAi ? "Ready" : "Optional"}</span>
                  <span style={{ fontSize: 14, opacity: 0.9 }}>›</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* DESKTOP: Right column (teaser w/ shimmer → full AI) */}
        {!isNarrow && (
          <div style={rightSlotStyle}>{hasAnyInput ? renderAiInner() : renderAiTeaser()}</div>
        )}
      </div>

      {/* MOBILE DRAWER */}
      {isNarrow && (
        <>
          <div style={backdropStyle} onClick={closeDrawer} aria-hidden="true" />

          <div style={drawerStyle} role="dialog" aria-modal="true" aria-label="AI helper drawer">
            <div style={drawerHeaderStyle}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <div style={{ fontWeight: 900, letterSpacing: 0.3, opacity: 0.96 }}>
                  AI helper <span style={{ opacity: 0.55, fontWeight: 800 }}>(optional)</span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.72 }}>Use this only when you want a tighter draft.</div>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                style={{
                  appearance: "none",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.88)",
                  borderRadius: 12,
                  padding: "8px 10px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <div style={drawerBodyStyle}>{renderAiInner()}</div>
          </div>
        </>
      )}
    </>
  );
}
