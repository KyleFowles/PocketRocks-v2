/* ============================================================
   FILE: src/app/page.tsx

   SCOPE:
   App entry route (CHARTER HARDENED)
   - Clear, explicit routing logic
   - No blind redirects during render
   - Stable behavior for signed-in vs signed-out users
   - Makes the Golden Path obvious:
       Signed out → /login
       Signed in  → /rocks/new
   ============================================================ */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

export default function HomePage() {
  const router = useRouter();
  const { uid, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (uid) {
      router.replace("/rocks/new");
    } else {
      router.replace("/login");
    }
  }, [uid, loading, router]);

  // Minimal neutral shell while deciding
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.6,
        fontSize: 14,
      }}
    >
      Loading…
    </div>
  );
}
