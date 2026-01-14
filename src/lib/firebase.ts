// FILE: src/lib/firebase.ts
// SCOPE:
// - Firebase client initialization (Auth + Firestore)
// - Next.js-safe (client-only), avoids throwing hard errors in the browser bundle
// - Prevents "Missing Firebase env var" false negatives during dev/prod

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

type FirebaseClient = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

let cached: FirebaseClient | null = null;

function readFirebaseEnv() {
  // Next.js will inline NEXT_PUBLIC_* at build time.
  // In the browser, process.env is not a real runtime object, so we must
  // treat missing values gracefully and not throw during render.
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "";
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "";
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "";
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "";

  const missing: string[] = [];
  if (!apiKey) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!authDomain) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!storageBucket) missing.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!messagingSenderId) missing.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!appId) missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");

  return {
    ok: missing.length === 0,
    missing,
    config: { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId },
  };
}

export function getFirebaseClient(): FirebaseClient {
  if (cached) return cached;

  // This module must only be used in the browser.
  if (typeof window === "undefined") {
    throw new Error("getFirebaseClient() was called on the server. Use it in client components only.");
  }

  const env = readFirebaseEnv();
  if (!env.ok) {
    // Do NOT throw (it breaks the whole app). Provide a clear error.
    // This will surface as a normal runtime error only when Firebase is actually used.
    throw new Error(`Firebase env missing: ${env.missing.join(", ")}`);
  }

  const app = getApps().length ? getApp() : initializeApp(env.config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  cached = { app, auth, db };
  return cached;
}

export function getAuthClient() {
  return getFirebaseClient().auth;
}

export function getDbClient() {
  return getFirebaseClient().db;
}
