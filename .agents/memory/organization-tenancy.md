---
name: Organization tenancy boundary
description: Organization ownership is derived from the authenticated server-side user and inherited by child records through aggregate roots.
---

Business API requests must establish organization context on the server; browser-provided organization IDs are never authoritative. Child records inherit scope through validated aggregate-root parents. In no-login mode, every visitor shares the default organization, so that mode is public access rather than visitor isolation.

**Why:** Tenant isolation depends on server-owned scope. A shared guest organization preserves data consistency but does not protect records from visitors who can reach the app.

**How to apply:** Preserve server-derived scope in storage methods, validate linked parents on create/update, and treat no-login mode as unsuitable for public release.