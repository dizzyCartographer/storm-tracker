---
name: Staging-first workflow
description: Dev on staging branch — Claude tests local then live preview, user approves on live preview, then merge to main
type: feedback
---

All changes go to the staging branch. Claude tests locally first, then pushes to staging and tests on the live Vercel preview deployment. User then tests on the live preview and gives explicit approval. Only after user approval, merge staging → main for production.

**Why:** Changes were going directly to main without proper verification. User wants a full gate: Claude local test → Claude live test → user live test → production.

**How to apply:** Work on staging branch. Test locally before pushing. Push to staging. Test on the live Vercel preview URL. Then hand off to the user to test. Wait for explicit approval before merging to main. Never push directly to main. Never skip any verification step.
