# Conventions

## Code Style

_Fill in as the project establishes norms._

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
