# BACKLOG.md — Storm Tracker build queue
Work top-down. Format: `[ID] (est) Task — Acceptance criteria`. Statuses: `TODO / IN-PROGRESS / DONE / BLOCKED(Q#|D#) / NEEDS-VISUAL-REVIEW`.
Tags: **NEEDS-VISUAL-REVIEW** (UI — implement, screenshot if possible, never iterate on aesthetics autonomously) · **CLINICAL-REVIEW** (touches scoring rules or interpretive language — Maria approves before merge) · **PROMPT-REVIEW** (AI prompt/tone — never tune autonomously) · **DEVICE-GATED** (needs Maria's Mac / simulator / TestFlight / App Store) · **DB-GATED** (needs live Neon credentials) · **DIGEST-GATED** (schema or product decision — needs a DECISIONS.md answer first).
Every task cites its TEST_CASES IDs; a task without tests for its ACs is not done (once M0-5 lands). ST-xxx references are `docs/issues/` tickets — update the issue file + `_index.md` when a task closes one.

## M0 — Harness & test rig
- [M0-1] **[DONE 2026-07-08]** (—) Consistency read — full codebase + docs survey; contradictions and defects logged. **AC:** findings list written before any code. → F1–F22 in QUESTIONS.md; digest D-1…D-5 in DECISIONS.md.
- [M0-2] (60m) Web unit-test infra — Vitest + @testing-library/react + jsdom in `web/`; `npm test` script; first real test: `Reports.extractScore` handles TEXT `computedMood`, NULL computed fields (RPT-3 slice). **AC:** `npm test` green in `web/`.
- [M0-3] (60m) Mobile unit-test infra — jest-expo + @testing-library/react-native in `mobile/`; declare the undeclared deps while touching package.json (`react-native-paper`, `@expo/vector-icons` — F12); first test: `generateUUID` shape/uniqueness. **AC:** `npm test` green in `mobile/`; `npx expo-doctor` no missing-dep complaints.
- [M0-4] (90m) Framework seed recovery — recover `scripts/seed-frameworks.ts` content from git history (deleted in ST-071); convert to idempotent plain SQL at `db/seed/dsm5-bipolar.sql` (ON CONFLICT keyed on slugs/itemKeys; safe to re-run). **AC:** fresh Postgres + migrations + seed → an SC-1 style insert produces non-NULL `computedMood`. Content is clinical config: **CLINICAL-REVIEW** — the SQL must be value-identical to the historical seed; any discrepancy is a QUESTIONS entry, not a judgment call.
- [M0-5] (90m) Postgres test rig — per build-spec §5.1: local Postgres 16 (initdb/pg_ctl or Docker), migration applier, `auth.user_id()` shim, role switching, Vitest+pg runner in `db/tests/`. **AC:** SC-1, SC-2, SC-16, ISO-1, ISO-2 implemented and passing (or failing with findings filed). *(D-3 answered 2026-07-09: approved.)*
- [M0-6] (60m) Schema-drift audit — dump live production + staging schema/function definitions; diff against migrations; specifically verify F1/F2 (`accept_invite`), F3 (`"Invite"`/`"Tenant"` tables), jwks RLS state, applied GRANTs. **AC:** drift report appended to QUESTIONS.md; reconciliation plan proposed in the digest. **DB-GATED.**
- [M0-7] (45m) Scoring-suite completion — implement remaining §1 SC cases + §4 EP-1..6 against the rig. **AC:** all implemented cases green or pinned-red with findings. Depends: M0-4, M0-5.
- [M0-8] (45m) GitHub Actions CI — minimal workflow: web, mobile, and db suites on push to `staging` (and PRs into it). **AC:** a red suite fails the check; green run visible on GitHub. *(Approved D-5, 2026-07-09.)*

## M1 — Phase A: core stability
- [M1-1] (90m) **ST-077** ProjectProvider resilience — add `ready` flag to AuthProvider (true after session hydration); gate the first load on it; add `error` state + auto-retry once with short backoff + visible Retry banner consumed by Dashboard/History/Log/Entry-detail; `getJwt()` null must NOT trigger signOut (transient path retries — F18). **AC:** MOB-1..4 as jest-expo tests with mocked auth/api; manual cold-start check.
- [M1-2] (60m) **ST-064** loading states — every list screen shows skeleton/spinner until first fetch resolves; empty-state copy only after confirmed-empty. **AC:** MOB-5, MOB-6. NEEDS-VISUAL-REVIEW.
- [M1-3] (60m) **ST-073** error surfacing audit — replace generic/silent catches in `log-edit` (save), `project-edit` (load), `profile`, `history`, `import`/reference loads with real-message + retry-where-sensible. **AC:** MOB-7; grep shows no user-facing catch that drops `e.message`.
- [M1-4] (30m) **ST-068** remove web auth debug handlers — the 500 body-leak, the `err.stack` response, the `app.all("*")` debug route. **AC:** AU-5; staging sign-in verified working after deploy.
- [M1-5] (45m) **ST-069** + dead-code sweep — delete `web/api/_auth-config.ts`, unused `web/src/components/DatePicker.tsx` (F14), the 10 mobile Expo-template components + template hooks/constants, orphaned `mobile/src/app/journal-import.tsx` (F13). **AC:** both apps build green; grep shows zero imports of removed files.
- [M1-6] (45m) computedMood shape reconciliation (F10/F11) — clients treat `computedMood` as TEXT everywhere (remove `.classification` object paths in web Dashboard/History/LogDetail); fix `docs/context/data-architecture.md` (computedMood/computedScore types, remove `hasBehaviorDetail`). **AC:** RPT-1; web tests for display fallbacks.
- [M1-7] (60m) SignIn redirect + invite return path (F16) — honor `?redirect=` on web sign-in/up. **AC:** INV-6.
- [M1-8] (90m) **ST-076** dbmate switch, repo side — `db/migrations/` conversion with `-- migrate:up` headers, dbmate config, docs update. **AC:** `dbmate up` from scratch reproduces the schema in the rig (M0-5 re-run green). Live-DB cutover (tracking-table seeding, Vercel build step): **DB-GATED**, separate sign-off.
- [M1-9] (45m) **ST-004** grants migration — first dbmate migration: schema USAGE + table grants for `authenticated`/`anonymous`/`authenticator`/`neon_auth` per environment-and-deployment.md. **AC:** rig applies it; live apply DB-GATED.
- [M1-10] (60m) Authz/function repair migration — fix `accept_invite` (use `used` boolean, correct tenant_members columns), fix `create_tenant_with_owner` columns, add RLS to `jwks`, add owner-only UPDATE policy to `tenant_members`. **AC:** INV-2..5, ISO-9, ISO-10 green in rig. *(D-2 answered 2026-07-09: bundle approved, audit first — depends on M0-6 findings.)*
- [M1-11] (45m) Fix `web/api/invite-details.ts` — correct table names, env-driven URL (F22), minimal field exposure; keep public-by-design behavior. **AC:** INV-5 green; invite landing works on staging. *(D-2 approved; depends on M0-6.)*
- [M1-12] (30m) On-stage verification sweep — confirm ST-051..056/065/067 are merged or still pending on `staging`; update issue index to match reality. Device checks **DEVICE-GATED**; repo-side status reconciliation is autonomous-safe.

## M2 — Reports on mobile (biggest daily-value gap)
- [M2-1] (30m) Charting library decision — present options (victory-native XL vs react-native-gifted-charts vs Skia-based) with tradeoffs vs Recharts parity. **BLOCKED(D)** — new dependency requires approval; post to digest.
- [M2-2] (120m) **ST-039** mobile Reports screen — date range picker, stat summary, wave graph (computedScore, classification-colored dots), behavior frequency, impairment summary, notes list; reads persisted values only. **AC:** RPT-1..5, RPT-9. NEEDS-VISUAL-REVIEW. Depends: M2-1.
- [M2-3] (90m) **ST-059** mobile PDF export — expo-print HTML template mirroring web print layout (patient info, wave, frequency, episodes, notes); share sheet. **AC:** RPT-8. NEEDS-VISUAL-REVIEW; expo-print is an Expo package but still note it in the digest (dependency rule).
- [M2-4] (60m) **ST-012** project info in clinician PDF — cover/header section with teen profile, active meds, strategies on web + mobile exports. **AC:** RPT-6; LNG-2 language check.

## M3 — Phase B completion (solo caregiver feature-complete)
- [M3-1] (90m) **ST-040** projects create/delete on mobile — create via `/rpc/create_tenant_with_owner` (with copy-from-existing parity), owner-only delete with typed confirmation. **AC:** ISO-4; create→log→dashboard slice works in one session. NEEDS-VISUAL-REVIEW.
- [M3-2] (90m) **ST-041** medications & strategies CRUD on mobile — add/edit/discontinue/delete meds; add/delete strategies + load-defaults; mirrors web ProjectDetail capability. **AC:** parity checklist vs web; RLS paths ISO-12.
- [M3-3] (45m) Entry-detail hygiene (F19) — resolve med/strategy UUIDs to names; replace hardcoded itemKey pole-coloring with framework-driven pole lookup. **AC:** entry detail shows names; coloring works for any framework.
- [M3-4] (45m) **ST-010** project-selection persistence — persist selected tenant (SecureStore mobile / localStorage web); restore on launch; verify web behavior and close or re-scope the ticket. **AC:** relaunch keeps selection; default-tenant fallback intact.
- [M3-5] (60m) **ST-016** dismissable dashboard items — needs a `dismissals` design (per-user? per-item-hash? does recompute resurrect?). **BLOCKED(D)** — schema + product semantics to digest, then implement. **AC:** dismissed state persists per decision; wholesale-replace interplay tested (EP-9/SIG-7 variants).
- [M3-6] (120m) **ST-043a** offline read cache — stale-while-revalidate cache for dashboard/history/log lookups on mobile. **AC:** airplane-mode launch shows cached data with staleness indicator; MOB-5 unaffected.
- [M3-7] (—) **ST-043b** offline write queue — **BLOCKED(D)**: conflict-resolution semantics (last-write-wins vs prompt) is a product decision; propose options in digest before building.
- [M3-8] (60m) Attachments UI, web (F15) — wire existing `/api/attachments` into Log form + LogDetail (upload, list, delete). **AC:** DAT-5, DAT-6. NEEDS-VISUAL-REVIEW. (Mobile attachments = ST-058/ST-037, Phase F per index — leave.)
- [M3-9] (60m) **ST-066** mobile project-edit UX — proper date pickers, color picker, section groupings; photo upload depends on M3-8 pattern. **AC:** field-level parity list vs web. NEEDS-VISUAL-REVIEW.
- [M3-10] (—) **ST-013** positive-behavior tracking — **BLOCKED(D)**: does good-day data affect scoring/episode boundaries or is it display/encouragement only? (requirements.md open Q1). Propose design in digest.

## M4 — Phase C: multi-user & privacy
- [M4-1] (90m) **ST-061** invite acceptance on mobile — handle `stormtracker://` + universal links for `/invite/:token`; in-app accept flow. **AC:** INV-2, INV-3, INV-6 mobile variants. Depends: M1-10/M1-11 (working invite pipeline).
- [M4-2] (90m) **ST-062** email invites + member name resolution — send invite by email; member lists show names not IDs. **BLOCKED(D)**: email provider is a new external service (dependency approval + which provider).
- [M4-3] (60m) **ST-011** project read-only view + **ST-022** connected-people descriptions — polished read view for non-owners. NEEDS-VISUAL-REVIEW.
- [M4-4] (—) **ST-027** private caregiver notes — **BLOCKED(D)**: private-to-author vs private-to-role; schema change (column vs table) to digest.
- [M4-5] (—) **ST-008** privacy controls (teen vs caregiver data separation) — **BLOCKED(D)**: define the visibility matrix (requirements Q5) before any code.
- [M4-6] (90m) **ST-009** onboarding flow — first-run: create project, name teen, disclaimers, optional invites. NEEDS-VISUAL-REVIEW + LNG-5.
- [M4-7] (—) Observer-discrepancy persistence — deferred Phase 20.5 design; **BLOCKED(D)** (schema). OBS-3 display behavior meanwhile.

## M5 — Phase D: clinical review & validation
- [M5-1] (120m) **ST-005** full clinical test coverage — every §1/§4/§5/§6/§7 case implemented in the rig; coverage report appended to RUNLOG. **AC:** all TEST_CASES clinical sections green or pinned with findings.
- [M5-2] (90m) **ST-006** clinician review package — generate a plain-language document from the LIVE database config (every behavior→criterion mapping, rule, threshold, with DSM-5 citations) for external clinical review. **CLINICAL-REVIEW** (Maria reviews before it goes anywhere). **AC:** doc generated reproducibly from DB; matches reference page.
- [M5-3] (—) Scoring-defect fixes bundle — F6 (persist severity; real episode peakSeverity), F8 (withdrawal-trend signal: implement or de-document), F9 (episodes read persisted counts), F7 (remove temp-table coupling; framework-agnostic poles). **CLINICAL-REVIEW + BLOCKED(D-4)** — each changes clinical output; tests first (SC-21, EP-11, SIG-8, PRD-7 flip from pinned-red to green).
- [M5-4] (45m) **ST-029** cite sources on reference page; **ST-057** reference page on mobile (60m). **AC:** citation per criterion; mobile parity. CLINICAL-REVIEW for citation accuracy.

## M6 — Phase E: App Store (mostly DEVICE-GATED)
- [M6-1] **ST-046** privacy policy — draft autonomously from the data inventory (what's collected, where it lives, Anthropic/Vercel/Neon subprocessors); legal review is Maria's. **AC:** draft in docs/, flagged for review.
- [M6-2] **ST-035** Apple Sign In (Better Auth apple plugin + expo-apple-authentication). DEVICE-GATED verification.
- [M6-3] **ST-036** push notifications + **ST-015** novelty engine — logging reminders with varied copy/timing; PROMPT-REVIEW for the copy bank; product scope BLOCKED(D) (requirements Q6).
- [M6-4] **ST-038** Face ID / Touch ID. DEVICE-GATED.
- [M6-5] **ST-045** app icons/splash/screenshots + **ST-063** iPad layout. NEEDS-VISUAL-REVIEW + DEVICE-GATED.
- [M6-6] **ST-047** App Store submission. DEVICE-GATED, Maria drives.

## Phase F (pointer — not scheduled)
ST-014, ST-018, ST-019, ST-020, ST-021, ST-023, ST-024, ST-025, ST-026, ST-028, ST-030, ST-031, ST-032, ST-033, ST-034, ST-037, ST-042, ST-044, ST-058 — see `docs/issues/_index.md`.

## Parked for review windows (never autonomous)
- Aesthetic iteration of any screen; AI journal prompt tuning (PROMPT-REVIEW); any change to suggestion/episode/prediction wording (LNG + CLINICAL-REVIEW); anything touching production env vars or the production database.

## Blocked pending Maria
- M5-3 scoring defects → **D-4** (revised options posted 2026-07-09). *(D-1/D-2/D-3/D-5 answered 2026-07-09 — see DECISIONS.md Answered section.)*
