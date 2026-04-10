---
id: ST-055
title: Make AI Journal a proper tab screen with persistent tab bar
type: bug
status: open
priority: high
urgency: soon
components:
  - mobile
  - navigation
source: user-request
created: 2026-04-10
completed:
dev-plan-ref:
---

The AI Journal tab currently intercepts the tab press, pushes to a stack screen (`/journal-import`), and leaves the tab layout entirely. This means:

- The bottom tab bar disappears
- A back button appears in a stack header
- Behavior is inconsistent with Dashboard, Log, and History tabs

The journal import content should render inside the tab layout like the other tabs, keeping the bottom bar persistent and not requiring a back button to return.

**Current implementation:**
- `(tabs)/import.tsx` is a redirect placeholder that calls `router.replace("/journal-import")`
- `(tabs)/_layout.tsx` has a `tabPress` listener that calls `router.push("/journal-import")`
- `journal-import.tsx` is a root-level stack screen with its own header

**Fix:** Move the journal import content into the `(tabs)/import.tsx` file (or a component it renders) so it stays within the tab navigator.
