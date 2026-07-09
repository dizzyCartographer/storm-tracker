import { describe, expect, test } from "vitest";
import { extractScore } from "./Reports";
import type { EntryRow } from "../lib/api";

function entry(overrides: Partial<EntryRow>): EntryRow {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    date: "2026-07-01",
    mood: "NEUTRAL",
    dayQuality: "NEUTRAL",
    notes: null,
    behaviorKeys: [],
    customItemIds: [],
    strategyIds: [],
    missedMedIds: [],
    impairments: {},
    menstrualSeverity: null,
    computedMood: null,
    computedScore: null,
    computedCriteriaCounts: null,
    userId: "00000000-0000-0000-0000-0000000000aa",
    tenantId: "00000000-0000-0000-0000-0000000000bb",
    ...overrides,
  } as EntryRow;
}

describe("extractScore (RPT-1: persisted values only)", () => {
  test("RPT-1: reads computedMood as a TEXT classification and computedScore as the wave score", () => {
    const score = extractScore(
      entry({
        computedMood: "MANIC",
        computedScore: 3,
        computedCriteriaCounts: { manic: 3, depressive: 0 },
      })
    );
    expect(score.classification).toBe("MANIC");
    expect(score.waveScore).toBe(3);
    expect(score.manicCriteriaCount).toBe(3);
    expect(score.depressiveCriteriaCount).toBe(0);
  });

  test("RPT-3: quick-log-only entry (NULL computed fields) degrades to NEUTRAL/0 without crashing", () => {
    const score = extractScore(entry({}));
    expect(score.classification).toBe("NEUTRAL");
    expect(score.waveScore).toBe(0);
    expect(score.manicCriteriaCount).toBe(0);
    expect(score.depressiveCriteriaCount).toBe(0);
  });

  test("RPT-4: per-pole counts come from computedCriteriaCounts, missing poles default to 0", () => {
    const score = extractScore(
      entry({
        computedMood: "DEPRESSIVE",
        computedScore: -4,
        computedCriteriaCounts: { depressive: 4 },
      })
    );
    expect(score.depressiveCriteriaCount).toBe(4);
    expect(score.manicCriteriaCount).toBe(0);
    expect(score.waveScore).toBe(-4);
  });
});
