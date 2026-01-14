/* ============================================================
   FILE: src/components/ButtonLink.tsx

   SCOPE:
   Link that looks/behaves like a Button.
   - Use this instead of <Link className={buttonClassName(...)} />
   - Keeps styling consistent, readable, and future-proof
   ============================================================ */

"use client";

import React from "react";
import Link, { type LinkProps } from "next/link";

import { buttonClassName, type ButtonSize, type ButtonVariant } from "@/components/Button";

type ButtonLinkProps = LinkProps & {
  children: React.ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  ariaLabel?: string;
};

export function ButtonLink({
  children,
  className,
  variant = "primary",
  size = "md",
  ariaLabel,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      {...props}
      aria-label={ariaLabel}
      className={buttonClassName({ variant, size, className })}
    >
      {children}
    </Link>
  );
}
