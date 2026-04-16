---
id: ST-071
title: Delete old Next.js source code and Prisma dependencies
type: tech-debt
status: open
urgency: high
phase: A
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
