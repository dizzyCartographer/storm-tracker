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

## Environment Variables

Document all required env vars in `.env.example`. Never commit `.env`.
