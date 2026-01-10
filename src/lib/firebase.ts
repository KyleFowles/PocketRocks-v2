// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * IMPORTANT:
 * - Never initialize Firebase during SSR/build.
 * - Vercel prerenders pages at build time (including /_not-found).
 * - If Firebase initializes on the server without env vars, builds fail.
 *
 * So we only initialize Firebase in the browser (typeof window !== "undefined").
 */

type FirebaseClient = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

let cached: FirebaseClient | null = null;

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  };
}

function hasConfig(cfg: ReturnType<typeof getFirebaseConfig>) {
  return Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
}

/**
 * Returns Firebase clients ONLY in the browser.
 * Returns null on the server/build step.
 */
export function getFirebaseClient(): FirebaseClient | null {
  // Server / build / prerender: do NOT initialize Firebase.
  if (typeof window === "undefined") return null;

  if (cached) return cached;

  const cfg = getFirebaseConfig();

  // If env vars are missing in Vercel, we still must not crash the app at import time.
  // We throw only when code actually tries to use Firebase on the client.
  if (!hasConfig(cfg)) {
    throw new Error(
      "Firebase is not configured. Missing NEXT_PUBLIC_FIREBASE_* env vars."
    );
  }

  // Prevent duplicate initialization in fast refresh / multi-bundle situations
  const app =
    getApps().length > 0 ? getApps()[0] : initializeApp(cfg);

  const auth = getAuth(app);
  const db = getFirestore(app);

  cached = { app, auth, db };
  return cached;
}

/** Convenience helpers */
export function getAuthClient(): Auth {
  const client = getFirebaseClient();
  if (!client) {
    // This should never happen on the client, but keep a clear message.
    throw new Error("Firebase Auth requested during SSR/build. This is a bug.");
  }
  return client.auth;
}

export function getDbClient(): Firestore {
  const client = getFirebaseClient();
  if (!client) {
    throw new Error("Firestore requested during SSR/build. This is a bug.");
  }
  return client.db;
}
