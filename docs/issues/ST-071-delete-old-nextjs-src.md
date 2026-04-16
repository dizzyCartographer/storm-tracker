---
id: ST-071
title: Delete old Next.js source code and Prisma dependencies
type: tech-debt
status: open
priority: high
urgency: soon
components:
  - web
  - infrastructure
source: ST-060-phase-8
created: 2026-04-15
depends-on: ST-060
---

The old Next.js web app (`src/`, root-level `next.config.ts`, `prisma/`, Prisma dependencies in `package.json`) is still in the repo. The Vite app in `web/` has replaced it in production. The old code should be deleted once the Vite app is confirmed stable.

This is the final step of ST-060 Phase 8 (cutover). Blocked until the Vite web app has been verified in production for a reasonable period.

**Action:**
1. Confirm Vite web app is stable in production
2. Delete `src/` directory (old Next.js app code)
3. Delete root-level Next.js config files (`next.config.ts`, `postcss.config.mjs`, etc.)
4. Remove Prisma from `package.json` dependencies
5. Delete `prisma/` directory (schema + migrations stay in git history)
6. Update `CLAUDE.md` project structure
7. Update `docs/context/system-architecture.md` to remove Next.js/Prisma references

## Notes

**2026-04-16 — First attempt rolled back.** ST-071 was completed and pushed to staging, but the staging preview had never actually worked with the Vite app (cross-origin auth to production failed because Hono didn't handle OPTIONS preflight). Rolled staging back to pre-ST-071 baseline (`d125a5c`) to debug from a known state.

The staging issue was resolved by setting up proper environment isolation (same-origin auth, separate JWKS keys, staging Neon Data API endpoint) rather than fixing cross-origin. ST-071 cleanup can be re-executed now that staging is verified working.

**CORS/OPTIONS discovery:** The Hono route in `web/api/auth.ts` only handles `["POST", "GET"]` — no `OPTIONS`. This caused CORS preflight failures when staging tried cross-origin auth to production. Not a problem now (same-origin), but should be added if cross-origin auth is ever needed (e.g., mobile web view).
