# Conventions

## Code Style

_Fill in as the project establishes norms._

## Data Persistence

Any business logic that produces a result displayed to the user MUST store that result in the database — never recompute it on the fly for display. Computed values are persisted at write time (e.g., `computedMood` and `computedScore` on Entry). If a feature detects or derives something (episodes, signals, classifications), it gets its own table or column and is written when the underlying data changes. Reports and views read stored data.

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
