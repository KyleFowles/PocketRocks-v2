/* ============================================================
   FILE: src/lib/theme.ts

   PURPOSE:
   Centralized theme control for PocketRocks UI.
   ------------------------------------------------------------
   This file is the SINGLE SOURCE OF TRUTH for primary button
   styling (color, depth, glow, and focus behavior).

   👉 Change values here ONCE and the entire application updates.
   👉 No other files should define primary button styling directly.

   HOW THIS WORKS:
   - Values below map to stable CSS variables
   - Those CSS variables are consumed by:
       • <Button />
       • buttonClassName()
       • ButtonLink
       • Any future UI components
   - Providers.tsx applies these tokens at app startup.

   ============================================================
   QUICK START (MOST COMMON CHANGE)
   ------------------------------------------------------------
   To change the PRIMARY button color globally, update ONLY
   these three values in DEFAULT_THEME:

     buttonTop     → top highlight
     buttonMain    → main body
     buttonBottom  → bottom depth

   Example:
     buttonTop:    "#84B6FF",
     buttonMain:   "#3B7BFF",
     buttonBottom: "#1A49E6",

   ============================================================
   COPY / PASTE THEMES
   ------------------------------------------------------------

   🔵 BLUE (Default SaaS)
     buttonTop:    "#84B6FF",
     buttonMain:   "#3B7BFF",
     buttonBottom: "#1A49E6",

   🟢 GREEN (Success / Growth)
     buttonTop:    "#7EE2A8",
     buttonMain:   "#34C27A",
     buttonBottom: "#1F8F58",

   🟣 PURPLE (Premium / Strategy)
     buttonTop:    "#B79CFF",
     buttonMain:   "#7B5CFF",
     buttonBottom: "#4A32CC",

   🟠 ORANGE (Action / Energy)
     buttonTop:    "#FFC27A",
     buttonMain:   "#FF8A1F",
     buttonBottom: "#D65A00",

   ============================================================
   IMPORTANT RULES
   ------------------------------------------------------------
   ✅ Do NOT hardcode button colors elsewhere.
   ✅ Use role-based names only (no color names).
   ✅ If adding a new token, update:
        - ThemeTokens
        - CSS_VAR_MAP
   ============================================================ */

export type ThemeTokens = {
  /* ==========================================================
     Primary Button — Visual Roles
     ========================================================== */
  buttonTop: string;       // top highlight
  buttonMain: string;      // main body
  buttonBottom: string;    // bottom depth

  /* ==========================================================
     Primary Button — Surface Details
     ========================================================== */
  buttonEdge: string;      // border / edge line
  buttonInnerTop: string;  // inner highlight
  buttonInnerBottom: string; // inner shadow
  buttonSheen: string;     // hover sheen sweep

  /* ==========================================================
     Primary Button — Glow & Focus
     ========================================================== */
  buttonGlow: string;
  buttonGlowStrong: string;
  focusRing: string;
  focusRingStrong: string;
};

export const DEFAULT_THEME: ThemeTokens = {
  /* Primary Button Gradient */
  buttonTop: "#84B6FF",
  buttonMain: "#3B7BFF",
  buttonBottom: "#1A49E6",

  /* Surface Details */
  buttonEdge: "rgba(255,255,255,0.16)",
  buttonInnerTop: "rgba(255,255,255,0.20)",
  buttonInnerBottom: "rgba(0,0,0,0.18)",
  buttonSheen: "rgba(255,255,255,0.22)",

  /* Glow + Focus */
  buttonGlow: "rgba(98,160,255,0.45)",
  buttonGlowStrong: "rgba(98,160,255,0.72)",
  focusRing: "rgba(110,168,255,0.55)",
  focusRingStrong: "rgba(110,168,255,0.78)",
};

/**
 * Maps semantic theme tokens to concrete CSS variables.
 * CSS variable names are intentionally stable and consumed
 * by Button styles.
 */
const CSS_VAR_MAP: Record<keyof ThemeTokens, string> = {
  buttonTop: "--btn-blue-1",
  buttonMain: "--btn-blue-2",
  buttonBottom: "--btn-blue-3",

  buttonEdge: "--btn-blue-edge",
  buttonInnerTop: "--btn-inner-top",
  buttonInnerBottom: "--btn-inner-bot",
  buttonSheen: "--btn-sheen",

  buttonGlow: "--btn-blue-glow",
  buttonGlowStrong: "--btn-blue-glow-strong",
  focusRing: "--ring",
  focusRingStrong: "--ring-strong",
};

/**
 * Apply theme tokens by setting CSS variables on :root.
 * Safe to call multiple times.
 */
export function applyTheme(theme: ThemeTokens) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  (Object.keys(CSS_VAR_MAP) as Array<keyof ThemeTokens>).forEach((key) => {
    root.style.setProperty(CSS_VAR_MAP[key], theme[key]);
  });
}
