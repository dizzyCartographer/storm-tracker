# Data Architecture

This document describes Storm Tracker's complete data model, table relationships, RLS policies, and persistence patterns. For diagnostic framework tables specifically, see `data-architecture-diagnostic-frameworks.md`.

---

## Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         IDENTITY & AUTH                              │
│                                                                     │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐             │
│  │  User     │───▶│ TenantMember │◀───│    Tenant     │             │
│  │           │    │              │    │   (Project)   │             │
│  │ id        │    │ role:        │    │               │             │
│  │ name      │    │  OWNER       │    │ name          │             │
│  │ email     │    │  CAREGIVER   │    │ description   │             │
│  │ defaultId │    │  TEEN_SELF   │    │ purpose       │             │
│  └──────────┘    └──────────────┘    │ teenFullName   │             │
│       │                               │ teenNickname   │             │
│       │           ┌──────────────┐    │ birthday       │             │
│       └──────────▶│   Session    │    │ favoriteColor  │             │
│       │           └──────────────┘    │ diagnosis      │             │
│       │           ┌──────────────┐    │ onsetDate      │             │
│       └──────────▶│   Account    │    │ photoUrl       │             │
│                   └──────────────┘    │ ...            │             │
│                                       └───────┬───────┘             │
└───────────────────────────────────────────────┼─────────────────────┘
                                                │
                    ┌───────────────────────────┼──────────────────┐
                    │                           │                  │
                    ▼                           ▼                  ▼
┌─────────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐
│      DAILY DATA          │  │   TREATMENT           │  │  ANALYSIS       │
│                          │  │                        │  │  OUTPUT         │
│  ┌───────────────┐      │  │  ┌──────────────┐     │  │                 │
│  │    Entry       │      │  │  │  Medication   │     │  │ ┌────────────┐ │
│  │                │      │  │  │              │     │  │ │  Episode    │ │
│  │ date           │      │  │  │ name         │     │  │ │            │ │
│  │ mood           │      │  │  │ dosage       │     │  │ │ type       │ │
│  │ dayQuality     │      │  │  │ frequency    │     │  │ │ startDate  │ │
│  │ behaviorKeys[] │      │  │  │ startDate    │     │  │ │ endDate    │ │
│  │ customItemIds[]│      │  │  │ isActive     │     │  │ │ confidence │ │
│  │ strategyIds[]  │      │  │  └──────────────┘     │  │ └────────────┘ │
│  │ missedMedIds[] │      │  │                        │  │                 │
│  │ impairments{}  │      │  │  ┌──────────────┐     │  │ ┌────────────┐ │
│  │ notes          │      │  │  │  Strategy     │     │  │ │ Prodrome   │ │
│  │ menstrualFlow  │      │  │  │              │     │  │ │  Signal    │ │
│  │ computedMood{} │      │  │  │ name         │     │  │ └────────────┘ │
│  │ computedScore{}│      │  │  │ category     │     │  │                 │
│  │ hasBehavior    │      │  │  │ isDefault    │     │  │ ┌────────────┐ │
│  │ Detail         │      │  │  └──────────────┘     │  │ │ Prediction │ │
│  └───────┬───────┘      │  │                        │  │ └────────────┘ │
│          │               │  │  ┌──────────────┐     │  │                 │
│          ▼               │  │  │  CustomCheck  │     │  │ ┌────────────┐ │
│  ┌───────────────┐      │  │  │              │     │  │ │ Suggestion │ │
│  │  Attachment    │      │  │  │ label        │     │  │ └────────────┘ │
│  │               │      │  │  │ per tenant   │     │  │                 │
│  │ fileName      │      │  │  └──────────────┘     │  │                 │
│  │ fileType      │      │  │                        │  │                 │
│  │ blobUrl       │      │  │  ┌──────────────┐     │  │                 │
│  │ fileSize      │      │  │  │  Invite       │     │  │                 │
│  └───────────────┘      │  │  │              │     │  │                 │
│                          │  │  │ token        │     │  │                 │
│                          │  │  │ role         │     │  │                 │
│                          │  │  │ expiresAt    │     │  │                 │
│                          │  │  └──────────────┘     │  │                 │
└──────────────────────────┘  └────────────────────────┘  └─────────────────┘
```

---

## Table Groups

### 1. Identity & Auth (managed by Better Auth)

| Table | Purpose | RLS |
|-------|---------|-----|
| `user` | User accounts (email, name, image) | Owner-only read/write |
| `session` | Active sessions (web cookies, mobile SecureStore) | Owner-only |
| `account` | Auth provider links (email/password, future Apple Sign In) | Owner-only |
| `jwks` | RS256 key pairs for JWT signing | No RLS (system table) |
| `verification` | Email verification tokens | Owner-only |

### 2. Multi-Tenancy

| Table | Purpose | RLS |
|-------|---------|-----|
| `Tenant` | Projects — each represents a tracked teen | Members can read, owner can write |
| `TenantMember` | User ↔ Tenant join with role (OWNER, CAREGIVER, TEEN_SELF) | Members can read own |
| `Invite` | Token-based invite links (7-day expiry) | Owner can CRUD |

**Tenant profile fields:** name, description, purpose (ONGOING_TRACKING / DIAGNOSTIC_COLLECTION), teen info (fullName, nickname, birthday, favoriteColor, interests, school, favoriteSubject, iep, diagnosis, otherHealth, photoUrl), background (onsetDate, familyHistory).

### 3. Daily Entry Data

| Table | Purpose | RLS |
|-------|---------|-----|
| `Entry` | Daily log entries — the core transactional record | Tenant members |
| `Attachment` | File attachments on entries (Vercel Blob URLs) | Tenant members |
| `CustomCheck` | User-defined behavior items per tenant | Tenant members |

**Entry data model (flattened):**

The Entry table uses JSONB columns instead of join tables for write-time selections:

| Column | Type | Content |
|--------|------|---------|
| `behaviorKeys` | `jsonb` (string[]) | Checked behavior definition itemKeys |
| `customItemIds` | `jsonb` (string[]) | Checked custom check IDs |
| `strategyIds` | `jsonb` (string[]) | Selected strategy IDs |
| `missedMedIds` | `jsonb` (string[]) | Medications missed this day |
| `impairments` | `jsonb` (object) | `{ domain: severity }` map |
| `menstrualSeverity` | `string` | null, LIGHT, MEDIUM, or HEAVY |
| `computedMood` | `jsonb` | Full scoring output (classification, waveScore, severity, etc.) |
| `computedScore` | `jsonb` | Criteria counts per pole |
| `hasBehaviorDetail` | `boolean` | True if any behaviors were checked (vs quick-log-only) |

**Why flattened:** These selections have no independent lifecycle — they don't get updated separately from the entry. No need to query them independently. A join table would add complexity without benefit. See `application-architecture-standards.md` for the full rationale.

### 4. Treatment

| Table | Purpose | RLS |
|-------|---------|-----|
| `Medication` | Meds tracked per tenant (name, dosage, frequency, active/discontinued) | Tenant members |
| `Strategy` | Coping strategies per tenant (some pre-seeded defaults) | Tenant members |

### 5. Analysis Output (persisted at write time)

These tables are **replaced wholesale** whenever an entry is saved. The Postgres trigger `run_tenant_analysis()` deletes all existing rows for the tenant and inserts fresh results.

| Table | Purpose | RLS |
|-------|---------|-----|
| `Episode` | Detected mood episodes (manic, hypomanic, depressive, mixed) with duration, confidence, severity | Tenant members |
| `ProdromeSignal` | Early-warning signals (sleep disruption, escalating irritability, etc.) | Tenant members |
| `Prediction` | Pattern predictions (cycle forecasts, trends, day-of-week patterns) | Tenant members |
| `Suggestion` | Caregiver suggestions (safety, communication, environment, self-care, clinical) | Tenant members |

### 6. Diagnostic Framework (reference data)

Normalized reference tables that define how behaviors map to clinical criteria. Shared across all tenants. See `data-architecture-diagnostic-frameworks.md` for full details.

| Table | Purpose |
|-------|---------|
| `DiagnosticFramework` | Top-level framework (e.g., dsm5-bipolar) |
| `CriterionPole` | Axes (manic +1, depressive -1) |
| `Criterion` | Individual DSM-5 criteria (gate, core, standard) |
| `FrameworkBehaviorCategory` | Groupings (Sleep, Energy, Manic, Depressive) |
| `BehaviorDefinition` | Observable behaviors with recognition examples |
| `BehaviorCriterionMapping` | Many-to-many: behavior → criteria |
| `ClassificationRule` | Thresholds for daily classification |
| `EpisodeThreshold` | Duration rules for episode detection |
| `MoodDescriptorMapping` | Mood selector → gate/criterion effects |
| `SignalRule` | Early-warning pattern rules |
| `SignalBehavior` | Signal rule → behavior links |
| `TenantFramework` | Links tenants to active frameworks |

---

## RLS Policy Pattern

Every table follows this pattern:

```sql
-- Enable RLS
ALTER TABLE "TableName" ENABLE ROW LEVEL SECURITY;

-- Members can read
CREATE POLICY "tenant_member_select" ON "TableName"
  FOR SELECT USING (is_tenant_member("tenantId"));

-- Members can insert
CREATE POLICY "tenant_member_insert" ON "TableName"
  FOR INSERT WITH CHECK (is_tenant_member("tenantId"));

-- Members can update own rows (or all for some tables)
CREATE POLICY "tenant_member_update" ON "TableName"
  FOR UPDATE USING (is_tenant_member("tenantId"));

-- Owner can delete
CREATE POLICY "tenant_owner_delete" ON "TableName"
  FOR DELETE USING (is_tenant_owner("tenantId"));
```

Helper functions (SECURITY DEFINER):
- `is_tenant_member(tenant_id)` — checks if `auth.user_id()` (from JWT `sub` claim) exists in `TenantMember` for that tenant
- `is_tenant_owner(tenant_id)` — checks if user has OWNER role in that tenant

All runtime data access goes through Neon Data API, so RLS is enforced on every query. (Prisma still ships migrations until ST-076 swaps in dbmate, but no application code talks to Postgres through Prisma anymore.)

---

## Computed Data & Triggers

### Write-Time Scoring (BEFORE trigger)

```
compute_daily_score()
  Fires: BEFORE INSERT OR UPDATE on Entry
  Reads: DiagnosticFramework tables (SECURITY DEFINER)
  Writes: computedMood, computedScore columns on the Entry row
```

### Write-Time Analysis (AFTER trigger)

```
run_tenant_analysis()
  Fires: AFTER INSERT OR UPDATE on Entry
  Calls:
    compute_episodes(tenant_id)         → DELETE + INSERT episodes
    compute_prodrome_signals(tenant_id) → DELETE + INSERT prodrome_signals
    compute_predictions(tenant_id)      → DELETE + INSERT predictions
    compute_suggestions(tenant_id)      → DELETE + INSERT suggestions
```

---

## Data Access Patterns

Both mobile and web use the same data path: JWT from Better Auth, REST queries to Neon Data API, RLS enforced in Postgres.

| Operation | Method |
|-----------|--------|
| Read entries, episodes, signals, predictions, suggestions | Neon Data API (GET with JWT) |
| Read tenant/project data | Neon Data API |
| Read framework data (categories, definitions, criteria) | Neon Data API |
| Save/update entry | Neon Data API upsert with `?on_conflict=userId,tenantId,date`; Postgres triggers handle scoring + analysis |
| Side effects requiring server-side secrets | Vercel serverless functions (`web/api/parse-journal`, `web/api/attachments`, `web/api/auth/*`) |

---

## ID Strategy

All tables use UUIDs (`@default(uuid())`) as primary keys. UUIDs are unguessable (security benefit for health data) and don't leak record counts.

## Timestamps

- `createdAt` and `updatedAt` on all tables
- Entry dates are date-only (no time component) — one entry per user per tenant per date
- All timestamps stored as UTC

## Unique Constraints

- Entry: unique on `(date, userId, tenantId)` — one entry per observer per day per project
- TenantMember: unique on `(userId, tenantId)` — one membership per user per project
- BehaviorDefinition: unique `itemKey` per framework
