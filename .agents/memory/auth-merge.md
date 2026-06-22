---
name: Auth system merge strategy
description: How Firebase Google auth and email-OTP auth coexist; what to remove when merging GitHub branch changes.
---

## The rule
Firebase handles Google Sign-In client-side via `signInWithPopup`. The server handles it at `/api/auth/firebase`. Do NOT use `passport-google-oauth20` or `/api/auth/google` redirect routes alongside this — they conflict.

## Why
The GitHub branch added server-side Google OAuth via `passport-google-oauth20`. We use Firebase popup instead (already working, no extra OAuth credentials needed). Merging the branch naively pulled in the Passport Google strategy.

## How to apply
When merging a branch that touches auth:
1. Remove `passport-google-oauth20` import from `server/auth.ts`
2. Remove `GET /api/auth/google` and `GET /api/auth/google/callback` routes from `server/routes.ts`
3. Keep `findUserByFirebaseUid` + `findOrCreateFirebaseUser` in `storage.ts` alongside any new OTP methods
4. Keep `firebaseUid` column in `shared/schema.ts` alongside `googleId`
5. The GitHub branch's `express-rate-limit` and `nodemailer` packages must be installed — they are not in the original lock file
