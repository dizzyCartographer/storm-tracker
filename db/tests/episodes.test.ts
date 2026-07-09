import { describe, expect, test } from "vitest";
import { Client } from "pg";
import { IDS, insertEntry, seedFixture, withRollback } from "./helpers";

// TEST_CASES §4 — episode detection (compute_episodes via run_tenant_analysis).
// Seeded thresholds: MANIC 7d / HYPOMANIC 4d / DEPRESSIVE 14d at DSM5_MET;
// MANIC 4d / HYPOMANIC 2d / DEPRESSIVE 7d,5d at PRODROMAL_CONCERN.

const MANIC_FULL = [
  "elevated-expansive-irritable-mood",
  "inflated-self-image",
  "decreased-need-for-sleep",
  "pressured-speech",
]; // gate + 3 B → meets DSM full
const MANIC_SUB = ["elevated-expansive-irritable-mood", "inflated-self-image", "decreased-need-for-sleep"]; // gate + 2

function day(offset: number): string {
  const d = new Date(Date.UTC(2026, 5, 1)); // 2026-06-01 baseline
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

async function insertRun(c: Client, offsets: number[], behaviorKeys: string[]) {
  for (const o of offsets) {
    await insertEntry(c, { date: day(o), behaviorKeys });
  }
}

async function episodes(c: Client) {
  const res = await c.query(
    `SELECT type, confidence, "dayCount" FROM episodes WHERE "tenantId" = $1 ORDER BY "startDate"`,
    [IDS.tenant]
  );
  return res.rows;
}

describe("compute_episodes", () => {
  test("EP-1: 7 consecutive DSM-full manic days → MANIC / DSM5_MET / 7 days", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      await insertRun(c, [0, 1, 2, 3, 4, 5, 6], MANIC_FULL);
      const eps = await episodes(c);
      expect(eps).toHaveLength(1);
      expect(eps[0]).toMatchObject({ type: "MANIC", confidence: "DSM5_MET", dayCount: 7 });
    }));

  test("EP-2: 4 consecutive DSM-full manic days → HYPOMANIC / DSM5_MET (not MANIC)", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      await insertRun(c, [0, 1, 2, 3], MANIC_FULL);
      const eps = await episodes(c);
      expect(eps).toHaveLength(1);
      expect(eps[0]).toMatchObject({ type: "HYPOMANIC", confidence: "DSM5_MET", dayCount: 4 });
    }));

  test("EP-3: 4 consecutive subthreshold manic days → MANIC / PRODROMAL_CONCERN", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      await insertRun(c, [0, 1, 2, 3], MANIC_SUB);
      const eps = await episodes(c);
      expect(eps).toHaveLength(1);
      expect(eps[0]).toMatchObject({ type: "MANIC", confidence: "PRODROMAL_CONCERN" });
    }));

  test("EP-6a: one missed logging day does not split a run (date-diff ≤ 2)", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      await insertRun(c, [0, 1, 2, 4, 5, 6], MANIC_FULL); // day 3 not logged
      const eps = await episodes(c);
      expect(eps).toHaveLength(1);
      expect(eps[0].dayCount).toBe(6);
    }));

  // F25 pin: the SQL splits when date-diff > 2, i.e. TWO consecutive missed days
  // break a run. Docs say "allow up to 2-day gaps for missed logging", which reads
  // as two missed days merging. Pinned as current behavior pending clinical review.
  test("EP-6b (F25 pin): two consecutive missed days split the run under current SQL", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      await insertRun(c, [0, 1, 2, 5, 6, 7], MANIC_FULL); // days 3,4 not logged
      const eps = await episodes(c);
      expect(eps).toHaveLength(2);
    }));

  test("EP-8: a single non-neutral day produces no episode (min run 2)", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      await insertEntry(c, { date: day(0), behaviorKeys: MANIC_FULL });
      const eps = await episodes(c);
      expect(eps).toHaveLength(0);
    }));

  test("EP-9: analysis output is replaced wholesale — no stale rows as a run grows", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      await insertRun(c, [0, 1, 2, 3], MANIC_FULL); // HYPOMANIC DSM5_MET
      await insertRun(c, [4, 5, 6], MANIC_FULL); // grows to 7 → MANIC DSM5_MET
      const eps = await episodes(c);
      expect(eps).toHaveLength(1);
      expect(eps[0]).toMatchObject({ type: "MANIC", confidence: "DSM5_MET", dayCount: 7 });
    }));

  test("EP-11 (F6 pin): peakSeverity is hardcoded MODERATE today", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      // Severe days: DSM-full + 2 SEVERE impairments — real severity would be SEVERE.
      for (const o of [0, 1, 2, 3]) {
        await insertEntry(c, {
          date: day(o),
          behaviorKeys: MANIC_FULL,
          impairments: { SCHOOL_WORK: "SEVERE", FAMILY: "SEVERE" },
        });
      }
      const res = await c.query(
        `SELECT "peakSeverity" FROM episodes WHERE "tenantId" = $1`,
        [IDS.tenant]
      );
      // Pins the F6 defect; M1-1b (approved via D-4) flips this to expect SEVERE.
      expect(res.rows[0].peakSeverity).toBe("MODERATE");
    }));
});
