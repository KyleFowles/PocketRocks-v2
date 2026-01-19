/* ============================================================
   FILE: src/lib/firebase.ts

   SCOPE:
   Client Firebase helpers (NO Firestore client)
   - Firestore is SERVER-ONLY via Admin SDK + /api routes.
   - This file intentionally does NOT export a Firestore instance.
   ============================================================ */

"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

function env(name: string): string {
  return (process.env[name] || "").trim();
}

export function isFirebaseConfigured(): boolean {
  // If you still use Firebase Auth in the browser, keep these.
  // If not, this can still be true/false safely.
  return !!(
    env("NEXT_PUBLIC_FIREBASE_API_KEY") &&
    env("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN") &&
    env("NEXT_PUBLIC_FIREBASE_PROJECT_ID")
  );
}

export function getFirebaseClientApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;

  if (_app) return _app;

  const config = {
    apiKey: env("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: env("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: env("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: env("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: env("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: env("NEXT_PUBLIC_FIREBASE_APP_ID"),
  };

  _app = getApps().length ? getApps()[0]! : initializeApp(config);
  return _app;
}

export function getAuthClient(): Auth | null {
  const app = getFirebaseClientApp();
  if (!app) return null;
  if (_auth) return _auth;
  _auth = getAuth(app);
  return _auth;
}

/**
 * IMPORTANT:
 * Firestore client is intentionally NOT available.
 * All Rock data must go through /api routes (Admin SDK).
 */
export function getFirestoreClient(): never {
  throw new Error("Firestore client is disabled. Use /api routes (Admin SDK) instead.");
}
