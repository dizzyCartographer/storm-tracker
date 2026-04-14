# Storm Tracker — iOS Conversion Plan

## Context

The web app (Next.js 16, Vercel, Prisma/Neon Postgres) is being converted to an iOS app via React Native + Expo. The web app will eventually be sunset. The data model was flattened (Phase A) to simplify API access. Neon Data API provides auto-generated REST for all tables. Better Auth handles both web and mobile authentication via its Expo and JWT plugins.

**Strategy:** Flatten the data model → enable Neon Data API with RLS → add Better Auth Expo/JWT plugins → build Expo app → TestFlight → App Store.

---

## Phase A: Flatten Entry Data Model ✅

Consolidated 5 tables into 1 Entry table with JSONB columns (`behaviorKeys`, `customItemIds`, `strategyIds`, `impairments`, `menstrualSeverity`) and persisted computed fields (`computedMood`, `computedScore`).

---

## Phase B: Backend API Layer ✅

### B.1 — Row-Level Security Policies ✅
RLS enabled on all 24 tables via migration `20260331_add_rls_policies`. Helper functions `is_tenant_member()` and `is_tenant_owner()` (SECURITY DEFINER). Prisma connects as DB owner and bypasses RLS; only Neon Data API requests are subject to policies.

### B.2 — Better Auth Plugins ✅
Added `expo()`, `jwt()`, and `nextCookies()` (must be last) to `src/lib/auth.ts`. The JWT plugin stores keys in the `jwks` table (migration `20260407_add_jwks_table`). The Expo plugin enables mobile session management via `expo-secure-store`. `trustedOrigins` accepts production URL, `stormtracker://` deep link scheme, localhost, and Vercel preview URLs via dynamic callback.

**Key lesson:** Plugin ordering matters — `nextCookies()` must be last or it breaks web sessions.

### B.3 — Neon Data API ✅
Data API, JWT, and RLS enabled in Neon console. JWKS URL set to `https://storm-tracker-murex.vercel.app/api/auth/jwks`.

### B.4 — Custom API Endpoints ✅
Three endpoints for server-side computation (authenticated via Better Auth sessions):

| Endpoint | Purpose |
|----------|---------|
| `POST /api/mobile/entries` | Save daily log — upsert + scoring engine + persist computed fields |
| `GET /api/mobile/analysis/[tenantId]` | Full analysis pipeline |
| `GET /api/mobile/frameworks/[tenantId]` | Framework data for UI rendering |

Everything else goes through Neon Data API.

---

## Phase C: Expo App Scaffold + TestFlight Pipeline 🔧

### C.1 — Project Setup ✅
- `mobile/` directory (Expo SDK 55, React Native 0.83, TypeScript)
- Expo Router for file-based navigation
- Bundle ID: `com.stormtracker.app`

### C.2 — Mobile Auth Client 🔧
- `@better-auth/expo` client with `expoClient()` plugin for cookie-based session management via SecureStore
- `createAuthClient()` with `baseURL` pointing to production Vercel URL
- `authClient.signIn.email()` for email/password, `authClient.token()` for JWT when needed for Neon Data API
- Auth context provides `isSignedIn`, `signIn`, `signOut` to the app

### C.3 — API Client ✅
- `mobile/src/lib/api.ts` — fetch wrapper for custom endpoints
- Uses session cookies (via `authClient.getCookie()`) for custom API endpoints
- Uses JWT (via `authClient.token()`) for Neon Data API requests
- Helpers: `saveEntry()`, `getAnalysis()`, `getFrameworks()`

### C.4 — Screens Built ✅ (partial)
- `_layout.tsx` — root layout with AuthProvider
- `sign-in.tsx` — sign-in form (email/password, error handling, loading state)
- `index.tsx` — placeholder home screen with auth gate

### C.5 — Apple Developer + TestFlight Setup ✅
- Apple Developer account ($99/year) — enrolled
- App Store Connect: production (`com.stormtracker.app`, ascAppId `6761905904`) + staging (`com.stormtracker.dev`, ascAppId `6761926912`)
- EAS credentials configured (distribution cert + provisioning profiles)
- 5 builds submitted to TestFlight successfully
- **Note:** EAS Build free tier = 15 iOS builds/month, lower-priority queue (1+ hour waits during US business hours). Starter plan ($19/month) gets priority queue.

### C.6 — Styling Foundation ✅
- React Native Paper + centralized `theme.ts` with mint/teal palette
- Mood color system (manic=amber/orange, depressive=teal/cyan, mixed=purple, neutral=sage green)
- Project theming via teen's favorite color (accent bar, project selector pills)
- Native shadows on pills, Paper Surface on cards

---

## Phase D: v1 Screens (build + push to TestFlight iteratively) 🔧

Each screen gets tested on device via TestFlight as it's built.

1. Sign in / Sign up ✅
2. Dashboard (entry cards with `computedMood`, project selector) ✅
3. Daily log form (behavior checklist, custom items, impairments, menstrual, notes) ✅
4. History / calendar view (mood-colored dots from `computedMood`) ✅
5. Entry detail (read-only) ✅
6. Projects list + Project detail ✅
7. Profile ✅
8. AI Journal Import (3-step: paste → AI parse → review/edit → save) ✅
9. Log edit (pre-populated form from existing entry) ✅
10. Project edit (all profile fields) ✅

---

## Phase E: Native Features (post-v1) ⬜
- Apple Sign In (`expo-apple-authentication` + Better Auth Apple plugin)
- Push notifications for logging reminders
- Camera for attachments (`expo-image-picker`)
- Face ID / Touch ID (`expo-local-authentication`)
- Reports + wave graph (`victory-native`)
- Projects CRUD, medications, strategies
- Document library
- Offline queue
- HealthKit for menstrual data

---

## Phase F: Design & Visual Polish ⬜
- User-driven design changes (TBD — collect during beta testing)
- Deferred intentionally: functionality first, then polish

---

## Phase G: App Store Submission ⬜
- App icons, splash screen, screenshots
- Privacy policy (health-adjacent data)
- App Store review + submission

---

## Execution Order
1. ~~Phase A~~ ✅ — flatten data model
2. ~~Phase B~~ ✅ — backend API layer (RLS, auth plugins, Neon Data API, custom endpoints)
3. **Phase C** 🔧 — finish mobile auth client, Apple Developer + TestFlight
4. **Phase D** — build v1 screens iteratively
5. **Phase E** — native features (Apple Sign In, notifications, etc.)
6. **Phase F** — design polish from beta feedback
7. **Phase G** — App Store submission
