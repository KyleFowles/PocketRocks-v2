"use client";

/* ============================================================
   FILE: src/app/login/page.tsx

   SCOPE:
   Login page (CHARTER SCRUB)
   - Redirects logged-in users using useEffect (no render-time side effects)
   - Uses shared Button component WITHOUT overriding its visuals (keeps halo)
   - Handles missing Firebase config / null auth client gracefully
   - Clear, friendly error messages (no silent failures)
   - Golden Path:
       Signed in  → /rocks/new
       Signed out → stay here and sign in
   ============================================================ */

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { GoogleAuthProvider, signInAnonymously, signInWithPopup } from "firebase/auth";

import { useAuth } from "@/lib/useAuth";
import { getAuthClient, isFirebaseConfigured } from "@/lib/firebase";
import { Button } from "@/components/Button";

function devError(...args: any[]) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
}

function friendlyAuthError(e: any) {
  const code = typeof e?.code === "string" ? e.code : "";
  const msg = typeof e?.message === "string" ? e.message : "";

  if (code.includes("auth/popup-blocked")) return "Popup blocked. Please allow popups for this site and try again.";
  if (code.includes("auth/cancelled-popup-request")) return "Popup was closed. Please try again.";
  if (code.includes("auth/popup-closed-by-user")) return "You closed the popup. Please try again.";
  if (code.includes("auth/unauthorized-domain"))
    return "This domain is not allowed in Firebase Auth. Add it in Firebase Console → Authentication → Settings → Authorized domains.";
  if (code) return `${code}: ${msg || "Sign-in failed."}`;
  return msg || "Sign-in failed. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const { uid, loading } = useAuth();

  const firebaseReady = useMemo(() => isFirebaseConfigured(), []);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Redirect must happen in an effect (NOT during render)
  useEffect(() => {
    if (!loading && uid) {
      router.replace("/rocks/new");
    }
  }, [loading, uid, router]);

  async function handleGoogle() {
    setErr(null);

    if (!firebaseReady) {
      setErr("Firebase is not configured. Check NEXT_PUBLIC_FIREBASE_* env vars.");
      return;
    }

    setBusy(true);
    try {
      const auth = getAuthClient();
      if (!auth) {
        setErr("Firebase Auth is not available (auth is null). Check Firebase initialization.");
        return;
      }

      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // useEffect will redirect once uid is present
    } catch (e: any) {
      devError("[Login] Google sign-in failed:", e);
      setErr(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleAnonymous() {
    setErr(null);

    if (!firebaseReady) {
      setErr("Firebase is not configured. Check NEXT_PUBLIC_FIREBASE_* env vars.");
      return;
    }

    setBusy(true);
    try {
      const auth = getAuthClient();
      if (!auth) {
        setErr("Firebase Auth is not available (auth is null). Check Firebase initialization.");
        return;
      }

      await signInAnonymously(auth);
      // useEffect will redirect once uid is present
    } catch (e: any) {
      devError("[Login] Guest sign-in failed:", e);
      setErr(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={shell}>
      <header style={header}>
        <div style={kicker}>LOGIN</div>
        <h1 style={title}>Sign in</h1>
        <p style={subtitle}>Sign in to create and manage your Rocks.</p>
      </header>

      <section style={panel}>
        {!firebaseReady && (
          <div style={bannerWarn}>
            <div style={bannerTitle}>Config needed</div>
            <div style={bannerBody}>Firebase env vars are missing. Add NEXT_PUBLIC_FIREBASE_* to run login.</div>
          </div>
        )}

        {loading && <div style={muted}>Checking sign-in…</div>}

        {!loading && uid && <div style={muted}>Signed in. Redirecting…</div>}

        {!loading && !uid && (
          <>
            {err && (
              <div style={bannerErr}>
                <div style={bannerTitle}>Sign-in failed</div>
                <div style={bannerBody}>{err}</div>
              </div>
            )}

            <div style={btnGrid}>
              {/* Keep Button visuals. No custom className overrides. */}
              <Button type="button" onClick={handleGoogle} disabled={busy || !firebaseReady} fullWidth>
                {busy ? "Working…" : "Continue with Google"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleAnonymous}
                disabled={busy || !firebaseReady}
                fullWidth
              >
                {busy ? "Working…" : "Continue as Guest"}
              </Button>
            </div>

            <div style={tip}>
              Tip: If Google popup is blocked, allow popups for this site and try again.
            </div>
          </>
        )}
      </section>
    </main>
  );
}

/* -----------------------------
   Minimal, token-friendly styles
------------------------------ */

const shell: React.CSSProperties = {
  minHeight: "100dvh",
  maxWidth: 820,
  margin: "0 auto",
  padding: "44px 22px",
};

const header: React.CSSProperties = {
  marginBottom: 16,
};

const kicker: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: 3,
  opacity: 0.6,
  fontWeight: 800,
};

const title: React.CSSProperties = {
  margin: "10px 0 8px",
  fontSize: 42,
  lineHeight: 1.05,
  fontWeight: 900,
  letterSpacing: -0.6,
};

const subtitle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  opacity: 0.75,
};

const panel: React.CSSProperties = {
  borderRadius: 26,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.28)",
  boxShadow: "0 20px 70px rgba(0,0,0,0.35)",
  padding: 18,
};

const muted: React.CSSProperties = {
  opacity: 0.75,
};

const bannerBase: React.CSSProperties = {
  marginBottom: 12,
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
};

const bannerWarn: React.CSSProperties = {
  ...bannerBase,
  border: "1px solid rgba(255,200,80,0.35)",
  background: "rgba(255,200,80,0.10)",
};

const bannerErr: React.CSSProperties = {
  ...bannerBase,
  border: "1px solid rgba(255,80,80,0.35)",
  background: "rgba(255,80,80,0.10)",
};

const bannerTitle: React.CSSProperties = {
  fontWeight: 900,
  marginBottom: 4,
};

const bannerBody: React.CSSProperties = {
  opacity: 0.9,
  lineHeight: 1.35,
};

const btnGrid: React.CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 10,
};

const tip: React.CSSProperties = {
  marginTop: 12,
  fontSize: 12,
  opacity: 0.6,
};
