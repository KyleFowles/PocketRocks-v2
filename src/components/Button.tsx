/* ============================================================
   FILE: src/components/Button.tsx

   SCOPE:
   Portable, semantic Button system.
   - Uses global semantic classes from globals.css:
       .btn, .btn-primary, .btn-secondary, .btn-ghost
   - Components do NOT hard-code colors (theme controls appearance)
   - Exports buttonClassName() so Links can share the same styling
   ============================================================ */

"use client";

import React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export function buttonClassName(variant: ButtonVariant = "primary", className = "") {
  const base = "btn";
  const v =
    variant === "secondary"
      ? "btn-secondary"
      : variant === "ghost"
      ? "btn-ghost"
      : "btn-primary";

  return [base, v, className].filter(Boolean).join(" ");
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, className)} {...props} />;
}
