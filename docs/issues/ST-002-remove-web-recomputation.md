---
id: ST-002
title: Remove recomputation from web read paths
type: tech-debt
status: open
priority: high
urgency: low
components:
  - web
  - dashboard
  - reports
  - history
source: session
created: 2026-04-07
completed:
dev-plan-ref: Phase 20.7
---

Web dashboard, reports, and history still call TypeScript analysis functions on every read instead of reading from the persisted `episodes`, `prodrome_signals`, `predictions`, and `suggestions` tables. Postgres triggers already populate these tables at write time.

**Risk:** Inconsistency between what mobile shows (persisted) and what web shows (recomputed). Performance cost on every page load.
**Fix:** Update web components to query persisted tables. Delete `/api/mobile/analysis/[tenantId]` endpoint.
