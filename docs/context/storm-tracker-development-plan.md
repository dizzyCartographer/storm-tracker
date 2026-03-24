# Storm Tracker — Development Plan

Tickets are roughly ordered by dependency. Each ticket should be a deployable increment.

***

## Phase 1: Foundation

### 1.1 — Database schema and ORM setup

Choose and configure a database (e.g. Supabase/Postgres) and ORM (e.g. Prisma). Define core tables: `users`, `tenants`, `tenant_members`, `entries`. Set up migrations.

### 1.2 — Authentication

Implement sign-up, login, and session management. Integrate with the multi-tenant model so every authenticated user is scoped to their tenant(s).

### 1.3 — Tenant management

Create/join/leave a tenant. Owner can invite users, assign roles (owner, caregiver, teen-self). CRUD permissions enforced at the API layer.

***

## Phase 2: Daily Logging

### 2.1 — Quick Log entry

Form with two required fields: mood descriptor (Manic / Depressive / Neutral / Mixed) and day quality (Good / Neutral / Bad). Saves with timestamp and user attribution. This is the minimum viable entry — optimized for speed.

### 2.2 — Behavior Checklist entry

Boolean checklist grouped by category (Sleep, Energy, Manic, Depressive, Mixed/Cycling). Items are static and derived from DSM criteria defined in `features.md`. Render from a shared config so the list is maintained in one place.

### 2.3 — Custom behavior items

Allow caregivers to add/edit/delete their own boolean checklist items within a "Custom" section on the behavior checklist. Scoped per tenant.

### 2.4 — Impairment Tracking entry

Five domains (School/work, Family life, Friendships, Self-care, Safety concern), each rated None / Present / Severe.

### 2.5 — Freeform Notes entry

Rich text / markdown editor for long-form notes. Must handle substantial text comfortably on mobile.

### 2.6 — Menstrual Tracking entry

Log period days with bleeding severity (Light / Medium / Heavy). Stored as date-level records alongside mood entries.

### 2.7 — Combined daily entry form

Compose all entry types (2.1–2.6) into a single daily log screen. Quick Log is always visible at the top; remaining sections expand/collapse. A caregiver can submit just the Quick Log or fill in as much as they want.

***

## Phase 3: History & Timeline

### 3.1 — Entry list / calendar view

Browse past entries by date. Show mood color-coding on a calendar grid. Tap a date to view/edit that day's full entry.

### 3.2 — User attribution and discrepancy view

Display who logged each entry. When both a caregiver and the teen logged for the same day, surface the differences side-by-side.

***

## Phase 4: Data Analysis

### 4.1 — Daily classification engine

Score each day's entries and classify as manic, depressive, mixed, or neutral based on the behavior checklist data.

### 4.2 — Episode detection

Evaluate consecutive day classifications against clinical criteria for manic, hypomanic, and depressive episodes. Flag episodes in the timeline.

### 4.3 — Prodrome signal detection

Flag when logged symptoms are consistent with early bipolar signs even when they don't meet full episode criteria. Reference the diagnostic scales in `diagnostic-resources.md`.

***

## Phase 5: Reporting & Visualization

### 5.1 — Symptom wave graph

Plot a symptom score over time — manic symptoms positive, depressive symptoms negative — to visualize the bipolar cycle as a wave.

### 5.2 — Menstrual cycle overlay

For users with menstrual data: overlay a generic cycle wave anchored to the last logged period date on the symptom wave graph.

### 5.3 — PDF export

Generate a PDF report for a user-selected date range. Include: entry summaries, symptom frequency counts, impairment domain breakdown, and the symptom wave graph.

***

## Phase 6: Reminders & Notifications

### 6.1 — Pattern-based predictions

Analyze historical data to predict likely upcoming mood states based on cycle patterns and known triggers.

### 6.2 — Caregiver alerts

Notify caregivers to watch for specific behaviors based on predicted mood states and past patterns.

### 6.3 — Supportive activity suggestions

During predicted difficult periods, surface suggestions for activities that have historically helped or are clinically recommended.

***

## Phase 7: Polish & Hardening

### 7.1 — Mobile optimization

Ensure every screen works well on small viewports. Tap targets, font sizes, and form flow optimized for one-handed phone use.

### 7.2 — Privacy controls

Enforce separation between teen-facing and caregiver-facing data. 

### 7.3 — Onboarding flow

First-run experience: create a tenant, name the teen, invite co-caregivers, optionally invite the teen.

### 7.4 — Error handling and edge cases

Offline resilience, input validation, empty states, loading skeletons, and graceful error messages throughout.
