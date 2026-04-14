# API Reference

Storm Tracker has two data access patterns: **Neon Data API** (the target architecture) and **custom API endpoints** (for writes needing server-side computation). This document covers both.

---

## Neon Data API (PostgREST)

**Base URL:** `https://ep-shy-breeze-ami5dzoi.apirest.c-5.us-east-1.aws.neon.tech/neondb/rest/v1`

**Auth:** `Authorization: Bearer <JWT>` (obtained via `authClient.token()`)

**RLS:** All queries are filtered by Postgres RLS policies. The JWT `sub` claim identifies the user via `auth.user_id()`.

### Query Syntax (PostgREST)

```
GET /table_name?column=eq.value              # Exact match
GET /table_name?column=in.(val1,val2)        # IN clause
GET /table_name?column=gte.value             # Greater than or equal
GET /table_name?select=col1,col2             # Column selection
GET /table_name?order=column.desc            # Ordering
GET /table_name?limit=10                     # Pagination
PATCH /table_name?id=eq.value                # Update (with Prefer: return=minimal)
```

**Quoting:** Column names with camelCase need double-quote wrapping in the URL: `"tenantId"=eq.value`

### Tables Accessed via Neon Data API

| Table | Used for | Key queries |
|-------|----------|-------------|
| `entries` | Daily log entries | By tenant (recent), by date range, by ID |
| `episodes` | Detected mood episodes | By tenant, ordered by startDate desc |
| `prodrome_signals` | Early-warning signals | By tenant |
| `predictions` | Pattern predictions | By tenant |
| `suggestions` | Caregiver suggestions | By tenant, ordered by priority |
| `tenants` | Project details | By ID, by membership |
| `tenant_members` | User memberships + roles | By tenant (for member lists) |
| `users` | User info, defaultTenantId | By ID |
| `tenant_frameworks` | Active frameworks per tenant | By tenant |
| `diagnostic_frameworks` | Framework metadata | By ID |
| `framework_behavior_categories` | Behavior groupings | By framework |
| `behavior_definitions` | Observable behaviors | By category IDs |
| `custom_checklist_items` | User-defined behavior items | By tenant |
| `medications` | Active medications | By tenant, isActive=true |
| `strategies` | Coping strategies | By tenant |

### Mobile API Helpers

All defined in `mobile/src/lib/api.ts`:

| Function | Method | Purpose |
|----------|--------|---------|
| `neonFetch(path, options)` | any | Base Neon Data API fetch with JWT + retry logic |
| `getTenants()` | GET | User's tenant memberships + tenant details |
| `getRecentEntries(tenantId, limit)` | GET | Recent entries (default 14) |
| `getEntriesByRange(tenantId, start, end)` | GET | Entries in date range |
| `getEntryById(id)` | GET | Single entry by ID |
| `getEntryByDate(tenantId, date)` | GET | Entry for specific date |
| `getEpisodes(tenantId)` | GET | Detected episodes (limit 10) |
| `getSignals(tenantId)` | GET | Prodrome signals (limit 20) |
| `getPredictions(tenantId)` | GET | Pattern predictions (limit 10) |
| `getSuggestions(tenantId)` | GET | Caregiver suggestions (limit 20) |
| `getFrameworkId(tenantId)` | GET | Active framework ID |
| `getBehaviorCategories(frameworkId)` | GET | Behavior category list |
| `getBehaviorDefinitions(categoryIds)` | GET | Behavior definitions for categories |
| `getCustomItems(tenantId)` | GET | Custom checklist items |
| `getActiveMedications(tenantId)` | GET | Active medications (name, dosage) |
| `getFullMedications(tenantId)` | GET | Active medications (full detail) |
| `getStrategies(tenantId)` | GET | Strategies (name, category) |
| `getFullStrategies(tenantId)` | GET | Strategies (full detail) |
| `getTenantById(tenantId)` | GET | Full tenant profile |
| `getTenantMembers(tenantId)` | GET | Tenant member list |
| `getUsersByIds(ids)` | GET | User display info |
| `getTenantFrameworkDetails(tenantId)` | GET | Framework names for tenant |
| `getCurrentUserInfo()` | GET | Current user with defaultTenantId |
| `setDefaultTenant(userId, tenantId)` | PATCH | Update user's default tenant |
| `updateTenantProfile(tenantId, data)` | PATCH | Update project profile fields |

---

## Custom API Endpoints

**Base URL:** `https://storm-tracker-murex.vercel.app`

**Auth:** Session cookies (via `authClient.getCookie()` on mobile, HTTP-only cookies on web)

### POST /api/mobile/entries

Save or update a daily log entry. This is a custom endpoint because it triggers server-side scoring computation.

**Request body:**

```json
{
  "tenantId": "uuid",
  "mood": "MANIC | DEPRESSIVE | NEUTRAL | MIXED",
  "dayQuality": "GOOD | NEUTRAL | BAD | MIXED",
  "behaviorKeys": ["criterion-key-1", "criterion-key-2"],
  "customItemIds": ["uuid-1"],
  "strategyIds": ["uuid-1"],
  "missedMedIds": ["uuid-1"],
  "impairments": {
    "SCHOOL_WORK": "NONE | PRESENT | SEVERE",
    "FAMILY": "NONE | PRESENT | SEVERE",
    "FRIENDSHIPS": "NONE | PRESENT | SEVERE",
    "SELF_CARE": "NONE | PRESENT | SEVERE",
    "SAFETY_CONCERN": "NONE | PRESENT | SEVERE"
  },
  "notes": "Freeform text",
  "menstrualSeverity": "LIGHT | MEDIUM | HEAVY | null",
  "date": "2026-04-10"
}
```

**What happens server-side:**

1. Validates user is a member of the tenant
2. Upserts entry (unique on date + userId + tenantId)
3. Postgres trigger `compute_daily_score()` fires → computes classification, wave score, severity
4. Postgres trigger `run_tenant_analysis()` fires → recomputes episodes, signals, predictions, suggestions for the tenant

**Response:** Saved entry with `computedMood` and `computedScore` fields populated.

### GET /api/mobile/analysis/[tenantId]

Returns full analysis pipeline results. **Tech debt — should be replaced by Neon Data API reads from episodes, prodrome_signals, predictions, and suggestions tables (ST-003).**

### GET /api/mobile/frameworks/[tenantId]

Returns diagnostic framework data for UI rendering (behavior categories, definitions, criterion mappings). **Tech debt — should be replaced by Neon Data API reads (ST-003).**

### GET /api/mobile/tenants

Returns tenants the authenticated user belongs to. **Tech debt — already replaced by `getTenants()` in mobile api.ts which uses Neon Data API (ST-003).**

### POST /api/parse-journal

AI-powered journal parsing. Sends freeform caregiver text to Anthropic API and returns structured entry data.

**Request body:**

```json
{
  "text": "Today was rough. Jake barely slept last night...",
  "tenantId": "uuid"
}
```

**Response:**

```json
{
  "date": "2026-04-10",
  "mood": "MANIC",
  "dayQuality": "BAD",
  "behaviorKeys": ["very-little-sleep", "pressured-rapid-speech"],
  "impairments": { "SCHOOL_WORK": "PRESENT", "FAMILY": "SEVERE" },
  "notes": "Cleaned up version of the journal text",
  "confidence": 0.85,
  "reasoning": "Why the AI chose these values",
  "followUpQuestions": ["Did Jake sleep at all?"]
}
```

### POST/DELETE /api/attachments

File upload/delete for entry attachments (Vercel Blob).

- **POST:** Multipart form upload. Max 10MB. PDF and image types. Returns blob URL.
- **DELETE:** Removes blob by URL. Query param: `?url=<blob_url>`

### /api/auth/[...all]

Better Auth catch-all route. Handles sign-in, sign-up, sign-out, session management, JWKS endpoint.

Key sub-routes:
- `/api/auth/sign-in/email` — email/password sign-in
- `/api/auth/sign-up/email` — registration
- `/api/auth/sign-out` — session termination
- `/api/auth/jwks` — JWKS public keys for JWT verification
- `/api/auth/get-session` — current session info
- `/api/auth/token` — JWT token for Neon Data API

### POST /api/force-sign-out

Forces sign-out (used for session recovery).

---

## Mobile Fetch Helpers

Two base fetch functions in `mobile/src/lib/api.ts`:

| Function | Auth method | Used for |
|----------|-------------|----------|
| `apiFetch(path, options)` | Session cookies via `authClient.getCookie()` | Custom API endpoints |
| `neonFetch(path, options)` | JWT Bearer via `authClient.token()` | Neon Data API queries |

`neonFetch` includes retry logic (up to 2 retries) for Neon's intermittent JWKS cache misses.
