/* ============================================================
   FILE: src/lib/auth.ts

   SCOPE:
   Node-only auth helpers (API routes)
   - Next.js 16 cookies() is async in this setup (await cookies())
   - Fix TS strictness in verifyPassword (parts may be undefined)
   ============================================================ */

import crypto from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE_NAME = "pr_session";

function base64UrlEncode(input: Buffer | string) {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecodeToString(b64url: string) {
  const pad = b64url.length % 4 === 0 ? "" : "=".repeat(4 - (b64url.length % 4));
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

function hmacSha256(secret: string, data: string) {
  return base64UrlEncode(crypto.createHmac("sha256", secret).update(data).digest());
}

export function normalizeEmail(email: unknown) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export type SessionUser = {
  uid: string;
  email: string;
  name?: string;
};

export function createSessionToken(
  user: SessionUser,
  secret: string,
  ttlSeconds: number = 60 * 60 * 24 * 14 // 14 days
) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSeconds;

  const payload: any = {
    uid: user.uid,
    email: user.email,
    iat,
    exp,
  };

  if (typeof user.name === "string" && user.name.trim()) {
    payload.name = user.name.trim();
  }

  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = hmacSha256(secret, body);
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string, secret: string): SessionUser | null {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;

    const expected = hmacSha256(secret, body);

    // constant-time compare
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;

    const json = base64UrlDecodeToString(body);
    const payload = JSON.parse(json) as {
      uid?: string;
      email?: string;
      name?: string;
      exp?: number;
    };

    if (!payload?.uid || !payload?.email || !payload?.exp) return null;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) return null;

    const out: SessionUser = { uid: payload.uid, email: payload.email };
    if (typeof payload.name === "string" && payload.name.trim()) out.name = payload.name.trim();

    return out;
  } catch {
    return null;
  }
}

// ✅ Next.js 16-safe: cookies() must be awaited
export async function getSessionFromServerCookies(secret: string): Promise<SessionUser | null> {
  try {
    const c = await cookies();
    const token = c.get(COOKIE_NAME)?.value || "";
    if (!token) return null;
    return verifySessionToken(token, secret);
  } catch {
    return null;
  }
}

// ✅ Next.js 16-safe: cookies() must be awaited
export async function setSessionCookie(token: string) {
  const c = await cookies();
  c.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

// ✅ Next.js 16-safe: cookies() must be awaited
export async function clearSessionCookie() {
  const c = await cookies();
  c.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
}

/**
 * Password hashing (PBKDF2)
 * Stores: "pbkdf2$<iter>$<saltB64url>$<hashB64url>"
 */
export function hashPassword(password: string) {
  const iter = 150_000;
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, iter, 32, "sha256");
  return `pbkdf2$${iter}$${base64UrlEncode(salt)}$${base64UrlEncode(hash)}`;
}

function b64urlToBuffer(b64u: string) {
  const b64 = b64u.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, "base64");
}

export function verifyPassword(password: string, stored: string) {
  try {
    const parts = stored.split("$");
    if (parts.length !== 4) return false;

    const kind = parts[0];
    const iterStr = parts[1];
    const saltB64u = parts[2];
    const hashB64u = parts[3];

    if (!kind || !iterStr || !saltB64u || !hashB64u) return false;
    if (kind !== "pbkdf2") return false;

    const iter = Number(iterStr);
    if (!Number.isFinite(iter) || iter < 50_000) return false;

    const salt = b64urlToBuffer(saltB64u);
    const expected = b64urlToBuffer(hashB64u);

    const actual = crypto.pbkdf2Sync(password, salt, iter, 32, "sha256");
    if (actual.length !== expected.length) return false;
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
