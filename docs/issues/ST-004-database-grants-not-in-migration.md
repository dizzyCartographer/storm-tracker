---
id: ST-004
title: Database grants for Neon Data API not in a migration
type: tech-debt
status: open
urgency: low
phase: A
components:
  - infrastructure
depends_on:
  - [[ST-074-switch-to-dbmate-migrations|ST-074]]
source: session
created: 2026-04-08
completed:
dev-plan-ref:
---

GRANT permissions for Neon Data API roles (`authenticated`, `neon_auth`, `anonymous`, `authenticator`) were applied manually to production on 2026-04-08. Not captured in any migration.

**Risk:** Any new Neon branch or environment will get 403 errors until grants are applied manually. Staging DB does not have them. This blocks the ephemeral feature branch workflow — every new Neon branch needs these GRANTs.

**Fix:** Write as the first dbmate migration after [[ST-074-switch-to-dbmate-migrations|ST-074]] (Prisma → dbmate switch) lands.

**Depends on:** [[ST-074-switch-to-dbmate-migrations|ST-074]] (migration tool must be in place first).
