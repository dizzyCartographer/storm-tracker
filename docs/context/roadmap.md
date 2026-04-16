# Roadmap

This document summarizes where Storm Tracker is, what's next, and how work is phased. For the detailed development history, see `storm-tracker-development-plan.md`. For individual tracked issues, see `docs/issues/`.

---

## Current State (as of April 2026)

### What's Built

**Web app (Vite + React SPA)** — rewritten from Next.js in April 2026:
- Daily logging (quick log + full behavior checklist + impairments + notes + menstrual)
- Calendar history with mood-colored dots
- Dashboard with entry cards, signals, episodes, predictions, suggestions
- PDF export for clinicians with patient info, wave graph, behavior frequency chart
- All data access via Neon Data API with JWT/RLS (no ORM)
- Serverless functions only for server-side secrets (Anthropic API, Vercel Blob)

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
- Neon Postgres with RLS on all tables
- Postgres triggers for all scoring and analysis (write-time computation)
- Better Auth with Expo + JWT + nextCookies plugins
- Neon Data API for all client reads and writes
- Diagnostic framework system (database-driven, extensible)

**Infrastructure:**
- Production: Vercel + Neon main branch
- Staging: Vercel preview + Neon staging branch
- Local Xcode build workflow (ST-050, done)
- TestFlight pipeline via local archive + Xcode Organizer

---

## How Issues Are Categorized

**Urgency** — is something broken or degraded right now?
- **high**: core function doesn't work — can't log, can't view data, can't sign in
- **medium**: something works but wrong — bad display, missing feedback, confusing UX
- **low**: everything works, this is about improvement

**Phase** — when does this belong in the product's lifecycle?

Phases are ordered by what makes the creator's daily experience better first, then what fulfills the broader mission, then what gets to market. This is not a startup — quality over speed.

---

## Phases

### Phase A: Core Stability
*The app works reliably for one caregiver.*

Infrastructure cleanup, bug fixes, and merge of already-built features. Unblocks all future development.

**Key issues:** ST-071 (Next.js cleanup), ST-074 (dbmate migrations), ST-004 (DB grants), ST-064 (loading states), ST-073 (error messages), plus 8 on-stage items awaiting merge.

### Phase B: Feature Complete (Solo Caregiver)
*One caregiver can do everything the app promises: log, analyze, report, manage — without wifi anxiety.*

Full feature set for daily use. Reports for clinician appointments, project management, medication tracking, offline logging. This phase is what makes the app reliable enough to depend on.

**Key issues:** ST-039 (reports on mobile), ST-040 (projects CRUD), ST-041 (meds/strategies), ST-043 (offline mode), ST-059 (PDF export), ST-013 (positive behavior), ST-016 (dismissable dashboard items), ST-017 (design polish).

### Phase C: Multi-User & Privacy
*Multiple caregivers and the teen can participate safely.*

Core to the mission — the app bridges qualitative caregiver observations and clinical diagnostic categories. Multiple observers providing structured, DSM-5-mapped data to a clinician is the differentiator. Co-caregiver invites, teen self-tracking, observer discrepancies, and privacy controls. Privacy is non-optional given eventual HIPAA requirements.

**Key issues:** ST-008 (privacy controls), ST-009 (onboarding), ST-061 (invite acceptance), ST-062 (email invites), ST-011 (read-only view), ST-027 (private notes).

### Phase D: Clinical Review & Validation
*The scoring, episode detection, and framework logic are reviewed and tested before public release.*

The creator reviews all diagnostic logic personally — scoring, suggestions, episode generation, framework management. The app legitimizes diagnostic conversations by mapping observations to DSM-5 criteria. That bridge only works if the mapping is accurate.

**Key issues:** ST-005 (automated tests), ST-006 (clinical validation), ST-029 (cite sources), ST-057 (reference page on mobile), ST-012 (project info in PDF).

### Phase E: App Store Submission
*Everything required to pass Apple review and be publicly available. No rush — quality over speed.*

**Key issues:** ST-035 (Apple Sign In), ST-036 (push notifications), ST-045 (app assets), ST-046 (privacy policy), ST-047 (submission), ST-038 (biometric auth), ST-063 (iPad layout).

### Phase F: Growth & Enhancement
*Post-launch features that deepen the product and serve the broader community.*

AI-powered logging for exhausted caregivers, faith-based resources, advanced theming, native integrations. These serve the broader mission of comforting others with the comfort the creator has received.

**20 issues** — see `docs/issues/_index.md` for the full list.

---

## Dependency Chain (Current Blockers)

```
ST-071 (remove old Next.js/Prisma — in progress)
  → ST-074 (switch to dbmate)
    → ST-004 (GRANTs as first dbmate migration)
      → ephemeral Neon feature branches work
        → faster development velocity for all phases
```
