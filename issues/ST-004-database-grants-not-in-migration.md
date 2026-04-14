---
id: ST-004
title: Database grants for Neon Data API not in a Prisma migration
type: tech-debt
status: open
priority: medium
urgency: soon
components:
  - infrastructure
source: session
created: 2026-04-08
completed:
dev-plan-ref:
---

GRANT permissions for Neon Data API roles (`authenticated`, `neon_auth`, `anonymous`, `authenticator`) were applied manually to production on 2026-04-08. Not captured in any Prisma migration.

**Risk:** Any new Neon branch or environment will get 403 errors until grants are applied manually. Staging DB does not have them.
**Fix:** Create a Prisma migration with the GRANT statements.
