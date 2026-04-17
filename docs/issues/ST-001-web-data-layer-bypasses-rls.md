---
id: ST-001
title: Web data layer bypasses RLS (server actions + Prisma)
type: tech-debt
status: superseded
components:
  - web
  - infrastructure
  - auth
source: session
created: 2026-04-07
completed:
dev-plan-ref:
superseded-by: ST-060
---

**Superseded by ST-060.** The Vite SPA rewrite eliminates Prisma and server actions entirely. New web app uses Neon Data API with JWT/RLS (same as mobile).

~~The entire web app reads and writes data through Next.js server actions and Prisma, which connects as database owner and bypasses RLS. No row-level authorization enforcement on web.~~
