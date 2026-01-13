/* ============================================================
   FILE: src/components/Button.tsx

   SCOPE:
   Single source of truth for ALL buttons in PocketRocks.
   - Permanent button palette: MINERAL TEAL (solid, grounded)
   - Harmonizes with the “PocketRocks” name and brand tone (stone > glass)
   - Make it responsive (mobile-first sizing + full-width on small screens)
   - World-class SaaS motion timing (snappy, confident)
   - Crisp, clean text rendering (no fuzz)
   - Variants: primary | secondary | ghost | danger
   - Sizes: sm | md | lg
   - Disabled + loading support
   - Turbopack-safe (no duplicate symbol names)
   ============================================================ */

"use client";

import * as React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

function cx(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------
   BASE BUTTON STYLES (APPLIES TO ALL VARIANTS)
------------------------------------------------------------ */
const base =
  // layout
  "inline-flex items-center justify-center gap-2 " +
  // responsive width: full on small screens, content-width on larger
  "w-full sm:w-auto " +
  // minimum tap target for mobile
  "min-h-[44px] " +
  // shape + behavior
  "rounded-[14px] select-none " +
  // WORLD-CLASS MOTION (FAST, DECISIVE)
  "transition-[transform,box-shadow,filter,background-color,border-color] duration-130 ease-out " +
  // focus state (accessible + calm)
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/35 " +
  // disabled behavior
  "disabled:opacity-60 disabled:cursor-not-allowed " +
  // mobile polish
  "[-webkit-tap-highlight-color:transparent] " +
  // CRISP TEXT RENDERING
  "[text-rendering:geometricPrecision] [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale]";

const sizes: Record<ButtonSize, string> = {
  // mobile-first spacing, slightly larger on sm+
  sm: "text-sm font-semibold px-3.5 py-2 sm:px-4",
  md: "text-[15px] font-semibold px-5 py-3 sm:px-6",
  lg: "text-[16px] font-semibold px-6 py-3.5 sm:px-7",
};

/* ------------------------------------------------------------
   VARIANTS
------------------------------------------------------------ */

/**
 * PRIMARY — MINERAL TEAL (SOLID, GROUNDED)
 * - No glass blur
 * - No neon glow
 * - Subtle, premium depth (stone-like)
 * - High contrast + crisp text
 */
const primaryMineralTeal =
  "text-white tracking-[0.012em] " +
  // solid mineral teal with a gentle top highlight (not glass)
  "bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(20,184,166,1))] " +
  // subtle border for definition on dark backgrounds
  "border border-teal-200/15 " +
  // premium, restrained depth
  "shadow-[0_10px_22px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.10)] " +
  // hover/active: a touch brighter/darker + tactile press
  "hover:brightness-[1.06] active:brightness-[0.96] " +
  "hover:-translate-y-[1px] active:translate-y-[1px] " +
  "active:shadow-[0_6px_14px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.06)]";

const secondaryMineral =
  "text-white/90 tracking-[0.01em] " +
  "border border-slate-500/60 " +
  "bg-white/6 " +
  "shadow-none " +
  "hover:bg-white/10 " +
  "hover:-translate-y-[1px] active:translate-y-[1px]";

const ghostMineral =
  "text-white/85 " +
  "border border-transparent " +
  "bg-transparent " +
  "hover:bg-white/10 active:bg-white/8";

const dangerMineral =
  "text-white tracking-[0.01em] " +
  "border border-red-200/15 " +
  "bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(239,68,68,1))] " +
  "shadow-[0_10px_22px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.10)] " +
  "hover:brightness-[1.05] active:brightness-[0.96] " +
  "hover:-translate-y-[1px] active:translate-y-[1px] " +
  "active:shadow-[0_6px_14px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.06)]";

const variants: Record<ButtonVariant, string> = {
  primary: primaryMineralTeal,
  secondary: secondaryMineral,
  ghost: ghostMineral,
  danger: dangerMineral,
};

/* ------------------------------------------------------------
   COMPONENT
------------------------------------------------------------ */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function ButtonInner(
    { className, variant = "primary", size = "md", disabled, loading, children, type, ...props },
    ref
  ) {
    const isDisabled = Boolean(disabled || loading);

    return (
      <button
        ref={ref}
        type={type ?? "button"}
        disabled={isDisabled}
        className={cx(base, sizes[size], variants[variant], className)}
        {...props}
      >
        {loading ? (
          <>
            <span
              aria-hidden="true"
              className="h-4 w-4 rounded-full border-2 border-white/75 border-t-transparent animate-spin"
            />
            <span className="leading-none">{children}</span>
          </>
        ) : (
          <span className="leading-none">{children}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
