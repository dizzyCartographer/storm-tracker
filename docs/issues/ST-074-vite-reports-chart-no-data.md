---
id: ST-074
title: Wave graph chart on Vite reports page displays no data
type: bug
status: in-progress
priority: high
urgency: now
components:
  - web
  - reports
  - scoring
source: testing-feedback
created: 2026-04-15
completed:
---

> **ID collision note:** `ST-074-switch-to-dbmate-migrations.md` also uses ID ST-074. The `claude/competent-rubin` branch (`bdc411c`) renumbers the dbmate issue to avoid this but isn't merged. User plans to re-triage via Obsidian kanban.

## Current Status (2026-04-16) — Paused

**Partial fix landed on staging** via PR #10 (`15410f9`). Wave graph renders correctly (classification colors + wave score curve). **Criteria counts still show 0/9 on staging preview** — behavior frequency chart and tooltip counts not populated.

**Fix landed:**
- ✅ `extractScore()` rewritten to read `computedMood` as TEXT and `computedScore` as DOUBLE PRECISION scalars (not JSONB)
- ✅ `generate()` rewritten to fetch framework data in parallel and build `behaviorPoleMap` (itemKey → pole slug)
- ✅ Wave graph classification colors + wave score values correct on staging
- ❌ Per-entry `manicCriteriaCount` / `depressiveCriteriaCount` remain 0 — `behaviorPoleMap` appears empty at runtime despite all data being correct

**Verified correct in DB (prod and staging):**
- `tenant_frameworks` records for test tenants
- `framework_behavior_categories` has rows with slugs `manic` and `depressive`
- `behavior_definitions` has 17 rows with `itemKey`s matching entry `behaviorKeys`
- RLS on framework tables = `auth.user_id() IS NOT NULL` (any authenticated user reads)
- Entries have non-empty `behaviorKeys` arrays

**Verified correct in code:**
- `getEntriesByRange()` selects `"behaviorKeys"`
- `getFrameworkId()`, `getBehaviorCategories()`, `getBehaviorDefinitions()` use double-quoted UUID IN-clause pattern (same as working mobile code)
- `neonFetch()` retries up to 3 times on JWKS errors
- Vercel env: Preview `VITE_NEON_DATA_API_URL` → staging Neon (`ep-round-shape-amx2h82v`); Production → `ep-shy-breeze-ami5dzoi`

**Leading hypothesis:** Transient JWKS cache miss on one of the framework-data fetches in `generate()` fails silently (the `try/catch` swallows errors and leaves `behaviorPoleMap` empty). Not confirmed. Debug `console.log` statements were added to `web/src/pages/Reports.tsx` in the `sharp-hawking` worktree but not committed.

**Production unchanged.** Staging has the partial fix; production still renders pre-fix version. Merging `staging → main` would ship the partial fix (wave graph) but criteria counts would be 0 in production too.

## Next Steps (when resumed)

1. Reproduce on staging preview with browser devtools — check Network tab for failed `framework_behavior_categories` / `behavior_definitions` requests
2. If transient JWKS is the cause, surface the error instead of swallowing it (same theme as ST-073)
3. Decide whether to merge partial fix to main (production wave graph works, criteria counts still 0) or hold for full fix
4. Remove uncommitted debug `console.log`s from the `sharp-hawking` worktree, or delete that worktree

## Root Cause

`extractScore()` (Reports.tsx:103-113) treats `computedMood` and `computedScore` as JSONB objects and tries to access nested properties like `mood?.classification` and `mood?.waveScore`. In reality:

- **`computedMood`** is a **plain string** (`"MANIC"`, `"DEPRESSIVE"`, `"MIXED"`, `"NEUTRAL"`) — see Prisma schema line 213 and migration `20260327_flatten_entry_model` (`TEXT` column)
- **`computedScore`** is a **plain number** (the wave score float) — see Prisma schema line 214 and migration (`DOUBLE PRECISION` column)

The Postgres trigger (`compute_daily_score()` in `20260407_scoring_trigger/migration.sql:383-384`) stores:
```sql
NEW."computedMood" := v_classification;  -- TEXT string
NEW."computedScore" := v_wave_score;     -- DOUBLE PRECISION number
```

Since `extractScore()` casts a string to `Record<string, unknown>` and tries property access, every field falls through to its `?? 0` / `?? "NEUTRAL"` default. The chart receives all-zero data points.

## Broken Code

```typescript
// Reports.tsx:103-113
function extractScore(entry: EntryRow) {
  const mood = entry.computedMood as Record<string, unknown> | null;  // WRONG — it's a string
  const score = entry.computedScore as Record<string, unknown> | null; // WRONG — it's a number
  return {
    classification: (mood?.classification as string) ?? "NEUTRAL",     // always "NEUTRAL"
    waveScore: (mood?.waveScore as number) ?? 0,                       // always 0
    severity: (mood?.severity as string) ?? "NONE",                    // always "NONE"
    manicCriteriaCount: ... ?? 0,                                      // always 0
    depressiveCriteriaCount: ... ?? 0,                                 // always 0
  };
}
```

## What Needs to Change

**Minimum fix** — make `extractScore()` read the actual scalar values:

```typescript
function extractScore(entry: EntryRow) {
  return {
    classification: (entry.computedMood as string) ?? "NEUTRAL",
    waveScore: (entry.computedScore as number) ?? 0,
    severity: "NONE",  // not stored as a separate column
    manicCriteriaCount: 0,
    depressiveCriteriaCount: 0,
  };
}
```

This fixes the wave graph (which only needs `waveScore` and `classification`) but leaves `manicCriteriaCount` and `depressiveCriteriaCount` at 0, which affects the behavior frequency chart.

**Full fix** — the per-pole criteria counts are not persisted as separate columns. Two options:

1. **Expand the Postgres trigger** to store a JSONB column with the full score breakdown (classification, waveScore, severity, criteriaCounts, safetyConcern) instead of two scalar columns. Then `extractScore()` can read the nested object as originally written.

2. **Derive criteria counts client-side** from `behaviorKeys` + framework data. This is compute-on-read, which violates the architecture conventions — option 1 is preferred.

## Files

- `web/src/pages/Reports.tsx:103-113` — `extractScore()` function (primary bug)
- `web/src/lib/api.ts` — `EntryRow` type should reflect actual column types
- `prisma/migrations/20260407_scoring_trigger/migration.sql` — trigger that stores the values
- `prisma/schema.prisma:213-214` — column definitions
