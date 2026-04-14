---
id: ST-060
title: Rewrite web app from Next.js to Vite SPA
type: tech-debt
status: in-progress
priority: high
urgency: now
components:
  - web
  - infrastructure
source: architecture-standards
created: 2026-04-11
completed:
supersedes: ST-001, ST-002, ST-003
---

The web app is built on Next.js but every page is behind auth — there's no SEO benefit and SSR is unnecessary. Replacing with a Vite + React SPA that uses Neon Data API (same as mobile), eliminating Prisma, server actions, SSR, and all compute-on-read patterns.

**Decision (2026-04-14):** Web is staying — needed for admin features (diagnostic frameworks, project management). This is the path forward.

**Technology justification (approved 2026-04-14):**
- Every page behind auth → SPA, no SSR needed
- Data access: Neon Data API with JWT/RLS (same as mobile)
- Business logic: Postgres triggers (already done)
- Auth: Better Auth client with JWT
- Only server-side needs: Anthropic API (journal parsing) + Vercel Blob (attachments) → 2 Vercel serverless functions
- Stack: Vite + React + TypeScript + Tailwind + React Router + 2 serverless functions

**Repo structure:** New `web/` directory alongside `mobile/`. Old `src/` (Next.js) stays running until new web is verified, then deleted.

**Supersedes:**
- ST-001 (web bypasses RLS) — new app uses Neon Data API with RLS
- ST-002 (web recomputes on read) — new app reads persisted tables directly
- ST-003 (custom GET endpoints) — no custom endpoints needed
