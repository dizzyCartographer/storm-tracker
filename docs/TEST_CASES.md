# TEST_CASES.md — Storm Tracker test bank (for Maria's review)
Derived from `docs/requirements.md` + `docs/build-spec.md`. Format: **ID — Given / When / Then.**
Sections marked ⚠️ are safety-critical: **a red test there halts feature work until fixed.**
Execution tiers: DB cases run in the Postgres rig (build-spec §5.1); UI/client cases in Vitest / jest-expo. Every automated test names its case ID.
Standard fixture: tenant "Test Teen" with the seeded `dsm5-bipolar` framework active; users Maria (OWNER), Sarah (CAREGIVER), Jake (TEEN_SELF), and Rando (no membership).

## §1 ⚠️ SC — Scoring correctness (DSM-5 as configured)
- **SC-1** — Given an entry with the manic gate behavior + 3 distinct manic B-criteria behaviors / When saved / Then `computedMood = 'MANIC'` under a DSM5_FULL rule.
- **SC-2** — Given the manic gate + only 2 B-criteria / When saved / Then classification is manic SUBTHRESHOLD, not DSM5_FULL.
- **SC-3** — Given 3 manic B-criteria but NO gate (no gate behavior, mood NEUTRAL) / When saved / Then classification is not MANIC (gate is required).
- **SC-4** — Given depressive core criterion (#1 or #2) + 4 more distinct depressive criteria (5 total) / When saved / Then `computedMood = 'DEPRESSIVE'` (DSM5_FULL).
- **SC-5** — Given 5 depressive STANDARD criteria but neither core criterion / When saved / Then not DEPRESSIVE-full (core required).
- **SC-6** — Given depressive core + 2 more (3 total) / When saved / Then depressive SUBTHRESHOLD.
- **SC-7** — Given a full manic day that also has ≥3 depressive criteria / When saved / Then MIXED (mixed-features rule outranks by priority).
- **SC-8** — Given subthreshold matches on BOTH poles and no full rule / When saved / Then classification falls back to MIXED.
- **SC-9 (dedup)** — Given two behaviors that both map to the same criterion number / When saved / Then that criterion counts once (set semantics), and `computedCriteriaCounts` reflects the deduped count.
- **SC-10 (cross-pole)** — Given one behavior mapped to criteria on both poles / When saved / Then both poles' counts increment from the single check.
- **SC-11 (mood gates)** — Given mood = MANIC and zero behaviors mapped to the gate / When saved with ≥3 B-criteria / Then the manic gate is satisfied by the mood descriptor alone.
- **SC-12** — Given mood = MIXED / When saved / Then manic gate satisfied AND depressive criterion #1 added (per mood_descriptor_mappings).
- **SC-13** — Given mood = DEPRESSIVE and behaviors satisfying 4 non-core depressive criteria / When saved / Then criterion #1 is added by the mood mapping and core is satisfied → DEPRESSIVE.
- **SC-14 (wave score)** — Given 3 manic criteria and 1 depressive criterion / When saved / Then `computedScore = +2` (Σ direction × count) and `computedCriteriaCounts = {"manic":3,"depressive":1}`.
- **SC-15 (zero poles present)** — Given manic-only behaviors / When saved / Then `computedCriteriaCounts` still contains `"depressive":0` (zero-count poles included).
- **SC-16 (quick log only)** — Given mood + dayQuality and no behaviors / When saved / Then `computedMood`, `computedScore`, `computedCriteriaCounts` are all NULL.
- **SC-17 (no framework)** — Given a tenant with no `tenant_frameworks` row / When an entry with behaviors is saved / Then computed fields are NULL and the save still succeeds.
- **SC-18 (update recompute)** — Given a saved NEUTRAL entry / When updated to add manic gate + 3 criteria / Then computed fields change to MANIC on the same row (BEFORE trigger fires on UPDATE).
- **SC-19 (priority order)** — Given an entry satisfying both a DSM5_FULL rule and a SUBTHRESHOLD rule / When classified / Then the higher-priority (DSM5_FULL) rule wins.
- **SC-20 (decision-forcing, F21)** — Given the gate is satisfied and `gateOnlyAdjustment > 0` on the manic full rule / When exactly 3 B-criteria are present / Then — pin the actual behavior (does the threshold become 4 always, or only for irritable-only gates?) and file the answer for clinical confirmation. This test documents reality; changing it is CLINICAL-REVIEW gated.
- **SC-21 (severity, F6)** — Given a DSM5_FULL day with 2 SEVERE impairments / When saved / Then severity computes SEVERE — currently discarded, not persisted. Test pins the computation; persistence is an M5 decision.

## §2 ⚠️ ISO — Tenant isolation & RLS (health data)
All ISO tests run as role `authenticated` with `auth.user_id()` shimmed (build-spec §5.1).
- **ISO-1** — Given Rando's user id / When SELECTing entries, episodes, prodrome_signals, predictions, suggestions, medications, strategies, custom_checklist_items, attachments, invites-scoped-data for Maria's tenant / Then zero rows from every table.
- **ISO-2** — Given Rando / When INSERTing an entry into Maria's tenant / Then the write is rejected by RLS.
- **ISO-3** — Given Sarah (CAREGIVER member) / When SELECTing entries for the tenant / Then she sees all members' entries (shared observation is the product).
- **ISO-4** — Given Sarah / When DELETEing the tenant / Then rejected; Given Maria (OWNER) / Then permitted.
- **ISO-5** — Given Jake (TEEN_SELF) / When inserting an entry attributed to himself / Then permitted; When inserting an entry with `userId` = Maria's id / Then rejected (own-user check on insert).
- **ISO-6** — Given any authenticated user / When SELECTing framework config tables / Then readable; Given the `anon` role (no JWT) / Then no access.
- **ISO-7** — Given any member / When INSERT/UPDATE/DELETE on episodes/prodrome_signals/predictions/suggestions via the Data API / Then rejected (SELECT-only; triggers write as owner).
- **ISO-8** — Given a user in tenant A and tenant B / When reading with A selected / Then B's rows appear only under B's tenantId filter — and RLS (not the client filter) is what enforces it: a query with no tenant filter returns only tenants they belong to.
- **ISO-9 (F4)** — Given any authenticated user / When SELECTing `jwks` via the Data API / Then no rows (private keys must be unreadable). *Currently expected RED — jwks has no RLS. Red here halts feature work per §2 rules once the rig exists.*
- **ISO-10** — Given Maria (OWNER) / When updating a member's role / Then — pin current behavior (no UPDATE policy exists on tenant_members, F17); the desired end state is owner-only role updates.
- **ISO-11** — Given a brand-new table added by any future migration / Then the migration adds RLS policies in the same file (meta-test: every table in the schema has rowsecurity = true except documented exceptions).
- **ISO-12** — Given Rando with a forged tenantId in a PostgREST insert to custom_checklist_items / medications / strategies / Then rejected.

## §3 ⚠️ LNG — Liability language (never diagnose)
Scope: app-generated interpretive copy — UI strings, report text, suggestion text, AI-generated notes. Parent-entered fields (e.g., the tenant profile "diagnosis" input) are exempt: those are the caregiver's own words.
- **LNG-1** — Given all user-facing generated strings in `web/src`, `mobile/src`, and suggestion/criteria-note text in migrations / When scanned / Then no interpretive string contains "diagnosed", "diagnosis confirmed", "your child has", "likely bipolar" or equivalent diagnostic claims.
- **LNG-2** — Given the episodes UI and PDF report / When rendered / Then episodes are labeled "Possible" episodes and DSM matches read "pattern consistent with DSM-5 criteria" / "emerging pattern of concern" — never "episode detected/confirmed".
- **LNG-3** — Given every suggestion string (in `compute_suggestions` and any client fallback) / When reviewed / Then zero treatment or dosage advice; medication content is adherence-only; safety suggestions point to 988/clinician.
- **LNG-4** — Given predictive UI copy / When rendered / Then framed as preparation support ("you may want to prepare"), never certainty or instruction ("your child will", "you should medicate").
- **LNG-5** — Given the sign-up flow / When an account is created / Then the disclaimer acknowledgment is shown and `users.disclaimerAcceptedAt` is set.
- **LNG-6** — Given every protected page (web) and mobile shell / When rendered / Then the footer disclaimer ("observation tool, not a diagnostic instrument") is present.
- **LNG-7** — Given the `parse-journal` system prompt / When reviewed / Then it instructs the model to structure observations only — no diagnostic conclusions in notes, no invented behaviors; and the zod schema restricts behaviorKeys to known itemKeys.
- **LNG-8** — Given any NEW user-facing string added by a task / When the task completes / Then the string passes LNG-1..LNG-4 vocabulary rules (checked in review; violations are stop-work).

## §4 EP — Episode detection
- **EP-1** — Given 7 consecutive MANIC-classified days each meeting DSM5_FULL / When analysis runs / Then one MANIC episode, confidence DSM5_MET, dayCount 7, correct start/end dates.
- **EP-2** — Given 4 consecutive manic DSM-full days / Then HYPOMANIC DSM5_MET (not MANIC — 7-day rule).
- **EP-3** — Given 4 consecutive manic days that never meet full DSM criteria / Then MANIC PRODROMAL_CONCERN (requiresDsmSymptoms=false path).
- **EP-4** — Given 14 consecutive DSM-full depressive days / Then DEPRESSIVE DSM5_MET.
- **EP-5** — Given 5 or 7 consecutive subthreshold depressive days / Then DEPRESSIVE PRODROMAL_CONCERN at the matching threshold.
- **EP-6 (gap tolerance)** — Given 3 manic days, a 2-day logging gap, then 3 more manic days / Then one run of 6 counted days; Given a 3-day gap / Then two separate runs.
- **EP-7** — Given a run with ≥ threshold days on BOTH poles (mixed days count toward all poles) / Then episode type MIXED.
- **EP-8** — Given a single non-neutral day surrounded by neutral days / Then no episode (min run 2).
- **EP-9 (wholesale replace)** — Given an existing episode / When a new entry extends the run / Then the episodes table contains exactly the recomputed set — no stale or duplicate rows for the tenant.
- **EP-10** — Given a run containing days with missed meds / Then the episode's missed-med day count matches.
- **EP-11 (F6 pin)** — Given any detected episode today / Then peakSeverity is 'MODERATE' (pins the hardcoded value; fixing it is M5 + CLINICAL-REVIEW).

## §5 SIG — Prodrome signals
- **SIG-1 (simple mode)** — Given a signal rule (window 7, minOccurrences 3) and 3 linked-behavior days within 7 days / Then the signal fires with `{count}`/`{window}` filled in.
- **SIG-2** — Given only 2 occurrences / Then no signal.
- **SIG-3 (trend mode)** — Given trendCompare rule and late-half count ≥ trendMinLate AND > early-half / Then fires; Given equal halves / Then silent.
- **SIG-4** — Given `impairments.SAFETY_CONCERN = "PRESENT"` on any entry in the last 7 days / Then an ALERT-level safety signal exists.
- **SIG-5** — Given ≥3 non-NEUTRAL→different-non-NEUTRAL classification changes within 7 days / Then mood-instability WARNING.
- **SIG-6** — Given signals of mixed levels / Then ordering is ALERT, WARNING, INFO.
- **SIG-7 (wholesale replace)** — Given a signal that no longer meets its rule after an entry edit / Then it is gone after recompute.
- **SIG-8 (F8 pin)** — The documented "withdrawal trend" generic signal does not fire from SQL today — decision-forcing: implement (CLINICAL-REVIEW) or remove from docs.

## §6 PRD — Predictions
- **PRD-1** — Given <7 entries / Then zero predictions.
- **PRD-2** — Given transitions averaging a gap of 1–90 days with ≥4 transitions / Then a CYCLE prediction at MEDIUM confidence; 3 transitions → LOW.
- **PRD-3** — Given recent-3-day manic criteria avg ≥2 and > prior-4-day × 1.5 / Then escalating-manic TREND; avg ≥3 → HIGH.
- **PRD-4** — Given prior avg ≥2 and recent < prior × 0.5 with opposite pole < 2 / Then resolving TREND.
- **PRD-5** — Given ≥14 entries where one weekday's criteria avg ≥ 2× overall AND ≥3 / Then DAY_PATTERN prediction.
- **PRD-6** — Given last 5 days with ≥3 sharing a non-NEUTRAL classification / Then FORECAST; ≥4/5 → HIGH.
- **PRD-7 (F7 pin)** — Given `compute_predictions` invoked WITHOUT `compute_episodes` first in the same transaction / Then it errors (temp-table dependency) — pins the fragility until M5 removes it.
- **PRD-8** — Prediction copy uses preparation-support framing (cross-check LNG-4).

## §7 SUG — Caregiver suggestions
- **SUG-1** — Given a safety signal or safety-flagged entry in the last 7 days / Then a SAFETY/HIGH suggestion referencing 988 exists.
- **SUG-2** — Given ≥3 manic-classified days in the last 7 / Then reduce-stimulation + protect-sleep (ENVIRONMENT/HIGH) and calm-language (COMMUNICATION/MEDIUM) suggestions.
- **SUG-3** — Given ≥3 depressive days in 7 / Then gentle-connection (COMMUNICATION/HIGH), simplify-expectations (ENVIRONMENT/MEDIUM), caregiver-self-care (SELF_CARE/MEDIUM).
- **SUG-4** — Given an escalating TREND prediction / Then contact-clinician (CLINICAL/HIGH).
- **SUG-5** — Given sleep-disruption / escalating-irritability / mood-instability signals / Then their mapped suggestions.
- **SUG-6** — Given a calm week (no triggers) / Then no stale suggestions remain after recompute.

## §8 ENT — Entry lifecycle
- **ENT-1** — Given no entry for a date / When Maria saves / Then a row exists with her userId and the computed fields populated by the trigger, returned in the PostgREST representation.
- **ENT-2 (upsert)** — Given Maria already has an entry for a date / When she saves the same date again / Then the same row is updated (`on_conflict="userId","tenantId",date`) — never a duplicate, never a PK-based miss.
- **ENT-3** — Given Maria's entry for a date / When Jake saves the same date / Then two rows exist for that date (per-observer entries).
- **ENT-4** — Given an entry save / Then episodes, prodrome_signals, predictions, suggestions for that tenant are recomputed in the same transaction (AFTER trigger).
- **ENT-5** — Given an entry with all optional sections (custom items, strategies, missed meds, impairments, menstrual, notes) / Then all JSONB fields round-trip exactly.
- **ENT-6** — Given a backdated entry / Then it saves for that date and history/analysis include it.
- **ENT-7** — Given an entry edit that clears all behaviors / Then computed fields return to NULL and downstream analysis updates.
- **ENT-8** — Given an entry delete by its author / Then permitted; analysis for the tenant no longer reflects it after the next save. (Pin current recompute-on-delete behavior — there is no DELETE trigger today; decision-forcing.)
- **ENT-9** — Given a date with an existing entry / When the log form loads (web + mobile) / Then it pre-populates in update mode.
- **ENT-10** — Given the same user saving entries in two different tenants on the same date / Then both save (uniqueness is per tenant).

## §9 AU — Auth & sessions
- **AU-1** — Given valid email/password sign-up / Then account + session created (web cookie / mobile SecureStore) and disclaimer timestamp set (cross-check LNG-5).
- **AU-2** — Given a signed-in user / When requesting `/api/auth/token` / Then an RS256 JWT with `sub` = user id verifiable against `/api/auth/jwks`, ~15-min expiry.
- **AU-3** — Given a Data API request with no/expired JWT / Then 401 and the client's handling does not destroy the session on a *transient* failure (cross-check MOB-4).
- **AU-4** — Given sign-out / Then session invalidated; protected routes redirect to sign-in.
- **AU-5** — Given any 500 from the auth function in production config / Then the response contains no stack traces or upstream error bodies (ST-068 — currently RED by design of the debug handler).
- **AU-6** — Given password change with wrong current password / Then rejected with a clear message; with correct → session remains valid.

## §10 MOB — Mobile/client resilience (ST-077 family)
- **MOB-1** — Given a cold app launch where the auth token round-trip has not completed / When ProjectProvider mounts / Then it waits for auth `ready` before its first fetch — no fetch fires with a null JWT.
- **MOB-2** — Given the first tenant fetch fails (network/JWKS) / Then the provider records an error state; Dashboard/History/Log show a retry banner — never a permanent silent "No projects yet".
- **MOB-3** — Given the retry banner / When tapped / Then the context reloads in place and dependent screens populate without restart or re-auth.
- **MOB-4** — Given `getJwt()` returns null once (transient) / Then the user is NOT signed out; the fetch retries with backoff before surfacing an error.
- **MOB-5** — Given any list screen during its first fetch / Then a loading skeleton/spinner renders — empty-state copy appears only after a completed fetch confirms emptiness (ST-064).
- **MOB-6** — Given a fetch that resolves with genuinely zero rows / Then the empty state renders (loading must not spin forever).
- **MOB-7** — Given any save/load failure in log-edit, project-edit, profile, history, import / Then the visible message includes the actual error text (`e.message`), not only a generic string (ST-073).
- **MOB-8** — Given `neonFetch` receives 400 "jwk not found" / Then it retries up to its limit and succeeds on a later attempt without user-visible failure.

## §11 RPT — Reports
- **RPT-1** — Given entries with persisted computed fields / When a report generates / Then every plotted value comes from `computedMood`/`computedScore`/`computedCriteriaCounts` — the report path performs no framework fetching or re-scoring.
- **RPT-2** — Given a date range / Then the report includes exactly the entries in range (boundary dates inclusive).
- **RPT-3** — Given mixed entry types in range / Then quick-log-only days (NULL computed) render without crashing and are visibly distinct from scored days.
- **RPT-4** — Given per-pole counts / Then the wave graph plots `computedScore` with classification-colored points and the tooltip shows real per-pole counts (ST-074 regression guard).
- **RPT-5** — Given checked behaviors across the range / Then the frequency chart counts each itemKey's occurrences correctly with readable labels.
- **RPT-6** — Given active medications and strategies / Then the patient-info header lists them; discontinued meds excluded.
- **RPT-7** — Given caregiver notes in range / Then the notes section lists them with dates, attributed correctly.
- **RPT-8** — Given the export action / Then web produces a print-faithful PDF; mobile (M2) produces a shareable PDF with the same sections.
- **RPT-9** — Episode section wording passes LNG-2.

## §12 AI — Journal import
- **AI-1** — Given freeform journal text / When parsed / Then the response contains only valid framework itemKeys, valid enums, a confidence value, reasoning, and follow-up questions.
- **AI-2** — Given a parse response / When the user edits fields in review / Then the save uses the edited values through the normal entry upsert (triggers fire — cross-check ENT-4).
- **AI-3** — Given a request from a non-member of the tenant / Then `parse-journal` rejects it (membership check server-side).
- **AI-4** — Given any client bundle / Then the Anthropic key appears nowhere client-side (server env only).
- **AI-5** — Given parsed notes / Then no diagnostic language is introduced (cross-check LNG-7).
- **AI-6** — Given an Anthropic failure/timeout / Then the user sees a real error and their pasted text is not lost.

## §13 OBS — Multi-observer
- **OBS-1** — Given Maria and Jake entries on the same date / Then history flags the multi-observer day and both entries are readable with attribution.
- **OBS-2** — Given Jake's entry / Then it is identifiable as self-observation (TEEN_SELF role attribution) wherever entries are displayed.
- **OBS-3** — Given conflicting classifications on the same date / Then both are preserved — the system never merges or averages observers.
- **OBS-4** — Given Sarah logging on her custody days only / Then analysis treats her days as normal tenant data (no per-observer exclusion).

## §14 INV — Invites & membership
- **INV-1** — Given Maria (OWNER) / When creating an invite with role CAREGIVER / Then a token with 7-day expiry exists; Sarah (non-owner) cannot create invites.
- **INV-2** — Given a valid token / When an authenticated non-member accepts / Then a tenant_members row with the invite's role is created and the invite cannot be used again.
- **INV-3** — Given an expired or used token / When accepting / Then a clear failure, no membership.
- **INV-4 (F1/F2 pin)** — Given the current `accept_invite` SQL as migrated / When executed on a schema-faithful database / Then it errors (`invites.status`, `tenant_members.createdAt` don't exist) — decision-forcing: repair migration required (D-2).
- **INV-5 (F3 pin)** — Given `invite-details` / When called against a schema-faithful database / Then it errors on `"Invite"`/`"Tenant"` table names — decision-forcing with INV-4.
- **INV-6** — Given a signed-out user opening an invite link / When they sign in via the redirect / Then they land back on the invite acceptance page (F16 — currently RED: redirect param ignored).

## §15 DAT — Data integrity
- **DAT-1** — Given the schema / Then `entries` enforces UNIQUE (userId, tenantId, date) and all PKs are UUIDs.
- **DAT-2** — Given entry dates / Then they are date-only (no time component leaks; "April 7" is the same day everywhere).
- **DAT-3** — Given tenant deletion by the owner / Then dependent rows (entries, analysis, meds, strategies, custom items, invites, members) are removed or orphan-safe per FK rules — pin actual cascade behavior; surprises are findings.
- **DAT-4** — Given a member deletion / Then their entries' attribution behavior is pinned (decision-forcing if dangling).
- **DAT-5** — Given an attachment upload > 10MB or a disallowed MIME type / Then rejected server-side.
- **DAT-6** — Given an attachment on an entry / Then it is listed with the entry and deletable, and the blob is removed on delete.
