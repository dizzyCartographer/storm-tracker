# Tech Debt

Known architectural debt. Items here are not blockers for current work but represent real liability if left indefinitely. Each item includes what it is, why it matters, and when to address it.

---

## 1. Web data layer bypasses RLS (server actions + Prisma)

The entire web app reads and writes data through Next.js server actions and Prisma, which connects as database owner and bypasses RLS. This means web has no row-level authorization enforcement.

**Risk:** Any server action bug could expose or mutate another tenant's data.
**Fix:** Migrate web data access to Neon Data API with JWT/RLS (same as mobile). Large effort — effectively rebuilding the web data layer.
**When:** Before adding any new web features, or when web is sunset. Not blocking mobile development.
**Ref:** conventions.md ("Existing code is not a reference architecture"), architecture-standards.md Lesson #7

## 2. Web read paths still recompute analysis (Phase 20.7)

Web dashboard, reports, and history still call TypeScript analysis functions on every read instead of reading from the persisted `episodes`, `prodrome_signals`, `predictions`, and `suggestions` tables. The Postgres triggers already populate these tables at write time.

**Risk:** Inconsistency between what mobile shows (persisted) and what web shows (recomputed). Performance cost on every page load.
**Fix:** Update web components to query persisted tables. Delete `/api/mobile/analysis/[tenantId]` endpoint.
**When:** Before any further web feature work.
**Ref:** development-plan.md Phase 20.7

## 3. Custom GET endpoints should be Neon Data API reads

Three mobile API routes exist for reads that should go through Neon Data API:
- `GET /api/mobile/analysis/[tenantId]`
- `GET /api/mobile/frameworks/[tenantId]`
- `GET /api/mobile/tenants`

**Risk:** Maintenance burden, bypasses RLS, inconsistent with architecture.
**Fix:** Mobile reads these via Neon Data API. Delete the endpoints.
**When:** As mobile screens are built that consume this data.
**Ref:** conventions.md ("No custom API endpoints")

## 4. Neon Data API database grants not in a migration

GRANT permissions for Neon Data API roles (`authenticated`, `neon_auth`, `anonymous`, `authenticator`) were applied manually to production on 2026-04-08. Not captured in any Prisma migration.

**Risk:** Any new Neon branch or environment will get 403 errors from Neon Data API until grants are applied manually. Staging DB does not have them.
**Fix:** Create a Prisma migration with the GRANT statements.
**When:** Before spinning up a new environment or enabling Neon Data API on staging.
**Ref:** work-log.md 2026-04-08 session

## 5. No automated test coverage

No unit, integration, or end-to-end tests exist. The only testing has been manual verification. For an app handling health data with clinical scoring logic, this is a significant gap.

**Risk:** Regressions in scoring, classification, or RLS policies go undetected.
**Fix:** Prioritize tests for Postgres scoring triggers, RLS policy verification, and critical UI flows.
**When:** Before any public release.
**Ref:** architecture-standards.md ("Known Risks")

## 6. Scoring algorithm not clinically validated

DSM-5 behavior-to-criterion mappings, classification thresholds, gate criteria logic, and wave score formula were implemented from the builder's interpretation of clinical literature. Not reviewed by a clinician.

**Risk:** Incorrect scoring could mislead caregivers or clinicians. Liability concern.
**Fix:** Clinical review of implemented rules against source DSM-5 criteria.
**When:** Before App Store submission.
**Ref:** architecture-standards.md ("Known Risks"), app-purpose-and-liability-constraints.md
