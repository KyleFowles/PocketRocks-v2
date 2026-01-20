/* ============================================================
   FILE: src/app/page.tsx

   SCOPE:
   Home page
   - Fix TypeScript: useAuth() returns { user, loading }
   - Redirect:
     - If signed in → /dashboard
     - If not signed in → /login
   ============================================================ */

"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/useAuth";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const uid = user?.uid || "";

  useEffect(() => {
    if (loading) return;

    if (uid) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [uid, loading, router]);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "36px 16px", opacity: 0.85 }}>
      Loading…
    </div>
  );
}
