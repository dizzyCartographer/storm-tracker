---
id: ST-054
title: Remove "Import Journal" from hamburger menu
type: enhancement
status: on-stage
urgency: low
phase: A
components:
  - mobile
  - navigation
source: user-request
created: 2026-04-10
completed:
dev-plan-ref:
---

"Import Journal" appears in the hamburger menu (`mobile/src/components/header-menu.tsx`) but AI Journal already has its own tab in the bottom bar. The hamburger entry is redundant. Remove it.
