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

## Session: 2026-04-08 — Apple Developer Account Setup

### What Happened

Short session focused on connecting the Apple Developer account to EAS for iOS builds.

### Work Completed

- **Fixed Node.js PATH issue.** `node`/`npx` installed at `/opt/homebrew/bin/` but not on PATH in some shells. Confirmed `~/.zprofile` has `eval "$(/opt/homebrew/bin/brew shellenv)"` — opening a new terminal resolves it.
- **Fixed `eas.json` validation error.** Empty string values for `ascAppId` and `appleTeamId` caused EAS CLI to reject the file. Removed the empty fields.
- **Set up Apple Developer credentials via `eas credentials`.** Selected iOS → production → build credentials. EAS generated and stored a distribution certificate and provisioning profile.
- **Added Apple Team ID to `eas.json`.** Team ID: `RC99K6SXQX`, Apple ID: `maria.yarley@gmail.com`.

### Current State

Apple Developer account is fully connected to EAS. Signing credentials (distribution cert + provisioning profile) stored in EAS cloud. Ready to run `eas build` when the app is ready.

### What's Next

- First iOS build (`eas build --platform ios`)
- Phase 20.7 — Remove recomputation from web read paths (still open)
- Mobile v1 screens

---

## Session: 2026-04-08 — Memory Cleanup & Architecture Contradiction Resolution

### What Happened

Started session intending to build mobile dashboard (Phase D.2). Hit an architectural contradiction in the memory system that derailed into cleanup work. No app code was shipped — all changes are documentation and memory corrections.

### Key Issues Found & Resolved

1. **Stale memory contradicted architecture decisions.** `feedback_no_neon_data_api_jwt.md` said "don't use Neon Data API for mobile, use API routes instead." This was written mid-debugging before the JWT plugin ordering fix was found. It directly contradicted the April 7 architecture decision that all reads go through Neon Data API. Claude built a custom GET endpoint based on this stale memory, then second-guessed itself, then proceeded without clear approval. Multiple corrections needed.

2. **`feedback_never_modify_shared_auth.md`** said never add plugins to `src/lib/auth.ts`. Also stale — the fix was plugin ordering (`nextCookies()` must be last), not plugin removal. Replaced with correct rule.

3. **`feedback_better_auth_mobile_session.md`** described manual cookie formatting for token exchange. The `expoClient` plugin handles this automatically now. Deleted as stale.

4. **`project_ios_conversion.md`** said "web will be sunset." Work log (April 7) says "web may NOT be sunset." Corrected to "may or may not be sunset — both must work."

5. **Duplicate file** — `data-architecture-diagnostic-frameworks 2.md` was identical to `data-architecture-diagnostic-frameworks.md`. Deleted.

### Process Rules Established

1. **Memories require approval.** Never write a memory without showing content to the user first and getting explicit approval. (Was violated multiple times this session.)

2. **Memories go to both locations.** Write to memory folder AND `docs/context/feedback/`. Context folder is primary — it's what Claude sees first.

3. **Never proceed on ambiguous answers.** If a decision is surfaced and the response isn't a clear "do X," ask again. Don't interpret non-answers as direction.

### Documentation Changes

- **`docs/context/feedback/`** — New subdirectory for feedback/process rules, auto-loaded via `@docs/context/feedback/*.md` in CLAUDE.md.
- **`docs/context/feedback/feedback_memory_process.md`** — New. Memories require approval + dual-write rule.
- **`docs/context/feedback/feedback_better_auth_plugin_ordering.md`** — New. Plugin ordering rule (`nextCookies()` last).
- **`CLAUDE.md`** — Added feedback subdirectory to tree and imports. Added missing imports for `app-purpose-and-liability-constraints.md` and `future-enhancements.md`.
- **Memory folder** — Stale memories deleted/corrected, MEMORY.md updated.

### Architecture Decision Confirmed

**Mobile reads go through Neon Data API with JWT.** This was decided on April 7, documented in the work log, conventions, architecture standards, and iOS conversion plan. The contradicting memory was stale. No custom GET endpoints for data reads.

### What's Next

1. **Wire up `neonFetch()`** — Point to Neon REST endpoint (`https://ep-shy-breeze-ami5dzoi.apirest.c-5.us-east-1.aws.neon.tech/neondb/rest/v1`) with JWT auth via `authClient.token()`.
2. **Phase D.2 — Dashboard screen** — Using Neon Data API for entry reads, existing custom endpoints only for write-time computation.
3. **Phase C.5 — Apple Developer + TestFlight** — Can run in parallel, no code dependency.
4. **Existing custom GET endpoints** (`/api/mobile/tenants`, `/api/mobile/analysis/[tenantId]`, `/api/mobile/frameworks/[tenantId]`) — These are also reads that should go through Neon Data API. Need to plan migration.

---
