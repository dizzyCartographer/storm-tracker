# Signals, Predictions & Suggestions

This document describes how Storm Tracker generates early-warning signals, pattern predictions, and caregiver suggestions. All are computed at write time and persisted to dedicated tables — read paths never compute.

---

## 1. Prodrome Signal Detection

**Source:** `src/lib/analysis/prodrome-signals.ts`
**Persisted to:** `prodrome_signals` table
**Recomputed:** On every entry save for the tenant

Prodrome signals detect early-warning patterns that may precede a full mood episode. They come from two sources: framework-driven rules and generic (framework-independent) patterns.

### Framework-Driven Signals

Configured via `signal_rules` and `signal_behaviors` tables. Each rule specifies:

| Field | Purpose |
|-------|---------|
| `signalId` | Stable key (e.g., `sleep-disruption`) |
| `windowDays` | How many days to look back |
| `minOccurrences` | How many behavior hits to trigger |
| `trendCompare` | If true, compares first half vs second half of window |
| `trendMinLate` | Minimum second-half count for trend signals |
| `descriptionTemplate` | Template with `{count}` and `{window}` placeholders |
| `level` | INFO, WARNING, or ALERT |

**Two evaluation modes:**

**Simple mode** (`trendCompare = false`):
- Look back `windowDays` days
- Count occurrences of linked behavior keys
- Accept if `count >= minOccurrences`

**Trend mode** (`trendCompare = true`):
- Double the window. Split into first half and second half.
- Count behavior key occurrences in each half.
- Accept if: `lateCount >= trendMinLate` AND `lateCount > earlyCount`
- This detects *worsening* patterns, not just presence.

### Framework-Independent Signals

These fire regardless of which diagnostic framework is active:

**Withdrawal trend:**
- Window: 14 days, split in half
- For negative-direction poles (depressive): if second-half average criteria >= 3 AND >= 1.5x first half
- Level: WARNING

**Safety concern:**
- Any safety flag in last 7 days not already covered by a framework signal rule
- Level: ALERT

**Mood instability:**
- >= 3 classification changes (non-NEUTRAL to different non-NEUTRAL) in last 7 days
- Level: WARNING

### Signal Output

Each signal produces:

| Field | Content |
|-------|---------|
| `signalId` | Rule identifier |
| `level` | INFO, WARNING, or ALERT |
| `title` | Human-readable title |
| `description` | Explanation with counts and dates |
| `relatedDates` | JSONB array of dates that contributed |

Sorted by priority: ALERT first, then WARNING, then INFO.

---

## 2. Pattern Prediction

**Source:** `src/lib/analysis/pattern-prediction.ts`
**Persisted to:** `predictions` table
**Recomputed:** On every entry save

Four prediction types, each requiring minimum data thresholds:

### Cycle Length

- Identifies mood transitions (consecutive days where non-NEUTRAL classification changes)
- Needs >= 3 transitions (first 2 skipped as calibration)
- Averages the gap between transitions. Rejects if < 1 or > 90 days.
- **Confidence:** MEDIUM if >= 4 transitions, LOW otherwise
- **Forecast:** Days since last transition vs average gap — predicts when next shift is likely

### Trend Detection

Compares last 3 days vs preceding 4 days (average criteria counts per pole):

| Pattern | Condition | Confidence |
|---------|-----------|------------|
| Escalating manic | Recent avg >= 2 AND > prior x 1.5 | HIGH if >= 3, else MEDIUM |
| Escalating depressive | Recent avg >= 2 AND > prior x 1.5 | HIGH if >= 4, else MEDIUM |
| Resolving manic | Prior avg >= 2 AND recent < prior x 0.5 AND recent depressive < 2 | MEDIUM |
| Resolving depressive | Prior avg >= 2 AND recent < prior x 0.5 AND recent manic < 2 | MEDIUM |

### Day-of-Week Patterns

- Requires >= 14 days of data
- Total criteria count per day of week vs overall average
- Flags if day avg >= overall x 2 AND >= 3
- **Confidence:** MEDIUM if >= 3 observations, else LOW

### Forecast Next State

- Requires >= 5 days. Analyzes last 5 days.
- Dominant classification = most frequent, must be >= 3 of 5, not NEUTRAL
- Trajectory: compare avg criteria of first 2 days vs last 2 days
  - Intensifying / stabilizing / steady
- **Confidence:** HIGH if dominant >= 4 of 5, else MEDIUM

### Prediction Output

| Field | Content |
|-------|---------|
| `type` | CYCLE, TREND, DAY_PATTERN, or FORECAST |
| `title` | Human-readable title |
| `description` | Explanation |
| `confidence` | LOW, MEDIUM, or HIGH |

---

## 3. Caregiver Suggestions

**Source:** `src/lib/analysis/caregiver-suggestions.ts`
**Persisted to:** `suggestions` table
**Recomputed:** On every entry save

Suggestions are reactive to the current state — they read from daily scores, signals, predictions, and behavior data to generate actionable tips.

### Trigger Matrix

| Trigger | Category | Priority | Suggestion |
|---------|----------|----------|------------|
| Safety concern or safety signal | SAFETY | HIGH | Secure environment, contact 988 or clinician |
| >= 3 manic days in last 7 | ENVIRONMENT | HIGH | Reduce stimulation |
| >= 3 manic days in last 7 | ENVIRONMENT | HIGH | Protect sleep schedule |
| >= 3 manic days in last 7 | COMMUNICATION | MEDIUM | Use calm, brief language |
| >= 3 depressive days in last 7 | COMMUNICATION | HIGH | Maintain gentle connection |
| >= 3 depressive days in last 7 | ENVIRONMENT | MEDIUM | Simplify daily expectations |
| >= 3 depressive days in last 7 | SELF_CARE | MEDIUM | Check in on yourself (caregiver burnout) |
| Escalation trend prediction | CLINICAL | HIGH | Contact clinician proactively |
| Sleep disruption signal | ENVIRONMENT | HIGH | Prioritize sleep intervention |
| Escalating irritability signal | COMMUNICATION | HIGH | De-escalation strategies |
| Mood instability signal | CLINICAL | MEDIUM | Increase logging detail |
| Imminent cycle transition | ENVIRONMENT | MEDIUM | Prepare for mood transition |

### Suggestion Output

| Field | Content |
|-------|---------|
| `category` | SAFETY, COMMUNICATION, ENVIRONMENT, SELF_CARE, or CLINICAL |
| `title` | Short actionable title |
| `description` | Detailed guidance |
| `priority` | HIGH, MEDIUM, or LOW |

### Important Constraints

Per the app's liability framework:
- Suggestions are **emotional support and parenting guidance only**
- **No treatment advice or dosage recommendations**
- Predictive features framed as **preparation support**, not clinical authority
- Language: "you may want to prepare" / "consider coping strategies" — never "you should" / "your child needs"

---

## Dependency Chain

```
Entry saved
  |
  v
Daily Score Engine (compute_daily_score trigger)
  |
  v
Episode Detection ── uses daily scores across date range
Prodrome Signals ─── uses daily scores + behavior keys
  |
  v
Pattern Prediction ── uses daily scores
  |
  v
Caregiver Suggestions ── uses scores + signals + predictions
```

All modules depend on the diagnostic framework data. Daily scoring is the foundation — everything else consumes its output.

---

## Persistence Model

On every entry save, the application:
1. Upserts the entry with computed mood/score (via Postgres trigger)
2. Runs episode detection → replaces all `episodes` rows for the tenant
3. Runs prodrome signal detection → replaces all `prodrome_signals` rows
4. Runs prediction generation → replaces all `predictions` rows
5. Runs suggestion generation → replaces all `suggestions` rows

Mobile and web read from these tables directly. No computation on read paths.
