// src/lib/authGate.ts
import { onAuthStateChanged, type Auth, type User } from "firebase/auth";

/**
 * Wait for the first auth state result, but NEVER hang forever.
 * Returns whatever Firebase knows at that moment (User or null).
 */
export function waitForAuthUser(auth: Auth, timeoutMs = 1200): Promise<User | null> {
  return new Promise((resolve) => {
    let done = false;

    const timeout = window.setTimeout(() => {
      if (done) return;
      done = true;
      resolve(auth.currentUser);
    }, timeoutMs);

    const unsub = onAuthStateChanged(auth, (u) => {
      if (done) return;
      done = true;
      window.clearTimeout(timeout);
      unsub();
      resolve(u);
    });
  });
}
