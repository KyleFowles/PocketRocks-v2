/* ============================================================
   FILE: src/components/Button.tsx

   SCOPE:
   Single source of truth for ALL buttons in PocketRocks.
   - Permanent button palette: GLASS BLUE (bright, translucent, premium)
   - Harmonizes with the “PocketRocks” name and brand tone (orange brand + blue action)
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
  "transition-[transform,box-shadow,filter,background-color,border-color] duration-150 ease-out " +
  // focus state (accessible + calm)
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/35 " +
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
 * PRIMARY — GLASS BLUE (BRIGHT, TRANSLUCENT)
 * - True "glass" feel using translucent gradients + subtle inner highlight
 * - No blur (keeps text sharp)
 * - Premium depth without neon
 * - Looks great next to orange brand wordmark
 */
const primaryGlassBlue =
  "text-white tracking-[0.012em] " +
  // glassy gradient (translucent)
  "bg-[linear-gradient(180deg,rgba(255,255,255,0.26),rgba(56,189,248,0.22)_22%,rgba(14,165,233,0.22)_55%,rgba(2,132,199,0.26))] " +
  // crisp glass edge
  "border border-sky-200/25 " +
  // depth + inner highlight (no blur)
  "shadow-[0_14px_30px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.22)] " +
  // hover/active: subtle lift + brightness, tactile press
  "hover:brightness-[1.08] active:brightness-[0.96] " +
  "hover:-translate-y-[1px] active:translate-y-[1px] " +
  "active:shadow-[0_8px_18px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.14)]";

const secondaryGlass =
  "text-white/90 tracking-[0.01em] " +
  "border border-white/14 " +
  "bg-white/6 " +
  "shadow-none " +
  "hover:bg-white/10 " +
  "hover:-translate-y-[1px] active:translate-y-[1px]";

const ghostGlass =
  "text-white/85 " +
  "border border-transparent " +
  "bg-transparent " +
  "hover:bg-white/10 active:bg-white/8";

const dangerGlass =
  "text-white tracking-[0.01em] " +
  "border border-red-200/18 " +
  "bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(239,68,68,0.85))] " +
  "shadow-[0_12px_26px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.16)] " +
  "hover:brightness-[1.05] active:brightness-[0.96] " +
  "hover:-translate-y-[1px] active:translate-y-[1px] " +
  "active:shadow-[0_7px_16px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.10)]";

const variants: Record<ButtonVariant, string> = {
  primary: primaryGlassBlue,
  secondary: secondaryGlass,
  ghost: ghostGlass,
  danger: dangerGlass,
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
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/75 border-t-transparent"
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
