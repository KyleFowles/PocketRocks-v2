/* ============================================================
   FILE: src/lib/rocks.ts

   PURPOSE:
   Rock persistence layer with safety guards.

   FIX:
   Prevent Firestore path crashes (Cannot read ... indexOf) by:
   - Supporting Guest mode (no uid) via localStorage
   - Validating uid/rockId before calling Firestore doc()
   - Allowing both saveRock(uid, rock) and saveRock(uid, rockId, rock)

   NOTES:
   - Firestore throws a cryptic runtime error when any doc() path
     segment is undefined. This file ensures that never happens.
   ============================================================ */

import type { Rock } from "@/types/rock";
import { getDbClient } from "@/lib/firebase";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";

/* -----------------------------
   Guest (localStorage) helpers
------------------------------ */

const GUEST_KEY = "pocketrocks_guest_rocks_v1";

type GuestStore = {
  rocks: Record<string, any>;
};

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function guestRead(): GuestStore {
  if (typeof window === "undefined") return { rocks: {} };
  return safeJsonParse<GuestStore>(window.localStorage.getItem(GUEST_KEY), { rocks: {} });
}

function guestWrite(store: GuestStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_KEY, JSON.stringify(store));
}

function makeId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `rock_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function isNonEmptyString(v: any): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/* -----------------------------
   Firestore helpers
------------------------------ */

function rockDocRef(uid: string, rockId: string) {
  const db = getDbClient();
  if (!db) return null;

  if (!isNonEmptyString(uid)) return null;
  if (!isNonEmptyString(rockId)) return null;

  return doc(db, "users", uid, "rocks", rockId);
}

function normalizeRock(id: string, data: DocumentData): Rock {
  // We keep this permissive so we don’t break if Rock evolves.
  // Ensure "id" is always present.
  return { ...(data as any), id } as Rock;
}

/* -----------------------------
   Public API
------------------------------ */

/**
 * Get a rock by id.
 * - If uid is missing => read from localStorage (guest).
 * - If uid exists => read from Firestore.
 */
export async function getRock(uid: string | null | undefined, rockId: string): Promise<Rock | null> {
  if (!isNonEmptyString(rockId)) return null;

  // Guest
  if (!isNonEmptyString(uid)) {
    const store = guestRead();
    const raw = store.rocks[rockId];
    return raw ? ({ ...raw, id: rockId } as Rock) : null;
  }

  // Firestore
  const ref = rockDocRef(uid, rockId);
  if (!ref) return null;

  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  return normalizeRock(snap.id, snap.data());
}

/**
 * Save a rock (create or overwrite).
 * Supports BOTH:
 *   saveRock(uid, rock)
 *   saveRock(uid, rockId, rock)
 *
 * Returns the rockId used.
 */
export async function saveRock(
  uid: string | null | undefined,
  rockOrRockId: Rock | string,
  maybeRock?: Rock
): Promise<string> {
  const rockId = typeof rockOrRockId === "string" ? rockOrRockId : (rockOrRockId as any)?.id;
  const rock: Rock = (typeof rockOrRockId === "string" ? maybeRock : rockOrRockId) as Rock;

  const finalId = isNonEmptyString(rockId) ? rockId : isNonEmptyString((rock as any)?.id) ? (rock as any).id : makeId();

  // Guest
  if (!isNonEmptyString(uid)) {
    const store = guestRead();
    store.rocks[finalId] = {
      ...(rock as any),
      id: finalId,
      updatedAt: Date.now(),
      createdAt: (rock as any)?.createdAt ?? Date.now(),
    };
    guestWrite(store);
    return finalId;
  }

  // Firestore
  const ref = rockDocRef(uid, finalId);
  if (!ref) {
    // If this happens, we are missing something critical. Fall back to guest so the user can keep moving.
    const store = guestRead();
    store.rocks[finalId] = { ...(rock as any), id: finalId, updatedAt: Date.now(), createdAt: Date.now() };
    guestWrite(store);
    return finalId;
  }

  await setDoc(
    ref,
    {
      ...(rock as any),
      id: finalId,
      updatedAt: serverTimestamp(),
      createdAt: (rock as any)?.createdAt ?? serverTimestamp(),
    },
    { merge: true }
  );

  return finalId;
}

/**
 * Patch/update fields on a rock.
 * - Guest => localStorage merge
 * - Firestore => updateDoc
 */
export async function updateRock(
  uid: string | null | undefined,
  rockId: string,
  patch: Partial<Rock>
): Promise<void> {
  if (!isNonEmptyString(rockId)) return;

  // Guest
  if (!isNonEmptyString(uid)) {
    const store = guestRead();
    const prev = store.rocks[rockId] ?? { id: rockId, createdAt: Date.now() };
    store.rocks[rockId] = {
      ...prev,
      ...(patch as any),
      id: rockId,
      updatedAt: Date.now(),
    };
    guestWrite(store);
    return;
  }

  // Firestore
  const ref = rockDocRef(uid, rockId);
  if (!ref) return;

  await updateDoc(ref, {
    ...(patch as any),
    updatedAt: serverTimestamp(),
  });
}
