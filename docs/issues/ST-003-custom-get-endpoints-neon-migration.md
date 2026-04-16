---
id: ST-003
title: Custom GET endpoints should use Neon Data API
type: tech-debt
status: superseded
components:
  - mobile
  - infrastructure
source: session
created: 2026-04-07
completed:
dev-plan-ref:
superseded-by: ST-060
---

**Superseded by ST-060.** The custom GET endpoints live in the Next.js app (`src/`). When `src/` is deleted after the Vite rewrite, these endpoints go with it. Mobile already reads via Neon Data API for most data. The remaining endpoints (`/api/mobile/analysis/[tenantId]`, `/api/mobile/frameworks/[tenantId]`) will be fully replaced before `src/` is removed.

~~Three mobile API routes exist for reads that should go through Neon Data API.~~
