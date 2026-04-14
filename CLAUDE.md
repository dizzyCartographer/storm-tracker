# Storm Tracker — Claude Context

This file is automatically loaded by Claude Code at the start of every session.

## Project Structure

```
storm-tracker/
├── src/              # All application source code
├── docs/
│   ├── context/      # Markdown files that define project context (all loaded every session)
│   │   ├── overview.md                    # Project goals, users, and use cases
│   │   ├── vision-mission.md              # Mission, vision, core values
│   │   ├── personas.md                    # User personas (caregiver, clinician, teen, co-caregiver)
│   │   ├── features.md                    # Full functional requirements
│   │   ├── architecture.md                # System design and decisions
│   │   ├── data-sources.md                # External APIs and data feeds
│   │   ├── conventions.md                 # Coding conventions and patterns
│   │   ├── diagnostic-resources.md        # Clinical scales (YMRS, KSADS-PL, GBI)
│   │   ├── development-plan.md            # Phased development roadmap
│   │   ├── branding-style-guide.md        # Style guide, colors, typography, components
│   │   ├── ui-requirements.md             # UI/UX specifications
│   │   ├── functional-requirements.md     # Functional requirements
│   │   ├── application-architecture-standards.md # Data access, computation, and modeling standards
│   │   ├── data-architecture-diagnostic-frameworks.md # Diagnostic framework data model
│   │   ├── scoring-logic.md               # Scoring & classification algorithms
│   │   ├── signals-and-suggestions.md     # Prodrome signals, predictions, caregiver suggestions
│   │   ├── system-architecture.md         # System architecture, component diagram, data flows
│   │   ├── data-architecture.md           # Full data model, RLS, triggers, persistence patterns
│   │   ├── roadmap.md                     # Current state, what's next, milestones, tech debt
│   │   ├── environment-and-deployment.md  # Environments, deployment workflow, local dev
│   │   ├── integration-config.md          # External services, credentials, URLs
│   │   ├── api-reference.md               # API endpoints, Neon Data API patterns
│   │   ├── app-purpose-and-liability-constraints.md # Purpose and liability guardrails
│   │   ├── storm-tracker-ios-conversion-plan.md # iOS conversion roadmap
│   │   ├── storm-tracker-work-log.md      # Running log of sessions, decisions, and work context
│   │   ├── tooling.md                     # Development tools (ContextStore config, symlinks)
│   │   └── feedback/                      # Corrections and process rules (auto-loaded)
│   ├── issues/       # File-based issue tracker (ST-001 through ST-050+)
│   │   └── _index.md # Auto-generated issue index (loaded every session)
│   └── archive/      # Retired context documents
└── CLAUDE.md         # This file — loaded into every Claude session
```

## How Context Works

All top-level files in `docs/context/` are the source of truth for project decisions.
Every `.md` file in `docs/context/` is loaded into every session.
Files in `docs/context/feedback/` are also loaded via the wildcard import below.
Before making significant changes, consult the relevant context files.
When adding a new context file, add an `@` import below **and** update the tree above.

@docs/context/overview\.md
@docs/context/vision-mission.md
@docs/context/personas.md
@docs/context/features.md
@docs/context/architecture.md
@docs/context/data-sources.md
@docs/context/conventions.md
@docs/context/diagnostic-resources.md
@docs/context/branding-style-guide.md
@docs/context/functional-requirements.md
@docs/context/ui-requirements.md
@docs/context/data-architecture-diagnostic-frameworks.md
@docs/context/application-architecture-standards.md
@docs/context/scoring-logic.md
@docs/context/signals-and-suggestions.md
@docs/context/system-architecture.md
@docs/context/data-architecture.md
@docs/context/roadmap.md
@docs/context/environment-and-deployment.md
@docs/context/integration-config.md
@docs/context/api-reference.md
@docs/context/storm-tracker-development-plan.md
@docs/context/storm-tracker-ios-conversion-plan.md
@docs/context/app-purpose-and-liability-constraints.md
@docs/context/storm-tracker-work-log.md
@docs/context/tooling.md
@docs/context/feedback/\*.md
@docs/issues/_index.md

## Workflow Rules

- **Commit and push after every phase.** When a development plan phase is complete, create a commit and push to `origin/staging` immediately. Do not wait for the user to ask.

- **Commit before auto-save can.** Stage and commit with a proper message immediately after completing a logical unit of work. Do not leave modified files sitting in the working tree for auto-commit to pick up. If auto-commits have already been made with generic messages, squash them into a single descriptive commit before pushing (unless already pushed to remote).

- **Descriptive commit messages only.** Never use "Update documents", "Update files", or "Add file.ts; Update file2.ts" style messages. Every commit message must follow the format in `docs/context/conventions.md`: `<type>: <description>`. Name the feature or change, not the files.

- **Clean up worktrees and branches.** After completing work in a Claude Code worktree, merge to `main`, remove the worktree, and delete the branch (local + remote). Do not leave stale branches.

- **Check git state at session start.** Run `git branch -a` and `git worktree list` early. Clean up anything left over from previous sessions before starting new work.

- **Maintain the work log.** `docs/context/storm-tracker-work-log.md` is the primary continuity mechanism across conversations. Append to it as things happen — when a decision is made, a feature is started or completed, a roadblock is discovered, or an architecture change is agreed upon. Do not wait for a session to end. The goal is that a new conversation can read this file and pick up exactly where the last one left off.

- **Update issue index on every change.** When creating, modifying, or closing an issue in `docs/issues/`, regenerate `docs/issues/_index.md` from the YAML frontmatter of all issue files. The index is loaded into every session via the `@docs/issues/_index.md` import above.
