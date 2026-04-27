# Issue Index

Auto-generated from YAML frontmatter in issue files. Do not edit manually.

---

## In Progress

_None._

## On Stage (built, awaiting merge/verification)

| ID | Title | Type | Urgency | Phase | Components |
|----|-------|------|---------|-------|------------|
| ST-051 | Set app icon from brand SVG | enhancement | low | A | mobile, theming |
| ST-052 | Add branded splash screen | enhancement | low | A | mobile, theming |
| ST-053 | Add "Create Account" option to sign-in screen | enhancement | low | A | mobile, auth |
| ST-054 | Remove "Import Journal" from hamburger menu | enhancement | low | A | mobile, navigation |
| ST-055 | Make AI Journal a proper tab screen with persistent tab bar | bug | low | A | mobile, navigation |
| ST-056 | Fix AI Journal page title and redundant header | bug | low | A | mobile, navigation |
| ST-065 | Behavior checklist not displaying on mobile log screen | bug | medium | A | mobile, log |
| ST-067 | Dynamic app icon per build profile (dev vs production) | enhancement | low | A | mobile, infrastructure, theming |
| ST-071 | Delete old Next.js source code and Prisma dependencies | tech-debt | high | A | web, infrastructure |

## Phase A: Core Stability

*The app works reliably for one caregiver.*

| ID | Title | Type | Urgency | Components |
|----|-------|------|---------|------------|
| ST-064 | Fix premature "no data" messages during loading | bug | medium | mobile, dashboard |
| ST-073 | Surface actual error messages in mobile save/load failures | enhancement | medium | mobile |
| ST-076 | Switch from Prisma to dbmate for database migrations | tech-debt | low | infrastructure |
| ST-004 | Database grants for Neon Data API not in a migration | tech-debt | low | infrastructure |
| ST-068 | Remove debug error handler from web auth serverless function | tech-debt | low | web, auth |
| ST-069 | Remove unused _auth-config.ts from web serverless functions | tech-debt | low | web, auth |

## Phase B: Feature Complete (Solo Caregiver)

*One caregiver can do everything the app promises: log, analyze, report, manage — without wifi anxiety.*

| ID | Title | Type | Urgency | Components |
|----|-------|------|---------|------------|
| ST-039 | Reports and wave graph on mobile | enhancement | low | mobile, reports |
| ST-040 | Full projects CRUD on mobile | enhancement | low | mobile, projects |
| ST-041 | Medications and strategies management on mobile | enhancement | low | mobile, medications, strategies |
| ST-043 | Offline mode with read cache and write queue | enhancement | low | mobile |
| ST-059 | PDF report generation on mobile | enhancement | low | mobile, reports |
| ST-066 | Mobile project edit form UX parity with web | enhancement | low | mobile, projects |
| ST-013 | Track normal/positive behavior and encourage good days | enhancement | low | log, dashboard |
| ST-016 | Dismiss signals, episodes, predictions, and suggestions on dashboard | enhancement | low | dashboard |
| ST-017 | Minimal design polish | enhancement | low | theming, mobile |
| ST-048 | Finalize mobile design system / component library decision | tech-debt | low | mobile, theming |
| ST-049 | Define color palette and typography system | enhancement | low | theming |

## Phase C: Multi-User & Privacy

*Multiple caregivers and the teen can participate safely.*

| ID | Title | Type | Urgency | Components |
|----|-------|------|---------|------------|
| ST-008 | Privacy controls — teen vs caregiver data separation | enhancement | low | auth, projects |
| ST-009 | Onboarding flow for new accounts and projects | enhancement | low | projects, auth, scoring |
| ST-061 | Invite link acceptance on mobile | enhancement | low | mobile, projects, auth |
| ST-062 | Email-based invites with member name resolution | enhancement | low | projects, auth, mobile, web |
| ST-011 | Project read-only view | enhancement | low | projects |
| ST-027 | Private caregiver notes not shared with other caregivers | enhancement | low | log, auth |
| ST-022 | Add descriptions of people connected to the teen | enhancement | low | projects |

## Phase D: Clinical Review & Validation

*The scoring, episode detection, and framework logic are reviewed and tested before public release.*

| ID | Title | Type | Urgency | Components |
|----|-------|------|---------|------------|
| ST-005 | No automated test coverage | tech-debt | low | scoring, infrastructure, auth |
| ST-006 | Scoring algorithm not clinically validated | tech-debt | low | scoring |
| ST-029 | Cite sources on diagnostic criteria | enhancement | low | reference, scoring |
| ST-057 | Diagnostic reference page on mobile | enhancement | low | mobile, reference |
| ST-012 | Project info in clinician PDF export | enhancement | low | reports, projects |

## Phase E: App Store Submission

*Everything required to pass Apple review and be publicly available.*

| ID | Title | Type | Urgency | Components |
|----|-------|------|---------|------------|
| ST-035 | Apple Sign In | enhancement | low | mobile, auth |
| ST-036 | Push notifications for logging reminders | enhancement | low | mobile |
| ST-045 | App icons, splash screen, and App Store screenshots | enhancement | low | mobile, theming |
| ST-046 | Privacy policy for health-adjacent data | enhancement | low | infrastructure |
| ST-047 | App Store submission and review | enhancement | low | mobile |
| ST-038 | Face ID / Touch ID biometric auth | enhancement | low | mobile, auth |
| ST-063 | iPad layout adaptation | enhancement | low | mobile, theming |

## Phase F: Growth & Enhancement

*Post-launch features that deepen the product and serve the broader community.*

| ID | Title | Type | Components |
|----|-------|------|------------|
| ST-014 | Christian theme toggle with theology of mental illness framework | enhancement | theming |
| ST-015 | Variable novelty notification system for ND parent retention | enhancement | mobile |
| ST-018 | Customizable report content and format | enhancement | reports |
| ST-019 | AI qualitative summary in clinician reports | enhancement | reports |
| ST-020 | AI voice logging — talk to app, auto-tabulate observations | enhancement | log, journal-import, mobile |
| ST-021 | Parental goals and positive behavior tracking | enhancement | projects, log |
| ST-023 | Flexible kid/teen terminology throughout app | enhancement | navigation, projects |
| ST-024 | Calendar, reminders, and voice memo integration | enhancement | mobile |
| ST-025 | Home screen widget for quick entry | enhancement | mobile, log |
| ST-026 | Multiple entries per day feeding into daily entry | enhancement | log |
| ST-028 | Caregiver self mental health tracking | enhancement | projects, log |
| ST-030 | Research-based resources page for caregivers | enhancement | reference |
| ST-031 | About page with creator worldview | enhancement | navigation |
| ST-032 | Group projects to see cross-impact between family members | enhancement | projects, reports |
| ST-033 | Adult self-tracking project option | enhancement | projects |
| ST-034 | Track source of strategy (child, parent, teacher, etc.) | enhancement | strategies |
| ST-037 | Camera for photo/document attachments | enhancement | mobile, documents |
| ST-042 | Document library on mobile | enhancement | mobile, documents |
| ST-044 | HealthKit integration for menstrual data | enhancement | mobile, log |
| ST-058 | Document attachments on mobile entries | enhancement | mobile, documents |

## Deferred

| ID | Title | Type | Components |
|----|-------|------|------------|
| ST-007 | Menstrual cycle overlay on wave graph | enhancement | reports |

## Needs Verification

| ID | Title | Notes |
|----|-------|-------|
| ST-010 | Project selection should persist across pages | User reports this seems to work now. Verify and close if fixed, or move to Phase B. |

## Superseded

| ID | Title | Superseded By | Components |
|----|-------|---------------|------------|
| ST-001 | Web data layer bypasses RLS (server actions + Prisma) | ST-060 | web, infrastructure, auth |
| ST-002 | Remove recomputation from web read paths | ST-060 | web, dashboard, reports, history |
| ST-003 | Custom GET endpoints should use Neon Data API | ST-060 | mobile, infrastructure |

## Done

| ID | Title | Type | Components |
|----|-------|------|------------|
| ST-050 | Local Xcode build workflow | enhancement | mobile, infrastructure |
| ST-060 | Rewrite web app from Next.js to Vite SPA | tech-debt | web, infrastructure |
| ST-070 | Sync main with staging after mobile rebuild fixes | chore | infrastructure |
| ST-072 | Fix entry upsert via PostgREST on_conflict parameter | bug | infrastructure, mobile, web |
| ST-074 | Wave graph chart on Vite reports page displays no data | bug | web, reports, scoring |

---

**Total: 74 issues** (0 in progress, 9 on stage, 6 Phase A, 11 Phase B, 7 Phase C, 5 Phase D, 7 Phase E, 20 Phase F, 1 deferred, 1 needs verification, 3 superseded, 5 done)
