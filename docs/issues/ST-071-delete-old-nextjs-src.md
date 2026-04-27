---
id: ST-071
title: Delete old Next.js source code and Prisma dependencies
type: tech-debt
status: on-stage
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

## Notes

**2026-04-16 — First attempt rolled back.** ST-071 was completed and pushed to staging, but the staging preview had never actually worked with the Vite app (cross-origin auth to production failed because Hono didn't handle OPTIONS preflight). Rolled staging back to pre-ST-071 baseline (`d125a5c`) to debug from a known state.

The staging issue was resolved by setting up proper environment isolation (same-origin auth, separate JWKS keys, staging Neon Data API endpoint) rather than fixing cross-origin. ST-071 cleanup can be re-executed now that staging is verified working.

**CORS/OPTIONS discovery:** The Hono route in `web/api/auth.ts` only handles `["POST", "GET"]` — no `OPTIONS`. This caused CORS preflight failures when staging tried cross-origin auth to production. Not a problem now (same-origin), but should be added if cross-origin auth is ever needed (e.g., mobile web view).

**2026-04-27 — Re-execution.** Status moved to `on-stage`. What landed:

- Deleted `src/` (155 TS/TSX files, the entire Next.js app)
- Deleted `scripts/` (6 seed/backfill scripts; all imported `src/generated/prisma/client`, so they were orphaned by the `src/` removal — not in the original action list but unavoidable)
- Deleted root Next/Tooling files: `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`, plus untracked artifacts `next-env.d.ts` and `tsconfig.tsbuildinfo`
- Stripped Next/React/Tailwind/Anthropic/Better Auth/etc. from root `package.json` — dropped from 22 dependencies to 4 (Prisma trio + `pg`). Reinstalled to reconcile `package-lock.json` (-710 packages).
- Updated `CLAUDE.md` project structure
- Updated context docs that contained stale claims contradicting the new architecture: `system-architecture.md` (full architecture rewrite — diagram, web subsection, data flow, Better Auth section, infrastructure table), `data-architecture.md` (RLS bypass note + data access patterns table), `conventions.md` (removed "existing code is debt" warnings, removed stale TypeScript-on-read note, fixed broken link to `application-architecture-standards.md`, updated test paths to `web/src/`/`mobile/src/`).

**Deferred to [[ST-076-switch-to-dbmate-migrations|ST-076]]** (per planning discussion):
- Step 4 (Remove Prisma from `package.json`): kept Prisma deps so ST-076 can still run `prisma migrate` against the existing migration files during the dbmate transition.
- Step 5 (Delete `prisma/` directory): kept intact so ST-076's Phase 3 ("Copy existing SQL files from `prisma/migrations/*/migration.sql` into dbmate's directory") doesn't have to fish files out of git history.
- Final fate of root `package.json` and `node_modules/` (whether to delete the root install entirely once Prisma is gone, or keep it stripped down): also ST-076's call.

**Verification:**
- `cd web && npm run build` — passes (291ms, 753 KB JS, 218 KB gzipped)
- Mobile typecheck has one pre-existing error in `app-tabs.web.tsx` (Expo Router route type) — not related to ST-071 deletions; mobile has zero imports from the deleted `src/` or `prisma/`

**Awaiting:** staging deploy verification, then production verification (per `feedback_shipping_is_not_done.md`).
