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
│  │  (Expo/RN)    │              │  (Next.js)    │                │
│  │               │              │               │                │
│  │  React Native │              │  React + SSR  │                │
│  │  Paper v5.15  │              │  Tailwind CSS │                │
│  │  Expo Router  │              │  Recharts     │                │
│  └──────┬───────┘              └──────┬───────┘                │
│         │                             │                         │
│    JWT + Neon                   Session cookies                  │
│    Data API                     + Prisma (legacy)               │
└─────────┼─────────────────────────────┼─────────────────────────┘
          │                             │
          ▼                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICES                            │
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │   Neon Data API           │  │   Vercel (Next.js)       │    │
│  │   (PostgREST)             │  │                          │    │
│  │                           │  │   Server Actions (web)   │    │
│  │   Auto-generated REST     │  │   API Routes:            │    │
│  │   JWT verification        │  │     POST /api/mobile/    │    │
│  │   RLS enforcement         │  │       entries            │    │
│  │                           │  │     GET /api/mobile/     │    │
│  │   Reads: mobile           │  │       analysis/[id]      │    │
│  │   Writes: mobile (simple) │  │       frameworks/[id]    │    │
│  └──────────┬───────────────┘  │     POST /api/parse-     │    │
│             │                   │       journal             │    │
│             │                   │     /api/auth/*           │    │
│             │                   │     /api/attachments      │    │
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

### Web App (Next.js)

Legacy client. Functional but not the primary development target. Uses Prisma (bypasses RLS) and server actions. May or may not be sunset.

| Aspect | Detail |
|--------|--------|
| Framework | Next.js 16 (App Router) |
| Hosting | Vercel |
| Styling | Tailwind CSS v4.2 |
| Charts | Recharts v3.8 |
| Auth | Better Auth (session cookies) |
| Data access | Prisma ORM → Postgres (bypasses RLS — tech debt) |

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
| Version | Better Auth with expo(), jwt(), nextCookies() plugins |
| Plugin order | `expo()`, `jwt()`, `nextCookies()` — **nextCookies() must be last** |
| JWT algorithm | RS256 |
| JWKS endpoint | `/api/auth/jwks` (served by Better Auth) |
| Mobile sessions | SecureStore via @better-auth/expo |
| Web sessions | HTTP-only cookies via nextCookies() |

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

### Mobile: Writing an Entry

```
Mobile App
  │
  ├─ POST /api/mobile/entries    # Custom endpoint (needs server-side computation)
  │   ├─ Better Auth verifies session
  │   ├─ Validates membership in tenant
  │   ├─ Upserts entry via Prisma
  │   │
  │   ├─ Postgres trigger: compute_daily_score()
  │   │   └─ Reads framework tables → computes classification, wave score, severity
  │   │   └─ Stores as computedMood, computedScore on entry row
  │   │
  │   ├─ Postgres trigger: run_tenant_analysis()
  │   │   ├─ compute_episodes() → replaces episodes table rows
  │   │   ├─ compute_prodrome_signals() → replaces prodrome_signals rows
  │   │   ├─ compute_predictions() → replaces predictions rows
  │   │   └─ compute_suggestions() → replaces suggestions rows
  │   │
  │   └─ Returns saved entry with computed fields
  │
  └─ Dashboard refreshes from Neon Data API (reads persisted results)
```

### Web: Reading Data (Legacy)

```
Web Browser
  │
  ├─ Server Component renders
  │   ├─ Better Auth session cookie verified
  │   ├─ Server action calls Prisma (bypasses RLS)
  │   ├─ Some pages still recompute analysis in TypeScript (tech debt)
  │   └─ Returns rendered HTML
  │
  └─ Client hydrates
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

Prisma (used by web) connects as database owner and **bypasses RLS entirely**. This is known tech debt (ST-001).

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

**Exception:** Web still recomputes some analysis on read (ST-002 tech debt). Mobile uses the correct architecture.

---

## Infrastructure

| Service | Purpose | Provider |
|---------|---------|----------|
| Database | Postgres (serverless) | Neon |
| Data API | Auto-generated REST | Neon Data API (PostgREST) |
| Web hosting | Next.js SSR + static | Vercel |
| Mobile builds | iOS builds + TestFlight | EAS Build or local Xcode |
| Auth | Session + JWT management | Better Auth (self-hosted on Vercel) |
| File storage | Document attachments | Vercel Blob |
| AI | Journal parsing | Anthropic API (Claude) |
| ORM | Database migrations + web queries | Prisma (legacy, web only) |
