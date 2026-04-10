# Roadmap

This document summarizes where Storm Tracker is, what's next, and what tech debt needs attention. For the detailed phase-by-phase development history, see `storm-tracker-development-plan.md`. For individual tracked issues, see `docs/issues/`.

---

## Current State (as of April 2026)

### What's Built

**Web app (Next.js)** — fully functional but on legacy architecture:
- Daily logging (quick log + full behavior checklist + impairments + notes + menstrual)
- Calendar history with mood-colored dots
- Dashboard with entry cards, signals, episodes, predictions, suggestions
- PDF export for clinicians with patient info, wave graph, behavior frequency chart
- Project management (CRUD, profiles, medications, strategies)
- Document attachments (Vercel Blob)
- Diagnostic reference page (public, no auth)
- User profile management

**Mobile app (Expo/React Native)** — primary development target:
- Sign in / sign up
- Dashboard with entry cards, signals, episodes, suggestions
- Daily log form (behaviors, impairments, missed meds, strategies, notes)
- AI journal import (3-step: paste → AI parse → review → save)
- Calendar history
- Entry detail (read-only) + edit
- Projects list + detail + edit
- Profile
- Mint/teal theme with React Native Paper

**Backend:**
- Neon Postgres with RLS on all 24 tables
- Postgres triggers for all scoring and analysis (write-time computation)
- Better Auth with Expo + JWT + nextCookies plugins
- Neon Data API for mobile reads
- Diagnostic framework system (database-driven, extensible)

**Infrastructure:**
- Production: Vercel + Neon main branch
- Staging: Vercel preview + Neon staging branch
- TestFlight pipeline via EAS Build (5 builds submitted)
- Local Xcode build workflow available (ST-050)

---

## What's Next

### Immediate (blocking or soon)

| Issue | What | Why |
|-------|------|-----|
| ST-050 | Local Xcode build workflow | Eliminate EAS queue times and build ceilings |
| ST-040 | Full projects CRUD on mobile | Can't manage projects from mobile yet |
| ST-039 | Reports + wave graph on mobile | Core feature missing from mobile |
| ST-017 | Minimal design polish | App needs to feel more polished for beta |
| ST-016 | Dismissable dashboard items | Dashboard clutter from non-actionable signals |
| ST-048 | Finalize UI library decision | React Native Paper may not be the long-term choice |

### Before App Store Submission

| Issue | What | Why |
|-------|------|-----|
| ST-035 | Apple Sign In | Required by Apple for apps with third-party sign-in |
| ST-036 | Push notifications | Core engagement feature for daily logging reminders |
| ST-045 | App icons, splash, screenshots | Required for App Store listing |
| ST-046 | Privacy policy | Required for health-adjacent data |
| ST-047 | App Store submission | The goal |
| ST-005 | Automated test coverage | Can't ship health app without tests |
| ST-006 | Clinical validation of scoring | Liability concern — DSM-5 mappings need clinician review |

### High-Value Enhancements

| Issue | What | Why |
|-------|------|-----|
| ST-013 | Track positive behavior | Clinicians need baseline, not just crisis data |
| ST-015 | Novelty notifications for ND parents | Retention strategy for target user |
| ST-019 | AI qualitative summary in reports | Structured data + narrative = better clinical communication |
| ST-020 | AI voice logging | Lowest-friction entry method for exhausted caregivers |
| ST-041 | Medications/strategies on mobile | Treatment tracking only available on web |
| ST-043 | Offline queue | Mobile must work without connectivity |

---

## Tech Debt Priorities

These are architectural issues that increase risk or block features. Ordered by impact.

### Critical (before public release)

| Issue | What | Impact |
|-------|------|--------|
| ST-005 | No automated tests | Regressions in scoring/RLS go undetected |
| ST-006 | Unvalidated scoring algorithm | Liability — DSM-5 mappings may be incorrect |
| ST-001 | Web bypasses RLS | Any server action bug could leak tenant data |

### Important (before scaling)

| Issue | What | Impact |
|-------|------|--------|
| ST-002 | Web recomputes on read | Inconsistency between web and mobile display |
| ST-004 | DB grants not in migration | New environments get 403 errors from Neon Data API |
| ST-003 | Custom GET endpoints | Maintenance burden, bypasses RLS |
| ST-048 | UI library not finalized | May need to rewrite UI components |

### Low Urgency

| Issue | What | Impact |
|-------|------|--------|
| ST-010 | Project selection not persistent | UX friction — selection resets on navigation |
| ST-049 | Color/typography not formalized | Inconsistency risk as app grows |

---

## Feature Categories

### Logging & Entry
ST-013, ST-020, ST-025, ST-026, ST-037, ST-044

### Analysis & Reporting
ST-007, ST-019, ST-039

### Project Management
ST-008, ST-009, ST-011, ST-012, ST-021, ST-022, ST-028, ST-032, ST-033, ST-040

### Mobile Native Features
ST-035, ST-036, ST-038, ST-043

### Design & Theming
ST-014, ST-017, ST-045, ST-048, ST-049

### Infrastructure
ST-001, ST-002, ST-003, ST-004, ST-005, ST-006, ST-046, ST-050

---

## Milestones

### M1: Beta-Ready (TestFlight)
Mobile v1 screens complete, basic polish, local build workflow.
**Key issues:** ST-050, ST-040, ST-039, ST-017

### M2: App Store Submission
Apple Sign In, push notifications, app assets, privacy policy, test coverage, clinical review.
**Key issues:** ST-035, ST-036, ST-045, ST-046, ST-047, ST-005, ST-006

### M3: Post-Launch Enhancements
AI features, native integrations, offline support, advanced theming.
**Key issues:** ST-019, ST-020, ST-043, ST-014, ST-015

### M4: Multi-User & Collaboration
Privacy controls, onboarding, co-caregiver workflows, teen self-tracking polish.
**Key issues:** ST-008, ST-009, ST-011, ST-022
