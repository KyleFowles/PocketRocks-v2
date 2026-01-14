/* ============================================================
   FILE: src/components/Button.tsx

   SCOPE:
   PocketRocks shared Button component (STABLE API).
   - ButtonVariant includes dangerGhost
   - buttonClassName() is OBJECT-ONLY (no legacy overloads)
   - This is the long-term contract across the codebase
   ============================================================ */

"use client";

import * as React from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "dangerGhost";

export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export type ButtonClassNameOpts = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

function cn(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(" ");
}

const base =
  "inline-flex items-center justify-center gap-2 select-none whitespace-nowrap " +
  "rounded-xl font-semibold tracking-tight " +
  "transition-all duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:pointer-events-none";

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[#2B7CFF] text-white shadow-[0_10px_30px_rgba(43,124,255,0.22)] " +
    "hover:brightness-110 active:brightness-95 " +
    "focus-visible:ring-[#2B7CFF] focus-visible:ring-offset-[#0B1220]",

  secondary:
    "bg-white/10 text-white border border-white/15 " +
    "hover:bg-white/14 active:bg-white/10 " +
    "focus-visible:ring-white/40 focus-visible:ring-offset-[#0B1220]",

  ghost:
    "bg-transparent text-white/90 border border-white/15 " +
    "hover:bg-white/8 active:bg-white/5 " +
    "focus-visible:ring-white/35 focus-visible:ring-offset-[#0B1220]",

  danger:
    "bg-[#F04E23] text-white shadow-[0_10px_30px_rgba(240,78,35,0.18)] " +
    "hover:brightness-110 active:brightness-95 " +
    "focus-visible:ring-[#F04E23] focus-visible:ring-offset-[#0B1220]",

  dangerGhost:
    "bg-transparent text-[#F04E23] border border-[#F04E23]/45 " +
    "hover:bg-[#F04E23]/10 active:bg-[#F04E23]/6 " +
    "focus-visible:ring-[#F04E23] focus-visible:ring-offset-[#0B1220]",
};

/**
 * Long-term stable helper for styling non-button elements (e.g., <Link>).
 * Object-only on purpose to prevent argument-order bugs.
 */
export function buttonClassName(opts: ButtonClassNameOpts = {}) {
  const variant = opts.variant ?? "primary";
  const size = opts.size ?? "md";
  return cn(base, sizes[size], variants[variant], opts.className);
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", className, type, ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cn(base, sizes[size], variants[variant], className)}
        {...props}
      />
    );
  }
);
