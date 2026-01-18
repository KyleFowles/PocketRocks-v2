/* ============================================================
   FILE: src/app/signup/page.tsx

   SCOPE:
   Public signup page
   - Email + password
   - Domain agnostic
   - On success, routes to /dashboard
   ============================================================ */

"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (busy) return false;
    if (email.trim().length < 4) return false;
    if (password.length < 8) return false;
    if (password !== password2) return false;
    return true;
  }, [email, password, password2, busy]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setErr(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Signup failed.");

      router.push("/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Signup failed.");
    } finally {
      setBusy(false);
    }
  }

  const pwHint =
    password.length === 0
      ? "Use 8+ characters."
      : password.length < 8
        ? "Add a few more characters."
        : password !== password2
          ? "Passwords must match."
          : "Looks good.";

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brandRow}>
          <span style={styles.brandOrange}>Pocket</span>
          <span style={styles.brandWhite}>Rocks</span>
        </div>

        <div style={styles.h1}>Create your account</div>
        <div style={styles.sub}>Start building clear Rocks and tracking them weekly.</div>

        {err && (
          <div style={styles.alert}>
            <div style={styles.alertTitle}>Heads up</div>
            <div style={styles.alertBody}>{err}</div>
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={styles.label}>
            <div style={styles.labelText}>Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="you@company.com"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            <div style={styles.labelText}>Password</div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              type="password"
              placeholder="Create a password"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            <div style={styles.labelText}>Confirm password</div>
            <input
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
              type="password"
              placeholder="Re-enter password"
              style={styles.input}
            />
          </label>

          <div style={styles.hint}>{pwHint}</div>

          <Button type="submit" disabled={!canSubmit}>
            {busy ? "Creating…" : "Create account"}
          </Button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            style={styles.linkBtn}
          >
            Already have an account? Log in →
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 18,
    background:
      "radial-gradient(1200px 800px at 20% 0%, rgba(90,140,255,0.22), transparent 55%), rgba(10,14,20,1)",
    color: "white",
  },
  card: {
    width: "min(560px, 92vw)",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    boxShadow: "0 28px 80px rgba(0,0,0,0.55)",
    padding: 18,
  },
  brandRow: { display: "flex", gap: 0, alignItems: "baseline", marginBottom: 8 },
  brandOrange: { color: "#FF7900", fontWeight: 900, fontSize: 18, letterSpacing: 0.2 },
  brandWhite: { color: "rgba(255,255,255,0.92)", fontWeight: 900, fontSize: 18, letterSpacing: 0.2 },
  h1: { fontSize: 22, fontWeight: 900, marginTop: 6 },
  sub: { opacity: 0.72, marginTop: 6, marginBottom: 14, lineHeight: 1.4 },
  alert: {
    marginTop: 10,
    marginBottom: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,120,120,0.35)",
    background: "rgba(255,80,80,0.10)",
  },
  alertTitle: { fontWeight: 800, fontSize: 13, marginBottom: 2 },
  alertBody: { fontSize: 13, opacity: 0.92 },
  label: { display: "grid", gap: 6 },
  labelText: { fontSize: 12, fontWeight: 800, opacity: 0.85, letterSpacing: 0.2 },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "white",
    outline: "none",
  },
  hint: { fontSize: 12, opacity: 0.72, marginTop: -4, marginBottom: 2 },
  linkBtn: {
    marginTop: 4,
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "rgba(180,210,255,0.92)",
    textAlign: "left",
    cursor: "pointer",
    padding: 6,
    fontWeight: 700,
  },
};
