// src/lib/firebase.ts
import { initializeApp, getApp, getApps } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

/**
 * Best-effort persistence.
 * NEVER let this block rendering or auth state checks.
 */
let _persistenceInit: Promise<void> | null = null;

export function ensureAuthPersistence(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (_persistenceInit) return _persistenceInit;

  _persistenceInit = (async () => {
    // Timebox persistence so it cannot hang the UI
    const timebox = (p: Promise<void>, ms: number) =>
      Promise.race([p, new Promise<void>((res) => window.setTimeout(res, ms))]);

    try {
      await timebox(setPersistence(auth, browserLocalPersistence), 600);
    } catch {
      try {
        await timebox(setPersistence(auth, inMemoryPersistence), 600);
      } catch {
        // If even memory persistence fails, we still continue.
      }
    }
  })();

  return _persistenceInit;
}
