import { describe, expect, test } from "vitest";
import { IDS, insertEntry, seedFixture, withRollback } from "./helpers";

// ⚠️ TEST_CASES §1 — scoring correctness. A red test here halts feature work.
// Behavior itemKeys are the seeded dsm5-bipolar criterion-level checklist.

const MANIC_GATE = "elevated-expansive-irritable-mood";
const MANIC_B = ["inflated-self-image", "decreased-need-for-sleep", "pressured-speech"]; // B1, B2, B3

describe("compute_daily_score trigger", () => {
  test("SC-1: manic gate + 3 B criteria labels the day MANIC", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      const row = await insertEntry(c, { behaviorKeys: [MANIC_GATE, ...MANIC_B] });
      // F26: under current SQL this label comes from the SUBTHRESHOLD rule — the
      // DSM5_FULL rule's gateOnlyAdjustment (+1) applies whenever the gate is met,
      // so the full rule effectively needs gate + 4. Label is MANIC either way;
      // rule-path pinning lands with M1-1b (ruleType persistence).
      expect(row.computedMood).toBe("MANIC");
    }));

  test("SC-1b (F26 companion): manic gate + 4 B criteria also labels MANIC (full-rule path)", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      const row = await insertEntry(c, {
        behaviorKeys: [MANIC_GATE, ...MANIC_B, "racing-thoughts"],
      });
      expect(row.computedMood).toBe("MANIC");
      expect(row.computedCriteriaCounts).toEqual({ manic: 4, depressive: 0 });
    }));

  test("SC-14/SC-15: wave score = Σ direction × count; zero-count poles included", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      const row = await insertEntry(c, { behaviorKeys: [MANIC_GATE, ...MANIC_B] });
      expect(row.computedScore).toBe(3); // gate is criterion 0 (not counted); 3 B criteria
      expect(row.computedCriteriaCounts).toEqual({ manic: 3, depressive: 0 });
    }));

  test("SC-2: manic gate + only 2 B criteria is SUBTHRESHOLD, not full MANIC... pinned via label", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      const row = await insertEntry(c, {
        behaviorKeys: [MANIC_GATE, MANIC_B[0], MANIC_B[1]],
      });
      // Subthreshold rule still labels the day MANIC (classificationLabel), but must
      // NOT be reachable only via the DSM5_FULL rule: with 2 criteria the full rule
      // (gate + 3) cannot match, so a MANIC result here proves the SUBTHRESHOLD path.
      expect(row.computedMood).toBe("MANIC");
      expect(row.computedCriteriaCounts).toEqual({ manic: 2, depressive: 0 });
    }));

  test("SC-3: criteria without the gate never classify MANIC", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      const row = await insertEntry(c, { behaviorKeys: MANIC_B }); // no gate, mood NEUTRAL
      expect(row.computedMood).not.toBe("MANIC");
    }));

  test("SC-4: depressive core + 4 more (5 total) classifies DEPRESSIVE", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      const row = await insertEntry(c, {
        behaviorKeys: [
          "depressed-mood", // #1 CORE
          "weight-appetite-change", // #3
          "insomnia-hypersomnia", // #4
          "fatigue-loss-of-energy", // #6
          "worthlessness-guilt", // #7
        ],
      });
      expect(row.computedMood).toBe("DEPRESSIVE");
      expect(row.computedCriteriaCounts).toEqual({ manic: 0, depressive: 5 });
      expect(row.computedScore).toBe(-5);
    }));

  test("SC-11: mood descriptor MANIC satisfies the gate without a gate behavior", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      const row = await insertEntry(c, { mood: "MANIC", behaviorKeys: MANIC_B });
      expect(row.computedMood).toBe("MANIC");
    }));

  test("SC-16: quick-log-only entry (no behaviors) has NULL computed fields", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      const row = await insertEntry(c, { mood: "DEPRESSIVE", behaviorKeys: [] });
      expect(row.computedMood).toBeNull();
      expect(row.computedScore).toBeNull();
      expect(row.computedCriteriaCounts).toBeNull();
    }));

  test("SC-18: updating an entry recomputes on the same row", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      const row = await insertEntry(c, { behaviorKeys: [] });
      expect(row.computedMood).toBeNull();
      const updated = await c.query(
        `UPDATE entries SET "behaviorKeys" = $1::jsonb, "updatedAt" = now()
         WHERE id = $2 RETURNING "computedMood"`,
        [JSON.stringify([MANIC_GATE, ...MANIC_B]), row.id]
      );
      expect(updated.rows[0].computedMood).toBe("MANIC");
    }));

  test("SC-5: five depressive STANDARD criteria without a core criterion never classify DEPRESSIVE", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      const row = await insertEntry(c, {
        behaviorKeys: [
          "weight-appetite-change",
          "insomnia-hypersomnia",
          "psychomotor-change",
          "fatigue-loss-of-energy",
          "worthlessness-guilt",
        ],
      });
      expect(row.computedMood).not.toBe("DEPRESSIVE");
    }));

  test("SC-6: depressive core + 2 more (3 total) classifies DEPRESSIVE (subthreshold)", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      const row = await insertEntry(c, {
        behaviorKeys: ["depressed-mood", "insomnia-hypersomnia", "fatigue-loss-of-energy"],
      });
      expect(row.computedMood).toBe("DEPRESSIVE");
      expect(row.computedCriteriaCounts).toEqual({ manic: 0, depressive: 3 });
    }));

  test("SC-7: full manic day + 3 depressive criteria classifies MIXED (mixed-features priority)", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      const row = await insertEntry(c, {
        behaviorKeys: [
          MANIC_GATE,
          ...MANIC_B,
          "weight-appetite-change",
          "insomnia-hypersomnia",
          "fatigue-loss-of-energy",
        ],
      });
      expect(row.computedMood).toBe("MIXED");
    }));

  // F24 pin: scoring-logic.md documents "2+ poles at subthreshold → MIXED", but the
  // SQL evaluates SUBTHRESHOLD rules inside the main priority loop, so the first
  // matching single-pole rule wins and the documented MIXED fallback is dead code
  // (equal-priority ties also have no deterministic ORDER BY). This test asserts
  // the DOCUMENTED behavior and is expected to fail until clinical review (M5-3)
  // decides which side is right — then remove `.fails`.
  test.fails("SC-8 (F24 pin): subthreshold on both poles should fall back to MIXED per docs", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      const row = await insertEntry(c, {
        behaviorKeys: [
          MANIC_GATE,
          MANIC_B[0],
          MANIC_B[1], // manic: gate + 2 (subthreshold)
          "depressed-mood",
          "insomnia-hypersomnia",
          "fatigue-loss-of-energy", // depressive: core + 2 (subthreshold)
        ],
      });
      expect(row.computedMood).toBe("MIXED");
    }));

  test("SC-9: two behaviors mapped to the same criterion count once (set semantics)", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      // Synthetic second behavior mapped to the SAME criterion as inflated-self-image (manic B1).
      await c.query(`
        INSERT INTO behavior_definitions (id, "itemKey", label, description, "sortOrder", "categoryId")
        SELECT 'test-dup-behavior', 'test-dup-b1', 'Dup of B1', 'engine test', 99, c.id
        FROM framework_behavior_categories c
        JOIN diagnostic_frameworks f ON f.id = c."frameworkId" AND f.slug = 'dsm5-bipolar'
        WHERE c.slug = 'manic'`);
      await c.query(`
        INSERT INTO behavior_criterion_mappings (id, "behaviorId", "criterionId")
        SELECT 'test-dup-mapping', 'test-dup-behavior', m."criterionId"
        FROM behavior_criterion_mappings m
        JOIN behavior_definitions bd ON bd.id = m."behaviorId"
        WHERE bd."itemKey" = 'inflated-self-image'`);
      const row = await insertEntry(c, {
        behaviorKeys: [MANIC_GATE, "inflated-self-image", "test-dup-b1"],
      });
      expect(row.computedCriteriaCounts.manic).toBe(1); // B1 counted once, not twice
    }));

  test("SC-10: one behavior mapped to criteria on both poles increments both counts", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      // Synthetic cross-pole behavior: manic B5 (distractibility) + depressive #8.
      await c.query(`
        INSERT INTO behavior_definitions (id, "itemKey", label, description, "sortOrder", "categoryId")
        SELECT 'test-xpole-behavior', 'test-cant-focus', 'Cross-pole focus', 'engine test', 99, c.id
        FROM framework_behavior_categories c
        JOIN diagnostic_frameworks f ON f.id = c."frameworkId" AND f.slug = 'dsm5-bipolar'
        WHERE c.slug = 'manic'`);
      await c.query(`
        INSERT INTO behavior_criterion_mappings (id, "behaviorId", "criterionId")
        SELECT gen_random_uuid()::text, 'test-xpole-behavior', cr.id
        FROM criteria cr
        JOIN criterion_poles p ON p.id = cr."poleId"
        JOIN diagnostic_frameworks f ON f.id = p."frameworkId" AND f.slug = 'dsm5-bipolar'
        WHERE (p.slug = 'manic' AND cr.number = 5) OR (p.slug = 'depressive' AND cr.number = 8)`);
      const row = await insertEntry(c, { behaviorKeys: ["test-cant-focus"] });
      expect(row.computedCriteriaCounts).toEqual({ manic: 1, depressive: 1 });
    }));

  test("SC-12: mood MIXED satisfies the manic gate AND adds depressive #1", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      const row = await insertEntry(c, { mood: "MIXED", behaviorKeys: MANIC_B });
      expect(row.computedMood).toBe("MANIC"); // gate via mood + 3 B; only 1 depressive criterion (< 3 opposite)
      expect(row.computedCriteriaCounts).toEqual({ manic: 3, depressive: 1 });
      expect(row.computedScore).toBe(2);
    }));

  test("SC-13: mood DEPRESSIVE adds core #1, completing DSM5_FULL with 4 standard criteria", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      const row = await insertEntry(c, {
        mood: "DEPRESSIVE",
        behaviorKeys: [
          "weight-appetite-change",
          "insomnia-hypersomnia",
          "psychomotor-change",
          "fatigue-loss-of-energy",
        ],
      });
      expect(row.computedMood).toBe("DEPRESSIVE");
      expect(row.computedCriteriaCounts).toEqual({ manic: 0, depressive: 5 });
    }));

  test("SC-17: a tenant with no active framework saves entries with NULL computed fields", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      await c.query(
        `INSERT INTO tenants (id, name, "updatedAt") VALUES ('no-fw-tenant', 'No Framework', now())`
      );
      await c.query(
        `INSERT INTO tenant_members (id, "userId", "tenantId", role)
         VALUES (gen_random_uuid()::text, $1, 'no-fw-tenant', 'OWNER')`,
        [IDS.maria]
      );
      const row = await c.query(
        `INSERT INTO entries (id, date, mood, "dayQuality", "behaviorKeys", impairments, "userId", "tenantId", "updatedAt")
         VALUES (gen_random_uuid()::text, '2026-07-01', 'NEUTRAL', 'BAD', $1::jsonb, '{}'::jsonb, $2, 'no-fw-tenant', now())
         RETURNING "computedMood", "computedScore", "computedCriteriaCounts"`,
        [JSON.stringify([MANIC_GATE, ...MANIC_B]), IDS.maria]
      );
      expect(row.rows[0].computedMood).toBeNull();
      expect(row.rows[0].computedScore).toBeNull();
      expect(row.rows[0].computedCriteriaCounts).toBeNull();
    }));

  // SC-19 (rule priority) and SC-20 (gateOnlyAdjustment semantics) are currently
  // UNOBSERVABLE from persisted data: only the classification label is stored, and
  // full-vs-subthreshold both label MANIC. Pinning them needs ruleType/severity
  // persistence — folded into M1-1b (see QUESTIONS Q9 update, 2026-07-09).
});
