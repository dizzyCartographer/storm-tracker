# Storm Tracker — Issue Tracker

Each issue is a `.md` file in this directory with YAML frontmatter. This index is auto-generated from frontmatter whenever issues are created or modified.

**Status key:** open | in-progress | on-stage | done | deferred
**Urgency key:** blocking | soon | low
**Type key:** bug | enhancement | tech-debt

---

## Blocking

| ID | Title | Type | Status | Priority | Components | Created |
|----|-------|------|--------|----------|------------|---------|
| [ST-050](ST-050-local-xcode-build-workflow.md) | Set up local Xcode build workflow | enhancement | done | high | mobile, infrastructure | 2026-04-10 |
| [ST-065](ST-065-behavior-checklist-not-displaying.md) | Behavior checklist not displaying on mobile log screen | bug | on-stage | high | mobile, log | 2026-04-11 |

## Soon

| ID | Title | Type | Status | Priority | Components | Created |
|----|-------|------|--------|----------|------------|---------|
| [ST-004](ST-004-database-grants-not-in-migration.md) | Database grants not in Prisma migration | tech-debt | open | medium | infrastructure | 2026-04-08 |
| [ST-010](ST-010-project-selection-persistence.md) | Project selection persistence across pages | enhancement | deferred | medium | dashboard, history, reports, navigation | 2026-04-07 |
| [ST-016](ST-016-dismissable-dashboard-items.md) | Dismiss signals/episodes/predictions on dashboard | enhancement | open | medium | dashboard | 2026-04-10 |
| [ST-017](ST-017-minimal-design-polish.md) | Minimal design polish | enhancement | open | medium | theming, mobile | 2026-04-10 |
| [ST-039](ST-039-mobile-reports-wave-graph.md) | Reports and wave graph on mobile | enhancement | open | high | mobile, reports | 2026-04-10 |
| [ST-040](ST-040-mobile-projects-crud.md) | Full projects CRUD on mobile | enhancement | open | high | mobile, projects | 2026-04-10 |
| [ST-048](ST-048-design-system-library-selection.md) | Finalize mobile design system library decision | tech-debt | open | medium | mobile, theming | 2026-04-10 |
| [ST-051](ST-051-set-app-icon.md) | Set app icon from brand SVG | enhancement | on-stage | high | mobile, theming | 2026-04-10 |
| [ST-052](ST-052-splash-screen.md) | Add branded splash screen | enhancement | on-stage | high | mobile, theming | 2026-04-10 |
| [ST-053](ST-053-create-account-sign-in.md) | Add "Create Account" option to sign-in screen | enhancement | on-stage | high | mobile, auth | 2026-04-10 |
| [ST-054](ST-054-remove-import-journal-hamburger.md) | Remove "Import Journal" from hamburger menu | enhancement | on-stage | medium | mobile, navigation | 2026-04-10 |
| [ST-055](ST-055-ai-journal-tab-navigation.md) | Make AI Journal a proper tab screen with persistent tab bar | bug | on-stage | high | mobile, navigation | 2026-04-10 |
| [ST-056](ST-056-ai-journal-title-header-redundancy.md) | Fix AI Journal page title and redundant header | bug | on-stage | medium | mobile, navigation | 2026-04-10 |
| [ST-059](ST-059-mobile-pdf-reports.md) | PDF report generation on mobile | enhancement | open | medium | mobile, reports | 2026-04-11 |
| [ST-061](ST-061-mobile-invite-acceptance.md) | Invite link acceptance on mobile | enhancement | open | high | mobile, projects, auth | 2026-04-11 |
| [ST-062](ST-062-email-invites-member-names.md) | Email-based invites with member name resolution | enhancement | open | high | projects, auth, mobile, web | 2026-04-11 |
| [ST-063](ST-063-ipad-layout.md) | iPad layout adaptation | enhancement | open | medium | mobile, theming | 2026-04-11 |
| [ST-064](ST-064-loading-state-premature-display.md) | Fix premature "no data" messages during loading | bug | open | high | mobile, dashboard | 2026-04-11 |
| [ST-066](ST-066-mobile-project-edit-ux.md) | Mobile project edit form UX parity with web | enhancement | open | medium | mobile, projects | 2026-04-11 |
| [ST-067](ST-067-dynamic-app-icon-per-build-profile.md) | Dynamic app icon per build profile (dev vs production) | enhancement | on-stage | high | mobile, infrastructure, theming | 2026-04-13 |
| [ST-043](ST-043-offline-queue.md) | Offline mode with read cache and write queue | enhancement | open | high | mobile | 2026-04-10 |

## Low Urgency — High Priority

| ID | Title | Type | Status | Priority | Components | Created |
|----|-------|------|--------|----------|------------|---------|
| [ST-001](ST-001-web-data-layer-bypasses-rls.md) | Web data layer bypasses RLS | tech-debt | open | high | web, infrastructure, auth | 2026-04-07 |
| [ST-002](ST-002-remove-web-recomputation.md) | Remove recomputation from web read paths | tech-debt | open | high | web, dashboard, reports, history | 2026-04-07 |
| [ST-005](ST-005-no-automated-test-coverage.md) | No automated test coverage | tech-debt | open | high | scoring, infrastructure, auth | 2026-04-07 |
| [ST-006](ST-006-scoring-not-clinically-validated.md) | Scoring algorithm not clinically validated | tech-debt | open | high | scoring | 2026-04-07 |
| [ST-035](ST-035-apple-sign-in.md) | Apple Sign In | enhancement | open | high | mobile, auth | 2026-04-10 |
| [ST-036](ST-036-push-notifications.md) | Push notifications for logging reminders | enhancement | open | high | mobile | 2026-04-10 |
| [ST-045](ST-045-app-icons-splash-screenshots.md) | App icons, splash screen, screenshots | enhancement | open | high | mobile, theming | 2026-04-10 |
| [ST-046](ST-046-privacy-policy.md) | Privacy policy for health-adjacent data | enhancement | open | high | infrastructure | 2026-04-10 |
| [ST-047](ST-047-app-store-submission.md) | App Store submission and review | enhancement | open | high | mobile | 2026-04-10 |
| [ST-060](ST-060-vite-web-rewrite.md) | Rewrite web app from Next.js to Vite SPA | tech-debt | open | high | web, infrastructure | 2026-04-11 |

## Low Urgency — Medium Priority

| ID | Title | Type | Status | Priority | Components | Created |
|----|-------|------|--------|----------|------------|---------|
| [ST-003](ST-003-custom-get-endpoints-neon-migration.md) | Custom GET endpoints → Neon Data API | tech-debt | open | medium | mobile, infrastructure | 2026-04-07 |
| [ST-007](ST-007-menstrual-cycle-overlay.md) | Menstrual cycle overlay on wave graph | enhancement | deferred | medium | reports | 2026-04-07 |
| [ST-008](ST-008-privacy-controls.md) | Privacy controls (teen/caregiver separation) | enhancement | deferred | medium | auth, projects | 2026-04-07 |
| [ST-009](ST-009-onboarding-flow.md) | Onboarding flow for accounts and projects | enhancement | deferred | medium | projects, auth, scoring | 2026-04-07 |
| [ST-011](ST-011-project-read-only-view.md) | Project read-only view | enhancement | open | medium | projects | 2026-04-07 |
| [ST-012](ST-012-project-info-in-clinician-pdf.md) | Project info in clinician PDF export | enhancement | open | medium | reports, projects | 2026-04-07 |
| [ST-013](ST-013-track-positive-behavior.md) | Track normal/positive behavior | enhancement | open | medium | log, dashboard | 2026-04-10 |
| [ST-015](ST-015-novelty-notifications-nd-parents.md) | Variable novelty notifications for ND parents | enhancement | open | medium | mobile | 2026-04-10 |
| [ST-019](ST-019-ai-qualitative-summary-reports.md) | AI qualitative summary in reports | enhancement | open | medium | reports | 2026-04-10 |
| [ST-020](ST-020-ai-voice-logging.md) | AI voice logging | enhancement | open | medium | log, journal-import, mobile | 2026-04-10 |
| [ST-021](ST-021-parental-goals-tracking.md) | Parental goals tracking | enhancement | open | medium | projects, log | 2026-04-10 |
| [ST-024](ST-024-calendar-reminders-voice-integration.md) | Calendar/reminders/voice integration | enhancement | open | medium | mobile | 2026-04-10 |
| [ST-025](ST-025-home-screen-widget.md) | Home screen widget | enhancement | open | medium | mobile, log | 2026-04-10 |
| [ST-028](ST-028-caregiver-self-tracking.md) | Caregiver self mental health tracking | enhancement | open | medium | projects, log | 2026-04-10 |
| [ST-029](ST-029-cite-diagnostic-sources.md) | Cite diagnostic criteria sources | enhancement | open | medium | reference, scoring | 2026-04-10 |
| [ST-037](ST-037-camera-attachments.md) | Camera for attachments | enhancement | open | medium | mobile, documents | 2026-04-10 |
| [ST-038](ST-038-face-id-touch-id.md) | Face ID / Touch ID | enhancement | open | medium | mobile, auth | 2026-04-10 |
| [ST-041](ST-041-mobile-medications-strategies.md) | Medications/strategies on mobile | enhancement | open | medium | mobile, medications, strategies | 2026-04-10 |
| [ST-049](ST-049-color-typography-system.md) | Define color palette and typography | enhancement | open | medium | theming | 2026-04-10 |
| [ST-057](ST-057-mobile-diagnostic-reference.md) | Diagnostic reference page on mobile | enhancement | open | medium | mobile, reference | 2026-04-11 |
| [ST-058](ST-058-mobile-document-attachments.md) | Document attachments on mobile entries | enhancement | open | medium | mobile, documents | 2026-04-11 |

## Low Urgency — Low Priority

| ID | Title | Type | Status | Priority | Components | Created |
|----|-------|------|--------|----------|------------|---------|
| [ST-014](ST-014-christian-theme-toggle.md) | Christian theme toggle | enhancement | open | low | theming | 2026-04-10 |
| [ST-018](ST-018-customizable-report-formats.md) | Customizable report formats | enhancement | open | low | reports | 2026-04-10 |
| [ST-022](ST-022-people-connected-to-teen.md) | People connected to teen | enhancement | open | low | projects | 2026-04-10 |
| [ST-023](ST-023-kid-teen-terminology.md) | Kid/teen terminology flexibility | enhancement | open | low | navigation, projects | 2026-04-10 |
| [ST-026](ST-026-multiple-entries-per-day.md) | Multiple entries per day | enhancement | open | low | log | 2026-04-10 |
| [ST-027](ST-027-private-caregiver-notes.md) | Private caregiver notes | enhancement | open | low | log, auth | 2026-04-10 |
| [ST-030](ST-030-research-resources-page.md) | Research resources page | enhancement | open | low | reference | 2026-04-10 |
| [ST-031](ST-031-about-page-worldview.md) | About page with worldview | enhancement | open | low | navigation | 2026-04-10 |
| [ST-032](ST-032-group-projects-cross-impact.md) | Group projects for cross-impact | enhancement | open | low | projects, reports | 2026-04-10 |
| [ST-033](ST-033-adult-self-tracking.md) | Adult self-tracking option | enhancement | open | low | projects | 2026-04-10 |
| [ST-034](ST-034-strategy-source-tracking.md) | Strategy source tracking | enhancement | open | low | strategies | 2026-04-10 |
| [ST-042](ST-042-mobile-document-library.md) | Document library on mobile | enhancement | open | low | mobile, documents | 2026-04-10 |
| [ST-044](ST-044-healthkit-menstrual.md) | HealthKit menstrual data | enhancement | open | low | mobile, log | 2026-04-10 |
