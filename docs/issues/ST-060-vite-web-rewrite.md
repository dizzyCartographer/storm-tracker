---
id: ST-060
title: Rewrite web app from Next.js to Vite SPA
type: tech-debt
status: done
completed: 2026-04-15
components:
  - web
  - infrastructure
source: architecture-standards
created: 2026-04-11
supersedes: ST-001, ST-002, ST-003
---

The web app is built on Next.js with Prisma, server actions, and SSR — none of which are needed. Every page is behind auth, business logic runs in Postgres triggers, and authorization is via RLS. The correct architecture is a SPA that talks directly to Neon Data API (PostgREST) with JWT auth — the same pattern mobile already uses. This rewrite eliminates Prisma, server actions, compute-on-read, and the RLS bypass (ST-001, ST-002, ST-003) in one move.

**Supersedes:** ST-001 (web bypasses RLS), ST-002 (web recomputes on read), ST-003 (custom GET endpoints)

**Decisions made (2026-04-14):**
- Web is staying (not sunset) — needed for admin features
- Stack: Vite + React + TypeScript + Tailwind + React Router
- RLS gap: add missing INSERT policies via migration (not serverless functions)
- Mobile entry writes: decide after verifying Postgres trigger via PostgREST

**Technology justification (approved 2026-04-14):**
- Every page behind auth → SPA, no SSR needed
- Data access: Neon Data API with JWT/RLS (same as mobile)
- Business logic: Postgres triggers (already done)
- Auth: Better Auth client with JWT
- Only server-side needs: Anthropic API (journal parsing) + Vercel Blob (attachments) → 2 Vercel serverless functions
- Repo structure: `web/` alongside `mobile/`. Old `src/` stays until new web is verified, then deleted.

---

## Phase 0: Scaffold + Deploy Proof ✅

**Goal:** Vite app in `web/` deploys to Vercel with a hello-world page and a test serverless function.

1. `npm create vite@latest web -- --template react-ts`
2. Add Tailwind v4, React Router, Recharts, Zod, better-auth
3. Create `web/vercel.json` with SPA rewrites: `/((?!api).*) → /index.html`
4. Create `web/api/health.ts` — test serverless function
5. Minimal `App.tsx` with "Storm Tracker v2" placeholder

**Verify:** Deploy to staging. Page loads. `/api/health` responds.

---

## Phase 1: Auth Layer ✅

**Goal:** Sign in, sign up, sign out, JWT acquisition, protected routes.

**Implementation notes (2026-04-14/15):**
- Vercel catch-all `[...path]` is Next.js only — does not work for Vite. Used Hono as routing layer with a Vercel rewrite (`/api/auth/:rest*` → `/api/auth`).
- Better Auth requires `modelName` mappings when not using Prisma adapter — default table names are singular (`user`, `session`) but Prisma created plural (`users`, `sessions`).
- Better Auth returns empty 500 for database errors with no stack trace. Always add error wrapping when debugging.

1. **`web/api/auth.ts`** — Hono app with Better Auth handler (NOT catch-all)
   - Uses `pg` adapter (direct Postgres Pool, no Prisma)
   - `modelName` mappings: `user: "users"`, `session: "sessions"`, `account: "accounts"`, `verification: "verifications"`
   - Keeps `expo()`, `jwt()` plugins (mobile must keep working)
   - Same DB, same auth tables, same JWKS
2. **`web/src/lib/config.ts`** — `API_BASE_URL`, `NEON_DATA_API_URL`
3. **`web/src/lib/auth.ts`** — Better Auth client (`createAuthClient` with `jwtClient()`, no Expo plugin)
4. **`web/src/lib/auth-context.tsx`** — port from `mobile/src/lib/auth-context.tsx`
5. **`web/src/lib/api.ts`** — `neonFetch()` and `apiFetch()`, ported from `mobile/src/lib/api.ts`
   - `neonFetch`: JWT Bearer via `authClient.token()`, retry on "jwk not found"
   - `apiFetch`: browser cookies (simpler than mobile — `credentials: "include"`)
6. **`web/src/pages/SignIn.tsx`** — port from `src/app/sign-in/page.tsx`
7. **`web/src/pages/SignUp.tsx`** — port from `src/app/sign-up/page.tsx`
8. **React Router** in `App.tsx` — public routes + `ProtectedRoute` wrapper

**Key file to port from:** `src/lib/auth.ts` (server config), `mobile/src/lib/auth.ts` (client config)

**Verify:** Sign in with existing account. Sign out. Sign up new account. Unauthenticated `/dashboard` redirects to `/sign-in`. Mobile app still works (same auth endpoints).

**Cleanup:** ST-068 (remove debug error handler), ST-069 (delete unused `_auth-config.ts`)

---

## Phase 2: Data Layer + Project Context ✅

**Goal:** Fetch and display projects. Project selection works.

1. Port all 30+ read helpers from `mobile/src/lib/api.ts` into `web/src/lib/api.ts` (mostly copy-paste — pure fetch calls)
2. **`web/src/lib/project-context.tsx`** — port from `mobile/src/lib/project-context.tsx`
3. **`web/src/components/Nav.tsx`** — port from `src/app/_components/nav.tsx` (replace `next/link` → React Router `Link`, `usePathname` → `useLocation`)
4. **`web/src/components/ProjectSelector.tsx`** — port from `src/app/_components/project-selector.tsx`
5. **`web/src/pages/Dashboard.tsx`** — simplified: client component calling neonFetch helpers on mount
6. Shared layout component: `Nav` + `ProjectSelector` + `<Outlet />`

**Verify:** Sign in. See project list. Switch projects. See recent entries on dashboard.

---

## Phase 3: Entry Writes + Trigger Verification ✅

**Goal:** Confirm Postgres triggers fire via PostgREST. Build the log form.

**Findings (2026-04-15):**
- Postgres BEFORE triggers DO fire via PostgREST upsert — `computedMood` and `computedScore` are populated correctly.
- Mobile entry writes migrated to neonFetch (no more `/api/mobile/entries` endpoint).
- `crypto.randomUUID()` does not exist in React Native — replaced with polyfill.
- Missing unique constraint on `(date, userId, tenantId)` means upsert doesn't work correctly — see ST-072.

### Step 1: Trigger test (do first, before building UI)
- POST an entry to Neon Data API `/entries` with JWT auth on staging
- Use `Prefer: return=representation` to see the response
- Confirm `computedMood` and `computedScore` are populated by the trigger
- Test upsert via `Prefer: resolution=merge-duplicates` with conflict on `(userId, tenantId, date)`
- **If trigger doesn't fire:** fall back to a serverless function for entry writes

### Step 2: Write helpers
- `saveEntry(data)` — POST to `/entries` via neonFetch with upsert headers
- `deleteEntry(id)` — DELETE to `/entries?id=eq.{id}`

### Step 3: Port log form
- **`web/src/pages/Log.tsx`** — port `DailyLogForm` from `src/app/log/daily-log-form.tsx`
- Port sub-components: `BehaviorChecklist`, `ImpairmentTracking`, `NotesField`, `MenstrualTracking`, `CustomChecklist`
- **`web/src/pages/LogDetail.tsx`** — read-only entry detail

**Verify:** Create entry via form. `computedMood`/`computedScore` populated. Edit existing entry. Delete entry. Data visible on mobile.

**Decision point:** Based on trigger test results, decide whether to migrate mobile entry writes to neonFetch.

---

## Phase 4: Dashboard Analysis + History + Reports ✅

**Goal:** All read-heavy pages work, reading from persisted tables (no recomputation).

1. **Dashboard analysis** — replace `getAnalysis()` (recomputes) with direct reads: `getEpisodes()`, `getSignals()`, `getPredictions()`, `getSuggestions()`. Port `AnalysisPanel` from `src/app/dashboard/analysis-panel.tsx`.
2. **`web/src/pages/History.tsx`** — calendar grid. Replace `getEntriesByMonth` with `getEntriesByRange`. Port `HistoryView` component.
3. **`web/src/pages/Reports.tsx`** — most complex port:
   - Entries via `getEntriesByRange`, episodes/signals from persisted tables
   - Behavior frequency + impairment summary: simple counting, client-side
   - Port `WaveGraph` + `FrequencyChart` (Recharts, pure React)
   - Port `ReportView` layout

**Verify:** Dashboard shows episodes, signals, predictions, suggestions. History shows color-coded dots. Reports show wave graph + frequency chart.

---

## Phase 5: RLS Migration + CRUD Pages ✅

**Goal:** Project management, medications, strategies, frameworks, invites.

### Step 1: RLS migration
- Add `INSERT` policy on `tenants` (`WITH CHECK (auth.user_id() IS NOT NULL)`)
- Add `accept_invite(token)` Postgres function (SECURITY DEFINER) for atomic invite acceptance
- Apply to staging, verify, then production

### Step 2: Write helpers
- Medications: `createMedication`, `updateMedication`, `deleteMedication`
- Strategies: `createStrategy`, `deleteStrategy`
- Custom items: `addCustomItem`, `deleteCustomItem`
- Frameworks: `linkFramework`, `unlinkFramework`
- Invites: `createInvite`, `revokeInvite`
- Tenants: `createTenant`, `deleteTenant`

### Step 3: Port pages
- **`web/src/pages/Projects.tsx`** — project list
- **`web/src/pages/ProjectDetail.tsx`** — with sub-components: `ProjectProfileForm`, `MedicationManager`, `StrategyManager`, `FrameworkManager`, invite manager
- **`web/src/pages/ProjectCreate.tsx`** — create project form
- **`web/src/pages/Profile.tsx`** — user profile
- **`web/src/pages/Documents.tsx`** — attachment library (read-only listing)

**Verify:** Create project. Edit profile. Add/remove meds and strategies. Link/unlink frameworks. Create/revoke invites.

---

## Phase 6: Serverless Functions — Journal Import + Attachments ✅

**Goal:** The two features requiring server-side secrets work.

1. **`web/api/parse-journal.ts`** — port from `src/app/api/parse-journal/route.ts`. Uses `@ai-sdk/anthropic` + `ANTHROPIC_API_KEY`. Auth via session cookie validation.
2. **`web/api/attachments.ts`** — port from `src/app/api/attachments/route.ts`. Uses `@vercel/blob` + `BLOB_READ_WRITE_TOKEN`.
3. **`web/src/pages/JournalImport.tsx`** — 3-step flow: paste → AI parse → review → save
4. Update log form attachment section

**Verify:** Journal import parses text correctly. File upload/delete works.

---

## Phase 7: Remaining Pages + Polish ✅

**Goal:** Feature parity with old web app.

1. **`web/src/pages/Landing.tsx`** — public `/` page
2. **`web/src/pages/Reference.tsx`** — diagnostic reference (reads framework data via neonFetch)
3. **`web/src/pages/Invite.tsx`** — `/invite/[token]` acceptance
4. Redirect routes: `/settings` → `/projects`
5. `DisclaimerFooter`, `Logo`, `DatePicker` components
6. `NotFound` page + error boundary
7. Audit all pages against old app for missing features

**Verify:** Every page works. Navigation correct. Loading/error states present.

---

## Phase 8: Cutover 🔧

**Goal:** New web app replaces old one in production.

1. ~~Run both side-by-side on staging — test every flow~~ ✅
2. ~~Verify mobile still works (shares auth endpoint)~~ ✅
3. ~~`/api/auth/[...all]` stays at same path for mobile~~ ✅ (handled via Hono + rewrite)
4. ~~Mobile migrated to neonFetch for entries~~ ✅ (no longer needs `/api/mobile/entries`)
5. ~~Update Vercel project to deploy from `web/`~~ ✅ (user changed settings: Framework=Vite, Root=`web`)
6. ~~Deploy to production~~ ✅ (live at `storm-tracker-murex.vercel.app`)
7. Delete `src/`, root Next.js config files, Prisma dependencies — see ST-071
8. Update `CLAUDE.md` project structure — blocked on ST-071

**Status:** Complete. Vite web app live in production. Mobile app rebuilt with matching data layer (Neon Data API for all reads and writes). Both platforms verified working on production backend. Old Next.js code still in repo (ST-071 tracks deletion).

**Final notes (2026-04-15):**
- Production mobile build 3 (`com.stormtracker.app`) uploaded to App Store Connect
- Staging mobile build 13 (`com.stormtracker.dev`) on TestFlight
- Entry saves via PostgREST with `on_conflict=userId,tenantId,date` for upsert
- Postgres triggers fire correctly via PostgREST — `computedMood`/`computedScore` populated on every write
- `crypto.randomUUID()` not available in React Native — polyfilled with `generateUUID()`
- Both web and mobile share the same data path: JWT → Neon Data API → RLS → Postgres triggers
- No more custom API endpoints for data access (only auth, journal parsing, and attachments use serverless functions)

---

## Key Files to Port/Reference

| Source | Purpose | Target |
|--------|---------|--------|
| `mobile/src/lib/api.ts` | Template for entire data layer (30+ neonFetch helpers) | `web/src/lib/api.ts` |
| `mobile/src/lib/auth.ts` | Template for auth client (adapt for browser) | `web/src/lib/auth.ts` |
| `mobile/src/lib/auth-context.tsx` | Auth context (pure React, no Expo deps) | `web/src/lib/auth-context.tsx` |
| `mobile/src/lib/project-context.tsx` | Project selection context | `web/src/lib/project-context.tsx` |
| `src/lib/auth.ts` | Better Auth server config (adapt for serverless) | `web/api/auth/[...all].ts` |
| `src/app/log/daily-log-form.tsx` | Log form + sub-components | `web/src/pages/Log.tsx` |
| `src/app/dashboard/analysis-panel.tsx` | Analysis display | `web/src/components/AnalysisPanel.tsx` |
| `src/app/reports/report-view.tsx` | Report layout + charts | `web/src/pages/Reports.tsx` |
| `src/app/reports/wave-graph.tsx` | Recharts wave graph | `web/src/components/WaveGraph.tsx` |
| `src/app/api/parse-journal/route.ts` | AI journal parsing | `web/api/parse-journal.ts` |
| `src/app/api/attachments/route.ts` | File upload/delete | `web/api/attachments.ts` |

## What Does NOT Get Ported

- `src/lib/analysis/` — all TypeScript analysis functions (scoring, episodes, signals, predictions, suggestions). Postgres triggers handle all of this now.
- `src/lib/actions/` — all server actions. Replaced by neonFetch calls.
- `src/lib/prisma.ts` — Prisma client. No Prisma in new app.
- `src/lib/analysis/framework-loader.ts` — framework data read directly via neonFetch.
