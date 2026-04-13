---
id: ST-060
title: Rewrite web app from Next.js to Vite SPA
type: tech-debt
status: open
priority: high
urgency: low
components:
  - web
  - infrastructure
source: architecture-standards
created: 2026-04-11
completed:
---

The web app is built on Next.js but every page is behind auth — there's no SEO benefit and SSR is unnecessary. Per architecture standards, a Vite + React SPA is the correct choice. This rewrite would also eliminate Prisma (which bypasses RLS) and move all data access to Neon Data API, aligning web with the same architecture mobile already uses.

Depends on: Decision on whether web continues or is sunset. If web continues, this is the path forward.
