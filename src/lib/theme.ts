/* ============================================================
   FILE: src/lib/theme.ts

   SCOPE:
   Theme system (CHARTER SCRUB)
   - Single source of truth for CSS variables used by Button + app chrome
   - applyTheme() writes ONLY to :root and is safe to call multiple times
   - Guarantees required variables exist (prevents “flat button” regressions)
   - Covers both --focus-ring and --focus-ring-strong (globals.css + Button.tsx)
   - Does not depend on Tailwind classes or missing CSS
   ============================================================ */

export type ThemeVars = Record<string, string>;

export type Theme = {
  name: string;
  vars: ThemeVars;
};

function devWarn(...args: any[]) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
}

function setVar(root: HTMLElement, key: string, value: string) {
  root.style.setProperty(key, String(value));
}

function ensureVar(vars: ThemeVars, key: string, fallback: string) {
  const v = vars[key];
  if (typeof v !== "string" || v.trim() === "") {
    vars[key] = fallback;
  }
}

/**
 * Minimum variables required to keep Button.tsx + globals.css stable.
 * If any are missing, we fill them with safe fallbacks to prevent UI regressions.
 */
function normalizeThemeVars(input: ThemeVars): ThemeVars {
  const v: ThemeVars = { ...(input || {}) };

  // Focus ring (globals.css uses --focus-ring; Button uses --focus-ring-strong)
  ensureVar(v, "--focus-ring", "rgba(110, 168, 255, 0.55)");
  ensureVar(v, "--focus-ring-strong", "rgba(110, 168, 255, 0.78)");

  // Primary button gradient + edges
  ensureVar(v, "--button-top", "rgba(90,150,255,1)");
  ensureVar(v, "--button-main", "rgba(60,120,255,1)");
  ensureVar(v, "--button-bottom", "rgba(40,95,225,1)");
  ensureVar(v, "--button-edge", "rgba(255,255,255,0.18)");

  // Inner highlight gradient
  ensureVar(v, "--button-inner-top", "rgba(255,255,255,0.20)");
  ensureVar(v, "--button-inner-bottom", "rgba(0,0,0,0.18)");

  // Sheen sweep + glow
  ensureVar(v, "--button-sheen", "rgba(255,255,255,0.28)");
  ensureVar(v, "--button-glow", "rgba(90,150,255,0.40)");
  ensureVar(v, "--button-glow-strong", "rgba(90,150,255,0.65)");

  // Optional app-level vars (safe defaults)
  ensureVar(v, "--app-bg", "#050812");
  ensureVar(v, "--app-fg", "rgba(255,255,255,0.92)");
  ensureVar(v, "--card-bg", "rgba(0,0,0,0.28)");
  ensureVar(v, "--card-border", "rgba(255,255,255,0.10)");

  return v;
}

export const DEFAULT_THEME: Theme = {
  name: "pocketrocks-default",
  vars: normalizeThemeVars({
    // Focus ring
    "--focus-ring": "rgba(110, 168, 255, 0.55)",
    "--focus-ring-strong": "rgba(110, 168, 255, 0.78)",

    // Primary button
    "--button-top": "rgba(90,150,255,1)",
    "--button-main": "rgba(60,120,255,1)",
    "--button-bottom": "rgba(40,95,225,1)",
    "--button-edge": "rgba(255,255,255,0.18)",

    "--button-inner-top": "rgba(255,255,255,0.20)",
    "--button-inner-bottom": "rgba(0,0,0,0.18)",

    "--button-sheen": "rgba(255,255,255,0.28)",
    "--button-glow": "rgba(90,150,255,0.40)",
    "--button-glow-strong": "rgba(90,150,255,0.65)",

    // App chrome (optional)
    "--app-bg": "#050812",
    "--app-fg": "rgba(255,255,255,0.92)",
    "--card-bg": "rgba(0,0,0,0.28)",
    "--card-border": "rgba(255,255,255,0.10)",
  }),
};

/**
 * Applies theme CSS variables to :root.
 * Safe to call multiple times.
 */
export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement as HTMLElement | null;
  if (!root) return;

  const effectiveTheme: Theme =
    theme && theme.vars ? theme : DEFAULT_THEME;

  if (!theme || !theme.vars) {
    devWarn("[theme] applyTheme called with empty theme. Using DEFAULT_THEME.");
  }

  const vars = normalizeThemeVars(effectiveTheme.vars);

  // Tag the active theme (debuggable in DevTools)
  root.dataset.theme = effectiveTheme.name || "theme";

  for (const [k, value] of Object.entries(vars)) {
    if (!k.startsWith("--")) continue;
    setVar(root, k, value);
  }
}

/**
 * Helper if you ever want to switch themes later.
 */
export function makeTheme(name: string, vars: ThemeVars): Theme {
  return { name, vars: normalizeThemeVars(vars || {}) };
}
