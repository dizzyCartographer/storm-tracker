---
id: ST-005
title: No automated test coverage
type: tech-debt
status: open
priority: high
urgency: low
components:
  - scoring
  - infrastructure
  - auth
source: session
created: 2026-04-07
completed:
dev-plan-ref:
---

No unit, integration, or end-to-end tests exist. Only manual testing. For an app handling health data with clinical scoring logic, this is a significant gap.

**Risk:** Regressions in scoring, classification, or RLS policies go undetected.
**Fix:** Prioritize tests for Postgres scoring triggers, RLS policy verification, and critical UI flows.
**When:** Before any public release.
