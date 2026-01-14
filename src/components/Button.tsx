/* ============================================================
   FILE: src/components/Button.tsx

   SCOPE:
   Single source of truth for buttons (stability-first).
   - Fixes export collisions across the repo:
     ✅ exports ButtonVariant (includes "dangerGhost")
     ✅ exports ButtonSize (used by ButtonLink.tsx)
     ✅ exports buttonClassName + getButtonClassName
     ✅ exports Button (named) + default export
   - Keeps “blue sizzle” primary styling
   ============================================================ */

"use client";

import React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dangerGhost";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function sizeClass(size: ButtonSize) {
  switch (size) {
    case "sm":
      return "px-3 py-2 text-sm rounded-lg";
    case "lg":
      return "px-5 py-3 text-base rounded-2xl";
    case "md":
    default:
      return "px-4 py-2.5 text-sm rounded-xl";
  }
}

/**
 * Backward-compatible helper used by pages/components
 * that want the button class string without rendering <Button />.
 */
export function buttonClassName(opts?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const variant: ButtonVariant = opts?.variant ?? "primary";
  const size: ButtonSize = opts?.size ?? "md";
  const fullWidth = opts?.fullWidth ?? false;
  const disabled = opts?.disabled ?? false;

  const base =
    "inline-flex items-center justify-center gap-2 select-none font-semibold " +
    "transition-[transform,box-shadow,background,border-color,color,filter] duration-150 " +
    "focus-visible:outline-none " +
    "disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none " +
    "active:translate-y-[1px]";

  const width = fullWidth ? "w-full" : "";

  // 🔥 Blue “sizzle”
  const primary =
    "text-white " +
    "bg-[linear-gradient(180deg,var(--btn-blue-1),var(--btn-blue-2)_45%,var(--btn-blue-3))] " +
    "border border-[color:var(--btn-blue-edge)] " +
    "shadow-[0_10px_30px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.35)] " +
    "hover:shadow-[0_14px_40px_rgba(0,0,0,0.38),0_0_0_1px_rgba(0,0,0,0.35),0_0_24px_var(--btn-blue-glow)] " +
    "hover:brightness-[1.03] hover:-translate-y-[1px] " +
    "focus-visible:shadow-[0_14px_40px_rgba(0,0,0,0.38),0_0_0_1px_rgba(0,0,0,0.35),0_0_0_3px_var(--ring-strong),0_0_30px_var(--btn-blue-glow-strong)]";

  const secondary =
    "text-white/90 " +
    "bg-white/6 border border-white/12 " +
    "shadow-[0_10px_28px_rgba(0,0,0,0.28)] " +
    "hover:bg-white/9 hover:border-white/18 hover:-translate-y-[1px] " +
    "focus-visible:shadow-[0_10px_28px_rgba(0,0,0,0.28),0_0_0_3px_rgba(255,255,255,0.12)]";

  const ghost =
    "text-white/85 " +
    "bg-transparent border border-transparent " +
    "hover:bg-white/7 hover:border-white/10 " +
    "focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,0.12)]";

  const danger =
    "text-white " +
    "bg-[linear-gradient(180deg,#ff7a6b,#f04e23_55%,#c83b16)] " +
    "border border-white/14 " +
    "shadow-[0_12px_34px_rgba(0,0,0,0.36)] " +
    "hover:shadow-[0_16px_44px_rgba(0,0,0,0.40),0_0_22px_rgba(240,78,35,0.35)] " +
    "hover:brightness-[1.02] hover:-translate-y-[1px] " +
    "focus-visible:shadow-[0_16px_44px_rgba(0,0,0,0.40),0_0_0_3px_rgba(240,78,35,0.45)]";

  // Destructive, but subtle (Logout-style)
  const dangerGhost =
    "text-white/90 " +
    "bg-white/6 border border-white/12 " +
    "shadow-[0_10px_28px_rgba(0,0,0,0.28)] " +
    "hover:bg-[rgba(240,78,35,0.16)] hover:border-[rgba(240,78,35,0.35)] hover:-translate-y-[1px] " +
    "focus-visible:shadow-[0_10px_28px_rgba(0,0,0,0.28),0_0_0_3px_rgba(240,78,35,0.35)]";

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

  const disabledFix = disabled ? "opacity-60 cursor-not-allowed" : "";

  return cx(base, sizeClass(size), width, variantClass, disabledFix, opts?.className);
}

// Alias for legacy callers
export const getButtonClassName = buttonClassName;

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  disabled,
  type,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      disabled={disabled}
      className={buttonClassName({ variant, size, fullWidth, disabled: !!disabled, className })}
      {...props}
    />
  );
}

export default Button;
