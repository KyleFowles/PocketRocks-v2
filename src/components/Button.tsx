/* ============================================================
   FILE: src/components/Button.tsx

   SCOPE:
   SaaS-grade Button component (CHARTER HARDENED)
   - Single source of truth for button styling + halo/glow
   - Disabled state is consistent for BOTH disabled and loading
   - Disabled buttons do NOT animate on hover (no fake affordance)
   - Keeps role-based CSS variable usage (themeable)
   ============================================================ */

"use client";

import React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dangerGhost";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function sizeClass(size: ButtonSize) {
  switch (size) {
    case "sm":
      return "h-9 px-3 text-sm rounded-lg";
    case "lg":
      return "h-12 px-5 text-base rounded-2xl";
    default:
      return "h-10 px-4 text-sm rounded-xl";
  }
}

export function buttonClassName(opts?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const variant = opts?.variant ?? "primary";
  const size = opts?.size ?? "md";
  const fullWidth = opts?.fullWidth ?? false;
  const disabled = opts?.disabled ?? false;

  // Base always-on styling (NO hover/active here; those get added only if enabled)
  const base =
    "relative inline-flex items-center justify-center gap-2 select-none font-semibold " +
    "transition-[transform,box-shadow,background,border-color,color,filter] duration-150 " +
    "focus-visible:outline-none overflow-hidden";

  // Only apply motion + hover effects when enabled
  const interactive =
    "cursor-pointer " +
    "hover:-translate-y-[1px] active:translate-y-[1px] active:scale-[0.99]";

  // Disabled should look and feel disabled
  const disabledClass =
    "opacity-60 cursor-not-allowed " +
    "pointer-events-none " + // prevents hover/active firing in some browsers/styles
    "transform-none";

  const width = fullWidth ? "w-full" : "";

  const primary =
    "text-white " +
    "bg-[linear-gradient(180deg,var(--button-top),var(--button-main)_45%,var(--button-bottom))] " +
    "border border-[color:var(--button-edge)] " +
    "shadow-[0_14px_44px_rgba(0,0,0,0.38)] " +
    "before:content-[''] before:absolute before:inset-[1px] before:rounded-[inherit] " +
    "before:bg-[linear-gradient(180deg,var(--button-inner-top),transparent_35%,var(--button-inner-bottom))] " +
    "after:content-[''] after:absolute after:inset-0 " +
    "after:bg-[linear-gradient(120deg,transparent_0%,var(--button-sheen)_18%,transparent_36%)] " +
    "after:translate-x-[-140%] after:opacity-0 " +
    "after:transition-[transform,opacity] after:duration-500 " +
    "hover:after:opacity-100 hover:after:translate-x-[140%] " +
    "hover:shadow-[0_18px_54px_rgba(0,0,0,0.40),0_0_26px_var(--button-glow)] " +
    "focus-visible:shadow-[0_18px_54px_rgba(0,0,0,0.40),0_0_0_3px_var(--focus-ring-strong),0_0_34px_var(--button-glow-strong)]";

  const secondary =
    "text-white/90 bg-white/7 border border-white/12 hover:bg-white/10 " +
    "focus-visible:shadow-[0_0_0_3px_var(--focus-ring-strong)]";

  const ghost =
    "text-white/85 bg-transparent hover:bg-white/7 " +
    "focus-visible:shadow-[0_0_0_3px_var(--focus-ring-strong)]";

  const danger =
    "text-white bg-[linear-gradient(180deg,#ff7a6b,#f04e23_55%,#c83b16)] " +
    "hover:shadow-[0_18px_54px_rgba(0,0,0,0.40),0_0_18px_rgba(240,78,35,0.45)] " +
    "focus-visible:shadow-[0_0_0_3px_var(--focus-ring-strong)]";

  const dangerGhost =
    "text-white/90 bg-white/7 hover:bg-[rgba(240,78,35,0.16)] " +
    "focus-visible:shadow-[0_0_0_3px_var(--focus-ring-strong)]";

  const variantClass =
    variant === "primary"
      ? primary
      : variant === "secondary"
      ? secondary
      : variant === "ghost"
      ? ghost
      : variant === "danger"
      ? danger
      : dangerGhost;

  return cx(
    base,
    sizeClass(size),
    width,
    variantClass,
    disabled ? disabledClass : interactive,
    opts?.className
  );
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  loading,
  disabled,
  className,
  children,
  type,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <button
      type={type ?? "button"} // safer default; override when you need submit
      disabled={isDisabled}
      className={buttonClassName({ variant, size, fullWidth, disabled: isDisabled, className })}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export default Button;
