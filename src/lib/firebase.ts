/* ============================================================
   FILE: src/lib/firebase.ts

   SCOPE:
   Firebase client initialization (CHARTER HARDENED)
   - Reads NEXT_PUBLIC_* config
   - Never throws during import
   - Exposes clear diagnostics via getFirebaseConfigStatus()
   - Backward compatible exports:
       - isFirebaseConfigured()
       - getAuthClient()  (returns Auth OR throws clear error)
   - Exports: app, auth, db
   ============================================================ */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function s(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function readConfig(): FirebaseConfig {
  return {
    apiKey: s(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    authDomain: s(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: s(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    storageBucket: s(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: s(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
    appId: s(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  };
}

/**
 * Public diagnostic helper.
 */
export function getFirebaseConfigStatus() {
  const cfg = readConfig();
  const missing: string[] = [];

  if (!cfg.apiKey) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!cfg.authDomain) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!cfg.projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!cfg.storageBucket) missing.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!cfg.messagingSenderId) missing.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!cfg.appId) missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");

  return {
    ok: missing.length === 0,
    missing,
    preview: {
      apiKey: cfg.apiKey ? `${cfg.apiKey.slice(0, 6)}…` : "",
      authDomain: cfg.authDomain ? `${cfg.authDomain.slice(0, 6)}…` : "",
      projectId: cfg.projectId ? `${cfg.projectId.slice(0, 6)}…` : "",
    },
  };
}

/**
 * BACKCOMPAT: providers.tsx expects a NAMED export `isFirebaseConfigured`
 */
export function isFirebaseConfigured(): boolean {
  return getFirebaseConfigStatus().ok;
}

/**
 * Initialize Firebase app safely.
 */
function initFirebase(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;

  const config = readConfig();
  try {
    return getApps().length ? getApp() : initializeApp(config);
  } catch {
    return null;
  }
}

export const app: FirebaseApp | null = initFirebase();

/**
 * Auth + Firestore instances (or null if not configured).
 */
export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;

/**
 * BACKCOMPAT: providers.tsx expects a NAMED export `getAuthClient`
 *
 * Charter behavior:
 * - If Firebase isn’t configured, throw a clear error
 * - If app/auth failed to init, throw a clear error
 * - Callers can catch and handle gracefully
 */
export function getAuthClient(): Auth {
  if (!isFirebaseConfigured()) {
    throw new Error("config: Firebase env missing (NEXT_PUBLIC_FIREBASE_*).");
  }
  if (!app) {
    throw new Error("init: Firebase app failed to initialize.");
  }
  if (!auth) {
    throw new Error("init: Firebase auth failed to initialize.");
  }
  return auth;
}
