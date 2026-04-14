---
id: ST-003
title: Custom GET endpoints should use Neon Data API
type: tech-debt
status: open
priority: medium
urgency: low
components:
  - mobile
  - infrastructure
source: session
created: 2026-04-07
completed:
dev-plan-ref:
---

Three mobile API routes exist for reads that should go through Neon Data API:
- `GET /api/mobile/analysis/[tenantId]`
- `GET /api/mobile/frameworks/[tenantId]`
- `GET /api/mobile/tenants`

**Risk:** Maintenance burden, bypasses RLS, inconsistent with architecture.
**Fix:** Mobile reads via Neon Data API. Delete the endpoints.
**When:** As mobile screens are built that consume this data.
