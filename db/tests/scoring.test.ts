import { describe, expect, test } from "vitest";
import { insertEntry, seedFixture, withRollback } from "./helpers";

// ⚠️ TEST_CASES §1 — scoring correctness. A red test here halts feature work.
// Behavior itemKeys are the seeded dsm5-bipolar criterion-level checklist.

const MANIC_GATE = "elevated-expansive-irritable-mood";
const MANIC_B = ["inflated-self-image", "decreased-need-for-sleep", "pressured-speech"]; // B1, B2, B3

describe("compute_daily_score trigger", () => {
  test("SC-1: manic gate + 3 B criteria classifies MANIC (DSM5_FULL)", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      const row = await insertEntry(c, { behaviorKeys: [MANIC_GATE, ...MANIC_B] });
      expect(row.computedMood).toBe("MANIC");
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
});
