---
type: feedback
description: Issue tracker workflow — file-based system in docs/issues/ with YAML frontmatter
---

# Issue Tracker Process

Issues live in `docs/issues/` as individual `.md` files with YAML frontmatter. The `_index.md` file is a summary table auto-loaded into every Claude session.

## When creating a new issue:
1. Use the next sequential ST number (check existing files for the current highest)
2. File name format: `ST-NNN-kebab-case-title.md`
3. Include all YAML fields: id, title, type, status, priority, urgency, components, source, created, completed, dev-plan-ref
4. Regenerate `_index.md` sorted by urgency (blocking → soon → low) then priority (critical → high → medium → low)

## When modifying an issue:
- Update the YAML frontmatter in the issue file
- Regenerate `_index.md` to reflect the change

## When closing an issue:
- Set `status: done` and fill in `completed:` date
- Regenerate `_index.md` — done issues move to a "Completed" section at the bottom

## Valid values:
- **type:** bug, enhancement, tech-debt
- **status:** open, in-progress, done, deferred
- **priority:** critical, high, medium, low
- **urgency:** blocking, soon, low
- **source:** iterative, testflight, session, user-idea, future, ios-plan

## Components:
log, dashboard, history, reports, projects, profile, journal-import, documents, reference, scoring, medications, strategies, auth, navigation, theming, mobile, web, infrastructure
