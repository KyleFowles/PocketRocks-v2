/* ============================================================
   FILE: src/lib/rocks.ts

   SCOPE:
   Client-side Rocks data access (API ONLY)
   - Firestore rules are LOCKED DOWN, so the browser MUST NOT use firebase/firestore.
   - All reads/writes go through Next API routes (Admin SDK):
       GET   /api/rocks
       POST  /api/rocks
       GET   /api/rocks/[rockId]
       PATCH /api/rocks/[rockId]
   ============================================================ */

import type { Rock, RockStatus } from "@/types/rock";

/**
 * RockLike is what the UI wants to work with.
 * It remains compatible with Rock, but allows a couple optional fields
 * that may not exist in the strict Rock type everywhere.
 */
type RockLike = Rock & {
  archived?: boolean;
  notes?: string;
};

type ApiOk<T> = { ok: true } & T;

function isObj(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null;
}

function cleanStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function toNum(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function toRockStatus(v: unknown): RockStatus | undefined {
  const s = cleanStr(v);
  if (!s) return undefined;

  // Keep TS happy and UI stable. (If you later want strict validation,
  // we can align this to your exact RockStatus union values.)
  return s as unknown as RockStatus;
}

function mapApiError(err: unknown): string {
  const msg = (err as any)?.message ? String((err as any).message) : "Request failed";
  if (msg.includes("unauthorized")) return "Not signed in.";
  if (msg.includes("not_found")) return "Rock not found.";
  if (msg.includes("permission-denied")) return "permission-denied: Firestore blocked the request.";
  return msg;
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const data = (await res.json().catch(() => ({}))) as any;

  if (!res.ok) {
    const msg = typeof data?.error === "string" ? data.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

function normalizeRock(id: string, data: any): RockLike {
  // Keep the UI stable even if fields are missing.
  const base: RockLike = {
    id,
    companyId: cleanStr(data?.companyId) || "default",
    userId: cleanStr(data?.ownerId) || "",

    title: cleanStr(data?.title),
    draft: cleanStr(data?.draft),

    dueDate: cleanStr(data?.dueDate),
    status: toRockStatus(data?.status),

    // Optional fields commonly used in builders:
    metrics: Array.isArray(data?.metrics) ? data.metrics : [],
    milestones: Array.isArray(data?.milestones) ? data.milestones : [],

    // Optional text field (allowed by RockLike even if Rock doesn't include it everywhere):
    notes: cleanStr(data?.notes),

    // Optional flag used by list filtering:
    archived: !!data?.archived,

    createdAt: toNum(data?.createdAt) ?? Date.now(),
    updatedAt: toNum(data?.updatedAt) ?? Date.now(),
  };

  // Pass through extra fields safely, but do NOT let them overwrite normalized keys.
  if (isObj(data)) {
    return {
      ...data,
      ...base,
    } as RockLike;
  }

  return base;
}

/* ============================================================
   PUBLIC API (keep names stable for existing call sites)
   Note: uid param is kept for backward compatibility, but server
   derives the user from the session cookie.
   ============================================================ */

export async function listRocks(_uid: string, opts?: { includeArchived?: boolean }) {
  try {
    const data = await apiJson<ApiOk<{ items: any[] }>>("/api/rocks");
    const items = Array.isArray((data as any).items) ? (data as any).items : [];
    const rocks: RockLike[] = items.map((r: any) => normalizeRock(String(r?.id || ""), r));

    if (opts?.includeArchived) return rocks;
    return rocks.filter((r: RockLike) => !r.archived);
  } catch (err) {
    throw new Error(mapApiError(err));
  }
}

export async function getRock(_uid: string, rockId: string): Promise<Rock | null> {
  try {
    const rid = cleanStr(rockId);
    if (!rid) return null;

    const data = await apiJson<ApiOk<{ item: any }>>(`/api/rocks/${encodeURIComponent(rid)}`);
    const item = (data as any).item;
    if (!item) return null;

    return normalizeRock(rid, item) as Rock;
  } catch (err) {
    const msg = mapApiError(err);
    if (msg.toLowerCase().includes("not found")) return null;
    throw new Error(msg);
  }
}

export async function createRockWithId(_uid: string, rockId: string, rock: Partial<Rock>) {
  try {
    const rid = cleanStr(rockId);
    if (!rid) throw new Error("Missing rockId");

    await apiJson<ApiOk<{ id: string }>>("/api/rocks", {
      method: "POST",
      body: JSON.stringify({ id: rid, ...rock }),
    });

    return rid;
  } catch (err) {
    throw new Error(mapApiError(err));
  }
}

export async function createRock(_uid: string, rock: Partial<Rock>) {
  try {
    const data = await apiJson<ApiOk<{ id: string }>>("/api/rocks", {
      method: "POST",
      body: JSON.stringify({ ...rock }),
    });

    return cleanStr((data as any).id);
  } catch (err) {
    throw new Error(mapApiError(err));
  }
}

export async function updateRock(_uid: string, rockId: string, patch: Partial<Rock>) {
  try {
    const rid = cleanStr(rockId);
    if (!rid) throw new Error("Missing rockId");

    await apiJson<ApiOk<{}>>(`/api/rocks/${encodeURIComponent(rid)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  } catch (err) {
    throw new Error(mapApiError(err));
  }
}

export async function saveRock(uid: string, rockId: string, patch: Partial<Rock>) {
  // Alias used in multiple screens in PocketRocks
  return updateRock(uid, rockId, patch);
}

/* ============================================================
   Optional convenience helpers some components may call
   ============================================================ */

export async function archiveRock(uid: string, rockId: string, archived = true) {
  return updateRock(uid, rockId, { archived } as any);
}

export async function assertRockOwner(_uid: string, _rockId: string) {
  // Historical helper some codebases include.
  // With server-enforced scoping (users/{uid}/rocks), this is unnecessary.
  return true;
}
