# Storm Tracker — Claude Context

This file is automatically loaded by Claude Code at the start of every session.

## Project Structure

```
storm-tracker/
├── web/              # Vite + React SPA (client + Vercel serverless functions in web/api/)
├── mobile/           # Expo / React Native iOS app
├── prisma/           # Schema and migrations (kept until ST-076 switches migrations to dbmate)
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
│   │   ├── gender-bias-management.md      # AI interaction bias corrections (auto-loaded)
│   │   └── feedback/                      # Corrections and process rules (auto-loaded)
│   ├── issues/       # File-based issue tracker (ST-001 through ST-050+)
│   │   └── _index.md # Auto-generated issue index (loaded every session)
│   ├── requirements.md # North-star product requirements (Maria's doc — Claude proposes changes via digest, never edits)
│   ├── build-spec.md   # Buildable spec: pinned decisions, algorithms, ground-truth state, milestones, constants registry
│   ├── TEST_CASES.md   # Test bank; ⚠️ sections are safety-critical (red test = stop feature work)
│   ├── BACKLOG.md      # Ordered work queue for autonomous runs (work top-down)
│   ├── QUESTIONS.md    # Parked ambiguities & findings; Maria's inline answers are canon
│   ├── DECISIONS.md    # Decision digest (3–5 items per run); Maria's inline answers are canon
│   ├── RUNLOG.md       # Autonomous session log (per-task outcomes)
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
@docs/context/gender-bias-management.md
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

- **Read in-progress issues at session start.** The issue index (`docs/issues/_index.md`) is loaded every session. Any issue with `status: in-progress` contains an active development plan. At the start of every session, read the full issue file for each in-progress issue listed in the index. These are the current workstreams — their plans, decisions, and phase details are needed context.

## Autonomous Runs (the Moody protocol)

When running without Maria (overnight / work-hours sessions), follow this protocol on top of the Workflow Rules above.

**Authority order when documents conflict:** Maria's answers in `docs/DECISIONS.md` / `docs/QUESTIONS.md` > `docs/build-spec.md` > `docs/requirements.md` > `docs/context/*`.

### Work loop

1. At run start read `docs/BACKLOG.md`, `docs/DECISIONS.md` (any new answers become canon; note unanswered items), and the Open section of `docs/QUESTIONS.md`. On the first run of a session also read `docs/build-spec.md` §4–§6 (ground-truth state + milestones).
2. Take the **topmost unblocked task** in BACKLOG.md. Implement it. Small, focused changes only — do not refactor beyond the task's scope.
3. Run the relevant test suites (`web` npm test, `mobile` npm test, `db/tests` rig). **All green before commit.** A task without tests for its acceptance criteria is not done (once M0 test infra exists).
4. Commit per conventions (`<type>: <description>`), push to `staging` — never `main`. One logical change per commit.
5. Append a task entry to `docs/RUNLOG.md`. If the task closes an ST-issue, update the issue file and regenerate `docs/issues/_index.md`.
6. Move to the next unblocked task.

### Hard rules

- **Never guess on open decisions.** Any ambiguity, product choice, or schema question → write it to `docs/QUESTIONS.md`, mark the task `BLOCKED(Q#/D#)` in the backlog, move to the next unblocked task.
- **⚠️ Safety invariants:** a red test in TEST_CASES §1 (scoring correctness), §2 (RLS / tenant isolation), or §3 (liability language) halts feature work until fixed. Nothing ships over a red safety test.
- **⚠️ Language rules:** interpretive copy uses "possible / signal / pattern observed" — never diagnosis language; no treatment or dosage advice anywhere. Any new user-facing string with clinical implications is CLINICAL-REVIEW gated.
- **Schema changes are digest-gated.** The data model is Maria's (see `application-architecture-standards.md`). Propose in DECISIONS.md; no migration lands without an answer.
- **Scoring changes are CLINICAL-REVIEW gated** — even bug fixes change clinical output. Pin current behavior with a test first.
- **No new dependencies or external services** without a QUESTIONS/DECISIONS entry and approval.
- **No new hardcoded behavioral numbers.** New constants get a row in build-spec §8; clinical thresholds belong in the framework tables.
- **UI tasks are review-gated.** Implement, screenshot if possible, mark `NEEDS-VISUAL-REVIEW` in RUNLOG. Never iterate on aesthetics autonomously.
- **Never touch production.** No pushes to `main`, no production env vars, no production database writes. Staging-first, always.
- **Do not edit `docs/requirements.md` or `docs/build-spec.md`.** Those are Maria's documents; propose changes through the digest.

### Session end — the Decision Digest (required, every run)

Before a run window closes: commit or stash cleanly, then write two things:

1. **RUNLOG session summary** — done / blocked / needs-visual-review / suite status / next up — plus a one-paragraph pointer entry in the work log.
2. **DECISIONS.md digest** — a dated block of **3–5 legitimate decisions** ranked by how much they unblock. Each: one-line question, 2–3 concrete options with a recommended default, and what it blocks — answerable in under a minute. Never padding (if only 2 genuine decisions exist, list 2 and say so); overflow goes to QUESTIONS.md. Answers become canon; move resolved items to the Answered section with the date. An unanswered item that now blocks work may reappear once, marked ⏫ — never nag beyond that.

### Reaching Maria

If a push-notification tool is available in the session, send a one-line push (lead with what's needed and what it unblocks) when: a new digest is posted or work is fully blocked on her answer; a run window ends (session summary headline); anything needs her approval (safety, schema, new dependency, spec deviation). Never ping for routine progress.
