# System Architecture

This document describes Storm Tracker's system architecture — how the components fit together, where code runs, and how data flows between them.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                  │
│                                                                 │
│  ┌──────────────┐              ┌──────────────┐                │
│  │  Mobile App   │              │   Web App     │                │
│  │  (Expo/RN)    │              │  (Vite SPA)   │                │
│  │               │              │               │                │
│  │  React Native │              │  React        │                │
│  │  Paper v5.15  │              │  React Router │                │
│  │  Expo Router  │              │  Tailwind v4  │                │
│  │               │              │  Recharts     │                │
│  └──────┬───────┘              └──────┬───────┘                │
│         │                             │                         │
│         └────── JWT + Neon Data API ──┘  (same path both)       │
│         + serverless functions for server-side secrets only     │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICES                            │
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │   Neon Data API           │  │   Vercel Serverless       │    │
│  │   (PostgREST)             │  │   (web/api/*)             │    │
│  │                           │  │                          │    │
│  │   Auto-generated REST     │  │   /api/auth/*             │    │
│  │   JWT verification        │  │     Better Auth via Hono  │    │
│  │   RLS enforcement         │  │   /api/parse-journal      │    │
│  │                           │  │     Anthropic SDK         │    │
│  │   All reads + writes      │  │   /api/attachments        │    │
│  │   from web AND mobile     │  │     Vercel Blob upload    │    │
│  └──────────┬───────────────┘  │   /api/invite-details      │    │
│             │                   │   /api/health              │    │
│             │                   └──────────┬───────────────┘    │
│             │                              │                    │
│             ▼                              ▼                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Neon Postgres (Serverless)                   │   │
│  │                                                          │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │   │
│  │   │ Application  │  │  Diagnostic  │  │  Analysis    │   │   │
│  │   │ Tables       │  │  Framework   │  │  Output      │   │   │
│  │   │              │  │  Tables      │  │  Tables      │   │   │
│  │   │ users        │  │              │  │              │   │   │
│  │   │ sessions     │  │ frameworks   │  │ episodes     │   │   │
│  │   │ tenants      │  │ poles        │  │ prodrome_    │   │   │
│  │   │ entries      │  │ criteria     │  │   signals    │   │   │
│  │   │ medications  │  │ behaviors    │  │ predictions  │   │   │
│  │   │ strategies   │  │ rules        │  │ suggestions  │   │   │
│  │   │ attachments  │  │ thresholds   │  │              │   │   │
│  │   └─────────────┘  └─────────────┘  └──────────────┘   │   │
│  │                                                          │   │
│  │   Triggers: compute_daily_score, run_tenant_analysis     │   │
│  │   RLS: Every table has policies via is_tenant_member()   │   │
│  │   Extensions: pg_session_jwt (auth.user_id())            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Better Auth   │  │ Vercel Blob   │  │ Anthropic    │         │
│  │               │  │               │  │ API          │         │
│  │ Auth provider │  │ File storage  │  │              │         │
│  │ JWT issuer    │  │ Attachments   │  │ Journal      │         │
│  │ JWKS endpoint │  │ 10MB limit    │  │ parsing      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### Mobile App (Expo / React Native)

The primary client. Built with Expo SDK 55, React Native 0.83, TypeScript.

| Aspect | Detail |
|--------|--------|
| Framework | Expo SDK 55 + React Native 0.83 |
| Navigation | Expo Router (file-based) |
| UI Library | React Native Paper v5.15 (Material Design 3) |
| Animations | react-native-reanimated 4.2.1 |
| Icons | expo-symbols |
| Auth | @better-auth/expo with SecureStore |
| Data reads | Neon Data API (JWT + RLS) |
| Data writes | Custom API endpoint (`POST /api/mobile/entries`) for writes needing computation; Neon Data API for simple writes |

**Screen structure:**

```
mobile/src/app/
├── _layout.tsx              # Root: PaperProvider + AuthProvider + ProjectProvider
├── sign-in.tsx              # Email/password sign-in
├── index.tsx                # Auth gate → redirect to tabs
├── journal-import.tsx       # 3-step AI journal import
├── log-edit.tsx             # Edit existing entry
├── project-edit.tsx         # Edit project profile
├── entry/[id].tsx           # Read-only entry detail
├── project/[id].tsx         # Project detail + members
└── (tabs)/
    ├── _layout.tsx          # Tab bar (Dashboard, Log, AI Journal, History)
    ├── dashboard.tsx        # Entry cards, signals, episodes, suggestions
    ├── log.tsx              # Daily log form (behaviors, impairments, etc.)
    ├── import.tsx           # Redirect to journal-import
    ├── history.tsx          # Calendar view with mood dots
    ├── projects.tsx         # Projects list
    └── profile.tsx          # User profile
```

### Web App (Vite + React SPA)

Single-page app served as static assets from Vercel. Same data path as mobile: Neon Data API with JWT and RLS. Serverless functions exist only for things that require server-side secrets (auth, Anthropic, Blob).

| Aspect | Detail |
|--------|--------|
| Framework | Vite + React + TypeScript |
| Routing | React Router v7 (client-side) |
| Hosting | Vercel (static + `web/api/*` serverless) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts v3.8 |
| Auth | Better Auth client → `/api/auth/*` (Hono-routed serverless function) |
| Data access | Neon Data API (JWT + RLS) — no ORM, no server-side query wrappers |

### Neon Postgres (Database)

The database is the application's brain. All business logic (scoring, classification, episode detection, signals, predictions, suggestions) runs as Postgres triggers and functions at write time.

| Aspect | Detail |
|--------|--------|
| Provider | Neon (serverless Postgres) |
| Project | `green-silence-82079891` |
| Main endpoint | `ep-shy-breeze-ami5dzoi` |
| Staging endpoint | `ep-round-shape-amx2h82v` |
| Extensions | `pg_session_jwt` (extracts user ID from JWT) |
| Data API | PostgREST auto-generated REST, JWT auth, RLS enforcement |

### Better Auth

Handles authentication for both web and mobile.

| Aspect | Detail |
|--------|--------|
| Version | Better Auth with `expo()` and `jwt()` plugins |
| Web routing | Hono catches `/api/auth/:rest*` and forwards `c.req.raw` to `auth.handler()` |
| JWT algorithm | RS256 |
| JWKS endpoint | `/api/auth/jwks` (served by Better Auth) |
| Mobile sessions | SecureStore via @better-auth/expo |
| Web sessions | HTTP-only cookies (default Better Auth behavior, same-origin) |

### Vercel Blob

File storage for document attachments on log entries.

| Aspect | Detail |
|--------|--------|
| Max file size | 10MB |
| Allowed types | PDF, images (JPEG, PNG, GIF, WebP) |
| Auth | `BLOB_READ_WRITE_TOKEN` env var |

### Anthropic API

Powers AI journal import — parses freeform caregiver journal text into structured behavioral entries.

| Aspect | Detail |
|--------|--------|
| SDK | Vercel AI SDK + @ai-sdk/anthropic |
| Function | `generateObject` with Zod schema |
| Endpoint | `POST /api/parse-journal` |

---

## Data Flow

### Mobile: Reading Data

```
Mobile App
  │
  ├─ authClient.token()          # Get JWT from Better Auth
  │
  ├─ GET Neon Data API           # Direct REST query
  │   ├─ Authorization: Bearer <JWT>
  │   ├─ Neon verifies JWT via JWKS endpoint
  │   ├─ pg_session_jwt extracts user_id from sub claim
  │   ├─ RLS policies filter rows by tenant membership
  │   └─ Returns JSON rows
  │
  └─ Render in React Native
```

### Mobile (and Web): Writing an Entry

Both clients write entries the same way. No custom endpoint — the upsert goes through Neon Data API; Postgres triggers do the computation.

```
Client (mobile or web)
  │
  ├─ authClient.token()                      # JWT from Better Auth
  │
  ├─ POST Neon Data API /entries             # PostgREST upsert
  │      ?on_conflict=userId,tenantId,date    # uniqueness key
  │      Prefer: resolution=merge-duplicates,return=representation
  │   ├─ JWT verified via JWKS
  │   ├─ RLS checks tenant membership
  │   │
  │   ├─ BEFORE trigger: compute_daily_score()
  │   │   └─ Reads framework tables → classification, waveScore, severity,
  │   │      computedCriteriaCounts (per-pole counts)
  │   │   └─ Persists as columns on the entry row
  │   │
  │   ├─ AFTER trigger: run_tenant_analysis()
  │   │   ├─ compute_episodes()         → replaces episodes rows
  │   │   ├─ compute_prodrome_signals() → replaces prodrome_signals rows
  │   │   ├─ compute_predictions()      → replaces predictions rows
  │   │   └─ compute_suggestions()      → replaces suggestions rows
  │   │
  │   └─ Returns the saved row with computed fields
  │
  └─ Dashboard re-fetches from Neon Data API (reads persisted results only)
```

### Web: Reading Data

```
Web Browser
  │
  ├─ React Router renders the route component
  │
  ├─ authClient.token()                  # JWT from Better Auth
  │
  ├─ GET Neon Data API                   # Direct REST query (same as mobile)
  │   ├─ Authorization: Bearer <JWT>
  │   ├─ Neon verifies JWT via JWKS endpoint
  │   ├─ RLS policies filter rows by tenant membership
  │   └─ Returns JSON rows
  │
  └─ React renders persisted data — no compute on read
```

---

## Authentication Flow

```
┌─────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│  Mobile  │────▶│ Better Auth  │────▶│   Postgres   │────▶│  Session  │
│  App     │     │ /api/auth/*  │     │  users table │     │  created  │
└─────────┘     └──────────────┘     └──────────────┘     └────┬─────┘
                                                               │
                     ┌─────────────────────────────────────────┘
                     ▼
              ┌──────────────┐
              │  SecureStore  │  (mobile — encrypted on-device storage)
              │  or Cookie    │  (web — HTTP-only cookie)
              └──────┬───────┘
                     │
                     ▼ (when Neon Data API access needed)
              ┌──────────────┐
              │ authClient   │
              │  .token()    │──────▶ JWT with { sub: userId }
              └──────────────┘
                     │
                     ▼
              ┌──────────────┐     ┌──────────────┐
              │ Neon Data API│────▶│ JWKS verify  │
              │ (PostgREST)  │     │ /api/auth/   │
              └──────────────┘     │   jwks       │
                                   └──────────────┘
```

---

## Authorization Model

**RLS (Row-Level Security) is the only authorization layer.**

Every table has RLS policies. Two helper functions enforce access:

- `is_tenant_member(tenant_id)` — Returns true if the JWT user is a member of the tenant. Used for SELECT/INSERT/UPDATE policies.
- `is_tenant_owner(tenant_id)` — Returns true if the JWT user is the owner. Used for DELETE and admin operations.

Both web and mobile go through Neon Data API, so RLS is enforced on every query.

---

## Computation Model

**All computation happens at write time. Read paths never compute.**

```
Entry INSERT/UPDATE
  │
  ├─ BEFORE trigger: compute_daily_score()
  │   └─ Reads diagnostic framework tables
  │   └─ Computes: classification, ruleType, waveScore, severity, safetyConcern
  │   └─ Stores on the entry row (computedMood, computedScore JSONB)
  │
  └─ AFTER trigger: run_tenant_analysis()
      ├─ compute_episodes()         → episodes table
      ├─ compute_prodrome_signals() → prodrome_signals table
      ├─ compute_predictions()      → predictions table
      └─ compute_suggestions()      → suggestions table
```

Mobile and web read from these tables directly. No computation on read paths.

---

## Infrastructure

| Service | Purpose | Provider |
|---------|---------|----------|
| Database | Postgres (serverless) | Neon |
| Data API | Auto-generated REST | Neon Data API (PostgREST) |
| Web hosting | Vite SPA static assets + serverless functions in `web/api/` | Vercel |
| Mobile builds | iOS builds + TestFlight | Local Xcode (EAS available as fallback) |
| Auth | Session + JWT management | Better Auth (self-hosted serverless function on Vercel) |
| File storage | Document attachments | Vercel Blob |
| AI | Journal parsing | Anthropic API (Claude) |
| Migrations | Schema migrations | Prisma CLI against `prisma/migrations/` (planned switch to dbmate — see ST-076) |
