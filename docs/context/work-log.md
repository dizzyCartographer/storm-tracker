# Storm Tracker — Work Log

Running log of work sessions, decisions made, and conversation context. This file is NOT auto-loaded into Claude sessions (it lives in `docs/`, not `docs/context/`) to avoid consuming context window. Read it at the start of a session if you need history, or when the user references prior work.

---

## Session: 2026-04-07 — Architecture Pivot & Postgres Triggers

### What Happened

This session started as mobile iOS development but pivoted into a fundamental architecture rework after the user repeatedly had to correct Claude for building custom API endpoints and computing data on read paths.

### Key Decisions Made

1. **No custom API endpoints.** ALL data access (reads AND writes) goes through Neon Data API with JWT/RLS. No server actions, no API routes, no query wrappers. The user corrected this pattern 3+ times across sessions before it stuck.

2. **All computation moves to Postgres triggers.** Scoring, episode detection, prodrome signals, predictions, and caregiver suggestions must all compute at write time and persist results. Read paths never compute. This was documented as the single most important architectural rule.

3. **Next.js was the wrong framework.** Every page is behind auth, there's no SEO benefit, SSR is unnecessary. A Vite + React SPA would have been correct. Not rewriting now since web may or may not be sunset, but the lesson is documented in architecture-standards.md for future projects.

4. **Prisma and RLS don't mix.** Prisma connects as database owner, bypassing RLS. Incompatible with the target architecture. Neon Data API replaces Prisma entirely for the correct data path.

5. **Existing code is architectural debt, not a reference.** Server actions, custom endpoints, TypeScript analysis modules all predate the architecture standards. New code must not replicate these patterns. This is explicitly called out in conventions.md.

6. **Data model approval required before schema.** Every table, column, and relationship must be justified and approved by the user before implementation. The user was blindsided by decisions made without their knowledge.

7. **Technology justification required before choosing frameworks.** A formal justification process (8 questions) must be completed before selecting any framework for future projects.

8. **Three environments required.** Local, staging, production. No shortcuts. The user cut the corner of skipping staging and it impacted production.

9. **Web app may NOT be sunset.** Both web and mobile must coexist on the same correct architecture. Don't assume web goes away.

10. **Builder tests locally before user tests.** Claude must verify changes work locally before asking the user to test.

### Work Completed

- **`docs/context/architecture-standards.md`** — New file. Generic architecture reference for all future projects. Contains technology justification requirements, data model approval process, dependency approval, one-way-door decisions, environment requirements, default stack for authenticated CRUD apps, and 12 lessons learned from this project.

- **`docs/context/conventions.md`** — Major update. Replaced short "Data Persistence" section with full "Data & API Architecture" section marking existing code as non-compliant debt, establishing Neon Data API as the only data path, and computation-at-write-time as the rule.

- **`docs/context/scoring-logic.md`** — New file. Complete documentation of all 6 analysis modules (daily scoring, episode detection, prodrome signals, pattern prediction, caregiver suggestions, framework loader) with full algorithms, inputs, outputs, and migration status.

- **`prisma/migrations/20260407_scoring_trigger/migration.sql`** — Postgres function `compute_daily_score()` as a BEFORE INSERT OR UPDATE trigger on entries. Full DSM-5 scoring algorithm. SECURITY DEFINER to read framework tables regardless of caller's RLS context. Tested against 3 real entries — all matched TypeScript output exactly.

- **`prisma/migrations/20260407_analysis_tables_and_triggers/migration.sql`** — Four new tables (`episodes`, `prodrome_signals`, `predictions`, `suggestions`) all with RLS policies. Four Postgres functions (`compute_episodes`, `compute_prodrome_signals`, `compute_predictions`, `compute_suggestions`). One orchestrator trigger (`run_tenant_analysis`) that fires AFTER INSERT OR UPDATE on entries. Full pipeline verified — all 4 tables populated correctly.

- **`docs/context/storm-tracker-development-plan.md`** — Phase 20 expanded and phases 20.1–20.4, 20.6 marked complete. Phase 20.5 (discrepancies) deferred. Phase 20.7 (remove recomputation from web read paths) still open.

- **`CLAUDE.md`** — Added imports for architecture-standards.md and scoring-logic.md. Added commit timing rule.

### Issues Encountered

- **Node.js blocked by macOS Gatekeeper.** Workaround: used psql directly (`/opt/homebrew/opt/postgresql@17/bin/psql`) instead of npx.
- **`compute_predictions` had `RECORD[]` pseudo-type error.** Postgres doesn't support `RECORD[]`. Fixed by declaring individual typed variables.
- **Auto-commits with bad messages.** Files were auto-committed with "Update files" style messages and pushed before they could be squashed. Added commit timing rule to CLAUDE.md to prevent recurrence.
- **Git push rejected (non-fast-forward).** Auto-commits had been pushed to remote by something else. Resolved by merging remote changes.

### User Frustrations / Feedback

- Had to correct custom endpoint building 3+ times across sessions. This was the primary driver for the architecture standards document.
- Was blindsided by data model decisions made without approval. Led to the data model approval requirement.
- "I refuse to build on top of bad code" — Phase 20 (Postgres triggers) had to complete before any mobile screens could be built.
- "I don't ever want anything I've built here to be called AI slop" — wants rigorous justification for every architectural decision.
- Auto-commits with generic messages are unacceptable.

### What's Next (as of end of session)

1. **Phase 20.7** — Remove recomputation from web read paths
2. **Mobile v1 screens** — Dashboard, Daily Log, History, Entry Detail using Neon Data API at `https://ep-shy-breeze-ami5dzoi.apirest.c-5.us-east-1.aws.neon.tech/neondb/rest/v1`
3. **Staging environment setup**
4. **Neon Data API wiring** — `neonFetch()` needs to point to correct endpoint with JWT auth

---

## Session: 2026-04-08 — Status Check & Work Log Creation

### What Happened

Brief session. User checked status and requested creation of this work log file to maintain continuity across conversations. No code changes.

### Decisions Made

- Work log lives at `docs/work-log.md` (not in `docs/context/`) to avoid auto-loading into every session and consuming context window. Read on demand when history is needed.

---

## Session: 2026-04-08 — Staging Environment Setup

### What Happened

Set up a staging environment using Vercel Preview deployments + Neon database branching.

### Work Completed

1. **Installed CLIs** — `vercel` and `neonctl` installed globally via npm.

2. **Neon staging branch** — Created `staging` branch from `main` in the `storm-tracker-db` Neon project (`green-silence-82079891`). Branch ID: `br-still-unit-am2a7elj`. Endpoint: `ep-round-shape-amx2h82v`.

3. **Vercel Preview env vars** — Removed shared database env vars from Preview environment and re-added staging-specific values:
   - `STRM_TRKR_DATABASE_URL` → staging branch pooled connection
   - `STRM_TRKR_DATABASE_URL_UNPOOLED` → staging branch unpooled connection
   - Removed 7 Neon integration host vars from Preview (they pointed to prod)
   - `STRM_TRKR_BETTER_AUTH_URL` not set for Preview — handled dynamically via `VERCEL_URL`

4. **Better Auth `VERCEL_URL` fallback** — Updated `src/lib/auth.ts` so `baseURL` falls back to `https://${VERCEL_URL}` when `STRM_TRKR_BETTER_AUTH_URL` isn't set. This makes preview deployments work automatically without needing to know the exact URL.

5. **Git `staging` branch** — Cleaned up a stale remote `staging` branch (only had auto-commits). Created fresh `staging` branch from `main` and pushed. Merged auth change back to `main`.

6. **Verified deployment** — Preview deployment from `staging` branch deployed successfully (status: Ready).

### Environment Architecture

| Environment | Branch (Git) | Branch (Neon) | URL |
|-------------|-------------|---------------|-----|
| Production | `main` | `main` | `storm-tracker-murex.vercel.app` |
| Staging | `staging` | `staging` | Auto-generated Vercel preview URL |
| Local | any | `main` (via .env) | `localhost:3000` |

### Workflow

- Push to `main` → production deployment
- Push to `staging` → preview deployment with isolated database
- To promote staging to prod: merge `staging` → `main`

---
