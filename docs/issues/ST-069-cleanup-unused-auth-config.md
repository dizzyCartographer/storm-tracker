---
id: ST-069
title: Remove unused _auth-config.ts from web serverless functions
type: tech-debt
status: open
priority: low
urgency: low
components:
  - web
  - auth
source: work-log-2026-04-15
created: 2026-04-15
---

`web/api/_auth-config.ts` exists but is unused at runtime. The auth config was inlined into `web/api/auth.ts` because Vercel bundles each serverless function independently — cross-directory imports don't resolve at runtime.

**Action:** Delete `web/api/_auth-config.ts`. Verify no other files import from it.
