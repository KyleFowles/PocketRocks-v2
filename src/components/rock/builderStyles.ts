/* ============================================================
   FILE: src/components/rock/builderStyles.ts

   SCOPE:
   RockBuilder styles (PHASE 1)
   - Pure style extraction only (NO logic changes)
   - Exports all inline style objects used by RockBuilder
   ============================================================ */

import type React from "react";

export const page: React.CSSProperties = {
  minHeight: "100vh",
  padding: "22px",
  background:
    "radial-gradient(1000px 520px at 20% 20%, rgba(60,130,255,0.20), transparent 60%), radial-gradient(900px 480px at 70% 30%, rgba(255,120,0,0.12), transparent 60%), #050812",
  color: "rgba(255,255,255,0.92)",
};

export const topBar: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
};

export const brandRow: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 0,
  lineHeight: 1,
};

export const brandOrange: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 900,
  color: "#FF7900",
  letterSpacing: -0.3,
};

export const brandWhite: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 900,
  color: "rgba(255,255,255,0.92)",
  letterSpacing: -0.3,
};

export const crumb: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  letterSpacing: 2.5,
  opacity: 0.55,
};

export const savePillWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 6,
};

export const pill: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 800,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
};

export const pillFail: React.CSSProperties = {
  border: "1px solid rgba(255,80,80,0.35)",
  background: "rgba(255,80,80,0.12)",
};

export const card: React.CSSProperties = {
  maxWidth: 1100,
  margin: "18px auto 0",
  borderRadius: 26,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.28)",
  overflow: "hidden",
  boxShadow: "0 20px 70px rgba(0,0,0,0.35)",
};

export const cardHdr: React.CSSProperties = {
  paddingTop: 18,
  paddingRight: 18,
  paddingBottom: 10,
  paddingLeft: 18,
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "flex-start",
};

export const eyebrow: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: 3,
  opacity: 0.6,
  marginBottom: 4,
};

export const h1: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 900,
  letterSpacing: -0.4,
};

export const sub: React.CSSProperties = {
  marginTop: 6,
  opacity: 0.75,
};

export const subMuted: React.CSSProperties = {
  marginTop: 6,
  opacity: 0.6,
};

export const alert: React.CSSProperties = {
  margin: "0 18px 10px",
  padding: 16,
  borderRadius: 18,
  border: "1px solid rgba(255,80,80,0.35)",
  background: "rgba(255,80,80,0.10)",
};

export const alertTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  marginBottom: 6,
};

export const alertBody: React.CSSProperties = {
  fontSize: 14,
  opacity: 0.9,
};

export const section: React.CSSProperties = {
  padding: "14px 18px 18px",
  display: "grid",
  gap: 14,
};

export const sectionTopRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

export const sectionTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
};

export const sectionHint: React.CSSProperties = {
  marginTop: 6,
  fontSize: 14,
  opacity: 0.7,
};

export const label: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

export const labelText: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  opacity: 0.85,
};

export const input: React.CSSProperties = {
  width: "100%",
  borderRadius: 16,
  padding: "12px 14px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "rgba(255,255,255,0.95)",
  fontSize: 16,
  outline: "none",
};

export const textarea: React.CSSProperties = {
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
};

export const tip: React.CSSProperties = {
  marginTop: 6,
  fontSize: 13,
  opacity: 0.6,
};

export const tinyError: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  fontWeight: 800,
  color: "rgba(255,140,140,0.95)",
};

export const footer: React.CSSProperties = {
  padding: "14px 18px",
  borderTop: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

export const footerLeft: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.65,
};

export const footerRight: React.CSSProperties = {
  display: "flex",
  gap: 10,
};
