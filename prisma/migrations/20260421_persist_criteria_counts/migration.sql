-- ============================================================
-- ST-074: Persist per-pole criteria counts on entries
--
-- The scoring trigger already builds per-pole criteria counts
-- internally (_criteria_sets + _pole_data) but only persists the
-- aggregate wave score. This migration persists the per-pole
-- counts so reports can display them without recomputing on read.
-- ============================================================

-- 1. Add the new column (nullable; backfill handled separately)
ALTER TABLE "entries"
  ADD COLUMN IF NOT EXISTS "computedCriteriaCounts" JSONB;

-- 2. Replace the scoring trigger function so new writes populate it
CREATE OR REPLACE FUNCTION compute_daily_score()
RETURNS TRIGGER AS $$
DECLARE
  v_framework_id TEXT;
  v_behavior_keys TEXT[];
  v_mood TEXT;
  v_impairments JSONB;
  v_classification TEXT := 'NEUTRAL';
  v_rule_type TEXT := 'NONE';
  v_wave_score FLOAT := 0;
  v_safety_concern BOOLEAN := FALSE;
  v_criteria_counts JSONB;
  rec RECORD;
  rule_rec RECORD;
  v_pole_slug TEXT;
  v_threshold INT;
  v_pole_count INT;
  v_severe_impairments INT := 0;
  v_max_criteria INT := 0;
  v_severity TEXT := 'NONE';
  v_matched BOOLEAN := FALSE;
  v_subthreshold_poles TEXT[] := '{}';
BEGIN
  v_behavior_keys := ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW."behaviorKeys", '[]'::jsonb)));
  v_mood := NEW.mood::TEXT;
  v_impairments := COALESCE(NEW.impairments, '{}'::jsonb);

  -- No behaviors checked → neutral, clear all computed fields
  IF array_length(v_behavior_keys, 1) IS NULL OR array_length(v_behavior_keys, 1) = 0 THEN
    NEW."computedMood" := NULL;
    NEW."computedScore" := NULL;
    NEW."computedCriteriaCounts" := NULL;
    RETURN NEW;
  END IF;

  SELECT tf."frameworkId" INTO v_framework_id
  FROM "tenant_frameworks" tf
  JOIN "diagnostic_frameworks" df ON df.id = tf."frameworkId"
  WHERE tf."tenantId" = NEW."tenantId"
    AND df."isActive" = true
  LIMIT 1;

  -- No framework → neutral, clear all computed fields
  IF v_framework_id IS NULL THEN
    NEW."computedMood" := NULL;
    NEW."computedScore" := NULL;
    NEW."computedCriteriaCounts" := NULL;
    RETURN NEW;
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS _pole_data (
    pole_slug TEXT,
    pole_direction INT,
    gate_met BOOLEAN DEFAULT FALSE,
    core_met BOOLEAN DEFAULT FALSE
  ) ON COMMIT DROP;

  CREATE TEMP TABLE IF NOT EXISTS _criteria_sets (
    pole_slug TEXT,
    criterion_number INT,
    UNIQUE (pole_slug, criterion_number)
  ) ON COMMIT DROP;

  TRUNCATE _pole_data;
  TRUNCATE _criteria_sets;

  INSERT INTO _pole_data (pole_slug, pole_direction)
  SELECT cp.slug, cp.direction
  FROM "criterion_poles" cp
  WHERE cp."frameworkId" = v_framework_id;

  FOR rec IN
    SELECT
      bd."itemKey",
      bd."isSafetyConcern",
      cp.slug AS pole_slug,
      c.number AS criterion_number,
      c."criterionType"
    FROM "behavior_definitions" bd
    JOIN "behavior_criterion_mappings" bcm ON bcm."behaviorId" = bd.id
    JOIN "criteria" c ON c.id = bcm."criterionId"
    JOIN "criterion_poles" cp ON cp.id = c."poleId"
    JOIN "framework_behavior_categories" fbc ON fbc.id = bd."categoryId"
    WHERE fbc."frameworkId" = v_framework_id
      AND bd."itemKey" = ANY(v_behavior_keys)
  LOOP
    IF rec."isSafetyConcern" THEN
      v_safety_concern := TRUE;
    END IF;

    IF rec."criterionType" = 'GATE' THEN
      UPDATE _pole_data SET gate_met = TRUE WHERE pole_slug = rec.pole_slug;
    END IF;

    IF rec."criterionType" = 'CORE' THEN
      UPDATE _pole_data SET core_met = TRUE WHERE pole_slug = rec.pole_slug;
    END IF;

    IF rec."criterionType" IN ('CORE', 'STANDARD') THEN
      INSERT INTO _criteria_sets (pole_slug, criterion_number)
      VALUES (rec.pole_slug, rec.criterion_number)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  FOR rec IN
    SELECT
      mdm."satisfiesGate",
      cp.slug AS pole_slug,
      c.number AS adds_criterion_number,
      cp2.slug AS adds_criterion_pole_slug,
      c."criterionType" AS adds_criterion_type
    FROM "mood_descriptor_mappings" mdm
    LEFT JOIN "criterion_poles" cp ON cp.id = mdm."poleId"
    LEFT JOIN "criteria" c ON c.id = mdm."addsCriterionId"
    LEFT JOIN "criterion_poles" cp2 ON cp2.id = c."poleId"
    WHERE mdm."frameworkId" = v_framework_id
      AND mdm."moodValue" = v_mood
  LOOP
    IF rec."satisfiesGate" AND rec.pole_slug IS NOT NULL THEN
      UPDATE _pole_data SET gate_met = TRUE WHERE pole_slug = rec.pole_slug;
    END IF;

    IF rec.adds_criterion_number IS NOT NULL AND rec.adds_criterion_pole_slug IS NOT NULL THEN
      INSERT INTO _criteria_sets (pole_slug, criterion_number)
      VALUES (rec.adds_criterion_pole_slug, rec.adds_criterion_number)
      ON CONFLICT DO NOTHING;

      IF rec.adds_criterion_type = 'CORE' THEN
        UPDATE _pole_data SET core_met = TRUE WHERE pole_slug = rec.adds_criterion_pole_slug;
      END IF;
    END IF;
  END LOOP;

  UPDATE _pole_data pd SET core_met = TRUE
  WHERE EXISTS (
    SELECT 1
    FROM _criteria_sets cs
    JOIN "criteria" c ON c.number = cs.criterion_number
    JOIN "criterion_poles" cp ON cp.id = c."poleId" AND cp.slug = cs.pole_slug
    WHERE cp."frameworkId" = v_framework_id
      AND cp.slug = pd.pole_slug
      AND c."criterionType" = 'CORE'
  );

  IF v_impairments->>'SAFETY_CONCERN' IS NOT NULL
     AND v_impairments->>'SAFETY_CONCERN' != 'NONE' THEN
    v_safety_concern := TRUE;
  END IF;

  FOR rule_rec IN
    SELECT
      cr."classificationLabel",
      cr."ruleType",
      cr."gateRequired",
      cr."coreRequired",
      cr."minStandardCriteria",
      cr."gateOnlyAdjustment",
      cr."minOppositeCriteria",
      cr."mixedLabel",
      cp.slug AS pole_slug
    FROM "classification_rules" cr
    JOIN "criterion_poles" cp ON cp.id = cr."poleId"
    WHERE cr."frameworkId" = v_framework_id
    ORDER BY cr.priority DESC
  LOOP
    SELECT COUNT(*) INTO v_pole_count
    FROM _criteria_sets
    WHERE pole_slug = rule_rec.pole_slug;

    SELECT gate_met, core_met INTO rec
    FROM _pole_data
    WHERE pole_slug = rule_rec.pole_slug;

    IF rule_rec."gateRequired" AND NOT COALESCE(rec.gate_met, FALSE) THEN
      CONTINUE;
    END IF;

    IF rule_rec."coreRequired" AND NOT COALESCE(rec.core_met, FALSE) THEN
      CONTINUE;
    END IF;

    v_threshold := rule_rec."minStandardCriteria";
    IF rule_rec."gateOnlyAdjustment" > 0 AND COALESCE(rec.gate_met, FALSE) THEN
      v_threshold := v_threshold + rule_rec."gateOnlyAdjustment";
    END IF;

    IF v_pole_count >= v_threshold THEN
      IF rule_rec."mixedLabel" IS NOT NULL AND rule_rec."minOppositeCriteria" > 0 THEN
        DECLARE
          v_opposite_slug TEXT;
          v_opposite_count INT;
        BEGIN
          SELECT pole_slug INTO v_opposite_slug
          FROM _pole_data
          WHERE pole_slug != rule_rec.pole_slug
          LIMIT 1;

          IF v_opposite_slug IS NOT NULL THEN
            SELECT COUNT(*) INTO v_opposite_count
            FROM _criteria_sets
            WHERE pole_slug = v_opposite_slug;

            IF v_opposite_count >= rule_rec."minOppositeCriteria" THEN
              v_classification := rule_rec."mixedLabel";
              v_rule_type := rule_rec."ruleType";
              v_matched := TRUE;
            END IF;
          END IF;
        END;
      ELSE
        v_classification := rule_rec."classificationLabel";
        v_rule_type := rule_rec."ruleType";
        v_matched := TRUE;
      END IF;

      IF v_matched THEN EXIT; END IF;
    END IF;
  END LOOP;

  IF NOT v_matched THEN
    FOR rule_rec IN
      SELECT
        cr."classificationLabel",
        cr."gateRequired",
        cr."coreRequired",
        cr."minStandardCriteria",
        cr."gateOnlyAdjustment",
        cp.slug AS pole_slug
      FROM "classification_rules" cr
      JOIN "criterion_poles" cp ON cp.id = cr."poleId"
      WHERE cr."frameworkId" = v_framework_id
        AND cr."ruleType" = 'SUBTHRESHOLD'
    LOOP
      SELECT COUNT(*) INTO v_pole_count
      FROM _criteria_sets
      WHERE pole_slug = rule_rec.pole_slug;

      SELECT gate_met, core_met INTO rec
      FROM _pole_data
      WHERE pole_slug = rule_rec.pole_slug;

      v_threshold := rule_rec."minStandardCriteria";
      IF rule_rec."gateOnlyAdjustment" > 0 AND COALESCE(rec.gate_met, FALSE) THEN
        v_threshold := v_threshold + rule_rec."gateOnlyAdjustment";
      END IF;

      IF rule_rec."gateRequired" AND NOT COALESCE(rec.gate_met, FALSE) THEN
        CONTINUE;
      END IF;

      IF rule_rec."coreRequired" AND NOT COALESCE(rec.core_met, FALSE) THEN
        CONTINUE;
      END IF;

      IF v_pole_count >= v_threshold THEN
        v_subthreshold_poles := array_append(v_subthreshold_poles, rule_rec.pole_slug);
      END IF;
    END LOOP;

    IF array_length(v_subthreshold_poles, 1) >= 2 THEN
      v_classification := 'MIXED';
      v_rule_type := 'SUBTHRESHOLD';
    ELSIF array_length(v_subthreshold_poles, 1) = 1 THEN
      SELECT cr."classificationLabel" INTO v_classification
      FROM "classification_rules" cr
      JOIN "criterion_poles" cp ON cp.id = cr."poleId"
      WHERE cr."frameworkId" = v_framework_id
        AND cr."ruleType" = 'SUBTHRESHOLD'
        AND cp.slug = v_subthreshold_poles[1]
      LIMIT 1;
      v_rule_type := 'SUBTHRESHOLD';
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_severe_impairments
  FROM jsonb_each_text(v_impairments) AS kv
  WHERE kv.value = 'SEVERE';

  SELECT COALESCE(MAX(cnt), 0) INTO v_max_criteria
  FROM (
    SELECT COUNT(*) AS cnt
    FROM _criteria_sets
    GROUP BY pole_slug
  ) sub;

  IF v_classification = 'NEUTRAL' THEN
    v_severity := 'NONE';
  ELSIF v_rule_type = 'DSM5_FULL' THEN
    IF v_severe_impairments >= 2 THEN
      v_severity := 'SEVERE';
    ELSE
      v_severity := 'MODERATE';
    END IF;
  ELSE
    IF v_severe_impairments >= 1 OR v_max_criteria >= 3 THEN
      v_severity := 'MODERATE';
    ELSE
      v_severity := 'MILD';
    END IF;
  END IF;

  SELECT COALESCE(SUM(pd.pole_direction * cs_count.cnt), 0) INTO v_wave_score
  FROM _pole_data pd
  LEFT JOIN (
    SELECT pole_slug, COUNT(*) AS cnt
    FROM _criteria_sets
    GROUP BY pole_slug
  ) cs_count ON cs_count.pole_slug = pd.pole_slug;

  -- Per-pole criteria counts, including poles with zero hits
  SELECT jsonb_object_agg(pd.pole_slug, COALESCE(cs_count.cnt, 0)) INTO v_criteria_counts
  FROM _pole_data pd
  LEFT JOIN (
    SELECT pole_slug, COUNT(*) AS cnt
    FROM _criteria_sets
    GROUP BY pole_slug
  ) cs_count ON cs_count.pole_slug = pd.pole_slug;

  NEW."computedMood" := v_classification;
  NEW."computedScore" := v_wave_score;
  NEW."computedCriteriaCounts" := COALESCE(v_criteria_counts, '{}'::jsonb);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
