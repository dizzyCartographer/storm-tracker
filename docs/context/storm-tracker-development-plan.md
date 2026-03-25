# Storm Tracker — Development Plan

Tickets are roughly ordered by dependency. Each ticket should be a deployable increment.

Status key: ✅ Done | 🔧 In Progress | ⬜ Not Started

***

## Phase 1: Foundation ✅

### 1.1 — Database schema and ORM setup ✅

Neon Postgres via Vercel Storage, Prisma ORM with `@prisma/adapter-pg`. Core tables: users, tenants, tenant\_members, entries. Migrations via `prisma migrate dev`.

### 1.2 — Authentication ✅

Better Auth with email/password. Session management integrated with multi-tenant model. Sign-in/sign-up pages with redirect support.

### 1.3 — Tenant management ✅

Create tenants, invite system with token-based links (7-day expiry), role assignment (Owner/Caregiver/Teen-Self). CRUD permissions enforced via server actions.

***

## Phase 2: Daily Logging ✅

### 2.1 — Quick Log entry ✅

### 2.2 — Behavior Checklist entry ✅

### 2.3 — Custom behavior items ✅

### 2.4 — Impairment Tracking entry ✅

### 2.5 — Freeform Notes entry ✅

### 2.6 — Menstrual Tracking entry ✅

### 2.7 — Combined daily entry form ✅

Date picker for backdating. Pre-populates when date has existing entry. Edit/delete with ownership checks. Compact pill-style behavior toggles with info tooltips.

***

## Phase 3: History & Timeline ✅

### 3.1 — Entry list / calendar view ✅

Calendar grid with mood-colored dots. Tap date to expand full entry details. Project switcher tabs.

### 3.2 — User attribution and discrepancy view ✅

Flags when multiple observers logged same day. Discrepancy detection in analysis panel compares classifications.

***

## Phase 4: Data Analysis ✅

### 4.1 — Daily classification engine ✅

Database-driven diagnostic frameworks. Behavior→criterion mappings, classification rules, and scoring all stored in PostgreSQL. DSM-5 Bipolar seeded. See `data-architecture.md`.

### 4.2 — Episode detection ✅

Framework-driven duration thresholds. DSM5\_MET vs PRODROMAL\_CONCERN confidence levels.

### 4.3 — Prodrome signal detection ✅

Framework-driven signal rules (sleep disruption, escalating irritability, energy volatility, safety concern) plus framework-independent signals (mood instability, withdrawal trend).

***

## Phase 5: Reporting & Visualization ✅

### 5.1 — Symptom wave graph ✅

Recharts-powered wave graph. Manic criteria positive, depressive negative. Dot colors by classification.

### 5.2 — Menstrual cycle overlay ⬜

Pink bars show period days on wave graph. Still needs generic cycle wave overlay anchored to last period date.

### 5.3 — PDF export ✅

Browser print with print-specific styles. Date range picker with generate button.

***

## Phase 6: Insights & Alerts ✅

### 6.1 — Pattern-based predictions ✅

Cycle length estimation, trend detection (escalating/resolving), day-of-week patterns, mood state forecasting.

### 6.2 — Caregiver suggestions ✅

Context-aware tips organized by category (Safety, Communication, Environment, Self-Care, Clinical).

### 6.3 — Observer discrepancy detection ✅

Flags dates where multiple caregivers logged conflicting mood classifications.

***

## Phase 7: Algorithmic Mood Override ✅

_From iterative requirements: when specific behaviors are logged, the algorithmically produced classification should take precedence over the caregiver's manual mood entry._

### 7.1 — Computed mood classification ✅

`getRecentEntries` and `getEntriesByMonth` now compute a `displayMood` via the scoring engine when behaviors are logged. Dashboard, history calendar dots, and entry detail all show the algorithmic classification as primary. Manual mood shown as "reported \[mood]" when it differs from the computed classification. Reports and analysis panel already used computed classification.

### 7.2 — No-detail indicator ✅

Entries with only Quick Log data (no behaviors logged) show an amber "quick log only" label on dashboard and history entry detail. Calendar dots for quick-log-only entries use the manual mood color since no algorithmic override is available.

***

## Phase 8: Project Enrichment ✅

_From iterative requirements: projects need more context for the data being tracked._

### 8.1 — Project CRUD ✅

Nav renamed "Settings" to "Projects". New `/projects` list page and `/projects/[id]` detail page with full CRUD. Old `/settings` redirects. `updateTenantProfile` and `deleteTenant` server actions with owner-only permission checks. Members list on detail page.

### 8.2 — Project profile fields ✅

Added 15 fields to Tenant model: description, purpose (enum: ONGOING\_TRACKING / DIAGNOSTIC\_COLLECTION), teen info (full name, nickname, birthday, favorite color, interests, school, favorite subject, IEP, diagnosis, other health, photo URL), background (onset date, family history). Full edit form on project detail page for owners; read-only summary for non-owners.

### 8.3 — Default project selection ✅

Added `defaultTenantId` on User model. `setDefaultTenant`/`getDefaultTenantId` actions. Dashboard, log, history, and reports all use the default tenant when no `?tenant=` param. Toggle on project detail page.

### 8.4 — Copy project data ✅

New `/projects/create` page with `createTenantWithProfile` action. Dropdown to select an existing project — copies all profile/background fields. Explicit input overrides copied data.

### 8.5 — Project theming ✅

Teen's favorite color stored as hex. Colored accent bar on dashboard when set. Project tabs show color dots. Projects list shows color dots. Photo URL field available for future use.

***

## Phase 9: UI & Navigation Improvements ✅

_From iterative requirements: navigation and view enhancements._

### 9.1 — Navigation restructure ✅

"+ Log" is now a dark button at the start of the nav bar. "Sign Out" is a bordered button separated by a divider. Remaining nav items (Dashboard, History, Reports, Projects) are styled as view links with active-state highlighting.

### 9.2 — "Mixed" day quality option ✅

Added `MIXED` to the `DayQuality` enum. Migration applied. Log form and dashboard display updated.

### 9.3 — Log detail view (read-only) ✅

New `/log/[id]` page shows a full read-only view of a single entry: mood classification (with override/quick-log indicators), behaviors, custom items, impairments, menstrual data, and notes. Edit link for own entries. Linked from dashboard entry cards and history "View" links.

### 9.4 — Project selector on reports ✅

Reports project tabs now show favorite color dots matching the enriched project pattern. Already used default tenant from Phase 8.3.

***

## Phase 10: Document Management ✅

_From iterative requirements: attach documents to logs and browse them._

### 10.1 — File attachments on log entries ✅
Attachment model with Vercel Blob storage. Upload API route (`/api/attachments`) with POST/DELETE, 10MB limit, PDF and image types allowed. AttachmentManager component in log form (collapsible section). Attachments shown on read-only detail view (`/log/[id]`). Entry detail action includes attachments.

### 10.2 — Document library ✅
New `/documents` page with "Docs" nav link. Filterable by file type (images/PDFs) and date range. Each document links to its parent entry. Project tabs with color dots.

***

## Phase 11: Polish & Hardening ✅

### 11.1 — Mobile optimization ✅
Responsive hamburger menu for small screens (< md breakpoint). "+ Log" button always visible on mobile. All page containers use responsive padding (`p-4 md:p-6`). Nav links collapse into a dropdown menu on mobile with proper touch targets.

### 11.2 — Privacy controls ⬜
Enforce separation between teen-facing and caregiver-facing data.

### 11.3 — Onboarding flow ⬜
First-run experience: create a tenant, name the teen, invite co-caregivers, optionally invite the teen.

### 11.4 — Error handling and edge cases ✅
Global error boundary (`error.tsx`), 404 page (`not-found.tsx`), and root loading state. Per-route loading skeletons with animated placeholders for dashboard, history, reports, log, projects, and documents. Network error handling in file upload and log form submission. Form validation improvements (trimmed inputs, disabled submit for empty fields). Server error messages surfaced to users instead of generic failures.

***

## Phase 12: UX Refinements ⬜

_From iterative requirements: navigation, form, and visual polish._

### 12.1 — Global project selector ⬜
Single project selector dropdown that sits right under the nav on all authenticated pages (dashboard, history, reports, docs). Replaces per-page project tabs. Shows teen photo and favorite color dot.

### 12.2 — Date picker fix ⬜
Replace native date inputs for birthday and onset date on the project profile form with a picker that supports month/year navigation (no clicking back one month at a time).

### 12.3 — User profile page ⬜
New `/profile` page. View/edit display name, email, and password. Accessible from nav or a user avatar menu.

***

## Phase 13: Branding & Visual Identity ⬜

_From iterative requirements: logo, icons, and visual customization._

### 13.1 — App logo ⬜
Solid lightning bolt with cloud outline. Color changes based on the selected project's favorite color. Replaces "Storm Tracker" text in the nav.

### 13.2 — Symptom icons/emojis ⬜
Add icons or emojis to each behavior definition. Default set provided, customizable per project. Displayed alongside pill labels on the behavior checklist.

### 13.3 — Icon-only pill toggle mode ⬜
Option to collapse behavior pills to icon/emoji only. Reduces scrolling on the log page. Togglable via a compact/expanded switch on the checklist section.

***

## Phase 14: Treatment Tracking ⬜

_From iterative requirements: medication and strategy management._

### 14.1 — Medication tracking ⬜
New `Medication` model. Log current meds with name, dosage, frequency, and special instructions. Entered by user. Track start/stop dates. Display on entry detail and reports. Future: API integration for standard medication database.

### 14.2 — Strategy tracking ⬜
New `Strategy` model. Pre-seeded management strategies (sleep hygiene, de-escalation techniques, communication scripts, etc.) plus custom user entries. Track which strategies were used on a given day and their perceived effectiveness. Surface in caregiver suggestions.

***

## Architecture Milestone (Completed)

### Database-driven diagnostic frameworks ✅

All behavior definitions, DSM-5 criteria, classification rules, episode thresholds, and signal rules moved from hardcoded TypeScript to 11 database tables. New frameworks (ADHD, anxiety, etc.) can be added by inserting rows — no code changes needed. See `data-architecture.md` for full details.
