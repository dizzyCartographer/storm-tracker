# Storm Tracker — iOS Conversion Plan

## Context

The web app (Next.js 16, Vercel, Prisma/Neon Postgres) is being converted to an iOS app via React Native + Expo. The web app will eventually be sunset. The current data model has unnecessary complexity — a single daily log entry is fragmented across 5 tables when it should be one record. The app also has no REST API (uses Next.js server actions), which blocks mobile access.

**Strategy:** Flatten the data model first, then enable Neon Data API for auto-generated REST, with a few custom API endpoints for operations that need server-side computation (scoring/classification). Then build the Expo app.

---

## Phase A: Flatten Entry Data Model (web app, prerequisite) ✅

Consolidate 5 tables into 1. Add persisted computed fields.

### Schema Changes

**Remove these tables:**
- `BehaviorCheck`
- `CustomCheck`
- `Impairment`
- `MenstrualLog`

**Add JSONB + computed columns to `Entry`:**

| Column | Type | Example |
|--------|------|---------|
| `behaviorKeys` | `jsonb` | `["manic-gate", "depressive-core-1"]` |
| `customItemIds` | `jsonb` | `["clx123", "clx456"]` |
| `strategyIds` | `jsonb` | `["str123", "str456"]` |
| `impairments` | `jsonb` | `{"school": "PRESENT", "family": "SEVERE"}` |
| `menstrualSeverity` | `String?` | `"MEDIUM"` (or null — no need for a whole table for one field) |
| `computedMood` | `String?` | `"MANIC"` — algorithmic classification |
| `computedScore` | `Float?` | `0.75` — wave graph score |

### Migration Script
- Read all entries with their related BehaviorCheck, CustomCheck, Impairment, MenstrualLog records
- Write JSONB values + compute and store `computedMood`/`computedScore` for each entry
- Run scoring engine during migration to populate computed fields for historical data
- Verify row counts match before dropping old tables

### Application Code Updates

**Files to modify:**

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add JSONB columns to Entry, remove 4 child models |
| `src/lib/actions/entry-actions.ts` | `saveDailyLog()` becomes single upsert + compute classification. All `getEntries*` functions stop doing `.map(bc => bc.itemKey)` — data is already in the right shape. Remove `displayMood` computation on read. |
| `src/lib/actions/report-actions.ts` | Same — stop flattening nested records, read JSONB directly |
| `src/lib/actions/analysis-actions.ts` | Same — read `behaviorKeys` directly from entry |
| `src/app/log/daily-log-form.tsx` | Form state stays the same (already works with key arrays) |
| `src/app/log/[id]/page.tsx` | Read-only view — read from JSONB instead of nested includes |
| `src/app/log/behavior-checklist.tsx` | No change — already works with key arrays |
| `src/app/log/impairment-tracking.tsx` | Minor — read/write from JSONB object instead of array of records |
| `src/app/log/menstrual-tracking.tsx` | Minor — read/write single field instead of nested record |
| `src/app/dashboard/entry-card.tsx` | Use `computedMood` directly instead of recalculating |
| `src/app/history/entry-calendar.tsx` | Use `computedMood` for dot colors |
| `src/app/reports/report-view.tsx` | Use `computedScore` directly |

### Verification
- Run existing app locally, create/edit/view entries — all flows work
- Compare dashboard, history, reports output before and after migration
- Verify scoring matches: `computedMood` on every historical entry should match what the old read-time computation produced

---

## Phase B: Enable Neon Data API ✅

### B.1 — Row-Level Security Policies ✅
RLS enabled on all 24 tables via migration `20260331_add_rls_policies`. Helper functions `is_tenant_member()` and `is_tenant_owner()` (SECURITY DEFINER) avoid repeated subqueries. Prisma connects as DB owner and bypasses RLS; only Neon Data API requests (authenticated role) are subject to policies.

Policy categories:
- **Auth tables** (users, sessions, accounts): read/update own only. Verifications: no Data API access.
- **Tenant management** (tenants, tenant_members, invites): read if member, manage if owner.
- **Tenant data** (entries, custom_checklist_items, attachments, medications, strategies): CRUD if member. Entries: create/update/delete own only.
- **Diagnostic frameworks** (11 tables): read-only for any authenticated user.

### B.2 — JWT Auth Setup ✅
Added Better Auth `jwt` plugin alongside existing `nextCookies()` in `src/lib/auth.ts`. Exposes:
- `POST /api/auth/token` — mobile app calls after sign-in to get a JWT (sub = user ID)
- `GET /api/auth/jwks` — JWKS endpoint for Neon to verify tokens

### B.3 — Enable Data API in Neon Console ✅
User enabled Data API, JWT, and RLS in Neon console. JWKS URL must be set to `https://<production-domain>/api/auth/jwks`.

### B.4 — Custom API Endpoints ✅
Three endpoints for server-side computation (JWT-authenticated via `src/lib/mobile-auth.ts`):

| Endpoint | Purpose |
|----------|---------|
| `POST /api/mobile/entries` | Save daily log — single upsert + scoring engine + persist `computedMood`/`computedScore` |
| `GET /api/mobile/analysis/[tenantId]` | Full analysis pipeline: scoring, episodes, signals, predictions, suggestions, discrepancies |
| `GET /api/mobile/frameworks/[tenantId]` | Load tenant framework data (behaviors, criteria, classification rules, episode thresholds) |

Everything else (read entries, list tenants, CRUD medications, strategies, custom items, attachments) goes through the auto-generated Neon Data API.

---

## Phase C: Expo App Scaffold + TestFlight Pipeline

Get a minimal app running on your phone via TestFlight before building real screens.

### C.1 — Project Setup
- `mobile/` directory in existing repo
- Expo with TypeScript, Expo Router
- `expo-secure-store` for JWT tokens

### C.2 — Apple Developer + TestFlight Setup
- Apple Developer account ($99/year)
- Set up App Store Connect (app record, bundle ID)
- Configure Xcode signing (or EAS Build credentials)
- Build minimal "hello world" app → deploy to TestFlight
- Verify install on personal device
- Walk through entire Xcode/TestFlight flow step by step

### C.3 — API Client
- Typed client for Neon Data API (auto-generated CRUD)
- Typed client for custom endpoints (scoring, analysis)
- Auth token management

### C.4 — Styling Foundation
- NativeWind (Tailwind for React Native) or StyleSheet
- Mood color system (manic=orange, depressive=blue, mixed=purple, neutral=gray)
- Project theming (teen's favorite color)
- Logo SVG via `react-native-svg`

---

## Phase D: v1 Screens (build + push to TestFlight iteratively)

Each screen gets tested on device via TestFlight as it's built.

1. Sign in / Sign up
2. Dashboard (entry cards with `computedMood`, project selector)
3. Daily log form (behavior checklist, custom items, impairments, menstrual, notes)
4. History / calendar view (mood-colored dots from `computedMood`)
5. Entry detail (read-only)

---

## Phase E: Native Features (post-v1)
- Push notifications for logging reminders
- Camera for attachments (`expo-image-picker`)
- Face ID / Touch ID (`expo-local-authentication`)
- Reports + wave graph (`victory-native`)
- Projects CRUD, medications, strategies
- Document library
- Offline queue
- HealthKit for menstrual data

---

## Phase F: Design & Visual Polish
- User-driven design changes (TBD — collect during beta testing)
- Deferred intentionally: functionality first, then polish
- This phase will be scoped based on design feedback gathered during TestFlight beta

---

## Phase G: App Store Submission
- App icons, splash screen, screenshots
- Privacy policy (health-adjacent data)
- App Store review + submission

---

## Execution Order
1. **Phase A first** — flatten the data model in the existing web app. This improves the web app regardless of mobile.
2. **Phase B** — enable Neon Data API. Web app continues using server actions; mobile will use the Data API.
3. **Phase C** — scaffold Expo app + get TestFlight pipeline working.
4. **Phase D/E** — build screens iteratively, test on device, add native features.
5. **Phase F** — design polish based on beta testing feedback.
6. **Phase G** — App Store submission.
