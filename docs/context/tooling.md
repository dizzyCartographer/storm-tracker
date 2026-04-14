# Tooling

## ContextStore

**What it is:** An AI-native Markdown editor (macOS app, beta) with built-in GitHub auto-sync. Used for editing context files, issues, and project documentation outside of Claude Code. Website: https://contextstore.app

**Why it's valuable:** Context engineering is central to how this project works — `docs/context/` files define every architectural decision, convention, and requirement. ContextStore provides a dedicated editing environment for these files with live preview and automatic git sync, so the user can manage project context without needing to use a code editor or terminal. It's the primary tool for reading, writing, and organizing the markdown files that Claude Code loads every session.

**Role in the workflow:** The user edits context and issue files in ContextStore. Claude Code edits application code and sometimes context files. Both operate on the same repo. ContextStore's auto-sync keeps its view current with what Claude Code pushes, and vice versa.

### Configuration

**Space root:** `docs/`
ContextStore is scoped to the `docs/` subdirectory, not the repo root. This prevents it from displaying or accidentally interacting with application source code (`src/`, `mobile/src/`, `prisma/`, etc.). The UI only shows `.md` files, but the git sync operates on the full repo — scoping the root reduces noise and risk.

**Default branch:** `staging`
Matches the project's staging-first workflow. All changes go to `staging` first, get verified, then merge to `main`. ContextStore syncs to `staging` so edits land in the right place without manual branch management.

**Sync mode:** Auto-sync enabled.
ContextStore automatically pulls and pushes changes. This keeps the user's view current when Claude Code pushes doc changes, and pushes the user's edits so Claude Code sees them on the next session.

### File Layout

```
.contextstore/           # ContextStore config (repo root)
├── settings.yml         # Space name, root, default branch
├── settings.local.yml   # Local-only settings (sync mode)
├── templates/           # File templates
│   └── blank.md
└── logo.png

docs/.csignore           # ContextStore ignore file (scoped to space root)
docs/CLAUDE.md           # Symlink → ../CLAUDE.md (so ContextStore can edit it)
mobile/docs              # Symlink → ../docs (so Xcode's Claude can see context)
```

### Symlinks

Two symlinks exist to bridge ContextStore's scoped root and Xcode's project scope:

| Symlink | Target | Purpose |
|---------|--------|---------|
| `docs/CLAUDE.md` | `../CLAUDE.md` | ContextStore's root is `docs/`, but `CLAUDE.md` lives at the repo root. The symlink makes it visible and editable in ContextStore. Edits go to the real file. |
| `mobile/docs` | `../docs` | Xcode's Claude AI integration only sees files within the `mobile/` directory. The symlink gives it access to context files and issues when working on iOS code. Lost on `expo prebuild --clean` — recreate if needed. |

### Known Behaviors

- **Git sync clones the full repo.** Even with the space root set to `docs/`, the git integration clones the entire repository. The `docs/.csignore` and space root setting control what's displayed, not what's synced.

- **Disconnecting removes the git remote URL.** If ContextStore's git sync is disconnected from the UI, it removes the `origin` remote from `.git/config`. Restore with: `git remote add origin https://github.com/dizzyCartographer/storm-tracker.git`

- **YAML frontmatter rendering.** ContextStore may display YAML frontmatter differently than raw markdown preview. If frontmatter looks wrong in ContextStore but correct in a markdown previewer, it's a ContextStore rendering issue — file the feedback via TestFlight.

### Troubleshooting

**"Space already exists" error on setup:**
Delete `.contextstore/` directory and recreate the space from ContextStore's UI.

**Files duplicated into `docs/`:**
If ContextStore copies repo-root files (like `src/`, `package.json`) into `docs/`, it's likely a space reset gone wrong. Delete the duplicates manually — only `archive/`, `branding/`, `context/`, and `issues/` belong in `docs/`.

**`CLAUDE.md` not visible in ContextStore:**
Check that the `docs/CLAUDE.md` symlink exists: `ls -la docs/CLAUDE.md`. If missing, recreate: `ln -s ../CLAUDE.md docs/CLAUDE.md`. Also check `docs/.csignore` isn't excluding `CLAUDE.md`.
