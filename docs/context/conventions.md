# Conventions

## Code Style

_Fill in as the project establishes norms._

## Data & API Architecture

See `docs/context/application-architecture-standards.md` for the full reference. Key points for this project:

### Computation happens at write time. Always.

When business logic produces a result (classification, score, episode, signal, prediction, suggestion, discrepancy), that result is persisted to the database in its own column or table at the moment the input data is written. Read paths never run computation. Read paths query stored data. No exceptions.

### All reads and writes go through Neon Data API.

Both web and mobile are clients of the same Neon Data API. Authentication is via JWT. Authorization is via Postgres RLS. The only server-side endpoints that exist are the serverless functions in `web/api/` for things that genuinely need server-side secrets (Better Auth, Anthropic, Vercel Blob). The database is the API for everything else.

### Computation lives in Postgres.

Scoring, classification, episode detection, and all derived data are computed by Postgres triggers and functions that fire on insert/update. Even writes that require computation go through Neon Data API — Postgres handles the logic via triggers, no custom write endpoint needed.

### No custom API endpoints for data access.

If you're about to create a GET route for data, the data should already be in the database — read it via Neon Data API. If you're about to create a POST route, ask whether the computation can be a Postgres trigger instead. The only legitimate reasons for a serverless function are server-side secrets that can't be exposed to the client.

### RLS is the only authorization layer.

Do not write permission checks in application code for data access. RLS policies on every table enforce tenant isolation and ownership. The JWT carries the user ID. Postgres handles the rest.

### New tables get RLS policies immediately.

When adding a new model/table, add RLS policies in the same migration. No table should exist without RLS.

## File & Folder Naming

- `kebab-case` for files and directories
- One module per file; name the file after the primary export

## Testing

- Unit tests co-located with source: `web/src/foo/foo.test.ts` or `mobile/src/foo/foo.test.ts`
- Integration tests in `__tests__/` adjacent to the code being tested
- _No test infrastructure exists yet (ST-005)._

## Commit Messages

Use the format: `<type>: <short description>`

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

Rules:
- Every commit message must be descriptive. Never use generic messages like "Update documents" or "Update files".
- Name the files or features affected: `docs: add git conventions to conventions.md` not `docs: update documents`.
- One logical change per commit. If a phase touches multiple areas, break it into commits per area.

## Git & Branching

### Branch strategy
- `main` is the deployment branch. All work lands on `main`.
- Use feature branches (`feat/<short-name>`) only when work spans multiple sessions or needs review before merging. For single-session work, commit directly to `main`.
- Do not leave long-lived branches. Merge or delete within the session.

### Worktrees
- Claude Code worktrees (`.claude/worktrees/`) are disposable. They must be removed when the task is done.
- After completing work in a worktree: merge to `main`, remove the worktree (`git worktree remove`), delete the branch (`git branch -D`), and delete the remote branch if pushed (`git push origin --delete`).
- Run `git worktree prune` if worktree directories were deleted manually.

### Hygiene
- Before starting a session, check `git branch -a` and `git worktree list`. Clean up anything stale.
- Never force-push to `main`.
- Do not commit `.env`, credentials, or secrets. Check `.env.example` is up to date instead.

## iOS Builds

### Pre-build checklist
- Confirm the build number in `mobile/app.json` is incremented beyond the last uploaded build before archiving.

### Archive naming
- Include the build number in the archive path: `StormTrackRxDev-build12.xcarchive` (staging) or `StormTrackRx-build12.xcarchive` (production).
- Never reuse a fixed archive path — each build must have its own archive so previous builds are preserved.

## Environment Variables

Document all required env vars in `.env.example`. Never commit `.env`.
