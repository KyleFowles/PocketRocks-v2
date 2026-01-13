/* ============================================================
   FILE: src/components/Button.tsx

   SCOPE:
   Single source of truth for ALL buttons and button-like links.

   FINAL POLISH (WORLD-CLASS SAAS):
   1) Motion timing consistency:
      - Standardize to duration-150 + ease-out
      - Consistent hover/active press behavior across variants
   2) Link vs button consistency:
      - Add ButtonLink to avoid "Link styled like a button" drift
      - Same sizing/variants/motion as Button
   3) Responsive:
      - Full-width on mobile, auto width on sm+

   VARIANTS:
   - primary | secondary | ghost | danger | dangerGhost

   SIZES:
   - sm | md | lg
   ============================================================ */

"use client";

import * as React from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dangerGhost";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export type ButtonLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

function cx(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------
   BASE (applies to Button + ButtonLink)
------------------------------------------------------------ */
const base =
  "inline-flex items-center justify-center gap-2 " +
  "w-full sm:w-auto " +
  "min-h-[44px] " +
  "rounded-[14px] select-none " +
  // CONSISTENT SAAS MOTION
  "transition-[transform,box-shadow,filter,background-color,border-color,color] duration-150 ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/35 " +
  "disabled:opacity-60 disabled:cursor-not-allowed " +
  "[-webkit-tap-highlight-color:transparent] " +
  // CRISP TEXT
  "[text-rendering:geometricPrecision] [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale]";

const sizes: Record<ButtonSize, string> = {
  sm: "text-sm font-semibold px-3.5 py-2 sm:px-4",
  md: "text-[15px] font-semibold px-5 py-3 sm:px-6",
  lg: "text-[16px] font-semibold px-6 py-3.5 sm:px-7",
};

/* ------------------------------------------------------------
   VARIANTS
------------------------------------------------------------ */
const primaryMineralTeal =
  "text-white tracking-[0.012em] " +
  "bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(20,184,166,1))] " +
  "border border-teal-200/15 " +
  "shadow-[0_10px_22px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.10)] " +
  "hover:brightness-[1.06] active:brightness-[0.96] " +
  "hover:-translate-y-[1px] active:translate-y-[1px] " +
  "active:shadow-[0_6px_14px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.06)]";

const secondaryMineral =
  "text-white/90 tracking-[0.01em] " +
  "border border-white/12 " +
  "bg-white/6 " +
  "shadow-none " +
  "hover:bg-white/10 " +
  "hover:-translate-y-[1px] active:translate-y-[1px]";

const ghostMineral =
  "text-white/85 " +
  "border border-transparent " +
  "bg-transparent " +
  "shadow-none " +
  "hover:bg-white/10 active:bg-white/8";

const dangerMineral =
  "text-white tracking-[0.01em] " +
  "border border-red-200/15 " +
  "bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(239,68,68,1))] " +
  "shadow-[0_10px_22px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.10)] " +
  "hover:brightness-[1.05] active:brightness-[0.96] " +
  "hover:-translate-y-[1px] active:translate-y-[1px] " +
  "active:shadow-[0_6px_14px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.06)]";

// “Danger, but low weight” (perfect for Logout)
const dangerGhost =
  "text-red-200 " +
  "border border-red-500/25 " +
  "bg-transparent " +
  "shadow-none " +
  "hover:bg-red-500/10 hover:text-red-100 " +
  "active:bg-red-500/12";

const variants: Record<ButtonVariant, string> = {
  primary: primaryMineralTeal,
  secondary: secondaryMineral,
  ghost: ghostMineral,
  danger: dangerMineral,
  dangerGhost: dangerGhost,
};

/* ------------------------------------------------------------
   BUTTON
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

/* ------------------------------------------------------------
   BUTTON-LIKE LINK (prevents class drift)
------------------------------------------------------------ */
export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  function ButtonLinkInner(
    { href, className, variant = "primary", size = "md", "aria-disabled": ariaDisabled, children, ...props },
    ref
  ) {
    const disabled = Boolean(ariaDisabled);

    return (
      <Link
        ref={ref as any}
        href={href}
        aria-disabled={disabled ? true : undefined}
        tabIndex={disabled ? -1 : props.tabIndex}
        className={cx(
          base,
          sizes[size],
          variants[variant],
          disabled ? "pointer-events-none opacity-60" : "",
          className
        )}
        {...props}
      >
        <span className="leading-none">{children}</span>
      </Link>
    );
  }
);

ButtonLink.displayName = "ButtonLink";
