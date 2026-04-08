# Scoring & Analysis Logic

_Documents all computation that currently lives in TypeScript (`src/lib/analysis/`) and must migrate to Postgres triggers/functions. This is the source of truth for what the Postgres implementation must replicate._

## Migration Status

| Module | Current | Target | Status |
|--------|---------|--------|--------|
| Daily scoring | TypeScript, persisted at write | Postgres trigger on entry insert/update | ⬜ Not started |
| Episode detection | TypeScript, computed on read | Postgres function → `episodes` table | ⬜ Not started |
| Prodrome signals | TypeScript, computed on read | Postgres function → `prodrome_signals` table | ⬜ Not started |
| Pattern prediction | TypeScript, computed on read | Postgres function → `predictions` table | ⬜ Not started |
| Caregiver suggestions | TypeScript, computed on read | Postgres function → `suggestions` table | ⬜ Not started |
| Framework loader | TypeScript + Prisma + 5min cache | Eliminated — Postgres functions query framework tables directly | ⬜ Not started |

---

## 1. Daily Score Engine

**Source:** `src/lib/analysis/daily-score.ts`

**Input:**
- `behaviorKeys: string[]` — behavior item keys checked for the day
- `mood: string` — mood descriptor (e.g., "euphoric", "irritable", "sad")
- `dayQuality: string` — overall day quality (not currently processed)
- `impairments: Record<string, string>` — domain → severity ("NONE" / "PRESENT" / "SEVERE")

**Output:**
- `classification: string` — "MANIC", "DEPRESSIVE", "MIXED", "NEUTRAL" (or subthreshold variants)
- `ruleType: string` — which classification rule matched ("DSM5_FULL", "SUBTHRESHOLD", "NONE")
- `waveScore: number` — net directional score (manic positive, depressive negative)
- `severity: string` — "NONE", "MILD", "MODERATE", "SEVERE"
- `safetyConcern: boolean` — whether safety concerns flagged
- `criteriaCounts: Record<string, number>` — criteria met per pole
- `gateMet: Record<string, boolean>` — gate criterion met per pole
- `coreMet: Record<string, boolean>` — core criterion met per pole

**Algorithm:**

1. **Initialize** per-pole tracking: `criteriaSets` (Set of criterion numbers to prevent double-counting), `gateMet`, `coreMet` flags.

2. **Process behavior mappings.** For each behavior key:
   - Look up in framework's behavior map
   - For each criterion mapping on that behavior:
     - GATE type → set `gateMet[pole] = true`
     - CORE type → set `coreMet[pole] = true`, add criterion number to set
     - STANDARD type → add criterion number to set
   - Track if behavior is `isSafetyConcern`

3. **Process mood descriptor mappings.** For each mood mapping in framework:
   - If `moodValue` matches input mood:
     - If `satisfiesGate` → set `gateMet[pole] = true`
     - If `addsCriterionNumber` → add to criterion set, mark CORE if applicable

4. **Detect core criteria.** Scan all criterion mappings to see if any criterion in the accumulated sets is CORE type. If yes, set `coreMet[pole] = true`.

5. **Safety concern.** If `impairments["SAFETY_CONCERN"]` is not "NONE" → `safetyConcern = true`.

6. **Apply classification rules** (sorted by priority descending, first match wins):
   - For each rule, evaluate:
     - Gate check: if `gateRequired && !gateMet[pole]` → skip
     - Core check: if `coreRequired && !coreMet[pole]` → skip
     - Threshold: start with `minStandardCriteria`. If `gateOnlyAdjustment > 0` and gate met, add the adjustment (handles irritable-only vs euphoric gates needing different criteria counts)
     - Accept if `criteriaCounts[pole] >= threshold`
   - For mixed rules: also check `minOppositeCriteria` on opposite pole

7. **Subthreshold fallback.** If no rule matched (classification still "NEUTRAL"):
   - Check SUBTHRESHOLD rules
   - If 2+ poles have subthreshold match → "MIXED"
   - If 1 pole → use that pole's classification

8. **Severity:**
   - NEUTRAL → "NONE"
   - DSM5_FULL rule matched → "SEVERE" if ≥2 severe impairments, else "MODERATE"
   - Otherwise → "MODERATE" if ≥1 severe impairment OR ≥3 criteria, else "MILD"

9. **Wave score:** For each pole: `waveScore += pole.direction × criteriaCounts[pole]`. Direction is typically +1 for manic, -1 for depressive.

**Currently persisted at write time as `computedMood` and `computedScore` on the entry row.** ✅

---

## 2. Episode Detection

**Source:** `src/lib/analysis/episode-detection.ts`

**Input:**
- Array of `{date, score}` (daily scores sorted by date)
- Framework with episode thresholds

**Output per episode:**
- `type` — MANIC, HYPOMANIC, DEPRESSIVE, MIXED
- `confidence` — DSM5_MET or PRODROMAL_CONCERN
- `startDate`, `endDate`
- `dayCount`
- `peakSeverity`
- `averageWaveScore`
- `hasSafetyConcern`
- `criteriaNote` — human-readable explanation

**Algorithm:**

1. **Sort days** by date ascending.

2. **Find runs** of consecutive non-NEUTRAL days:
   - Allow up to 2-day gaps for missed logging
   - Skip runs shorter than 2 days

3. **Characterize each run:**
   - Count days per pole from classifications (MIXED counts toward all poles)
   - Check if any day meets DSM-5 symptom thresholds per pole (uses DSM5_FULL classification rules)

4. **Evaluate episode thresholds** (from framework, sorted DSM5_MET first, then by minDays descending):
   - Check `poleDayCounts[pole] >= threshold.minDays`
   - If `requiresDsmSymptoms`, verify at least one day met full DSM-5 criteria
   - Take first (best) match per pole

5. **Classify:**
   - 2+ poles matched → MIXED episode. Confidence = DSM5_MET if any pole has it.
   - 1 pole matched → use threshold's episodeLabel and confidence.

6. **Peak severity** = highest across all days in run.
7. **Average wave score** = mean of daily waveScores, rounded to 1 decimal.

**NOT persisted — recomputed on every read.** ❌

---

## 3. Prodrome Signal Detection

**Source:** `src/lib/analysis/prodrome-signals.ts`

**Input:**
- Daily scores
- Behavior keys by date (`Map<string, string[]>`)
- Framework (optional)

**Output per signal:**
- `id` — unique identifier
- `level` — INFO, WARNING, or ALERT
- `title`
- `description`
- `relatedDates`

**Framework-driven signals:**

- **Trend mode** (`trendCompare = true`):
  - Double the window. Split into first half and second half.
  - Count behavior key occurrences in each half.
  - Accept if: `lateCount >= trendMinLate` AND `lateCount > earlyCount`

- **Simple mode** (`trendCompare = false`):
  - Single window of `windowDays`.
  - Count behavior key occurrences.
  - Accept if: `count >= minOccurrences`

**Generic signals (framework-independent):**

- **Withdrawal trend:** Last 14 days split in half. For negative-direction poles, if second half average criteria ≥ 3 AND ≥ 1.5x first half → WARNING.

- **Safety concern:** Any safety flag in last 7 days not already covered by framework rule → ALERT.

- **Mood instability:** ≥3 classification changes (non-NEUTRAL to different non-NEUTRAL) in last 7 days → WARNING.

**Sorted by priority:** ALERT first, then WARNING, then INFO.

**NOT persisted.** ❌

---

## 4. Pattern Prediction

**Source:** `src/lib/analysis/pattern-prediction.ts`

**Input:** Historical daily scores (minimum 7 days for most predictions)

**Output per prediction:**
- `id`
- `type` — CYCLE, TREND, DAY_PATTERN, or FORECAST
- `title`
- `description`
- `confidence` — LOW, MEDIUM, or HIGH

**Four prediction types:**

### Cycle Length
- Identify transitions (consecutive days where non-NEUTRAL classification changes)
- Need at least 3 transitions (skip first 2)
- Average gap between transitions. Reject if < 1 or > 90 days.
- Confidence: MEDIUM if ≥4 transitions, LOW otherwise.
- Forecast: days since last transition vs average gap → predict next shift timing.

### Trend Detection
- Compare last 3 days vs preceding 4 days.
- Average manic and depressive criteria counts in each window.
- **Escalating manic:** recent avg ≥ 2 AND > prior × 1.5. HIGH if ≥ 3, else MEDIUM.
- **Escalating depressive:** recent avg ≥ 2 AND > prior × 1.5. HIGH if ≥ 4, else MEDIUM.
- **Resolving manic:** prior avg ≥ 2 AND recent < prior × 0.5 AND recent depressive < 2.
- **Resolving depressive:** prior avg ≥ 2 AND recent < prior × 0.5 AND recent manic < 2.

### Day-of-Week Patterns
- Require ≥14 days of data.
- Total criteria count per day of week vs overall average.
- Flag if day avg ≥ overall × 2 AND ≥ 3. MEDIUM if ≥3 observations, else LOW.

### Forecast Next State
- Require ≥5 days. Analyze last 5 days.
- Dominant classification = most frequent, must be ≥3 of 5, not NEUTRAL.
- Trajectory: compare avg criteria of first 2 days vs last 2 days → intensifying / stabilizing / steady.
- HIGH confidence if dominant ≥4 of 5, else MEDIUM.

**NOT persisted.** ❌

---

## 5. Caregiver Suggestions

**Source:** `src/lib/analysis/caregiver-suggestions.ts`

**Input:** Daily scores + signals + predictions + behaviors by date

**Output per suggestion:**
- `id`
- `category` — SAFETY, COMMUNICATION, ENVIRONMENT, SELF_CARE, CLINICAL
- `title`
- `description`
- `priority` — HIGH, MEDIUM, LOW

**Logic (reactive to current state):**

| Trigger | Category | Priority | Suggestion |
|---------|----------|----------|------------|
| Safety concern or safety signal | SAFETY | HIGH | Secure environment, contact 988 or clinician |
| ≥3 manic days in last 7 | ENVIRONMENT | HIGH | Reduce stimulation |
| ≥3 manic days in last 7 | ENVIRONMENT | HIGH | Protect sleep schedule |
| ≥3 manic days in last 7 | COMMUNICATION | MEDIUM | Use calm, brief language |
| ≥3 depressive days in last 7 | COMMUNICATION | HIGH | Maintain gentle connection |
| ≥3 depressive days in last 7 | ENVIRONMENT | MEDIUM | Simplify daily expectations |
| ≥3 depressive days in last 7 | SELF_CARE | MEDIUM | Check in on yourself (caregiver burnout) |
| Escalation trend prediction | CLINICAL | HIGH | Contact clinician proactively |
| Sleep disruption signal | ENVIRONMENT | HIGH | Prioritize sleep intervention |
| Escalating irritability signal | COMMUNICATION | HIGH | De-escalation strategies |
| Mood instability signal | CLINICAL | MEDIUM | Increase logging detail |
| Imminent cycle transition | ENVIRONMENT | MEDIUM | Prepare for mood transition |

**NOT persisted.** ❌

---

## 6. Framework Loader

**Source:** `src/lib/analysis/framework-loader.ts`

Loads all diagnostic framework data from 11 database tables into a single `LoadedFramework` structure. Used by all other modules. Has a 5-minute in-memory cache.

**Key data structures loaded:**
- Poles (manic/depressive with direction +1/-1)
- Behaviors with criterion mappings (which pole/criterion each behavior satisfies)
- Classification rules (priority-ordered, with gate/core/threshold requirements)
- Episode thresholds (min days, confidence level, DSM symptom requirements)
- Signal rules (window size, behavior keys, trend vs simple mode)
- Mood descriptor mappings (which moods satisfy gates or add criteria)

**In Postgres:** This module is eliminated entirely. Triggers/functions query the framework tables directly — no caching layer needed since the data is local to the database.

---

## Dependencies Between Modules

```
Framework Loader
      ↓
Daily Score Engine  ←  entry write triggers this
      ↓
Episode Detection   ←  uses daily scores across date range
Prodrome Signals    ←  uses daily scores + behavior keys
      ↓
Pattern Prediction  ←  uses daily scores
      ↓
Caregiver Suggestions  ←  uses scores + signals + predictions
```

All modules depend on the framework data. Daily scoring is the foundation — everything else consumes its output.
