# Repo Status

_Snapshot of the repository as of 2026-04-16. Written to give an at-a-glance view of what's deployed, what's in flight, what's stale, and what needs attention next. This file is a point-in-time status — update or replace it as state changes, don't extend it indefinitely._

---

## Deployed State

| Environment | Git Branch | Neon DB | URL | What's Live |
|-------------|-----------|---------|-----|-------------|
| **Production** | `main` | `main` (`ep-shy-breeze-ami5dzoi`) | `storm-tracker-murex.vercel.app` | Vite web app + Mobile (App Store Connect build 3). **Missing ST-074 partial fix.** Reports page wave graph shows no data. |
| **Staging** | `staging` | `staging` (`ep-round-shape-amx2h82v`) | `storm-tracker-git-staging-marias-projects-d63f6c00.vercel.app` | Vite web app with ST-074 partial fix — wave graph renders but **criteria counts still 0/9**. |
| **Mobile prod** | — | prod | App Store Connect build 3 | Neon Data API entry writes verified working |
| **Mobile staging** | — | prod (points at production) | TestFlight build 13 | Entry writes verified |

---

## Git State

### Local branches

| Branch | Tracking | Status | Notes |
|--------|----------|--------|-------|
| `staging` | `origin/staging` | **Current branch.** Merged remote + local chores. Ready to push. | HEAD: merge commit |
| `main` | `origin/main` | Behind staging. Missing PR #9 (docs), PR #10 (ST-074 partial), plus local chores. | Last commit: `dc2134c` |
| `fix/st-074-scoring` | — | Already merged via PR #10 | Delete when cleaning up |
| `claude/competent-rubin` | `origin/claude/competent-rubin` | Has ST-074 ID collision fix (`bdc411c`). Never merged. Action deferred — user will handle via Obsidian kanban. | |
| `claude/relaxed-kapitsa` | `origin/claude/relaxed-kapitsa` | Earlier version of phase-based docs. Superseded by PR #9. | Delete when cleaning up |
| `claude/sharp-hawking` | `origin/staging` (ahead/behind) | Worktree has uncommitted debug `console.log`s in `web/src/pages/Reports.tsx` and a `CLEANUP.md` file. | Decide: commit debug code (probably not), or delete |

### Worktrees

```
/Users/mariayarley/Documents/GitHub/storm-tracker                          [staging]
./.claude/worktrees/competent-rubin   [claude/competent-rubin]
./.claude/worktrees/relaxed-kapitsa   [claude/relaxed-kapitsa]
./.claude/worktrees/scoring-fix       [fix/st-074-scoring]
./.claude/worktrees/sharp-hawking     [claude/sharp-hawking]
```

All four worktrees are candidates for removal.

---

## Open Issues — By Priority

For full details see `docs/issues/` and `docs/issues/_index.md`. The index is currently authoritative for the phase-based structure (A–F) introduced by PR #9. User plans to re-triage via Obsidian kanban going forward.

### In Progress

- **ST-074** — Wave graph chart on Vite reports page displays no data. Partial fix on staging; criteria counts still 0. **Paused by user.**

### Highest Priority / Soon

- **ST-068** — Remove debug error handler from web auth serverless function
- **ST-071** — Delete old Next.js source code and Prisma dependencies
- **ST-004** — Database grants for Neon Data API not in a migration
- **ST-075** — JWT audience claim hardening (depends on ST-004)
- **ST-073** — Surface actual error messages in mobile save/load failures
- **ST-064** — Fix premature "no data" messages during loading

### Known ID Collision

Two issue files both claim ID **ST-074**:

- `ST-074-vite-reports-chart-no-data.md` — the scoring fix (in-progress)
- `ST-074-switch-to-dbmate-migrations.md` — introduced by PR #9

The `claude/competent-rubin` branch renumbers one of them but was never merged. User has said they'll handle this via Obsidian kanban rather than hand-editing issue files.

---

## Known Stale Artifacts

Things that should be cleaned up at some point but aren't urgent:

1. **Debug console.log statements** in `.claude/worktrees/sharp-hawking/web/src/pages/Reports.tsx` (uncommitted)
2. **`CLEANUP.md`** in `.claude/worktrees/sharp-hawking/` (uncommitted artifact from ST-074 debugging)
3. **Four Claude worktrees** — all represent finished or abandoned work:
   - `competent-rubin` — unmerged ID collision fix
   - `relaxed-kapitsa` — superseded by PR #9
   - `scoring-fix` — merged as PR #10
   - `sharp-hawking` — current debugging context; delete when ST-074 is resolved
4. **`.claude/settings.local.json`** — has uncommitted local changes (local-only, safe to leave)
5. **Old Next.js source code** in `src/` and Prisma config — tracked by ST-071
6. **Debug error handler** in `web/api/auth.ts` — tracked by ST-068

---

## Architecture Snapshot

| Layer | Tech | Status |
|-------|------|--------|
| Mobile app | Expo / React Native / TypeScript | Healthy. Production build uploaded. |
| Web app | Vite / React / TypeScript | **Healthy for everything except reports page chart.** |
| Auth | Better Auth (Hono handler for web, `@better-auth/expo` for mobile) | Healthy. Same-origin on both environments. |
| Data API | Neon Data API (PostgREST) with JWT + RLS | Healthy. `neonFetch` retries on transient JWKS errors. |
| Database | Neon Postgres | Healthy. Separate branches for prod and staging. Migrations still via Prisma. |
| Computation | Postgres triggers (scoring, episodes, signals, predictions, suggestions) | Healthy. All write-time. |
| File storage | Vercel Blob | Healthy. |
| AI | Anthropic API via Vercel AI SDK (journal parsing) | Healthy. |

### Known architectural debt

- Schema migrations still run via Prisma — ST-071 is removing Prisma ORM, ST-074 (dbmate version) is replacing Prisma migrations with dbmate
- `main` is behind staging — needs a merge once ST-074 decision is made
- Index (`_index.md`) is authoritative but will be replaced by an Obsidian-generated view per user decision

---

## Immediate Next Decisions

These are the decisions waiting for the user when work resumes:

1. **Merge staging → main?** Staging has partial ST-074 fix (wave graph works, criteria counts still 0). Merging would ship the wave graph improvement to production but leave criteria counts broken there too. Alternative: hold until full fix ready.
2. **Resume ST-074 debugging?** Next concrete step is reproducing on staging preview with devtools open to see which fetch is failing in `generate()`. The swallowing `try/catch` is the first thing to fix regardless.
3. **Worktree cleanup?** All four are safe to remove but none blocks anything.
4. **ID collision fix for ST-074?** Cleanest path: rename `ST-074-switch-to-dbmate-migrations.md` to a new unused ID and regenerate any references. Alternative: user handles via Obsidian kanban.

---

## How to Update This Doc

Replace the whole thing with a fresh snapshot when the repo state meaningfully changes — don't append. Keep it under two screenfuls so it stays scannable. The work log (`storm-tracker-work-log.md`) is where narrative history lives; this file is the snapshot view.
