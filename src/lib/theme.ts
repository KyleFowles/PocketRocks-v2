/* ============================================================
   FILE: src/lib/theme.ts

   PURPOSE:
   Centralized theme control for PocketRocks UI.

   NEW MODEL (EASIER):
   ------------------------------------------------------------
   Instead of hand-picking every token, you pick ONE base color
   (BASE_BUTTON_COLOR) and the system generates the full set of
   button tokens automatically.

   WHAT YOU EDIT MOST OFTEN:
   ------------------------------------------------------------
   1) BASE_BUTTON_COLOR
      Example: "#3B7BFF"

   OPTIONAL TUNING (rare):
   ------------------------------------------------------------
   You can adjust "depth" and "punch" in buildThemeFromBase()
   if you want stronger gradients or glow.

   WHY THIS IS BETTER:
   ------------------------------------------------------------
   - You don’t need to pick 10+ related colors manually
   - The button always stays cohesive
   - Theme changes are fast and safe

   ============================================================ */

export type ThemeTokens = {
  /* Primary Button — Visual Roles */
  buttonTop: string; // top highlight
  buttonMain: string; // main body
  buttonBottom: string; // bottom depth

  /* Primary Button — Surface Details */
  buttonEdge: string; // border / edge line
  buttonInnerTop: string; // inner highlight
  buttonInnerBottom: string; // inner shadow
  buttonSheen: string; // hover sheen sweep

  /* Primary Button — Glow & Focus */
  buttonGlow: string;
  buttonGlowStrong: string;
  focusRing: string;
  focusRingStrong: string;
};

export type ThemeBuildOptions = {
  depth?: number; // 0..1  (gradient strength)
  punch?: number; // 0..1  (glow/ring strength)
};

export const BASE_BUTTON_COLOR = "#3B7BFF"; // ✅ change this most often

// ---------- Color helpers (small + reliable) ----------

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hexToRgb(hex: string) {
  const s = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  const r = parseInt(s.slice(0, 2), 16);
  const g = parseInt(s.slice(2, 4), 16);
  const b = parseInt(s.slice(4, 6), 16);
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number) {
  const to = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 1);
  l = clamp(l, 0, 1);

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let rp = 0,
    gp = 0,
    bp = 0;

  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];

  return {
    r: (rp + m) * 255,
    g: (gp + m) * 255,
    b: (bp + m) * 255,
  };
}

function shiftLightness(hex: string, delta: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const next = hslToRgb(hsl.h, hsl.s, clamp(hsl.l + delta, 0, 1));
  return rgbToHex(next.r, next.g, next.b);
}

function shiftSaturation(hex: string, delta: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const next = hslToRgb(hsl.h, clamp(hsl.s + delta, 0, 1), hsl.l);
  return rgbToHex(next.r, next.g, next.b);
}

function rgbaFromHex(hex: string, a: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(255,255,255,${clamp(a, 0, 1)})`;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${clamp(a, 0, 1)})`;
}

// ---------- Theme builder ----------

export function buildThemeFromBase(baseHex: string, opts?: ThemeBuildOptions): ThemeTokens {
  const depth = clamp(opts?.depth ?? 0.72, 0, 1);
  const punch = clamp(opts?.punch ?? 0.70, 0, 1);

  // Gradient: lighter top, base middle, darker bottom
  const top = shiftLightness(baseHex, 0.12 * depth);
  const main = baseHex.toUpperCase();
  const bottom = shiftLightness(baseHex, -0.16 * depth);

  // Make glow a slightly more saturated + slightly lighter version of the base
  const glowBase = shiftLightness(shiftSaturation(baseHex, 0.10), 0.06);

  // Edge/highlights are neutral whites; we only scale strength with punch
  const edge = `rgba(255,255,255,${0.14 + 0.06 * punch})`;
  const innerTop = `rgba(255,255,255,${0.18 + 0.06 * punch})`;
  const innerBottom = `rgba(0,0,0,${0.16 + 0.06 * depth})`;
  const sheen = `rgba(255,255,255,${0.18 + 0.08 * punch})`;

  // Glow & ring derived from the glowBase
  const glow = rgbaFromHex(glowBase, 0.34 + 0.22 * punch);
  const glowStrong = rgbaFromHex(glowBase, 0.58 + 0.24 * punch);
  const ring = rgbaFromHex(glowBase, 0.42 + 0.18 * punch);
  const ringStrong = rgbaFromHex(glowBase, 0.64 + 0.20 * punch);

  return {
    buttonTop: top,
    buttonMain: main,
    buttonBottom: bottom,

    buttonEdge: edge,
    buttonInnerTop: innerTop,
    buttonInnerBottom: innerBottom,
    buttonSheen: sheen,

    buttonGlow: glow,
    buttonGlowStrong: glowStrong,
    focusRing: ring,
    focusRingStrong: ringStrong,
  };
}

/**
 * DEFAULT_THEME is generated from a single base button color.
 * Change BASE_BUTTON_COLOR to re-theme the app.
 */
export const DEFAULT_THEME: ThemeTokens = buildThemeFromBase(BASE_BUTTON_COLOR);

/**
 * Maps semantic theme tokens to concrete CSS variables.
 * CSS variable names are stable and consumed by Button styles.
 */
const CSS_VAR_MAP: Record<keyof ThemeTokens, string> = {
  buttonTop: "--button-top",
  buttonMain: "--button-main",
  buttonBottom: "--button-bottom",

  buttonEdge: "--button-edge",
  buttonInnerTop: "--button-inner-top",
  buttonInnerBottom: "--button-inner-bottom",
  buttonSheen: "--button-sheen",

  buttonGlow: "--button-glow",
  buttonGlowStrong: "--button-glow-strong",
  focusRing: "--focus-ring",
  focusRingStrong: "--focus-ring-strong",
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
