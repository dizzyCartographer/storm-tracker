# Storm Tracker — Requirements
### North-star requirements (v1.0, 2026-07-08)

**Working name:** Storm Tracker (App Store: StormTrackRx)
**Platforms:** Expo/React Native iOS app (primary) + Vite/React web SPA (both stay; same backend)
**One-liner:** A parent-friendly, DSM-aligned, longitudinal behavioral observation tool that turns daily chaos into clinician-ready data — without adding emotional friction to an already difficult life.

**The mission, in the user's own words:** *"I need someone — or something — to tell me I'm not crazy. And I need my psychiatrist to see what I see."* Storm Tracker exists to make the invisible visible: patterns emerge from daily observations, cycles become predictable, and a caregiver walks into the clinician's office with three months of structured, DSM-5-mapped data instead of a jumbled narrative. Every feature should be tested against that sentence.

**Authority order when documents conflict:** Maria's answers in `docs/DECISIONS.md` / `docs/QUESTIONS.md` > `docs/build-spec.md` > this document > the deep-dive context docs in `docs/context/`. The context docs remain the canonical detail reference (algorithms, data architecture, conventions); this document is the single consolidated statement of *what the product is*.

---

## Design principles (the reason this exists)

These are the constraints everything else serves. They come from `docs/context/vision-mission.md` and are restated here as build-time rules:

1. **The app is a safe space.** A parent at the end of her rope at 11pm must be able to log in 30 seconds. Every design decision reduces friction, never adds it. Quick Log is always sufficient; detail is always optional.
2. **Validate the caregiver's experience.** "It's not all in your head." The app takes observations seriously, quantifies them, and presents them in a way that commands clinical attention.
3. **⚠️ Never diagnose. Always inform.** This is a safety invariant, not a style preference. Language throughout the app uses "possible," "pattern observed," "signal" — never "diagnosis," "confirmed," or "likely [disorder]." All interpretation is clinician-led. See the Liability Constraints section below; violations halt work.
4. **See the whole child.** Capture good days, normal behavior, and positive moments so clinicians see baseline, not just crisis — and so caregivers are reminded good days exist.
5. **Meet caregivers where they are.** Two modes always: quick log for survival, detailed entry for depth. Reminders must be encouraging and novelty-managed, never naggy (ND caregivers tune out repetition).
6. **Evidence-based, not opinion-based.** All behavioral tracking maps to DSM-5 diagnostic criteria stored as data (not code). Scoring, classification, and episode detection follow the published clinical frameworks configured in the database. The app doesn't invent psychology.
7. **Deeply personal, not generic.** Per-project theming (teen's favorite color, photo), customization, a personal touch. "I want them to love using it, not go 'oh I've got to track my thing.'"
8. **Faith-informed option.** Faith-based encouragement and resources available as opt-in, never imposed (Phase F).

---

## Users

- **Maria — the primary caregiver** (persona 1): exhausted, gaslit by systems, needs validation + clinician-ready reports + pattern recognition + 30-second logging on bad days. Logs evenings; uses Quick Log on hard days; exports PDFs before appointments.
- **Dr. Reeves — the clinician** (persona 2): receives the PDF, never touches the app. Needs a scannable one-pager: DSM-aligned frequency counts, episode duration matches, medication adherence, safety concerns. Skeptical of apps that overstate certainty.
- **Jake — the teen self-tracker** (persona 3): joins his own project; entries tagged self-observation; discrepancies vs caregiver logs are clinically valuable. Won't use anything that looks clinical.
- **Sarah — the co-caregiver** (persona 4): different household, different observation window; her logs are a second data point, not a contradiction.

Full personas: `docs/context/personas.md`.

---

## Core concepts / data model (conceptual)

The pinned physical model lives in `prisma/schema.prisma` and `docs/context/data-architecture.md`. Concepts:

- **Project (Tenant)** — one tracked teen. Owns entries, medications, strategies, custom checks, analysis output, invites, members. Carries a profile: teen info (name, nickname, birthday, favorite color, photo, school, interests, IEP, diagnosis), background (onset date, family history), and purpose (ongoing tracking vs diagnostic collection).
- **Member** — a user's role in a project: `OWNER`, `CAREGIVER`, or `TEEN_SELF`. All entries are attributed. A user may belong to many projects; one is their default.
- **Entry** — the atomic record: one per (user, project, date). Composed of: mood descriptor (MANIC/DEPRESSIVE/NEUTRAL/MIXED), day quality (GOOD/NEUTRAL/BAD/MIXED), checked behavior criteria (`behaviorKeys`), custom items, impairment ratings per domain, missed medications, strategies used, freeform notes, menstrual severity, attachments. Computed at write time by Postgres triggers: `computedMood` (classification), `computedScore` (wave score), `computedCriteriaCounts` (per-pole counts).
- **Diagnostic Framework** — database-driven clinical configuration (DSM-5 Bipolar seeded; ADHD etc. addable without code changes): poles → criteria (GATE/CORE/STANDARD) → behavior definitions → criterion mappings, plus classification rules, episode thresholds, mood descriptor mappings, and signal rules. **Behavior checklist items are not user-editable** — they map to formal DSM criteria. Custom checks are the user-extensible section.
- **Analysis output** — episodes, prodrome signals, predictions, suggestions. Each is a table, replaced wholesale by Postgres triggers on every entry save. Read paths never compute. Ever.
- **Treatment** — medications (adherence tracking only — never treatment advice) and coping strategies (some seeded defaults).
- **Invite** — token link, 7-day expiry, role-carrying.

---

## Functional requirements

### 1. Multi-tenant projects & roles
- A user creates a project per teen; projects are isolated from one another (RLS-enforced, health data).
- Owner can add/remove users, set roles, edit the full profile, delete the project. Members can read and contribute entries.
- A teen may join their own project; their entries are tagged as self-observations.
- Project create can copy profile fields from an existing project.
- Default project per user; project selection persists across screens.

### 2. Daily logging
- **Quick Log (the floor):** mood descriptor + day quality. Always sufficient to save. 30 seconds, tired-caregiver-proof.
- **Behavior checklist:** criterion-level checkboxes (17 items: Manic gate + B1–B7; Depressive core #1–#2 + standard #3–#9), grouped by pole, each with teen-focused "this might look like" recognition examples. Not user-editable.
- **Custom checks:** per-project user-defined boolean items for patterns unique to their teen.
- **Impairments:** None / Present / Severe per domain — School/work, Family, Friendships, Self-care, Safety concern.
- **Missed medications:** per active medication, per day.
- **Strategies used:** which coping strategies were tried.
- **Freeform notes:** long-form; must support detailed recounting of hard days.
- **Menstrual tracking:** none / light / medium / heavy.
- **Attachments:** PDFs and images on an entry (10MB limit).
- One entry per user per project per date; saving the same date again updates (upsert). Backdating supported; editing pre-populates.

### 3. Scoring & classification (write-time, framework-driven)
- On every entry insert/update, Postgres computes and persists: classification (MANIC / DEPRESSIVE / MIXED / NEUTRAL + rule type), severity, wave score, per-pole criteria counts, safety-concern flag.
- Rules as configured in the database (DSM-5 Bipolar): manic full = gate + 3 B-criteria (4 if irritable-only gate); manic subthreshold = gate + 2; depressive full = core + 5; depressive subthreshold = core + 3; mixed = primary episode + 3 opposite-pole criteria. Criteria are counted as sets (no double-counting when two behaviors map to the same criterion). Cross-pole mappings are real (one behavior can satisfy criteria on both poles).
- The computed classification takes display precedence over the caregiver's manual mood; manual mood is shown as "reported [mood]" when it differs. Quick-log-only entries (no behaviors) show the manual mood and a "quick log only" indicator.
- Full algorithm: `docs/context/scoring-logic.md` (canonical).

### 4. Episode detection
- Runs of consecutive non-neutral days (gaps ≤ 2 days tolerated for missed logging) evaluated against framework thresholds: Manic 7d / Hypomanic 4d / Depressive 14d at DSM5_MET (requiring days that met full DSM criteria); 4d / 2d / 7d (and 5d) at PRODROMAL_CONCERN.
- Output: type, confidence, date range, day count, peak severity, average wave score, safety flag, human-readable criteria note, missed-med day count.
- **Language:** "Possible episodes," "pattern consistent with DSM-5 criteria," "emerging pattern of concern" — never "detected episode: manic."

### 5. Prodrome signals
- Framework-driven rules (sleep disruption, escalating irritability, etc.): simple window counts and trend comparisons (worsening second half).
- Framework-independent: withdrawal trend, safety concern (ALERT), mood instability.
- Levels INFO / WARNING / ALERT, sorted by severity.

### 6. Predictions
- Cycle length estimation, trend detection (escalating/resolving per pole), day-of-week patterns, next-state forecast — thresholds per `docs/context/signals-and-suggestions.md`.
- Framed as **preparation support**: "you may want to prepare," never certainty.

### 7. Caregiver suggestions
- Reactive tips by category (Safety, Communication, Environment, Self-care, Clinical) per the trigger matrix in `docs/context/signals-and-suggestions.md`.
- **Emotional support and parenting guidance only. No treatment advice, no dosage recommendations. Ever.**
- Safety triggers surface 988 and clinician contact.

### 8. Dashboard
- Recent entries with computed classification, active signals, possible episodes, suggestions, per selected project.
- Items should be dismissable (dismissed state persists) — planned, ST-016.
- Must never flash "no data" while loading (loading skeletons until first fetch resolves; empty states only after confirmed-empty).

### 9. History
- Calendar month view with mood-colored dots (computed classification; manual mood color for quick-log-only days).
- Tap a day → entries for that day; multi-observer days flagged.

### 10. Reports & PDF export
- User-selected date range. Contents: patient info header (teen profile, active medications, strategies), symptom wave graph (manic positive / depressive negative, dot colors by classification), behavior frequency chart, impairment summary, possible episodes with missed-med days, caregiver notes with dates.
- Reads persisted computed values only — the report path never re-derives scores.
- Web: browser print → PDF. Mobile: needs native equivalent (ST-039/ST-059).
- Deferred: menstrual cycle overlay anchored to last logged period (ST-007).

### 11. AI journal import
- 3-step flow: paste/dictate freeform journal text → server-side Anthropic parse into structured entry (date, mood, day quality, behavior keys, impairments, cleaned notes, confidence, reasoning, follow-up questions) → user reviews/edits with full checklist available → save through the normal entry path.
- The AI proposes; the caregiver confirms. Parsed output must use valid behavior item keys and must never add diagnosis language to notes.

### 12. Reference & transparency
- Public "How it works" page: every behavior item with its DSM-5 criterion mappings, classification rules, episode thresholds, wave score explanation. The caregiver and clinician can always see exactly how numbers are produced.
- Planned: source citations on criteria (ST-029), mobile version (ST-057).

### 13. Treatment tracking
- Medications: name, dosage, frequency, instructions, start/end, active/discontinued. Adherence only.
- Strategies: name, category, description; seeded defaults; per-entry usage.
- Management UI on both platforms (mobile gap: ST-041).

### 14. Multi-observer & discrepancies
- Multiple caregivers + teen self-tracking per project; all entries attributed and timestamped.
- Discrepancies between observers on the same date are surfaced, not suppressed — they're clinically valuable (Phase C persistence of discrepancy records is deferred work).

### 15. Invites & membership
- Owner generates role-carrying invite links (7-day expiry). Public invite landing shows project + role before sign-in; acceptance joins the project. Mobile acceptance flow: ST-061. Email invites + member name resolution: ST-062.

### 16. Reminders & notifications (Phase E/F)
- Logging reminders that are encouraging, novelty-managed (varied copy/timing so ND caregivers don't tune them out — ST-015, ST-036), and never punitive. Predictive alerts framed as preparation support.

### 17. Offline mode (Phase B — ST-043)
- Read cache (stale-while-revalidate on launch) + write queue with conflict resolution. Caregivers log at 11pm on flaky wifi; a failed save must never lose an entry.

### 18. Privacy controls (Phase C — ST-008)
- Teen-facing vs caregiver-facing data separation; private caregiver notes not shared with other caregivers (ST-027). Non-optional given eventual HIPAA posture.

### 19. Personalization & delight
- Per-project theming from the teen's favorite color + photo in the project selector; future theme presets (ST-014 faith-informed theme, anime, watercolor).

---

## ⚠️ Liability & language constraints (safety invariants)

From `docs/context/app-purpose-and-liability-constraints.md` — these are hard rules; a violation is a stop-work bug anywhere it appears (UI copy, report text, notification, AI output, code comments rendered to users):

1. Never state or imply a diagnosis: no "you/your child has X," "likely X," "confirmed," "diagnosed."
2. Approved vocabulary: "possible," "signal," "pattern observed," "pattern consistent with DSM-5 criteria," "emerging pattern of concern."
3. No treatment or dosage advice anywhere; medications are adherence-tracked only.
4. Predictive features always framed as preparation support ("you may want to prepare"), never clinical authority ("your child will").
5. No confidence framing that implies diagnostic certainty.
6. Disclaimers: account-creation acknowledgment + persistent footer (exact text in `docs/context/vision-mission.md`).
7. All interpretation is clinician-led; exports exist *for clinician interpretation*.

---

## Platform / technical constraints (summary — build-spec pins the details)

- **The database is the application.** All business logic in Postgres (triggers/functions); computation at write time; read paths never compute; both clients read/write through Neon Data API (PostgREST) with JWT + RLS. RLS is the only authorization layer. Serverless functions exist only for server-side secrets (Better Auth, Anthropic, Vercel Blob).
- **Web:** Vite + React SPA on Vercel. **Mobile:** Expo/React Native, local Xcode → TestFlight builds, always pointed at production backend.
- **Environments:** local → staging (own Neon branch, own JWKS) → production. Staging-first, always. Doc-only changes exempt.
- **Clinical config is data:** new frameworks are seeded rows, not code.
- Full standards: `docs/context/application-architecture-standards.md` and `docs/context/conventions.md`.

---

## Phasing (mirror of `docs/context/roadmap.md`, mapped to build milestones in `docs/BACKLOG.md`)

- **Phase A — Core Stability:** the app works reliably for one caregiver. Bug fixes (ST-077, ST-064, ST-073), infra debt (ST-076 dbmate, ST-004 grants, ST-068/069 cleanup), on-stage merges.
- **Phase B — Feature Complete (solo caregiver):** mobile reports/PDF, projects CRUD, meds/strategies on mobile, offline mode, dismissable dashboard, positive-behavior tracking.
- **Phase C — Multi-User & Privacy:** invites on mobile, email invites, privacy controls, onboarding, private notes, discrepancy surfacing.
- **Phase D — Clinical Review & Validation:** automated test coverage of all clinical logic, clinician review package, source citations, reference on mobile.
- **Phase E — App Store:** Apple Sign In, push notifications, assets, privacy policy, submission, biometrics, iPad.
- **Phase F — Growth:** AI voice logging, faith-informed resources, theming, widgets, HealthKit, and the rest of the F backlog.

---

## Open questions

Live questions belong in `docs/QUESTIONS.md` (answers there are canon). Standing product questions at time of writing:

1. Positive-behavior tracking (ST-013): does "good day" data enter the scoring model (e.g., neutral-day evidence for episode boundaries), or is it display/encouragement only?
2. Dismissable dashboard items (ST-016): does dismissing a signal suppress recomputation resurfacing it on the next entry save, or only hide that instance?
3. Private notes (ST-027): private to the author, or private to caregivers-vs-teen as a class?
4. Discrepancy records: persist as their own table (deferred Phase 20.5 design) or compute-on-display from same-date entries? (Standards say persist.)
5. Teen privacy (ST-008): exactly which data classes can a TEEN_SELF member see (own entries only? caregiver notes never?).
6. Notification novelty (ST-015/ST-036): scope of v1 — copy variation only, or copy + timing + modality?
