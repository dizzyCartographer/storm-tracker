---
id: ST-065
title: Behavior checklist not displaying on mobile log screen
type: bug
status: on-stage
priority: high
urgency: blocking
components:
  - mobile
  - log
source: testing-feedback
created: 2026-04-11
completed:
---

On TestFlight, the behavior checklist (DSM-5 criteria sections — Manic and Depressive) sometimes doesn't display on the log screen. Only the quick log fields (overall mood, day quality), custom items, impairments, period, and notes show.

**Root cause:** Intermittent JWKS cold-cache failures from Neon Data API cause `getFrameworkId` or `getBehaviorCategories` to throw. The catch block silently swallowed the error, leaving `categories` as an empty array — no behavior checklist rendered, no error shown.

**Fix:** Added `loadError` state and a visible retry banner. When the framework data fetch fails, users see an amber "Behavior checklist failed to load" message with a Retry button instead of silently missing content.
