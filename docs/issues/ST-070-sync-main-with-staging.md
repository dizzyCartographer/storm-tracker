---
id: ST-070
title: Sync main with staging after mobile rebuild fixes
type: chore
status: open
priority: high
urgency: now
components:
  - infrastructure
source: work-log-2026-04-15
created: 2026-04-15
---

Staging is 3 commits ahead of main after the April 15 mobile rebuild session:
1. `49500b7` — Restore themed UI + Neon Data API entry writes
2. `8e8a52e` — UUID polyfill + error message fix
3. `14ef530` — Work log + conventions

Main still has the broken mobile source code from the April 14 partial revert. Needs to be fast-forwarded to staging once user approves.

**Action:** Merge staging → main (fast-forward). Verify both branches match.
