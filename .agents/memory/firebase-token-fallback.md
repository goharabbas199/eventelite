---
name: Firebase token verification fallback
description: How to verify Firebase ID tokens without Firebase Admin SDK service-account credentials
---

## Rule
The `/api/auth/firebase` route verifies Firebase ID tokens in two ways:
1. **Firebase Admin SDK** (preferred) — requires `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` service-account secrets.
2. **Firebase REST API fallback** — uses `POST https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=<WEB_API_KEY>` with just the public Web API key (`VITE_FIREBASE_API_KEY`). Returns `users[0]` with fields: `localId`, `email`, `displayName`, `phoneNumber`, `photoUrl`.

**Why:** Users only add client-side Firebase env vars first; requiring service-account creds immediately blocks Google Sign-In from working at all.

**How to apply:** `server/firebase.ts` → `verifyWithAdminSdk` runs first; if it returns null, `verifyWithRestApi` is called. Both return the same normalized `FirebaseTokenPayload { uid, email, name, phone_number, picture }` so the route code doesn't change.

**Note:** The REST API approach is slightly less secure (doesn't reject revoked tokens as quickly) but acceptable for this use case. Encourage adding Admin SDK credentials for production.
