---
name: Schema-to-DB migration gap
description: Drizzle schema changes don't auto-apply to the live DB — must run ALTER TABLE manually or via drizzle-kit push.
---

# Schema-to-DB migration gap

When new columns are added to the Drizzle schema, the live PostgreSQL database does NOT update automatically.

**Why:** Drizzle ORM reads the schema at query time but never runs DDL on its own. A database can also be missing later additive fields even after one older migration has been applied, so validating only the failing table can leave related workflows broken.

**How to apply:**
- For populated tables receiving a required organization column, create the organization first, add the column nullable, backfill existing rows, then apply NOT NULL and foreign-key constraints.
- In development, reconcile the complete schema with `npm run db:push` after any required backfill; do not use `--force` without reviewing data-loss statements.
- Exercise create and delete flows that touch newly added columns, not just list pages.

**Real incident:** The development database was missing both organization scope and later task-automation fields. Client, venue, and vendor APIs initially failed before their route handlers; a planned-service delete still failed after organization backfill because task linkage columns were also absent. A full development schema push and end-to-end create/delete checks exposed and resolved the remaining drift.
