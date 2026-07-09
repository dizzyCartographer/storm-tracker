import { Client } from "pg";

export const RIG_URL =
  process.env.RIG_DATABASE_URL ?? "postgres://rig:rig@127.0.0.1:5432/storm_tracker_test";

// Standard fixture ids (TEST_CASES.md preamble): Maria (OWNER), Sarah (CAREGIVER),
// Jake (TEEN_SELF), Rando (no membership), one tenant on the seeded dsm5-bipolar framework.
export const IDS = {
  maria: "11111111-1111-4111-8111-111111111111",
  sarah: "11111111-1111-4111-8111-222222222222",
  jake: "11111111-1111-4111-8111-333333333333",
  rando: "11111111-1111-4111-8111-999999999999",
  tenant: "22222222-2222-4222-8222-222222222222",
};

export async function connect(): Promise<Client> {
  const client = new Client({ connectionString: RIG_URL });
  await client.connect();
  return client;
}

/** Run `fn` inside a transaction that is always rolled back — every test starts clean. */
export async function withRollback(fn: (c: Client) => Promise<void>): Promise<void> {
  const c = await connect();
  try {
    await c.query("BEGIN");
    await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

/** Insert the standard household fixture (inside the caller's transaction). */
export async function seedFixture(c: Client): Promise<void> {
  const users: Array<[string, string, string]> = [
    [IDS.maria, "maria@test.local", "Maria"],
    [IDS.sarah, "sarah@test.local", "Sarah"],
    [IDS.jake, "jake@test.local", "Jake"],
    [IDS.rando, "rando@test.local", "Rando"],
  ];
  for (const [id, email, name] of users) {
    await c.query(
      `INSERT INTO users (id, email, name, "emailVerified", "updatedAt") VALUES ($1, $2, $3, true, now())`,
      [id, email, name]
    );
  }
  await c.query(`INSERT INTO tenants (id, name, "updatedAt") VALUES ($1, 'Test Teen', now())`, [
    IDS.tenant,
  ]);
  const members: Array<[string, string]> = [
    [IDS.maria, "OWNER"],
    [IDS.sarah, "CAREGIVER"],
    [IDS.jake, "TEEN_SELF"],
  ];
  for (const [userId, role] of members) {
    await c.query(
      `INSERT INTO tenant_members (id, "userId", "tenantId", role) VALUES (gen_random_uuid()::text, $1, $2, $3)`,
      [userId, IDS.tenant, role]
    );
  }
  await c.query(
    `INSERT INTO tenant_frameworks (id, "tenantId", "frameworkId")
     SELECT gen_random_uuid()::text, $1, f.id FROM diagnostic_frameworks f WHERE f.slug = 'dsm5-bipolar'`,
    [IDS.tenant]
  );
}

export interface EntryInput {
  userId?: string;
  date?: string;
  mood?: string;
  dayQuality?: string;
  behaviorKeys?: string[];
  impairments?: Record<string, string>;
}

/** Insert an entry and return its computed columns (trigger output). */
export async function insertEntry(c: Client, input: EntryInput = {}) {
  const row = await c.query(
    `INSERT INTO entries (id, date, mood, "dayQuality", "behaviorKeys", impairments, "userId", "tenantId", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2::"MoodDescriptor", $3::"DayQuality", $4::jsonb, $5::jsonb, $6, $7, now())
     RETURNING id, "computedMood", "computedScore", "computedCriteriaCounts"`,
    [
      input.date ?? "2026-07-01",
      input.mood ?? "NEUTRAL",
      input.dayQuality ?? "NEUTRAL",
      JSON.stringify(input.behaviorKeys ?? []),
      JSON.stringify(input.impairments ?? {}),
      input.userId ?? IDS.maria,
      IDS.tenant,
    ]
  );
  return row.rows[0];
}

/** Impersonate a user through the Data API path: non-owner role + JWT-sub shim GUC. */
export async function actAs(c: Client, userId: string): Promise<void> {
  await c.query(`SET LOCAL ROLE authenticated`);
  await c.query(`SELECT set_config('test.user_id', $1, true)`, [userId]);
}
