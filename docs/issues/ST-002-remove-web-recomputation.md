---
id: ST-002
title: Remove recomputation from web read paths
type: tech-debt
status: superseded
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
superseded-by: ST-060
---

**Superseded by ST-060.** The Vite SPA rewrite reads from persisted tables via Neon Data API. No recomputation possible — the TypeScript analysis functions won't exist in the new app.

~~Web dashboard, reports, and history still call TypeScript analysis functions on every read instead of reading from the persisted tables. Postgres triggers already populate these tables at write time.~~
