-- Rig-local compatibility port of compute_predictions() (build-spec §5.1, finding F23).
-- The committed migration 20260407_analysis_tables_and_triggers declares
-- `v_transitions RECORD[]` — a pseudo-type Postgres rejects at compile time, so the
-- committed file cannot apply as-is. The 2026-04-07 work log records this exact error
-- being fixed live via psql; the fixed version was never committed (repo/prod drift).
-- This file is the migration text VERBATIM minus that single dead declaration
-- (the variable is never referenced — the code uses v_transition_dates DATE[]).
-- ⚠️ Provisional until M0-6 diffs it against the production function definition.

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
