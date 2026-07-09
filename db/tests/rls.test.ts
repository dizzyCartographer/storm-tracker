import { describe, expect, test } from "vitest";
import { actAs, IDS, insertEntry, seedFixture, withRollback } from "./helpers";

// ⚠️ TEST_CASES §2 — tenant isolation / RLS. A red test here halts feature work.
// All queries run as role `authenticated` with auth.user_id() shimmed (build-spec §5.1).

describe("row-level security", () => {
  test("ISO-1: a non-member sees zero rows in every tenant-scoped table", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      await insertEntry(c, { behaviorKeys: ["depressed-mood"] });
      await actAs(c, IDS.rando);
      for (const table of [
        "entries",
        "episodes",
        "prodrome_signals",
        "predictions",
        "suggestions",
        "medications",
        "strategies",
        "custom_checklist_items",
        "attachments",
      ]) {
        const res = await c.query(
          `SELECT count(*)::int AS n FROM ${table} WHERE "tenantId" = $1`,
          [IDS.tenant]
        );
        expect(res.rows[0].n, `${table} must be invisible to a non-member`).toBe(0);
      }
      // And the tenant row itself:
      const t = await c.query(`SELECT count(*)::int AS n FROM tenants WHERE id = $1`, [IDS.tenant]);
      expect(t.rows[0].n).toBe(0);
    }));

  test("ISO-2: a non-member cannot INSERT an entry into the tenant", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      await actAs(c, IDS.rando);
      await expect(
        c.query(
          `INSERT INTO entries (id, date, mood, "dayQuality", "behaviorKeys", impairments, "userId", "tenantId", "updatedAt")
           VALUES (gen_random_uuid()::text, '2026-07-02', 'NEUTRAL', 'NEUTRAL', '[]'::jsonb, '{}'::jsonb, $1, $2, now())`,
          [IDS.rando, IDS.tenant]
        )
      ).rejects.toThrow(/row-level security/);
    }));

  test("ISO-3: a CAREGIVER member reads all members' entries for the tenant", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      await insertEntry(c, { userId: IDS.maria, date: "2026-07-01" });
      await insertEntry(c, { userId: IDS.jake, date: "2026-07-01" });
      await actAs(c, IDS.sarah);
      const res = await c.query(`SELECT count(*)::int AS n FROM entries WHERE "tenantId" = $1`, [
        IDS.tenant,
      ]);
      expect(res.rows[0].n).toBe(2);
    }));

  // F4 pin: jwks (RS256 PRIVATE KEYS) has no RLS, so under table grants it is
  // readable by the Data API role. `test.fails` pins the defect: this test PASSES
  // while the hole exists and will flip red the moment M1-10 (approved via D-2)
  // adds RLS — at which point remove `.fails` to make it a permanent guard.
  test.fails("ISO-9 (F4 pin): jwks must not be readable through the Data API role", () =>
    withRollback(async (c) => {
      await seedFixture(c);
      await c.query(
        `INSERT INTO jwks (id, "publicKey", "privateKey", "createdAt")
         VALUES (gen_random_uuid()::text, 'test-public', 'test-PRIVATE-key-material', now())`
      );
      await actAs(c, IDS.rando);
      let visible: number;
      try {
        const res = await c.query(`SELECT count(*)::int AS n FROM jwks`);
        visible = res.rows[0].n;
      } catch {
        visible = 0; // permission denied would be a passing (safe) outcome
      }
      expect(visible).toBe(0);
    }));
});
