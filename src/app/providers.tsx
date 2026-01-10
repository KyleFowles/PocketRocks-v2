"use client";

import React from "react";

/**
 * App-level client providers.
 *
 * We intentionally keep this lightweight.
 * Auth is handled via useAuth() (listener-based) and does not require a context provider.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
