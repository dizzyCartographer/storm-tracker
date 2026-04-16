---
id: ST-072
title: Add unique constraint on entries (date, userId, tenantId)
type: bug
status: done
completed: 2026-04-15
components:
  - infrastructure
  - mobile
  - web
source: work-log-2026-04-15
created: 2026-04-15
---

**Resolution:** The unique constraint already existed (`entries_userId_tenantId_date_key`). The actual issue was PostgREST defaulting to the primary key for `merge-duplicates` conflict resolution. Fixed by adding `?on_conflict=userId,tenantId,date` to the POST URL in both mobile and web `saveEntry` functions.

~~The `entries` table has no unique constraint on `(date, userId, tenantId)`.~~ The only unique constraint is the primary key on `id`. This means:

1. **PostgREST `merge-duplicates` doesn't work correctly.** The `Prefer: resolution=merge-duplicates` header resolves conflicts using the primary key. Since `saveEntry` generates a new UUID for every save, every request is an INSERT — never an upsert. Saving the same date twice creates duplicate entries instead of updating the existing one.

2. **No database-level protection against duplicate entries.** The old Next.js endpoint handled upsert logic in application code. With direct PostgREST writes, the database must enforce uniqueness.

**Action:**
1. Add a Prisma migration: `UNIQUE (date, "userId", "tenantId")` on the `entries` table
2. Update `saveEntry` in both `mobile/src/lib/api.ts` and `web/src/lib/api.ts` to use `Prefer: resolution=merge-duplicates` with `on_conflict=date,userId,tenantId` (PostgREST upsert syntax)
3. Remove the client-side UUID generation — let Postgres generate IDs via `DEFAULT gen_random_uuid()` or keep client-side but stop sending `id` on new entries
4. Test: save entry for today, save again for today → should update, not duplicate
5. Check for existing duplicate entries in production and deduplicate if found
