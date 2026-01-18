/* ============================================================
   FILE: src/lib/authEdge.ts

   SCOPE:
   Edge-safe helpers for session verification (middleware-safe)
   - Fix TS strictness: Uint8Array index may be number | undefined
   - No behavior change: defaults undefined to 0 (should never happen)
   ============================================================ */

export type EdgeSessionUser = {
  uid: string;
  email: string;
  name?: string;
};

function base64UrlToUint8Array(b64url: string) {
  const pad = b64url.length % 4 === 0 ? "" : "=".repeat(4 - (b64url.length % 4));
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function uint8ArrayToBase64Url(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    const n = bytes[i] ?? 0;
    s += String.fromCharCode(n);
  }
  const b64 = btoa(s);
  return b64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function hmacSha256Base64Url(secret: string, data: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return uint8ArrayToBase64Url(new Uint8Array(sig));
}

export async function verifyEdgeSessionToken(
  token: string,
  secret: string
): Promise<EdgeSessionUser | null> {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;

    const expected = await hmacSha256Base64Url(secret, body);
    if (expected !== sig) return null;

    const json = new TextDecoder().decode(base64UrlToUint8Array(body));
    const payload = JSON.parse(json) as {
      uid?: string;
      email?: string;
      name?: string;
      exp?: number;
    };

    if (!payload?.uid || !payload?.email || !payload?.exp) return null;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) return null;

    const out: EdgeSessionUser = { uid: payload.uid, email: payload.email };
    if (typeof payload.name === "string" && payload.name.trim()) out.name = payload.name.trim();

    return out;
  } catch {
    return null;
  }
}
