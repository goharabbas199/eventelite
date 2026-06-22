---
name: Schema-to-DB migration gap
description: Drizzle schema changes don't auto-apply to the live DB — must run ALTER TABLE manually or via drizzle-kit push.
---

# Schema-to-DB migration gap

When new columns are added to `shared/schema.ts` (via merge or direct edit), the live PostgreSQL database does NOT update automatically.

**Why:** Drizzle ORM reads the schema at query time but never runs DDL on its own. The dev seed only runs `db.select()` / `db.insert()` — it never issues `ALTER TABLE`.

**How to apply:**
- For quick fixes: `psql $DATABASE_URL -c "ALTER TABLE <table> ADD COLUMN IF NOT EXISTS ..."`
- For production / repeatable migrations: run `npx drizzle-kit push` which diffs schema vs DB and applies DDL.

**Real incident:** After the auth branch merge added `email_verified boolean`, `google_id text` (to `users`) and the new `email_verifications` table, Firebase login hit `error: column "email_verified" does not exist` at runtime. Fixed by running the ALTER TABLE / CREATE TABLE statements directly.

Columns added manually on 2026-06-22:
- `users.email_verified boolean NOT NULL DEFAULT false`
- `users.google_id text`
- `email_verifications` table (id, email, code, type, expires_at, used_at, created_at)
