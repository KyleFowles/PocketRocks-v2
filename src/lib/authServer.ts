/* ============================================================
   FILE: src/lib/authServer.ts

   SCOPE:
   Server-only auth helper for API routes.
   - Uses the SAME session mechanism as /api/auth/me:
     getSessionFromServerCookies(SESSION_SECRET)
   - Guarantees a non-empty uid (falls back to email)
   ============================================================ */

import "server-only";

import { getSessionFromServerCookies } from "@/lib/auth";

export type AuthedUser = {
  uid: string;
  email: string;
  name: string;
};

function clean(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function requireUser(): Promise<AuthedUser> {
  const secret = process.env.SESSION_SECRET || "";
  if (!secret) {
    throw Object.assign(new Error("Missing SESSION_SECRET"), { status: 500 });
  }

  const s: any = await getSessionFromServerCookies(secret);
  if (!s) {
    throw Object.assign(new Error("unauthorized"), { status: 401 });
  }

  const email = clean(s.email);
  const uidRaw = clean(s.uid);

  // IMPORTANT: Firestore doc IDs cannot be empty.
  // If uid is missing/blank in the session, we fall back to email.
  const uid = (uidRaw || email).toLowerCase();

  if (!uid) {
    throw Object.assign(new Error("Session missing uid/email"), { status: 500 });
  }

  return {
    uid,
    email: email || uid,
    name: clean(s.name) || "",
  };
}
