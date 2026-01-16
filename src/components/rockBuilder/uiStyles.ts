/* ============================================================
   FILE: src/components/rockBuilder/uiStyles.ts

   SCOPE:
   UI helpers for RockBuilder:
   - stepName()
   - inline style objects extracted to keep RockBuilder.tsx smaller
   ============================================================ */

import React from "react";
import type { Step } from "./types";

export function stepName(step: Step) {
  switch (step) {
    case 1:
      return "DRAFT";
    case 2:
      return "SMART";
    case 3:
      return "METRICS";
    case 4:
      return "MILESTONES";
    case 5:
      return "REVIEW + AI";
  }
}

export const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "22px",
    background:
      "radial-gradient(1000px 520px at 20% 20%, rgba(60,130,255,0.20), transparent 60%), radial-gradient(900px 480px at 70% 30%, rgba(255,120,0,0.12), transparent 60%), #050812",
    color: "rgba(255,255,255,0.92)",
  },

  topBar: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },

  brandRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 0,
    lineHeight: 1,
  },

  brandOrange: {
    fontSize: 30,
    fontWeight: 900,
    color: "#FF7900",
    letterSpacing: -0.3,
  },

  brandWhite: {
    fontSize: 30,
    fontWeight: 900,
    color: "rgba(255,255,255,0.92)",
    letterSpacing: -0.3,
  },

  crumb: {
    marginTop: 6,
    fontSize: 12,
    letterSpacing: 2.5,
    opacity: 0.55,
  },

  savePillWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },

  pill: {
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 800,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
  },

  pillFail: {
    border: "1px solid rgba(255,80,80,0.35)",
    background: "rgba(255,80,80,0.12)",
  },

  card: {
    maxWidth: 1100,
    margin: "18px auto 0",
    borderRadius: 26,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.28)",
    overflow: "hidden",
    boxShadow: "0 20px 70px rgba(0,0,0,0.35)",
  },

  cardHdr: {
    padding: "18px 18px 10px",
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    alignItems: "flex-start",
  },

  eyebrow: {
    fontSize: 12,
    letterSpacing: 3,
    opacity: 0.6,
    marginBottom: 4,
  },

  h1: {
    fontSize: 30,
    fontWeight: 900,
    letterSpacing: -0.4,
  },

  sub: {
    marginTop: 6,
    opacity: 0.75,
  },

  subMuted: {
    marginTop: 6,
    opacity: 0.6,
  },

  alert: {
    margin: "0 18px 10px",
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(255,80,80,0.35)",
    background: "rgba(255,80,80,0.10)",
  },

  alertTitle: {
    fontSize: 18,
    fontWeight: 900,
    marginBottom: 6,
  },

  alertBody: {
    fontSize: 14,
    opacity: 0.9,
  },

  section: {
    padding: "14px 18px 18px",
    display: "grid",
    gap: 14,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: 900,
  },

  sectionHint: {
    marginTop: 6,
    fontSize: 14,
    opacity: 0.7,
  },

  label: {
    display: "grid",
    gap: 8,
  },

  labelText: {
    fontSize: 14,
    fontWeight: 800,
    opacity: 0.85,
  },

  textarea: {
    width: "100%",
    minHeight: 120,
    borderRadius: 16,
    padding: "12px 14px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "rgba(255,255,255,0.95)",
    fontSize: 16,
    outline: "none",
    whiteSpace: "pre-wrap",
  },

  tip: {
    marginTop: 6,
    fontSize: 13,
    opacity: 0.6,
  },

  tinyError: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: 800,
    color: "rgba(255,140,140,0.95)",
  },

  footer: {
    padding: "14px 18px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  footerLeft: {
    fontSize: 13,
    opacity: 0.65,
  },

  footerRight: {
    display: "flex",
    gap: 10,
  },
};
