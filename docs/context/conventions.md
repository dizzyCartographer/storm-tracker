# Conventions

## Code Style

_Fill in as the project establishes norms._

## Data & API Architecture

See `docs/context/architecture-standards.md` for the full reference. Key points for this project:

### ⚠️ Existing code is not a reference architecture.

The current codebase contains TypeScript-based computation on read paths (episode detection, prodrome signals, predictions, suggestions), custom API endpoints for mobile, and server actions that bypass RLS. **These patterns are architectural debt, not examples to follow.** Do not replicate, extend, or build on top of them. New features must follow the conventions below. When in doubt, these conventions override whatever the existing code does.

### Computation happens at write time. Always.

When business logic produces a result (classification, score, episode, signal, prediction, suggestion, discrepancy), that result is persisted to the database in its own column or table at the moment the input data is written. Read paths never run computation. Read paths query stored data. No exceptions.

### All reads and writes go through Neon Data API.

Both web and mobile are clients of the same Neon Data API. Authentication is via JWT. Authorization is via Postgres RLS. No Next.js API routes for data access. No server action wrappers around queries. The database is the API.

_Note: The web app currently uses server actions and Prisma (which bypass RLS). New features should use Neon Data API. Existing server actions will be migrated over time._

### Computation lives in Postgres.

Scoring, classification, episode detection, and all derived data should be computed by Postgres triggers and functions that fire on insert/update. This eliminates the need for custom write endpoints — even writes that require computation go through Neon Data API, and Postgres handles the logic.

_Note: Computation currently lives in TypeScript (scoring engine, episode detection). These will be migrated to Postgres functions as part of Phase 20. Until then, the TypeScript implementations are legacy — do not use them as patterns for new features._

### No custom API endpoints.

Do not create Next.js API routes under `/api/mobile/` or anywhere else for data access. If you're about to create a GET route, the data should already be in the database — read it via Neon Data API. If you're about to create a POST route, ask whether the computation can be a Postgres trigger instead.

### RLS is the only authorization layer.

Do not write permission checks in application code for data access. RLS policies on every table enforce tenant isolation and ownership. The JWT carries the user ID. Postgres handles the rest.

### New tables get RLS policies immediately.

When adding a new model/table, add RLS policies in the same migration. No table should exist without RLS.

### When these conventions conflict with existing code, the conventions win.

Do not look at an existing server action, API route, or TypeScript analysis module and conclude "this is how the app does it." The existing patterns predate these conventions. If you find yourself writing a custom endpoint, a server-side query wrapper, or computation on a read path because "that's what the other code does" — stop. Re-read this document.

## File & Folder Naming

- `kebab-case` for files and directories
- One module per file; name the file after the primary export

## Testing

- Unit tests co-located with source: `src/foo/foo.test.ts`
- Integration tests in `src/__tests__/`

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

## Environment Variables

Document all required env vars in `.env.example`. Never commit `.env`.
