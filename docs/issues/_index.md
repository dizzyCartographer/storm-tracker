# Issue Index

Auto-generated from YAML frontmatter in issue files. Do not edit manually.

---

## In Progress

_(none)_

## On Stage (built, awaiting merge/verification)

| ID | Title | Type | Priority | Components |
|----|-------|------|----------|------------|
| ST-051 | Set app icon from brand SVG | enhancement | high | mobile, theming |
| ST-052 | Add branded splash screen | enhancement | high | mobile, theming |
| ST-053 | Add "Create Account" option to sign-in screen | enhancement | high | mobile, auth |
| ST-055 | Make AI Journal a proper tab screen with persistent tab bar | bug | high | mobile, navigation |
| ST-065 | Behavior checklist not displaying on mobile log screen | bug | high | mobile, log |
| ST-067 | Dynamic app icon per build profile (dev vs production) | enhancement | high | mobile, infrastructure, theming |
| ST-054 | Remove "Import Journal" from hamburger menu | enhancement | medium | mobile, navigation |
| ST-056 | Fix AI Journal page title and redundant header | bug | medium | mobile, navigation |

## Open — Now

| ID | Title | Type | Priority | Urgency | Components |
|----|-------|------|----------|---------|------------|
| ST-074 | Wave graph chart on Vite reports page displays no data | bug | high | now | web, reports, scoring |

## Open — Soon

| ID | Title | Type | Priority | Urgency | Components |
|----|-------|------|----------|---------|------------|
| ST-039 | Reports and wave graph on mobile | enhancement | high | soon | mobile, reports |
| ST-040 | Full projects CRUD on mobile | enhancement | high | soon | mobile, projects |
| ST-043 | Offline mode with read cache and write queue | enhancement | high | soon | mobile |
| ST-061 | Invite link acceptance on mobile | enhancement | high | soon | mobile, projects, auth |
| ST-062 | Email-based invites with member name resolution | enhancement | high | soon | projects, auth, mobile, web |
| ST-064 | Fix premature "no data" messages during loading | bug | high | soon | mobile, dashboard |
| ST-071 | Delete old Next.js source code and Prisma dependencies | tech-debt | high | soon | web, infrastructure |
| ST-004 | Database grants for Neon Data API not in a Prisma migration | tech-debt | medium | soon | infrastructure |
| ST-016 | Dismiss signals, episodes, predictions, and suggestions on dashboard | enhancement | medium | soon | dashboard |
| ST-017 | Minimal design polish | enhancement | medium | soon | theming, mobile |
| ST-048 | Finalize mobile design system / component library decision | tech-debt | medium | soon | mobile, theming |
| ST-059 | PDF report generation on mobile | enhancement | medium | soon | mobile, reports |
| ST-063 | iPad layout adaptation | enhancement | medium | soon | mobile, theming |
| ST-066 | Mobile project edit form UX parity with web | enhancement | medium | soon | mobile, projects |
| ST-068 | Remove debug error handler from web auth serverless function | tech-debt | medium | soon | web, auth |
| ST-073 | Surface actual error messages in mobile save/load failures | enhancement | medium | soon | mobile |

## Open — Low Urgency

| ID | Title | Type | Priority | Urgency | Components |
|----|-------|------|----------|---------|------------|
| ST-005 | No automated test coverage | tech-debt | high | low | scoring, infrastructure, auth |
| ST-006 | Scoring algorithm not clinically validated | tech-debt | high | low | scoring |
| ST-035 | Apple Sign In | enhancement | high | low | mobile, auth |
| ST-036 | Push notifications for logging reminders | enhancement | high | low | mobile |
| ST-045 | App icons, splash screen, and App Store screenshots | enhancement | high | low | mobile, theming |
| ST-046 | Privacy policy for health-adjacent data | enhancement | high | low | infrastructure |
| ST-047 | App Store submission and review | enhancement | high | low | mobile |
| ST-011 | Project read-only view | enhancement | medium | low | projects |
| ST-012 | Project info in clinician PDF export | enhancement | medium | low | reports, projects |
| ST-013 | Track normal/positive behavior and encourage good days | enhancement | medium | low | log, dashboard |
| ST-015 | Variable novelty notification system for ND parent retention | enhancement | medium | low | mobile |
| ST-019 | AI qualitative summary in clinician reports | enhancement | medium | low | reports |
| ST-020 | AI voice logging — talk to app, auto-tabulate observations | enhancement | medium | low | log, journal-import, mobile |
| ST-021 | Parental goals and positive behavior tracking | enhancement | medium | low | projects, log |
| ST-024 | Calendar, reminders, and voice memo integration | enhancement | medium | low | mobile |
| ST-025 | Home screen widget for quick entry | enhancement | medium | low | mobile, log |
| ST-028 | Caregiver self mental health tracking | enhancement | medium | low | projects, log |
| ST-029 | Cite sources on diagnostic criteria | enhancement | medium | low | reference, scoring |
| ST-037 | Camera for photo/document attachments | enhancement | medium | low | mobile, documents |
| ST-038 | Face ID / Touch ID biometric auth | enhancement | medium | low | mobile, auth |
| ST-041 | Medications and strategies management on mobile | enhancement | medium | low | mobile, medications, strategies |
| ST-049 | Define color palette and typography system | enhancement | medium | low | theming |
| ST-057 | Diagnostic reference page on mobile | enhancement | medium | low | mobile, reference |
| ST-058 | Document attachments on mobile entries | enhancement | medium | low | mobile, documents |
| ST-069 | Remove unused _auth-config.ts from web serverless functions | tech-debt | low | low | web, auth |
| ST-014 | Christian theme toggle with theology of mental illness framework | enhancement | low | low | theming |
| ST-018 | Customizable report content and format | enhancement | low | low | reports |
| ST-022 | Add descriptions of people connected to the teen | enhancement | low | low | projects |
| ST-023 | Flexible kid/teen terminology throughout app | enhancement | low | low | navigation, projects |
| ST-026 | Multiple entries per day feeding into daily entry | enhancement | low | low | log |
| ST-027 | Private caregiver notes not shared with other caregivers | enhancement | low | low | log, auth |
| ST-030 | Research-based resources page for caregivers | enhancement | low | low | reference |
| ST-031 | About page with creator worldview | enhancement | low | low | navigation |
| ST-032 | Group projects to see cross-impact between family members | enhancement | low | low | projects, reports |
| ST-033 | Adult self-tracking project option | enhancement | low | low | projects |
| ST-034 | Track source of strategy (child, parent, teacher, etc.) | enhancement | low | low | strategies |
| ST-042 | Document library on mobile | enhancement | low | low | mobile, documents |
| ST-044 | HealthKit integration for menstrual data | enhancement | low | low | mobile, log |

## Deferred

| ID | Title | Type | Priority | Components |
|----|-------|------|----------|------------|
| ST-007 | Menstrual cycle overlay on wave graph | enhancement | medium | reports |
| ST-008 | Privacy controls — teen vs caregiver data separation | enhancement | medium | auth, projects |
| ST-009 | Onboarding flow for new accounts and projects | enhancement | medium | projects, auth, scoring |
| ST-010 | Project selection should persist across pages | enhancement | medium | dashboard, history, reports, navigation |

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

---

**Total: 74 issues** (0 in progress, 8 on stage, 1 open-now, 16 open-soon, 38 open-low, 4 deferred, 3 superseded, 4 done)
