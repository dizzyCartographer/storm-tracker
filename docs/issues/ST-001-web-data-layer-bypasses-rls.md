---
id: ST-001
title: Web data layer bypasses RLS (server actions + Prisma)
type: tech-debt
status: open
priority: high
urgency: low
components:
  - web
  - infrastructure
  - auth
source: session
created: 2026-04-07
completed:
dev-plan-ref:
---

The entire web app reads and writes data through Next.js server actions and Prisma, which connects as database owner and bypasses RLS. No row-level authorization enforcement on web.

**Risk:** Any server action bug could expose or mutate another tenant's data.
**Fix:** Migrate web data access to Neon Data API with JWT/RLS (same as mobile). Large effort — effectively rebuilding the web data layer.
**When:** Before adding any new web features, or when web is sunset. Not blocking mobile development.
