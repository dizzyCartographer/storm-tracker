---
id: ST-073
title: Surface actual error messages in mobile save/load failures
type: enhancement
status: open
urgency: medium
phase: A
components:
  - mobile
source: work-log-2026-04-15
created: 2026-04-15
---

Most error handlers in the mobile app show generic messages ("Could not save entry. Please try again.") and only log the actual error to `console.error`. This wastes significant debugging time — the `crypto.randomUUID` bug took extra investigation because the error detail was hidden behind a generic alert.

**Action:**
1. Audit all `catch` blocks in mobile screens for generic error messages
2. Replace with `e instanceof Error ? e.message : String(e)` in the alert body
3. Keep `console.error` for full stack traces
4. Affected files (at minimum): `log.tsx`, `import.tsx`, `journal-import.tsx`, `log-edit.tsx`, `project-edit.tsx`
