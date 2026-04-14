---
name: Better Auth plugin ordering is critical
description: JWT and Expo plugins belong in src/lib/auth.ts but nextCookies() must always be the last plugin.
type: feedback
---

The JWT and Expo plugins belong in `src/lib/auth.ts` alongside `nextCookies()`. The correct order is: `expo()`, `jwt()`, `nextCookies()` (last). Do not reorder them.

**Why:** Adding the JWT plugin initially broke web sessions. The root cause was plugin ordering — `nextCookies()` must be last in the array or it interferes with session processing for all other plugins. The fix was ordering, not removal.

**How to apply:** If adding a new Better Auth plugin, place it before `nextCookies()`. Always test web login after any auth config change before pushing.
