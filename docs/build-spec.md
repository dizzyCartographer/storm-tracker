# Storm Tracker — Build Spec
### Companion to `docs/requirements.md` — for execution by Claude Code — v1.0 (2026-07-08)

This is the buildable translation of the requirements. The requirements doc is the north star; this one pins resolved decisions, the data model, the algorithms, the current ground-truth state of the codebase, the test rig, and the work order. It was written from a full codebase survey on 2026-07-08 (findings F1–F22 in `docs/QUESTIONS.md`).

**Authority order:** Maria's answers in `docs/DECISIONS.md` / `docs/QUESTIONS.md` > this doc > `docs/requirements.md` > `docs/context/*`. Claude Code does not edit this document or `requirements.md` — proposed changes go through the Decision Digest.

---

## 1. Resolved decisions

These were decided during 2026 development and are settled. Do not relitigate; deviations require a digest entry.

| Decision | Resolution | Notes |
|---|---|---|
| Web framework | **Vite + React SPA** (Next.js removed, ST-060/071 done) | Every page behind auth; no SSR |
| Data access | **Neon Data API (PostgREST) for ALL reads and writes**, both platforms | JWT bearer; no custom GET endpoints, no ORM at runtime |
| Computation | **Postgres triggers at write time; read paths never compute** | `compute_daily_score` BEFORE trigger; `run_tenant_analysis` AFTER trigger |
| Authorization | **RLS only**, via `is_tenant_member()` / `is_tenant_owner()` + `auth.user_id()` (pg_session_jwt) | No app-layer permission checks |
| Auth provider | **Better Auth** (self-hosted serverless), RS256 JWT, JWKS at `/api/auth/jwks`, plugins `expo()` + `jwt()`; web routes via **Hono** catch-all rewrite | Plugin order matters; 15-min JWT |
| Serverless functions | Only for server-side secrets: `auth`, `parse-journal` (Anthropic), `attachments` (Vercel Blob), `invite-details`, `health` | Anything else is a violation |
| Clinical config | **Database-driven frameworks** (dsm5-bipolar seeded in prod); behavior checklist is criterion-level (17 items, Phase 16) | New frameworks = rows, not code |
| Entry uniqueness | One per (userId, tenantId, date); upsert via `?on_conflict="userId","tenantId",date` + `Prefer: resolution=merge-duplicates` | ST-072 |
| Mobile stack | Expo SDK 55 / RN 0.83 / expo-router / **React Native Paper** (MD3, iOS-feel) / mint-teal `lib/theme.ts` | ST-048 formal eval still open |
| Mobile backend | **Always production** (`storm-tracker-murex.vercel.app` + prod Neon Data API), both build profiles | Staging preview URLs are unstable |
| iOS builds | **Local Xcode archive** → Organizer → TestFlight; staging=`StormTrackRxDev` workspace, prod=`StormTrackRx`; build number bumped in `app.json` before every archive | EAS is fallback only |
| Environments | local → **staging** (git `staging`, Neon `staging`, own JWKS) → production (git `main`, Neon `main`); staging-first, never direct to main | Doc-only changes exempt |
| Migrations | Prisma CLI today; **dbmate is the decided target** (ST-076), grants migration first (ST-004) | Prisma is migration-runner-only debt |
| ID strategy | UUIDs everywhere; mobile generates client-side via Math.random `generateUUID()` (no `crypto.randomUUID` in Hermes) | |
| Charts (web) | Recharts | Mobile charting lib: **open** (D-digest) |
| AI | Anthropic via Vercel AI SDK `generateObject` + zod, server-side only | Model id currently pinned in `parse-journal.ts` |

---

## 2. Data model (pinned)

Canonical schema: `prisma/schema.prisma` + `prisma/migrations/` (raw SQL; the analysis tables exist only in migration SQL, not in the Prisma schema). Deep reference: `docs/context/data-architecture.md` — **with these corrections, which override that doc** (doc drift, F10):

- `entries.computedMood` is **TEXT** (classification label), `computedScore` is **DOUBLE PRECISION** (wave score), `computedCriteriaCounts` is **JSONB** `{pole_slug: count}` including zero-count poles; all three are NULL for quick-log-only entries or when no framework is active.
- There is **no `hasBehaviorDetail` column**. Quick-log-only detection = `behaviorKeys` empty / computed fields NULL.
- `invites` has a **`used` BOOLEAN** — there is no `status` column (see F1).
- `tenant_members` has **only `joinedAt`** — no createdAt/updatedAt (see F2).

Table groups (all `@@map`ed to snake_case):

| Group | Tables |
|---|---|
| Auth (Better Auth) | `users`, `sessions`, `accounts`, `verifications`, `jwks` |
| Tenancy | `tenants`, `tenant_members`, `invites` |
| Daily data | `entries`, `custom_checklist_items`, `attachments` |
| Treatment | `medications`, `strategies` |
| Analysis output (trigger-written, SELECT-only via RLS) | `episodes`, `prodrome_signals`, `predictions`, `suggestions` |
| Framework config (global read for authenticated) | `diagnostic_frameworks`, `criterion_poles`, `criteria`, `framework_behavior_categories`, `behavior_definitions`, `behavior_criterion_mappings`, `mood_descriptor_mappings`, `classification_rules`, `episode_thresholds`, `signal_rules`, `signal_behaviors`, `tenant_frameworks` |

**Modeling rules (from `application-architecture-standards.md`, restated as hard rules):** normalize reference data, flatten transactional data (JSONB arrays on `entries`); persist computed values as columns; analysis results are their own tables, replaced wholesale; every new table gets RLS in the same migration; **any schema change is digest-gated** — the data model belongs to Maria.

**PostgREST addressing:** camelCase columns must be double-quoted in query strings (`"tenantId"=eq.<id>`). RPC endpoints in use: `/rpc/create_tenant_with_owner`, `/rpc/accept_invite`.

---

## 3. Algorithm specs (pinned values)

Canonical algorithm documentation: `docs/context/scoring-logic.md` and `docs/context/signals-and-suggestions.md`. The SQL implementations in `prisma/migrations/20260421_persist_criteria_counts` (scoring) and `20260407_analysis_tables_and_triggers` (analysis) are the executable truth. Where docs and SQL disagree, **the SQL is current behavior and the disagreement is a filed finding** — never silently "fix" scoring; scoring changes are CLINICAL-REVIEW gated.

### 3.1 Daily scoring (`compute_daily_score`, BEFORE INSERT/UPDATE on entries)
- Empty `behaviorKeys` or no active tenant framework → all computed fields NULL.
- Behavior keys → criteria via `behavior_criterion_mappings`; GATE sets `gate_met`, CORE sets `core_met`; criterion numbers accumulate in per-pole **sets** (dedup — two behaviors hitting the same criterion count once).
- Mood descriptor mappings: MANIC satisfies manic gate; MIXED satisfies manic gate + adds depressive #1; DEPRESSIVE adds depressive #1 (CORE).
- Classification rules evaluated by `priority DESC`, first match wins. DSM-5 bipolar as seeded: manic DSM5_FULL = gate + 3 (with `gateOnlyAdjustment` — exact semantics ambiguous, F21, pin by test); manic SUBTHRESHOLD = gate + 2; depressive DSM5_FULL = core + 5; depressive SUBTHRESHOLD = core + 3; MIXED = primary + `minOppositeCriteria` 3 opposite-pole. Subthreshold fallback: 2+ poles at subthreshold → MIXED.
- `computedScore` = Σ (pole.direction × pole criteria count); manic +1, depressive −1.
- Severity ladder is computed internally but **never persisted** (F6): DSM5_FULL → SEVERE if ≥2 severe impairments else MODERATE; otherwise MODERATE if ≥1 severe impairment or ≥3 criteria, else MILD.
- Safety concern = `impairments.SAFETY_CONCERN != "NONE"` (feeds signals; not persisted on the entry).

### 3.2 Episodes (`compute_episodes`) — delete + rebuild per tenant
- Runs of consecutive non-NEUTRAL days, gaps ≤ **2** days tolerated, minimum run **2** days.
- Rebuilds per-pole day counts from `behaviorKeys` at analysis time (does not read `computedCriteriaCounts` — F9).
- Thresholds (seeded): MANIC 7d / HYPOMANIC 4d / DEPRESSIVE 14d at DSM5_MET (requires ≥1 day meeting full DSM criteria); MANIC 4d / HYPOMANIC 2d / DEPRESSIVE 7d and 5d at PRODROMAL_CONCERN. ≥2 poles matched → MIXED.
- `peakSeverity` currently hardcoded `'MODERATE'` for all runs (F6). DSM fallback threshold ≥3 criteria when no DSM5_FULL rule found.

### 3.3 Signals (`compute_prodrome_signals`) — delete + rebuild
- Framework rules from `signal_rules`/`signal_behaviors`: simple mode (count ≥ `minOccurrences` within `windowDays`) or trend mode (window doubled, fires if `late ≥ trendMinLate AND late > early`). Templates fill `{count}`/`{window}`.
- Hardcoded generic rules: safety concern in last 7 days → ALERT; ≥3 classification changes in last 7 days → WARNING. The documented "withdrawal trend" generic signal is **not implemented in SQL** (F8).

### 3.4 Predictions (`compute_predictions`) — delete + rebuild; needs ≥7 entries
- CYCLE: avg gap between classification transitions, valid 1–90 days; MEDIUM if ≥4 transitions else LOW.
- TREND: last-3-day vs prior-4-day per-pole criteria averages; escalating if recent ≥2 AND > prior×1.5 (HIGH at manic ≥3 / depressive ≥4); resolving if prior ≥2 AND recent < prior×0.5 AND opposite pole < 2.
- DAY_PATTERN: needs ≥14 entries; a weekday whose avg ≥ 2× overall AND ≥3.
- FORECAST: needs ≥5 entries; dominant classification ≥3 of last 5 (HIGH if ≥4/5).
- ⚠️ Reads the `_scored_days` temp table that `compute_episodes` creates — only works because `run_tenant_analysis` calls them in order within one transaction (F7). Pole slugs `'manic'`/`'depressive'` hardcoded (F7).

### 3.5 Suggestions (`compute_suggestions`) — delete + rebuild
- Triggers per the matrix in `signals-and-suggestions.md`: safety → SAFETY/HIGH (mentions 988); ≥3 manic days in 7 → reduce stimulation, protect sleep, calm language; ≥3 depressive days in 7 → gentle connection, simplify expectations, caregiver self-care; escalation prediction → contact clinician; sleep-disruption / escalating-irritability / mood-instability signals → mapped tips; imminent cycle transition → prepare.
- Suggestion text is static strings inside the function; ⚠️ any wording change is LNG-gated (liability language).

---

## 4. Current state (ground truth, surveyed 2026-07-08)

### 4.1 Web (`web/`) — Vite SPA, live in production
All 14 pages implemented and functional: Landing, SignIn, Invite, Dashboard, Log, LogDetail, History, Reports, Projects, ProjectCreate, ProjectDetail, Profile, JournalImport, Reference, NotFound. Full CRUD for meds/strategies/custom items/invites on ProjectDetail. Reports read persisted computed values (ST-074 fixed).

Known defects/debt (details in QUESTIONS findings):
- `api/auth.ts` debug handlers leak error bodies/stacks (ST-068, F-linked).
- `api/_auth-config.ts` dead (ST-069); `components/DatePicker.tsx` dead (F14).
- `api/attachments.ts` fully implemented but **no UI anywhere uses it** (F15).
- `api/invite-details.ts` bypasses RLS with a direct SQL connection AND queries `"Invite"`/`"Tenant"` capitalized table names that don't match the schema's `invites`/`tenants` (F3) — verify against live DB.
- `SignIn.tsx` ignores `?redirect=` — invite flow drops users at the dashboard (F16).
- Dashboard/History/LogDetail read `computedMood.classification` as if JSONB; schema says TEXT (F11).
- Hardcoded Neon URLs in `api/_auth.ts` and `api/invite-details.ts` (F22).
- No tests, no test script, no CI.

### 4.2 Mobile (`mobile/`) — Expo, primary client
Working: auth (email sign-in/up), dashboard (entries/episodes/signals/predictions/suggestions), full daily log with framework-driven checklist + ST-065 retry banner, AI journal import tab, history calendar, entry detail + edit, projects list/detail/edit/set-default, profile.

Known defects/debt:
- **ST-077 (top priority):** `ProjectProvider` fires one load on mount with no auth-ready gate; failure is swallowed (`console.error`), no error state, no retry, nothing re-fires on auth warm-up → Dashboard/History/Log/Entry-detail stranded on "No projects yet" until sign-out/in. `(tabs)/projects.tsx` does its own later fetch, which is why it works.
- `getJwt()` returns null on any failure; `neonFetch` responds to null JWT by **signing the user out** and throwing (F18). `neonFetch` retries (3 attempts, no backoff) only the `"jwk not found"` 400.
- Error handling is a mix (ST-073): real-message + retry (dashboard, projects, project detail), generic alerts (log-edit save, project-edit load, profile), silent swallow (project-context, history, import reference load).
- `react-native-paper` and `@expo/vector-icons` are used everywhere but **undeclared in package.json** (F12).
- Dead code: 10 Expo-template components + template hooks/constants; orphaned `journal-import.tsx` duplicate screen (F13).
- `entry/[id]` renders raw UUIDs for missed meds/strategies; pole coloring via hardcoded itemKey list (F19).
- Missing vs web: reports/PDF (ST-039/059), project create/delete (ST-040), meds/strategies CRUD (ST-041), attachments (ST-058/037), invites (ST-061/062), reference page (ST-057), offline (ST-043), selection persistence (ST-010).
- No tests, no test script.

### 4.3 Database
- 17 migrations; RLS on everything except: `jwks` has **no RLS at all** (holds private keys — F4); `verifications` deny-all (intended); `tenant_members` lacks an UPDATE policy so roles can't be changed via the Data API (F17).
- `accept_invite()` references `invites."status"` and `tenant_members."createdAt"/"updatedAt"` — columns that don't exist in any migration (F1/F2). Either broken in prod or the live DB has drifted from the migrations. **Schema-drift audit is an M0 task.**
- Neon Data API role GRANTs are still not in any migration (ST-004 confirmed — only two function EXECUTE grants exist).
- **No framework seed exists in the repo** (F5) — `scripts/seed-frameworks.ts` was deleted in ST-071. A fresh database scores every entry NULL. The seed content is recoverable from git history and must come back as plain SQL.

### 4.4 On-stage work (built, awaiting verify/merge)
ST-051–056, ST-065, ST-067 live on the `staging` branch pending device verification and merge to `main`. Device verification is DEVICE-GATED (Maria's Mac/TestFlight).

---

## 5. Test rig specification (the enabler for everything)

There are zero tests today (ST-005) in an app whose core logic is clinical scoring inside Postgres. The rig has three tiers:

### 5.1 Postgres rig (`db/tests/`) — the crown jewel
- **Runtime:** local Postgres 16 (Docker `postgres:16` locally; the cloud session container has psql + Docker available). One throwaway database per run.
- **Auth shim:** the Neon extension `pg_session_jwt` provides `auth.user_id()`. In the rig, before applying RLS migrations: `CREATE SCHEMA auth; CREATE FUNCTION auth.user_id() RETURNS text AS $$ SELECT current_setting('test.user_id', true) $$;`. Tests impersonate a user with `SET LOCAL test.user_id = '<uuid>'` and switch to a non-owner role (`CREATE ROLE authenticated NOLOGIN; SET ROLE authenticated`) so RLS actually applies.
- **Setup:** apply `prisma/migrations/*/migration.sql` in directory order with psql, then apply the recovered seed (`db/seed/dsm5-bipolar.sql`).
- **Runner:** Vitest + `pg` client in `db/tests/*.test.ts` (`npm test` from a new `db/package.json`, or root workspace script). Each test file opens a transaction, sets role + user GUC, exercises inserts, asserts computed columns / analysis rows, rolls back.
- **Naming:** every test references its TEST_CASES ID: `test("SC-1: euphoric gate + 3 B criteria classifies MANIC DSM5_FULL", …)`.

### 5.2 Web unit tests — Vitest + @testing-library/react + jsdom in `web/`. First targets: `Reports.extractScore`, date-range logic, classification display fallbacks, language-invariant greps (LNG cases).

### 5.3 Mobile unit tests — `jest-expo` + @testing-library/react-native in `mobile/`. First targets: `ProjectProvider` (mocked api/auth: ready-gating, error state, retry), `neonFetch` retry/null-JWT behavior, `generateUUID`.

**Rules:** tests reference constants from §8 (or the DB config tables), never re-hardcode magic numbers; a red test in TEST_CASES §1–§3 (⚠️ sections) halts feature work; a task without tests for its acceptance criteria is not done (once the rig exists — M0).

---

## 6. Milestones (thin vertical slices)

Detailed, criteria-tagged tasks live in `docs/BACKLOG.md`. Milestones:

- **M0 — Harness & rig:** consistency read (done 2026-07-08); web + mobile unit-test infra; framework seed recovered to SQL; Postgres test rig with auth shim; schema-drift audit vs live DBs (DB-GATED).
- **M1 — Phase A stability:** ST-077 auth-ready + retry; ST-064 loading states; ST-073 error surfacing; ST-068/069 cleanup + dead-code sweep; computedMood shape reconciliation; ST-076 dbmate; ST-004 grants migration; RLS/function repair migration (digest-gated); on-stage verification sweep (DEVICE-GATED).
- **M2 — Reports on mobile:** charting decision (digest); mobile reports screen; PDF export; project info in PDF.
- **M3 — Phase B completion:** projects create/delete; meds/strategies CRUD on mobile; name resolution in entry detail; selection persistence; dismissable dashboard (schema → digest); offline read cache then write queue (conflict design → digest); positive-behavior tracking (product design → digest); attachments UI web + mobile; project-edit UX parity; SignIn redirect fix.
- **M4 — Phase C multi-user & privacy:** invite acceptance on mobile (deep link); email invites + member names; invite-details repair; private notes (schema → digest); privacy controls (product → digest); onboarding; discrepancy persistence (schema → digest); read-only project view.
- **M5 — Phase D clinical validation:** full TEST_CASES coverage; clinician review package generated from live config; scoring-defect fixes (F6/F8/F9 — CLINICAL-REVIEW); source citations; reference on mobile.
- **M6 — Phase E App Store:** Apple Sign In, push notifications + novelty engine, biometrics, assets, privacy policy draft, iPad, submission (largely DEVICE-GATED).
- **Phase F** — pointer only; not scheduled here.

Each milestone ships something usable. M0–M1 make the app trustworthy; M2 delivers the single biggest daily-life gap (clinician reports from the phone).

---

## 7. Open questions

Live in `docs/QUESTIONS.md`. Highest-consequence at time of writing: harness approval (D-1), invite pipeline repair (D-2), test rig approach (D-3), scoring-defect policy (D-4), CI (D-5), plus the product questions listed at the end of `requirements.md`.

---

## 8. Constants & thresholds registry

Storm Tracker's clinical thresholds rightly live in database tables (classification_rules, episode_thresholds, signal_rules) — that is the equivalent of Moody's TuningConfig and must stay data-driven. The following are the remaining **code-level** constants. Rule: no new behavioral constant may be added without a row here (and a digest note); tests reference this table.

| Constant | Value | Where | Notes |
|---|---|---|---|
| Episode run gap tolerance | 2 days | `compute_episodes` | hardcoded |
| Episode min run length | 2 days | `compute_episodes` | hardcoded |
| Episode DSM fallback criteria | ≥3 | `compute_episodes` | when no DSM5_FULL rule |
| Episode peakSeverity | 'MODERATE' always | `compute_episodes` | F6 defect, fix in M5 |
| Safety-concern signal window | 7 days | `compute_prodrome_signals` | hardcoded |
| Mood-instability signal | ≥3 changes / 7 days | `compute_prodrome_signals` | hardcoded |
| Predictions minimum history | 7 entries | `compute_predictions` | |
| Cycle validity range | 1–90 days | `compute_predictions` | |
| Trend windows | last 3d vs prior 4d; ×1.5 escalate; ×0.5 resolve | `compute_predictions` | |
| Trend HIGH confidence | manic ≥3, depressive ≥4 | `compute_predictions` | |
| Day-pattern gate | ≥14 entries; ≥2× overall AND ≥3 | `compute_predictions` | |
| Forecast gate | ≥5 entries; dominant ≥3/5; HIGH ≥4/5 | `compute_predictions` | |
| Suggestion day threshold | ≥3 manic / ≥3 depressive days in 7 | `compute_suggestions` | |
| Severity ladder | ≥2 severe imp → SEVERE (full); ≥1 severe or ≥3 criteria → MODERATE; else MILD | `compute_daily_score` | not persisted (F6) |
| JWT lifetime | 15 min | `web/api/auth.ts` | |
| neonFetch retries | 3 attempts, `jwk not found` only, no backoff | web + mobile `api.ts` | |
| Dashboard read limits | entries 14 / episodes 10 / signals 20 / predictions 10 / suggestions 20 | both `api.ts` | |
| Attachment limits | 10 MB; PDF/JPEG/PNG/GIF/WebP | `web/api/attachments.ts` | |
| Invite expiry | 7 days | invite creation | |
| Anthropic model | pinned string in `web/api/parse-journal.ts` | | consider env-driven (Q) |

Open structural question (park until it matters): whether code-level analysis constants should move into an `analysis_config` table so they're tunable without migrations — schema change, digest-gated.
