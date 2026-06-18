import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Firebase project config
//
// Add these as Replit Secrets (Tools → Secrets) — they are prefixed with
// VITE_ so Vite exposes them to the browser bundle.
//
//   VITE_FIREBASE_API_KEY        e.g.  AIzaSyABC123...
//   VITE_FIREBASE_AUTH_DOMAIN    e.g.  my-project.firebaseapp.com
//   VITE_FIREBASE_PROJECT_ID     e.g.  my-project
//   VITE_FIREBASE_APP_ID         e.g.  1:123456789:web:abc123
//
// Get them from:
//   Firebase Console → Project Settings → General → Your Apps → SDK setup
// ─────────────────────────────────────────────────────────────────────────────

const apiKey      = import.meta.env.VITE_FIREBASE_API_KEY      as string | undefined;
const authDomain  = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN  as string | undefined;
const projectId   = import.meta.env.VITE_FIREBASE_PROJECT_ID   as string | undefined;
const appId       = import.meta.env.VITE_FIREBASE_APP_ID       as string | undefined;

export function isFirebaseConfigured(): boolean {
  return !!(apiKey && authDomain && projectId && appId);
}

// Only initialise Firebase when all required env vars are present.
// This prevents the "auth/invalid-api-key" error during development
// before credentials have been added.
let _app:  FirebaseApp | null = null;
let _auth: Auth         | null = null;

if (isFirebaseConfigured()) {
  _app  = getApps().length ? getApps()[0] : initializeApp({ apiKey, authDomain, projectId, appId });
  _auth = getAuth(_app);
}

// firebaseAuth will be null when Firebase is not yet configured.
// All call-sites guard with isFirebaseConfigured() before using it.
export const firebaseApp:  FirebaseApp | null = _app;
export const firebaseAuth: Auth         | null = _auth;
