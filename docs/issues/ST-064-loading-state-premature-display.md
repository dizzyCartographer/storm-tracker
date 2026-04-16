---
id: ST-064
title: Fix premature "no data" messages during loading
type: bug
status: open
urgency: medium
phase: A
components:
  - mobile
  - dashboard
source: testing-feedback
created: 2026-04-11
completed:
related: ST-052
---

Several screens briefly show "no data" messages (e.g., "No recent entries") before data has loaded from the API. This is misleading — the project does have data, it just hasn't been fetched yet. Screens should show a loading state (skeleton/spinner) until the first data fetch completes, and only show empty-state messages after confirming there's genuinely no data. The splash screen should remain visible until the initial data load is ready. The offline mode (ST-043) will help by providing cached data on app launch.
