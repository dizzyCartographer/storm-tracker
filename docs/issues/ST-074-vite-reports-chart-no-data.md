---
id: ST-074
title: Wave graph chart on Vite reports page displays no data
type: bug
status: open
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

The wave graph and behavior frequency chart on the Vite web app's Reports page (`web/src/pages/Reports.tsx`) display no data. All entries render as NEUTRAL with a wave score of 0 regardless of actual scoring.

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
