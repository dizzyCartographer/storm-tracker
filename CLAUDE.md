# Storm Tracker — Claude Context

This file is automatically loaded by Claude Code at the start of every session.

## Project Structure

```
storm-tracker/
├── src/              # All application source code
├── docs/
│   └── context/      # Markdown files that define project context (all loaded every session)
│       ├── overview.md              # Project goals, users, and use cases
│       ├── features.md              # Full functional requirements
│       ├── architecture.md          # System design and decisions
│       ├── data-sources.md          # External APIs and data feeds
│       ├── conventions.md           # Coding conventions and patterns
│       ├── diagnostic-resources.md  # Clinical scales (YMRS, KSADS-PL, GBI)
│       ├── development-plan.md      # Phased development roadmap
│       ├── branding.md              # Style guide, colors, typography
│       └── punch-list.md            # Small refinements and polish items
└── CLAUDE.md         # This file — loaded into every Claude session
```

## How Context Works

All top-level files in `docs/context/` are the source of truth for project decisions.
Every `.md` file in `docs/context/` is loaded into every session (subdirectories are not).
Before making significant changes, consult the relevant context files.
When adding a new context file, add an `@` import below **and** update the tree above.

@docs/context/overview\.md
@docs/context/features.md
@docs/context/architecture.md
@docs/context/data-sources.md
@docs/context/conventions.md
@docs/context/diagnostic-resources.md
@docs/context/development-plan.md
@docs/context/branding.md
@docs/context/punch-list.md @docs/context/functional-requirements.md @docs/context/iterative-functional-requirements.md
