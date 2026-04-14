-- ============================================================
-- Persisted Analysis: Tables and Triggers
-- Replaces compute-on-read in:
--   src/lib/analysis/episode-detection.ts
--   src/lib/analysis/prodrome-signals.ts
--   src/lib/analysis/pattern-prediction.ts
--   src/lib/analysis/caregiver-suggestions.ts
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. TABLES
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS episodes (
  id TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,               -- MANIC, HYPOMANIC, DEPRESSIVE, MIXED
  confidence TEXT NOT NULL,          -- DSM5_MET or PRODROMAL_CONCERN
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "dayCount" INT NOT NULL,
  "peakSeverity" TEXT NOT NULL,      -- NONE, MILD, MODERATE, SEVERE
  "averageWaveScore" FLOAT NOT NULL DEFAULT 0,
  "hasSafetyConcern" BOOLEAN NOT NULL DEFAULT FALSE,
  "criteriaNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT episodes_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS prodrome_signals (
  id TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  "signalId" TEXT NOT NULL,          -- e.g. sleep-disruption, mood-instability
  level TEXT NOT NULL,               -- INFO, WARNING, ALERT
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  "relatedDates" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT prodrome_signals_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS predictions (
  id TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                -- CYCLE, TREND, DAY_PATTERN, FORECAST
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence TEXT NOT NULL,          -- LOW, MEDIUM, HIGH
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT predictions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS suggestions (
  id TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category TEXT NOT NULL,            -- SAFETY, COMMUNICATION, ENVIRONMENT, SELF_CARE, CLINICAL
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL,            -- HIGH, MEDIUM, LOW
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT suggestions_pkey PRIMARY KEY (id)
);

-- ──────────────────────────────────────────────
-- 2. RLS POLICIES
-- ──────────────────────────────────────────────

ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "episodes_select_member" ON episodes
  FOR SELECT USING (is_tenant_member("tenantId"));

ALTER TABLE prodrome_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prodrome_signals_select_member" ON prodrome_signals
  FOR SELECT USING (is_tenant_member("tenantId"));

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "predictions_select_member" ON predictions
  FOR SELECT USING (is_tenant_member("tenantId"));

ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suggestions_select_member" ON suggestions
  FOR SELECT USING (is_tenant_member("tenantId"));

-- ──────────────────────────────────────────────
-- 3. EPISODE DETECTION FUNCTION
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION compute_episodes(p_tenant_id TEXT)
RETURNS VOID AS $$
DECLARE
  v_framework_id TEXT;
  v_run_start DATE;
  v_run_end DATE;
  v_prev_date DATE;
  v_prev_class TEXT;
  rec RECORD;
  day_rec RECORD;
  run_rec RECORD;
  v_day_gap INT;
  v_in_run BOOLEAN := FALSE;
BEGIN
  -- Find active framework
  SELECT tf."frameworkId" INTO v_framework_id
  FROM tenant_frameworks tf
  JOIN diagnostic_frameworks df ON df.id = tf."frameworkId"
  WHERE tf."tenantId" = p_tenant_id AND df."isActive" = true
  LIMIT 1;

  -- Clear existing episodes for this tenant
  DELETE FROM episodes WHERE "tenantId" = p_tenant_id;

  IF v_framework_id IS NULL THEN RETURN; END IF;

  -- Build scored entries into a temp table
  CREATE TEMP TABLE IF NOT EXISTS _scored_days (
    entry_date DATE,
    classification TEXT,
    severity TEXT,
    wave_score FLOAT,
    safety_concern BOOLEAN,
    criteria_counts JSONB  -- {"manic": 3, "depressive": 1}
  ) ON COMMIT DROP;
  TRUNCATE _scored_days;

  -- Populate from entries with stored computed values
  -- We need per-pole criteria counts — reconstruct from behavior keys
  INSERT INTO _scored_days (entry_date, classification, severity, wave_score, safety_concern, criteria_counts)
  SELECT
    e.date,
    COALESCE(e."computedMood", 'NEUTRAL'),
    -- Reconstruct severity from stored data
    CASE
      WHEN COALESCE(e."computedMood", 'NEUTRAL') = 'NEUTRAL' THEN 'NONE'
      ELSE 'MODERATE' -- simplified; full severity requires re-evaluation
    END,
    COALESCE(e."computedScore", 0),
    -- Safety concern
    COALESCE(e.impairments->>'SAFETY_CONCERN', 'NONE') != 'NONE',
    -- Per-pole criteria counts from behavior keys
    (
      SELECT COALESCE(jsonb_object_agg(pole_slug, cnt), '{}'::jsonb)
      FROM (
        SELECT cp.slug AS pole_slug, COUNT(DISTINCT c.number) AS cnt
        FROM jsonb_array_elements_text(COALESCE(e."behaviorKeys", '[]'::jsonb)) AS bk(key)
        JOIN behavior_definitions bd ON bd."itemKey" = bk.key
        JOIN framework_behavior_categories fbc ON fbc.id = bd."categoryId" AND fbc."frameworkId" = v_framework_id
        JOIN behavior_criterion_mappings bcm ON bcm."behaviorId" = bd.id
        JOIN criteria c ON c.id = bcm."criterionId"
        JOIN criterion_poles cp ON cp.id = c."poleId"
        WHERE c."criterionType" IN ('CORE', 'STANDARD')
        GROUP BY cp.slug
      ) sub
    )
  FROM entries e
  WHERE e."tenantId" = p_tenant_id
  ORDER BY e.date;

  -- Find runs of non-NEUTRAL days
  CREATE TEMP TABLE IF NOT EXISTS _runs (
    run_id SERIAL,
    start_date DATE,
    end_date DATE
  ) ON COMMIT DROP;
  TRUNCATE _runs;

  -- Identify runs allowing 2-day gaps
  DECLARE
    v_cur_start DATE := NULL;
    v_cur_end DATE := NULL;
  BEGIN
    FOR rec IN SELECT entry_date, classification FROM _scored_days ORDER BY entry_date LOOP
      IF rec.classification = 'NEUTRAL' THEN
        -- End current run if exists
        IF v_cur_start IS NOT NULL THEN
          INSERT INTO _runs (start_date, end_date) VALUES (v_cur_start, v_cur_end);
          v_cur_start := NULL;
          v_cur_end := NULL;
        END IF;
      ELSE
        IF v_cur_start IS NULL THEN
          -- Start new run
          v_cur_start := rec.entry_date;
          v_cur_end := rec.entry_date;
        ELSE
          -- Check gap
          IF (rec.entry_date - v_cur_end) <= 2 THEN
            v_cur_end := rec.entry_date;
          ELSE
            -- Gap too large, save current run, start new
            INSERT INTO _runs (start_date, end_date) VALUES (v_cur_start, v_cur_end);
            v_cur_start := rec.entry_date;
            v_cur_end := rec.entry_date;
          END IF;
        END IF;
      END IF;
    END LOOP;
    -- Save final run
    IF v_cur_start IS NOT NULL THEN
      INSERT INTO _runs (start_date, end_date) VALUES (v_cur_start, v_cur_end);
    END IF;
  END;

  -- Process each run
  FOR run_rec IN SELECT * FROM _runs LOOP
    DECLARE
      v_day_count INT;
      v_peak_severity TEXT := 'NONE';
      v_avg_wave FLOAT := 0;
      v_has_safety BOOLEAN := FALSE;
      v_pole_day_counts JSONB := '{}'::jsonb;
      v_any_day_meets_dsm JSONB := '{}'::jsonb;
      v_matched_poles JSONB := '{}'::jsonb;
      v_episode_type TEXT;
      v_episode_confidence TEXT;
      v_criteria_note TEXT;
      v_matched_count INT := 0;
      pole_rec RECORD;
      thresh_rec RECORD;
    BEGIN
      -- Count days in run (actual logged days, not calendar days)
      SELECT COUNT(*), COALESCE(AVG(wave_score), 0),
             BOOL_OR(safety_concern),
             MAX(CASE severity
               WHEN 'SEVERE' THEN 3 WHEN 'MODERATE' THEN 2
               WHEN 'MILD' THEN 1 ELSE 0 END)
      INTO v_day_count, v_avg_wave, v_has_safety, v_peak_severity
      FROM _scored_days
      WHERE entry_date BETWEEN run_rec.start_date AND run_rec.end_date
        AND classification != 'NEUTRAL';

      -- Map peak severity int back to text
      v_peak_severity := CASE v_peak_severity::INT
        WHEN 3 THEN 'SEVERE' WHEN 2 THEN 'MODERATE'
        WHEN 1 THEN 'MILD' ELSE 'NONE' END;

      IF v_day_count < 2 THEN CONTINUE; END IF;

      -- Count days per pole
      FOR pole_rec IN SELECT slug FROM criterion_poles WHERE "frameworkId" = v_framework_id LOOP
        DECLARE
          v_pole_days INT := 0;
        BEGIN
          SELECT COUNT(*) INTO v_pole_days
          FROM _scored_days sd
          WHERE sd.entry_date BETWEEN run_rec.start_date AND run_rec.end_date
            AND sd.classification != 'NEUTRAL'
            AND (
              sd.classification = 'MIXED'
              OR EXISTS (
                SELECT 1 FROM classification_rules cr
                JOIN criterion_poles cp ON cp.id = cr."poleId"
                WHERE cr."frameworkId" = v_framework_id
                  AND cp.slug = pole_rec.slug
                  AND cr."classificationLabel" = sd.classification
              )
            );

          v_pole_day_counts := v_pole_day_counts || jsonb_build_object(pole_rec.slug, v_pole_days);

          -- Check if any day meets DSM-5 threshold for this pole
          DECLARE
            v_dsm_met BOOLEAN := FALSE;
            v_full_rule RECORD;
          BEGIN
            SELECT cr."minStandardCriteria", cr."gateRequired", cr."coreRequired"
            INTO v_full_rule
            FROM classification_rules cr
            JOIN criterion_poles cp ON cp.id = cr."poleId"
            WHERE cr."frameworkId" = v_framework_id
              AND cp.slug = pole_rec.slug
              AND cr."ruleType" = 'DSM5_FULL'
              AND cr."mixedLabel" IS NULL
            LIMIT 1;

            IF v_full_rule IS NOT NULL THEN
              SELECT EXISTS(
                SELECT 1 FROM _scored_days sd
                WHERE sd.entry_date BETWEEN run_rec.start_date AND run_rec.end_date
                  AND COALESCE((sd.criteria_counts->>pole_rec.slug)::INT, 0) >= v_full_rule."minStandardCriteria"
              ) INTO v_dsm_met;
            ELSE
              SELECT EXISTS(
                SELECT 1 FROM _scored_days sd
                WHERE sd.entry_date BETWEEN run_rec.start_date AND run_rec.end_date
                  AND COALESCE((sd.criteria_counts->>pole_rec.slug)::INT, 0) >= 3
              ) INTO v_dsm_met;
            END IF;

            v_any_day_meets_dsm := v_any_day_meets_dsm || jsonb_build_object(pole_rec.slug, v_dsm_met);
          END;
        END;
      END LOOP;

      -- Evaluate episode thresholds
      FOR thresh_rec IN
        SELECT et."episodeLabel", et."confidenceLevel", et."minDays",
               et."requiresDsmSymptoms", cp.slug AS pole_slug
        FROM episode_thresholds et
        JOIN criterion_poles cp ON cp.id = et."poleId"
        WHERE et."frameworkId" = v_framework_id
        ORDER BY
          CASE WHEN et."confidenceLevel" = 'DSM5_MET' THEN 0 ELSE 1 END,
          et."minDays" DESC
      LOOP
        DECLARE
          v_pole_count INT;
          v_dsm_check BOOLEAN;
        BEGIN
          v_pole_count := COALESCE((v_pole_day_counts->>thresh_rec.pole_slug)::INT, 0);
          IF v_pole_count < thresh_rec."minDays" THEN CONTINUE; END IF;

          IF thresh_rec."requiresDsmSymptoms" THEN
            v_dsm_check := COALESCE((v_any_day_meets_dsm->>thresh_rec.pole_slug)::BOOLEAN, FALSE);
            IF NOT v_dsm_check THEN CONTINUE; END IF;
          END IF;

          -- Only take first match per pole
          IF NOT (v_matched_poles ? thresh_rec.pole_slug) THEN
            v_matched_poles := v_matched_poles || jsonb_build_object(
              thresh_rec.pole_slug,
              jsonb_build_object(
                'label', thresh_rec."episodeLabel",
                'confidence', thresh_rec."confidenceLevel",
                'days', v_pole_count
              )
            );
            v_matched_count := v_matched_count + 1;
          END IF;
        END;
      END LOOP;

      -- Build episode from matches
      IF v_matched_count >= 2 THEN
        -- Mixed episode
        v_episode_type := 'MIXED';
        v_episode_confidence := 'PRODROMAL_CONCERN';
        v_criteria_note := 'Mixed: ';

        DECLARE
          v_notes TEXT[] := '{}';
          v_key TEXT;
          v_val JSONB;
        BEGIN
          FOR v_key, v_val IN SELECT * FROM jsonb_each(v_matched_poles) LOOP
            IF v_val->>'confidence' = 'DSM5_MET' THEN
              v_episode_confidence := 'DSM5_MET';
            END IF;
            v_notes := array_append(v_notes,
              (SELECT name FROM criterion_poles WHERE "frameworkId" = v_framework_id AND slug = v_key) ||
              ': ' || (v_val->>'days') || ' days (' ||
              CASE WHEN v_val->>'confidence' = 'DSM5_MET' THEN 'DSM-5 met' ELSE 'prodromal' END || ')'
            );
          END LOOP;
          v_criteria_note := 'Mixed: ' || array_to_string(v_notes, '; ');
        END;

        INSERT INTO episodes (id, "tenantId", type, confidence, "startDate", "endDate",
          "dayCount", "peakSeverity", "averageWaveScore", "hasSafetyConcern", "criteriaNote")
        VALUES (gen_random_uuid()::TEXT, p_tenant_id, v_episode_type, v_episode_confidence,
          run_rec.start_date, run_rec.end_date, v_day_count, v_peak_severity,
          ROUND(v_avg_wave::NUMERIC, 1)::FLOAT, v_has_safety, v_criteria_note);

      ELSIF v_matched_count = 1 THEN
        DECLARE
          v_key TEXT;
          v_val JSONB;
          v_pole_name TEXT;
        BEGIN
          SELECT * INTO v_key, v_val FROM jsonb_each(v_matched_poles) LIMIT 1;
          SELECT name INTO v_pole_name FROM criterion_poles
            WHERE "frameworkId" = v_framework_id AND slug = v_key;

          v_episode_type := v_val->>'label';
          v_episode_confidence := v_val->>'confidence';

          IF v_episode_confidence = 'DSM5_MET' THEN
            v_criteria_note := (v_val->>'days') || ' days of ' || COALESCE(v_pole_name, v_key) ||
              ' symptoms meeting DSM-5 criteria';
          ELSE
            v_criteria_note := (v_val->>'days') || ' days of ' || COALESCE(v_pole_name, v_key) ||
              ' symptoms (prodromal concern)';
          END IF;

          INSERT INTO episodes (id, "tenantId", type, confidence, "startDate", "endDate",
            "dayCount", "peakSeverity", "averageWaveScore", "hasSafetyConcern", "criteriaNote")
          VALUES (gen_random_uuid()::TEXT, p_tenant_id, v_episode_type, v_episode_confidence,
            run_rec.start_date, run_rec.end_date, v_day_count, v_peak_severity,
            ROUND(v_avg_wave::NUMERIC, 1)::FLOAT, v_has_safety, v_criteria_note);
        END;
      END IF;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ──────────────────────────────────────────────
-- 4. PRODROME SIGNAL DETECTION FUNCTION
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION compute_prodrome_signals(p_tenant_id TEXT)
RETURNS VOID AS $$
DECLARE
  v_framework_id TEXT;
  rule_rec RECORD;
  v_count INT;
  v_early_count INT;
  v_late_count INT;
  v_related_dates JSONB;
BEGIN
  SELECT tf."frameworkId" INTO v_framework_id
  FROM tenant_frameworks tf
  JOIN diagnostic_frameworks df ON df.id = tf."frameworkId"
  WHERE tf."tenantId" = p_tenant_id AND df."isActive" = true
  LIMIT 1;

  DELETE FROM prodrome_signals WHERE "tenantId" = p_tenant_id;

  -- Framework-driven signal rules
  IF v_framework_id IS NOT NULL THEN
    FOR rule_rec IN
      SELECT sr."signalId", sr.title, sr."descriptionTemplate", sr.level,
             sr."windowDays", sr."minOccurrences", sr."trendCompare", sr."trendMinLate",
             ARRAY(
               SELECT bd."itemKey"
               FROM signal_behaviors sb
               JOIN behavior_definitions bd ON bd.id = sb."behaviorId"
               WHERE sb."signalRuleId" = sr.id
             ) AS behavior_keys
      FROM signal_rules sr
      WHERE sr."frameworkId" = v_framework_id
    LOOP
      IF rule_rec."trendCompare" THEN
        -- Trend mode: compare first half vs second half of double window
        WITH window_entries AS (
          SELECT e.date, e."behaviorKeys"
          FROM entries e
          WHERE e."tenantId" = p_tenant_id
          ORDER BY e.date DESC
          LIMIT rule_rec."windowDays" * 2
        ),
        ordered AS (
          SELECT *, ROW_NUMBER() OVER (ORDER BY date) AS rn,
                 COUNT(*) OVER () AS total
          FROM window_entries
        ),
        halves AS (
          SELECT date, "behaviorKeys",
            CASE WHEN rn <= total / 2 THEN 'early' ELSE 'late' END AS half
          FROM ordered
        )
        SELECT
          COALESCE(SUM(CASE WHEN half = 'early' AND EXISTS (
            SELECT 1 FROM jsonb_array_elements_text("behaviorKeys") bk
            WHERE bk = ANY(rule_rec.behavior_keys)
          ) THEN 1 ELSE 0 END), 0),
          COALESCE(SUM(CASE WHEN half = 'late' AND EXISTS (
            SELECT 1 FROM jsonb_array_elements_text("behaviorKeys") bk
            WHERE bk = ANY(rule_rec.behavior_keys)
          ) THEN 1 ELSE 0 END), 0),
          COALESCE(jsonb_agg(date ORDER BY date) FILTER (WHERE half = 'late'), '[]'::jsonb)
        INTO v_early_count, v_late_count, v_related_dates
        FROM halves;

        IF v_late_count >= rule_rec."trendMinLate" AND v_late_count > v_early_count THEN
          INSERT INTO prodrome_signals (id, "tenantId", "signalId", level, title, description, "relatedDates")
          VALUES (gen_random_uuid()::TEXT, p_tenant_id, rule_rec."signalId", rule_rec.level,
            rule_rec.title,
            REPLACE(REPLACE(rule_rec."descriptionTemplate",
              '{count}', v_late_count::TEXT),
              '{window}', (rule_rec."windowDays" * 2)::TEXT),
            v_related_dates);
        END IF;

      ELSE
        -- Simple mode: count occurrences in window
        WITH window_entries AS (
          SELECT e.date, e."behaviorKeys"
          FROM entries e
          WHERE e."tenantId" = p_tenant_id
          ORDER BY e.date DESC
          LIMIT rule_rec."windowDays"
        )
        SELECT
          COALESCE(SUM(CASE WHEN EXISTS (
            SELECT 1 FROM jsonb_array_elements_text("behaviorKeys") bk
            WHERE bk = ANY(rule_rec.behavior_keys)
          ) THEN 1 ELSE 0 END), 0),
          COALESCE(jsonb_agg(date ORDER BY date) FILTER (WHERE EXISTS (
            SELECT 1 FROM jsonb_array_elements_text("behaviorKeys") bk
            WHERE bk = ANY(rule_rec.behavior_keys)
          )), '[]'::jsonb)
        INTO v_count, v_related_dates
        FROM window_entries;

        IF v_count >= rule_rec."minOccurrences" THEN
          INSERT INTO prodrome_signals (id, "tenantId", "signalId", level, title, description, "relatedDates")
          VALUES (gen_random_uuid()::TEXT, p_tenant_id, rule_rec."signalId", rule_rec.level,
            rule_rec.title,
            REPLACE(REPLACE(rule_rec."descriptionTemplate",
              '{count}', v_count::TEXT),
              '{window}', rule_rec."windowDays"::TEXT),
            v_related_dates);
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Framework-independent: safety concern (last 7 days)
  DECLARE
    v_safety_count INT;
    v_safety_dates JSONB;
  BEGIN
    SELECT COUNT(*), COALESCE(jsonb_agg(e.date ORDER BY e.date), '[]'::jsonb)
    INTO v_safety_count, v_safety_dates
    FROM entries e
    WHERE e."tenantId" = p_tenant_id
      AND e.date >= CURRENT_DATE - 7
      AND e.impairments->>'SAFETY_CONCERN' IS NOT NULL
      AND e.impairments->>'SAFETY_CONCERN' != 'NONE';

    IF v_safety_count > 0 AND NOT EXISTS (
      SELECT 1 FROM prodrome_signals WHERE "tenantId" = p_tenant_id AND "signalId" = 'safety-concern'
    ) THEN
      INSERT INTO prodrome_signals (id, "tenantId", "signalId", level, title, description, "relatedDates")
      VALUES (gen_random_uuid()::TEXT, p_tenant_id, 'safety-concern', 'ALERT',
        'Safety concern detected',
        'References to death, self-harm, or safety concerns were logged on ' || v_safety_count ||
        ' recent day(s). Please discuss with a clinician.',
        v_safety_dates);
    END IF;
  END;

  -- Framework-independent: mood instability (3+ classification changes in 7 days)
  DECLARE
    v_changes INT := 0;
    v_prev_class TEXT := NULL;
    v_instability_dates JSONB;
    rec RECORD;
  BEGIN
    FOR rec IN
      SELECT e.date, COALESCE(e."computedMood", 'NEUTRAL') AS classification
      FROM entries e
      WHERE e."tenantId" = p_tenant_id AND e.date >= CURRENT_DATE - 7
      ORDER BY e.date
    LOOP
      IF v_prev_class IS NOT NULL
         AND rec.classification != v_prev_class
         AND rec.classification != 'NEUTRAL'
         AND v_prev_class != 'NEUTRAL' THEN
        v_changes := v_changes + 1;
      END IF;
      v_prev_class := rec.classification;
    END LOOP;

    IF v_changes >= 3 THEN
      SELECT COALESCE(jsonb_agg(e.date ORDER BY e.date), '[]'::jsonb) INTO v_instability_dates
      FROM entries e
      WHERE e."tenantId" = p_tenant_id AND e.date >= CURRENT_DATE - 7;

      INSERT INTO prodrome_signals (id, "tenantId", "signalId", level, title, description, "relatedDates")
      VALUES (gen_random_uuid()::TEXT, p_tenant_id, 'mood-instability', 'WARNING',
        'Rapid mood cycling',
        'Mood classification changed ' || v_changes || ' times in the last 7 days. Rapid cycling is a key prodromal indicator.',
        v_instability_dates);
    END IF;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ──────────────────────────────────────────────
-- 5. PATTERN PREDICTION FUNCTION
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION compute_predictions(p_tenant_id TEXT)
RETURNS VOID AS $$
DECLARE
  v_entry_count INT;
  v_day_names TEXT[] := ARRAY['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
BEGIN
  DELETE FROM predictions WHERE "tenantId" = p_tenant_id;

  SELECT COUNT(*) INTO v_entry_count
  FROM entries WHERE "tenantId" = p_tenant_id;

  IF v_entry_count < 7 THEN RETURN; END IF;

  -- ── Cycle length estimation ──
  DECLARE
    v_transitions RECORD[];
    v_transition_dates DATE[];
    v_avg_gap FLOAT;
    v_days_since_last INT;
    v_days_until_next INT;
    v_trans_count INT;
    rec RECORD;
    v_prev_class TEXT := NULL;
    v_prev_date DATE := NULL;
  BEGIN
    v_transition_dates := '{}';
    FOR rec IN
      SELECT e.date, COALESCE(e."computedMood", 'NEUTRAL') AS classification
      FROM entries e WHERE e."tenantId" = p_tenant_id ORDER BY e.date
    LOOP
      IF v_prev_class IS NOT NULL
         AND rec.classification != v_prev_class
         AND rec.classification != 'NEUTRAL'
         AND v_prev_class != 'NEUTRAL' THEN
        v_transition_dates := array_append(v_transition_dates, rec.date);
      END IF;
      IF rec.classification != 'NEUTRAL' THEN
        v_prev_class := rec.classification;
      END IF;
      v_prev_date := rec.date;
    END LOOP;

    v_trans_count := array_length(v_transition_dates, 1);
    IF v_trans_count IS NOT NULL AND v_trans_count >= 2 THEN
      -- Calculate average gap
      DECLARE
        v_total_gap INT := 0;
        v_gap_count INT := 0;
        i INT;
      BEGIN
        FOR i IN 2..v_trans_count LOOP
          v_total_gap := v_total_gap + (v_transition_dates[i] - v_transition_dates[i-1]);
          v_gap_count := v_gap_count + 1;
        END LOOP;

        IF v_gap_count > 0 THEN
          v_avg_gap := v_total_gap::FLOAT / v_gap_count;

          IF v_avg_gap >= 1 AND v_avg_gap <= 90 THEN
            v_days_since_last := CURRENT_DATE - v_transition_dates[v_trans_count];
            v_days_until_next := GREATEST(0, ROUND(v_avg_gap)::INT - v_days_since_last);

            INSERT INTO predictions (id, "tenantId", type, title, description, confidence)
            VALUES (gen_random_uuid()::TEXT, p_tenant_id, 'CYCLE',
              'Average cycle: ~' || ROUND(v_avg_gap)::INT || ' days between mood shifts',
              CASE WHEN v_days_until_next > 0
                THEN 'Based on ' || v_trans_count || ' observed transitions, a mood shift may occur in roughly ' ||
                     v_days_until_next || ' days. Continue monitoring closely.'
                ELSE 'The current phase has lasted longer than the average cycle (' ||
                     v_days_since_last || ' days vs ~' || ROUND(v_avg_gap)::INT ||
                     ' day average). A transition may be imminent.'
              END,
              CASE WHEN v_trans_count >= 4 THEN 'MEDIUM' ELSE 'LOW' END);
          END IF;
        END IF;
      END;
    END IF;
  END;

  -- ── Trend detection ──
  DECLARE
    v_recent_manic FLOAT;
    v_prior_manic FLOAT;
    v_recent_dep FLOAT;
    v_prior_dep FLOAT;
  BEGIN
    -- Last 3 days avg manic/depressive criteria
    WITH recent AS (
      SELECT COALESCE((
        SELECT SUM(COALESCE((criteria_counts->>cp.slug)::INT, 0))
        FROM criterion_poles cp
        WHERE cp."frameworkId" IN (
          SELECT tf."frameworkId" FROM tenant_frameworks tf
          JOIN diagnostic_frameworks df ON df.id = tf."frameworkId"
          WHERE tf."tenantId" = p_tenant_id AND df."isActive" = true
        ) AND cp.direction > 0
      ), 0) AS manic_count,
      COALESCE((
        SELECT SUM(COALESCE((criteria_counts->>cp.slug)::INT, 0))
        FROM criterion_poles cp
        WHERE cp."frameworkId" IN (
          SELECT tf."frameworkId" FROM tenant_frameworks tf
          JOIN diagnostic_frameworks df ON df.id = tf."frameworkId"
          WHERE tf."tenantId" = p_tenant_id AND df."isActive" = true
        ) AND cp.direction < 0
      ), 0) AS dep_count
      FROM _scored_days
      ORDER BY entry_date DESC LIMIT 3
    )
    SELECT AVG(manic_count), AVG(dep_count) INTO v_recent_manic, v_recent_dep FROM recent;

    -- Prior 4 days
    WITH prior AS (
      SELECT * FROM _scored_days ORDER BY entry_date DESC LIMIT 7 OFFSET 3
    )
    SELECT
      AVG(COALESCE((criteria_counts->>'manic')::INT, 0)),
      AVG(COALESCE((criteria_counts->>'depressive')::INT, 0))
    INTO v_prior_manic, v_prior_dep
    FROM (SELECT * FROM _scored_days ORDER BY entry_date DESC LIMIT 4 OFFSET 3) sub;

    -- Use simpler approach: read directly from _scored_days
    SELECT
      AVG(COALESCE((criteria_counts->>'manic')::FLOAT, 0)),
      AVG(COALESCE((criteria_counts->>'depressive')::FLOAT, 0))
    INTO v_recent_manic, v_recent_dep
    FROM (SELECT * FROM _scored_days ORDER BY entry_date DESC LIMIT 3) sub;

    SELECT
      AVG(COALESCE((criteria_counts->>'manic')::FLOAT, 0)),
      AVG(COALESCE((criteria_counts->>'depressive')::FLOAT, 0))
    INTO v_prior_manic, v_prior_dep
    FROM (SELECT * FROM _scored_days ORDER BY entry_date DESC LIMIT 4 OFFSET 3) sub;

    IF v_recent_manic >= 2 AND v_recent_manic > v_prior_manic * 1.5 THEN
      INSERT INTO predictions (id, "tenantId", type, title, description, confidence)
      VALUES (gen_random_uuid()::TEXT, p_tenant_id, 'TREND',
        'Manic symptoms escalating',
        'Manic criteria averaging ' || ROUND(v_recent_manic::NUMERIC, 1) || '/day over the last 3 days, up from ' ||
        ROUND(v_prior_manic::NUMERIC, 1) || '/day prior. This upward trend suggests the current episode may intensify.',
        CASE WHEN v_recent_manic >= 3 THEN 'HIGH' ELSE 'MEDIUM' END);

    ELSIF v_recent_dep >= 2 AND v_recent_dep > v_prior_dep * 1.5 THEN
      INSERT INTO predictions (id, "tenantId", type, title, description, confidence)
      VALUES (gen_random_uuid()::TEXT, p_tenant_id, 'TREND',
        'Depressive symptoms escalating',
        'Depressive criteria averaging ' || ROUND(v_recent_dep::NUMERIC, 1) || '/day over the last 3 days, up from ' ||
        ROUND(v_prior_dep::NUMERIC, 1) || '/day prior. Monitor closely for withdrawal and safety concerns.',
        CASE WHEN v_recent_dep >= 4 THEN 'HIGH' ELSE 'MEDIUM' END);

    ELSIF v_prior_manic >= 2 AND v_recent_manic < v_prior_manic * 0.5 AND v_recent_dep < 2 THEN
      INSERT INTO predictions (id, "tenantId", type, title, description, confidence)
      VALUES (gen_random_uuid()::TEXT, p_tenant_id, 'TREND',
        'Symptoms appear to be resolving',
        'Manic criteria dropped from ' || ROUND(v_prior_manic::NUMERIC, 1) || ' to ' ||
        ROUND(v_recent_manic::NUMERIC, 1) || '/day. The current episode may be subsiding — continue monitoring for a potential depressive swing.',
        'MEDIUM');

    ELSIF v_prior_dep >= 2 AND v_recent_dep < v_prior_dep * 0.5 AND v_recent_manic < 2 THEN
      INSERT INTO predictions (id, "tenantId", type, title, description, confidence)
      VALUES (gen_random_uuid()::TEXT, p_tenant_id, 'TREND',
        'Depressive symptoms easing',
        'Depressive criteria dropped from ' || ROUND(v_prior_dep::NUMERIC, 1) || ' to ' ||
        ROUND(v_recent_dep::NUMERIC, 1) || '/day. Watch for a potential rebound into elevated mood.',
        'MEDIUM');
    END IF;
  END;

  -- ── Day-of-week patterns ──
  IF v_entry_count >= 14 THEN
    DECLARE
      v_overall_avg FLOAT;
      dow_rec RECORD;
    BEGIN
      SELECT AVG(COALESCE((criteria_counts->>'manic')::FLOAT, 0) + COALESCE((criteria_counts->>'depressive')::FLOAT, 0))
      INTO v_overall_avg FROM _scored_days;

      FOR dow_rec IN
        SELECT EXTRACT(DOW FROM entry_date)::INT AS dow,
               AVG(COALESCE((criteria_counts->>'manic')::FLOAT, 0) + COALESCE((criteria_counts->>'depressive')::FLOAT, 0)) AS avg_criteria,
               COUNT(*) AS obs_count
        FROM _scored_days
        GROUP BY EXTRACT(DOW FROM entry_date)::INT
        HAVING COUNT(*) >= 2
      LOOP
        IF dow_rec.avg_criteria >= v_overall_avg * 2 AND dow_rec.avg_criteria >= 3 THEN
          INSERT INTO predictions (id, "tenantId", type, title, description, confidence)
          VALUES (gen_random_uuid()::TEXT, p_tenant_id, 'DAY_PATTERN',
            v_day_names[dow_rec.dow + 1] || 's tend to be harder',
            v_day_names[dow_rec.dow + 1] || 's average ' || ROUND(dow_rec.avg_criteria::NUMERIC, 1) ||
            ' total criteria vs ' || ROUND(v_overall_avg::NUMERIC, 1) || ' overall. Consider proactive support on ' ||
            v_day_names[dow_rec.dow + 1] || 's.',
            CASE WHEN dow_rec.obs_count >= 3 THEN 'MEDIUM' ELSE 'LOW' END);
        END IF;
      END LOOP;
    END;
  END IF;

  -- ── Forecast next state ──
  IF v_entry_count >= 5 THEN
    DECLARE
      v_dominant TEXT;
      v_dominant_count INT;
      v_first_half_avg FLOAT;
      v_second_half_avg FLOAT;
      v_trajectory TEXT;
      v_total_5 INT;
    BEGIN
      WITH recent5 AS (
        SELECT classification, criteria_counts, ROW_NUMBER() OVER (ORDER BY entry_date DESC) AS rn
        FROM _scored_days
        ORDER BY entry_date DESC LIMIT 5
      )
      SELECT classification, COUNT(*) INTO v_dominant, v_dominant_count
      FROM recent5
      WHERE classification != 'NEUTRAL'
      GROUP BY classification
      ORDER BY COUNT(*) DESC
      LIMIT 1;

      IF v_dominant IS NOT NULL AND v_dominant_count >= 3 THEN
        -- Calculate trajectory
        WITH recent5 AS (
          SELECT criteria_counts, ROW_NUMBER() OVER (ORDER BY entry_date DESC) AS rn
          FROM _scored_days
          ORDER BY entry_date DESC LIMIT 5
        )
        SELECT
          AVG(CASE WHEN rn >= 4 THEN COALESCE((criteria_counts->>'manic')::FLOAT, 0) + COALESCE((criteria_counts->>'depressive')::FLOAT, 0) END),
          AVG(CASE WHEN rn <= 2 THEN COALESCE((criteria_counts->>'manic')::FLOAT, 0) + COALESCE((criteria_counts->>'depressive')::FLOAT, 0) END)
        INTO v_first_half_avg, v_second_half_avg
        FROM recent5;

        v_trajectory := CASE
          WHEN v_second_half_avg > v_first_half_avg THEN 'intensifying'
          WHEN v_second_half_avg < v_first_half_avg THEN 'stabilizing'
          ELSE 'steady' END;

        INSERT INTO predictions (id, "tenantId", type, title, description, confidence)
        VALUES (gen_random_uuid()::TEXT, p_tenant_id, 'FORECAST',
          'Likely continued ' || LOWER(v_dominant) || ' pattern',
          v_dominant_count || ' of the last 5 days were classified as ' || LOWER(v_dominant) ||
          ', and the pattern appears to be ' || v_trajectory || '. ' ||
          CASE v_trajectory
            WHEN 'intensifying' THEN 'Extra vigilance is recommended.'
            WHEN 'stabilizing' THEN 'Symptoms may be easing, but continue monitoring.'
            ELSE 'Maintain current monitoring level.'
          END,
          CASE WHEN v_dominant_count >= 4 THEN 'HIGH' ELSE 'MEDIUM' END);
      END IF;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ──────────────────────────────────────────────
-- 6. CAREGIVER SUGGESTIONS FUNCTION
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION compute_suggestions(p_tenant_id TEXT)
RETURNS VOID AS $$
DECLARE
  v_manic_days INT;
  v_dep_days INT;
  v_has_safety BOOLEAN;
  v_has_safety_signal BOOLEAN;
  v_has_escalation BOOLEAN;
  v_has_sleep_signal BOOLEAN;
  v_has_irritability_signal BOOLEAN;
  v_has_instability_signal BOOLEAN;
  v_has_imminent_cycle BOOLEAN;
  v_priority_order INT := 0;
BEGIN
  DELETE FROM suggestions WHERE "tenantId" = p_tenant_id;

  -- Count recent manic/depressive days (last 7)
  SELECT
    COALESCE(SUM(CASE WHEN COALESCE("computedMood", 'NEUTRAL') IN ('MANIC', 'MIXED') THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN COALESCE("computedMood", 'NEUTRAL') IN ('DEPRESSIVE', 'MIXED') THEN 1 ELSE 0 END), 0),
    BOOL_OR(COALESCE(impairments->>'SAFETY_CONCERN', 'NONE') != 'NONE')
  INTO v_manic_days, v_dep_days, v_has_safety
  FROM entries
  WHERE "tenantId" = p_tenant_id AND date >= CURRENT_DATE - 7;

  -- Check signals
  SELECT EXISTS(SELECT 1 FROM prodrome_signals WHERE "tenantId" = p_tenant_id AND "signalId" = 'safety-concern')
  INTO v_has_safety_signal;

  SELECT EXISTS(SELECT 1 FROM prodrome_signals WHERE "tenantId" = p_tenant_id AND "signalId" = 'sleep-disruption')
  INTO v_has_sleep_signal;

  SELECT EXISTS(SELECT 1 FROM prodrome_signals WHERE "tenantId" = p_tenant_id AND "signalId" = 'escalating-irritability')
  INTO v_has_irritability_signal;

  SELECT EXISTS(SELECT 1 FROM prodrome_signals WHERE "tenantId" = p_tenant_id AND "signalId" = 'mood-instability')
  INTO v_has_instability_signal;

  -- Check predictions
  SELECT EXISTS(SELECT 1 FROM predictions WHERE "tenantId" = p_tenant_id
    AND type = 'TREND' AND (title LIKE '%escalating%'))
  INTO v_has_escalation;

  SELECT EXISTS(SELECT 1 FROM predictions WHERE "tenantId" = p_tenant_id
    AND type = 'CYCLE' AND description LIKE '%imminent%')
  INTO v_has_imminent_cycle;

  -- Safety (always first)
  IF v_has_safety OR v_has_safety_signal THEN
    INSERT INTO suggestions (id, "tenantId", category, title, description, priority)
    VALUES (gen_random_uuid()::TEXT, p_tenant_id, 'SAFETY', 'Safety concern — take action',
      'References to death or self-harm were logged recently. Secure the environment (medications, sharp objects). If there''s immediate danger, contact 988 (Suicide & Crisis Lifeline) or go to the nearest ER. Otherwise, contact the clinician as soon as possible.',
      'HIGH');
  END IF;

  -- Manic state
  IF v_manic_days >= 3 THEN
    INSERT INTO suggestions (id, "tenantId", category, title, description, priority) VALUES
    (gen_random_uuid()::TEXT, p_tenant_id, 'ENVIRONMENT', 'Reduce stimulation',
      'During manic phases, reduce environmental stimulation: dim lights in the evening, limit screen time, keep the household calm. Avoid power struggles — redirect rather than confront.', 'HIGH'),
    (gen_random_uuid()::TEXT, p_tenant_id, 'ENVIRONMENT', 'Protect sleep schedule',
      'Sleep disruption fuels mania. Enforce a consistent bedtime routine even if they resist. Remove devices from the bedroom. Consider melatonin if approved by their clinician.', 'HIGH'),
    (gen_random_uuid()::TEXT, p_tenant_id, 'COMMUNICATION', 'Use calm, brief language',
      'During elevated states, keep conversations short and clear. Avoid lengthy reasoning or emotional appeals. Use ''I notice'' statements instead of accusations. Pick your battles — address safety issues only.', 'MEDIUM');
  END IF;

  -- Depressive state
  IF v_dep_days >= 3 THEN
    INSERT INTO suggestions (id, "tenantId", category, title, description, priority) VALUES
    (gen_random_uuid()::TEXT, p_tenant_id, 'COMMUNICATION', 'Maintain gentle connection',
      'During depressive phases, be present without pressure. Sit nearby, offer food, suggest brief walks. Avoid ''cheer up'' or ''just try harder'' language. Validate their feelings: ''This is hard, and I''m here.''', 'HIGH'),
    (gen_random_uuid()::TEXT, p_tenant_id, 'ENVIRONMENT', 'Simplify daily expectations',
      'Lower the bar temporarily. Focus on basics: eating, hydration, minimal hygiene. School/social pressure can wait. Small accomplishments (getting dressed, eating a meal) are real wins during depressive episodes.', 'MEDIUM'),
    (gen_random_uuid()::TEXT, p_tenant_id, 'SELF_CARE', 'Check in on yourself',
      'Caring for a depressed teen is emotionally exhausting. Make sure you''re eating, sleeping, and reaching out to your own support system. Caregiver burnout helps no one.', 'MEDIUM');
  END IF;

  -- Escalation
  IF v_has_escalation THEN
    INSERT INTO suggestions (id, "tenantId", category, title, description, priority)
    VALUES (gen_random_uuid()::TEXT, p_tenant_id, 'CLINICAL', 'Consider contacting the clinician',
      'Symptoms are trending upward. If the teen has a psychiatrist or therapist, consider reaching out proactively rather than waiting for the next scheduled appointment. Share this report if helpful.', 'HIGH');
  END IF;

  -- Signal-based
  IF v_has_sleep_signal THEN
    INSERT INTO suggestions (id, "tenantId", category, title, description, priority)
    VALUES (gen_random_uuid()::TEXT, p_tenant_id, 'ENVIRONMENT', 'Prioritize sleep intervention',
      'Persistent sleep disruption is one of the strongest predictors of episode onset. Review sleep hygiene: consistent bedtime, no caffeine after noon, dark/cool room, no screens 1 hour before bed.', 'HIGH');
  END IF;

  IF v_has_irritability_signal THEN
    INSERT INTO suggestions (id, "tenantId", category, title, description, priority)
    VALUES (gen_random_uuid()::TEXT, p_tenant_id, 'COMMUNICATION', 'De-escalation strategies',
      'Irritability is increasing. Avoid matching their energy. Give space before engaging. Use a calm, low tone. If rage escalates, prioritize physical safety and wait for the storm to pass before discussing behavior.', 'HIGH');
  END IF;

  IF v_has_instability_signal THEN
    INSERT INTO suggestions (id, "tenantId", category, title, description, priority)
    VALUES (gen_random_uuid()::TEXT, p_tenant_id, 'CLINICAL', 'Increase logging detail',
      'Mood is shifting rapidly. Try to log entries daily and note the time of day when shifts happen. This data is extremely valuable for clinicians trying to distinguish bipolar from other conditions.', 'MEDIUM');
  END IF;

  IF v_has_imminent_cycle THEN
    INSERT INTO suggestions (id, "tenantId", category, title, description, priority)
    VALUES (gen_random_uuid()::TEXT, p_tenant_id, 'ENVIRONMENT', 'Prepare for a mood transition',
      'Based on past patterns, a mood shift may be approaching. Stock up on easy meals, clear the schedule of non-essentials, and make sure support contacts are fresh in your phone.', 'MEDIUM');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ──────────────────────────────────────────────
-- 7. ORCHESTRATOR: runs all analysis after entry save
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION run_tenant_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- Daily scoring is handled by the BEFORE trigger (compute_daily_score)
  -- This AFTER trigger runs the tenant-wide analysis
  PERFORM compute_episodes(NEW."tenantId");
  PERFORM compute_prodrome_signals(NEW."tenantId");
  PERFORM compute_predictions(NEW."tenantId");
  PERFORM compute_suggestions(NEW."tenantId");
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_run_tenant_analysis ON entries;

CREATE TRIGGER trg_run_tenant_analysis
  AFTER INSERT OR UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION run_tenant_analysis();
