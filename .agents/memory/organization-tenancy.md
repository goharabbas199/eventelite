---
name: Organization tenancy boundary
description: Organization ownership is derived from the authenticated server-side user and inherited by child records through aggregate roots.
---

Business API requests must establish organization context from the database-backed authenticated user. Browser-provided organization IDs are never authoritative; aggregate-root reads and writes are scoped, and child records validate their parent belongs to the same organization.

**Why:** A valid record ID from another organization must behave like an inaccessible record, while child tables remain normalized without duplicated ownership columns.

**How to apply:** Preserve server-derived scope in new storage methods, validate linked parents on create/update, and use RESTRICT behavior for organization deletion.