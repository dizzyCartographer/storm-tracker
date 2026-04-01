# Data Architecture — Diagnostic Frameworks

## Overview

Storm Tracker uses a **database-driven diagnostic framework** system. All behavior definitions, clinical criteria, scoring rules, episode thresholds, and early-warning signal configurations are stored in PostgreSQL — not hardcoded. This allows adding new diagnostic frameworks (e.g., ADHD, anxiety, schizophrenia) without code changes.

## Entity Relationship

```
DiagnosticFramework
 ├── CriterionPole[]           (axes: "manic" / "depressive")
 │    ├── Criterion[]          (individual DSM criteria per pole)
 │    ├── ClassificationRule[] (thresholds for daily classification)
 │    └── EpisodeThreshold[]   (duration rules for episode detection)
 ├── FrameworkBehaviorCategory[] (groupings: "Sleep", "Energy", etc.)
 │    └── BehaviorDefinition[]   (observable behaviors)
 │         └── BehaviorCriterionMapping[] → Criterion
 ├── MoodDescriptorMapping[]   (mood selector → gate/criterion effects)
 ├── SignalRule[]               (early-warning pattern rules)
 │    └── SignalBehavior[] → BehaviorDefinition
 └── TenantFramework[] → Tenant (links tenants to active frameworks)
```

## Core Models

### DiagnosticFramework
Top-level container. One per diagnostic system.

| Field       | Purpose                                          |
|-------------|--------------------------------------------------|
| `slug`      | Unique key, e.g. `dsm5-bipolar`, `dsm5-adhd`    |
| `name`      | Display name                                     |
| `version`   | Allows versioned updates to criteria              |
| `isActive`  | Soft-disable without deletion                    |

### CriterionPole
An axis of a framework. Bipolar has two poles: **manic** (+1 direction) and **depressive** (-1 direction). ADHD might have **inattentive** and **hyperactive-impulsive**.

| Field       | Purpose                                          |
|-------------|--------------------------------------------------|
| `slug`      | Stable key, e.g. `manic`, `depressive`           |
| `direction` | +1 or -1, used for wave graph scoring             |
| `sortOrder` | Display order                                    |

### Criterion
Individual diagnostic criteria within a pole. Maps directly to DSM-5 numbered criteria.

| Field           | Purpose                                      |
|-----------------|----------------------------------------------|
| `number`        | DSM criterion number (0=Gate, 1-9=criteria)  |
| `name`          | Human-readable name                          |
| `criterionType` | `GATE`, `CORE`, or `STANDARD`                |

**Criterion types:**
- **GATE** — Must be satisfied before counting other criteria (e.g., Criterion A for mania: elevated/irritable mood)
- **CORE** — At least one must be present (e.g., depressive criteria #1 depressed mood or #2 loss of interest)
- **STANDARD** — Normal counted criteria

### BehaviorDefinition
Observable behaviors that caregivers check off daily. Each belongs to a `FrameworkBehaviorCategory`.

| Field             | Purpose                                    |
|-------------------|--------------------------------------------|
| `itemKey`         | Stable string key (e.g. `very-little-sleep`) — used in `BehaviorCheck` records for backward compatibility |
| `label`           | Short display label                        |
| `description`     | Tooltip text explaining the behavior       |
| `isSafetyConcern` | Flags safety-critical behaviors            |

### BehaviorCriterionMapping
**Many-to-many** join between `BehaviorDefinition` and `Criterion`. A single behavior can satisfy criteria on multiple poles.

Example: `cant-focus` maps to both **manic B5** (distractibility) and **depressive #8** (diminished concentration).

### MoodDescriptorMapping
Maps the Quick Log mood selector values to framework effects.

| moodValue    | Effect                                           |
|--------------|--------------------------------------------------|
| `MANIC`      | Satisfies manic gate (Criterion A)               |
| `MIXED`      | Satisfies manic gate + adds depressive criterion #1 |
| `DEPRESSIVE` | Adds depressive criterion #1 (depressed mood)    |

### ClassificationRule
Defines thresholds for classifying a day. Evaluated in priority order (highest first).

| Field                 | Purpose                                    |
|-----------------------|--------------------------------------------|
| `classificationLabel` | Output label: `MANIC`, `DEPRESSIVE`, `MIXED` |
| `ruleType`            | `DSM5_FULL` or `SUBTHRESHOLD`              |
| `gateRequired`        | Must the gate criterion be met?            |
| `minStandardCriteria` | Minimum criteria count                     |
| `coreRequired`        | Must a core criterion be met?              |
| `gateOnlyAdjustment`  | +1 threshold if only irritable gate        |
| `minOppositeCriteria` | For mixed features detection               |
| `priority`            | Evaluation order (higher = first)          |

**DSM-5 Bipolar rules as stored:**
- Manic (DSM5_FULL): gate + 3 B criteria (4 if irritable-only)
- Manic (SUBTHRESHOLD): gate + 2 B criteria
- Depressive (DSM5_FULL): core + 5 criteria
- Depressive (SUBTHRESHOLD): core + 3 criteria
- Mixed: primary episode + 3 opposite-pole criteria

### EpisodeThreshold
Duration rules for detecting clinical episodes from consecutive day runs.

| Field                 | Purpose                                    |
|-----------------------|--------------------------------------------|
| `episodeLabel`        | `MANIC`, `HYPOMANIC`, `DEPRESSIVE`         |
| `confidenceLevel`     | `DSM5_MET` or `PRODROMAL_CONCERN`          |
| `minDays`             | Minimum consecutive days                   |
| `requiresDsmSymptoms` | Must daily symptoms meet full DSM criteria? |

**DSM-5 Bipolar thresholds as stored:**

| Episode     | Confidence        | Days | DSM Symptoms Required |
|-------------|-------------------|------|-----------------------|
| Manic       | DSM5_MET          | 7    | Yes                   |
| Hypomanic   | DSM5_MET          | 4    | Yes                   |
| Depressive  | DSM5_MET          | 14   | Yes                   |
| Manic       | PRODROMAL_CONCERN | 4    | No                    |
| Hypomanic   | PRODROMAL_CONCERN | 2    | No                    |
| Depressive  | PRODROMAL_CONCERN | 7    | No                    |
| Depressive  | PRODROMAL_CONCERN | 5    | No                    |

### SignalRule + SignalBehavior
Configurable early-warning pattern detection rules.

| Field                 | Purpose                                    |
|-----------------------|--------------------------------------------|
| `signalId`            | Stable key, e.g. `sleep-disruption`        |
| `windowDays`          | Lookback window                            |
| `minOccurrences`      | Minimum behavior hits to trigger           |
| `trendCompare`        | If true, compares first-half vs second-half of window |
| `trendMinLate`        | Minimum second-half count for trend signals |
| `descriptionTemplate` | Template with `{count}` and `{window}` placeholders |

`SignalBehavior` links each rule to the specific behaviors it watches.

### TenantFramework
Links tenants (tracking projects) to active frameworks. A tenant can have multiple frameworks active simultaneously (e.g., bipolar + ADHD).

## How Scoring Works

```
Entry → behaviorKeys[] + mood + impairments
         ↓
  Framework Loader (cached 5min)
         ↓
  For each behavior key:
    → Look up BehaviorDefinition
    → Get BehaviorCriterionMappings
    → Add criterion numbers to per-pole Sets (prevents double-counting)
    → Check criterionType: GATE sets gateMet, CORE sets coreMet
         ↓
  For mood descriptor:
    → Look up MoodDescriptorMappings
    → May satisfy gate and/or add criteria
         ↓
  Evaluate ClassificationRules (priority order):
    → Check gate, core, criteria count thresholds
    → First matching rule wins → classification label
         ↓
  DailyScore { criteriaCounts, classification, severity, waveScore, safetyConcern }
```

## Caching

Framework data is loaded once and cached in a module-scope `Map` with 5-minute TTL (`src/lib/analysis/framework-loader.ts`). On Vercel serverless, this survives warm invocations. Cold starts hit the database once — the query spans ~10 tables but only dozens of rows total, so it's fast.

## Adding a New Framework

1. Create a seed script (model after `scripts/seed-frameworks.ts`)
2. Define poles, criteria, behavior categories, behavior definitions, and criterion mappings
3. Add classification rules and episode thresholds
4. Add signal rules with behavior links
5. Run the seed script
6. Assign tenants via `TenantFramework` records
7. No code changes required — the generic scoring engine handles any framework shape
