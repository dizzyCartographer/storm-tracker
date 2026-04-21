---
name: Verify both staging and production before closing issues
description: Because of this project's branch sync history, always wait for user confirmation on BOTH environments before marking an issue done
type: feedback
---

Do not close an issue (status → `done`, `completed:` date, "Verified on production" log entry) until the user has confirmed it works on **both staging and production**. Approval to merge staging → main is not the same as approval to close.

**Why:** This project has had repeated branch-sync issues — partial reverts, cherry-picks, divergent merges. Even when staging looks correct and the merge to main fast-forwards cleanly, something can land on production that wasn't on staging, or the production database can drift out of sync with the code. On 2026-04-21 (ST-074), staging was verified, user approved the merge to main, prod DB was migrated, and I immediately closed the issue — before the user had opened production. User had to tell me to revert twice: once to roll back the premature closure, then again after they confirmed production actually worked.

**How to apply:**
- Staging verified + merge approved = ship to production. Do not close yet.
- After production deploy, say "shipped, ready for you to verify production" — then stop.
- Only write `status: done` / `completed:` / "verified on production" after the user explicitly confirms production works.
- This is a project-specific precaution, not a universal rule. A future project with rock-solid CI and branch hygiene may not need this. For Storm Tracker, treat it as default until branch-sync reliability improves.
