---
name: Deployment rules and production change approval
description: Rules for deploying changes, modifying production env vars, and making database changes
type: feedback
---

All changes follow the staging-first workflow. Production changes require explicit user approval.

**Why:** During the April 8 session, multiple production outages were caused by unauthorized changes to production env vars and JWKS keys. Env vars were removed from Production scope, JWKS keys were deleted from the production database, and code was merged to main without approval.

**How to apply:**

1. **Never modify production env vars without explicit user approval.** This includes adding, removing, or changing values scoped to Production in Vercel.
2. **Never modify production database records (jwks, sessions, etc.) without explicit user approval.** Even "cleanup" operations on production data require permission.
3. **All code changes go to staging first.** Workflow: test locally → push to staging → test on staging preview → get user approval → merge to main.
4. **Database migrations:** Run on staging DB first. Verify. Then merge to main (migrations run on deploy).
5. **JWKS/auth changes are high-risk.** Always present a rollback plan before executing. These affect every user's session.
6. **Env var changes:** Use `vercel env add VAR_NAME <scope>` to scope precisely. Never use operations that could remove vars from other environments.
7. **Before any production change, state what you're about to do and wait for "yes."** A description of the plan is not approval to execute it.
