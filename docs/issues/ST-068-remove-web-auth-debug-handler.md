---
id: ST-068
title: Remove debug error handler from web auth serverless function
type: tech-debt
status: open
priority: medium
urgency: soon
components:
  - web
  - auth
source: work-log-2026-04-15
created: 2026-04-15
---

`web/api/auth.ts` has a temporary debug error handler that returns error details on 500 responses. This was added during the Vite cutover (April 14–15) to diagnose Better Auth crashes. It should be removed now that auth is working — exposing error internals in production is a security risk.

**Action:** Remove the debug error wrapping in the Hono handler. Let Better Auth's default error handling take over.
