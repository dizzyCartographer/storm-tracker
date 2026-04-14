---
name: Never modify production environment variables
description: Never remove, replace, or modify production env vars when setting up staging or other environments
type: feedback
---

Never remove or modify production environment variables when setting up staging or other environments. Add new env vars for the new environment only. Do not touch production.

**Why:** During staging setup on 2026-04-08, production `STRM_TRKR_DATABASE_URL` and `STRM_TRKR_DATABASE_URL_UNPOOLED` were removed from the Production environment and only added back for Preview. This broke all auth on production (500 on every sign-in/sign-up/get-session) until the vars were restored and redeployed.

**How to apply:** When adding environment-specific variables (e.g., for staging), use `vercel env add VAR_NAME preview` to scope to Preview only. Never use operations that remove existing Production variables. Always verify production env vars are intact after any env changes with `vercel env ls`.
