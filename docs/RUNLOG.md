# RUNLOG.md — autonomous session log
Newest at top. One block per task; one Session summary per run window. Session summaries also get a short pointer entry in `docs/context/storm-tracker-work-log.md` (the cross-conversation continuity file) — RUNLOG carries the per-task detail, the work log carries the narrative.

---
## Session addendum — 2026-07-09 (M1-1 / ST-077)

### [M1-1] — ST-077 ProjectProvider resilience (F18 included)
- Outcome: **done — issue moved to on-stage** (device cold-start verification is Maria's). AuthProvider exposes `ready`; ProjectProvider gates on `ready && isSignedIn` (also re-loads after sign-in), auto-retries once (1.5s backoff), then surfaces `error`; shared `ProjectLoadError` banner in the tabs layout gives Dashboard/Log/AI Journal/History one in-place Retry; Dashboard's "No projects yet" suppressed on error. `neonFetch` retries a null JWT (300/900ms) and never signs out for transient failures — genuine 401s still do.
- Tests: MOB-1/1b/2/3 (provider), MOB-4/4b/8 (token handling) — mobile suite 10/10. Typecheck clean (one pre-existing error in dead template code, M1-5 deletes it).
- New behavioral constants (need build-spec §8 rows — proposing via digest next run, per the no-hardcoded-numbers rule): provider auto-retry backoff 1500ms; getJwt retry backoff 300ms/900ms (3 attempts).
- Next unblocked: M1-2 (ST-064 loading states). M1-1b (F6) waits only on D-7 (severity-only vs severity+ruleType — one migration either way).

## Session summary — 2026-07-09 (first backlog run — M0 near-complete)
- **Done:** D-1…D-5 answered by Maria (recorded as canon) + D-4 split decision after live discussion; M0-2 (web Vitest, 3 green), M0-3 (mobile jest-expo, 2 green, F12 deps declared), M0-4 (seed recovered to SQL), M0-5 (Postgres rig), M0-7 (30-case db suite: 28 green + 2 expected-fail pins), M0-8 (CI workflow, db path verified locally).
- **Blocked / remaining in M0:** M0-6 schema-drift audit — DB-GATED (no Neon credentials in this environment). M0-8 live-run verification lands with the first push to `staging`.
- **Needs visual review:** none (no UI touched).
- **Test suites:** web 3/3 · mobile 2/2 · db 28 green + 2 pinned expected-fail (F4 jwks, F24 MIXED fallback). All green by protocol definition.
- **New findings:** F23 (committed analysis migration cannot compile — confirmed repo↔prod drift), F24 (documented subthreshold-MIXED fallback is dead code), F25 (episode gap tolerance is 1 missed day, docs say 2), F26 (daily scoring vs episode detection disagree on "DSM-full day"; gateOnlyAdjustment penalizes every gate-met day). Digest D-6/D-7 posted.
- **Next up:** M1-1 (ST-077 ProjectProvider resilience), then M1-1b (F6 severity fix — needs rig, which now exists). Note: this session pushed to its assigned branch `claude/codebase-requirements-doc-iwlutu`; Maria merges to `staging`.

### [M0-8] — GitHub Actions CI
- Outcome: **done (live verification pending first staging push).** Three jobs: web (vitest + tsc/vite build), mobile (jest-expo), db (postgres:16 service container + full rig via `RIG_SUPERUSER_URL`). The CI connection path was simulated locally end-to-end (28 green + 2 pinned).

### [M0-7] — Scoring + episode suite completion
- Outcome: **done, review-productive.** 18 SC + 8 EP + 4 ISO cases. Building the suite against the real trigger exposed three divergences between the SQL and the documented algorithm (F24/F25/F26 — see QUESTIONS). Per hard rules, nothing was changed: current behavior is pinned (SC-8 expected-fail asserting documented behavior; EP-6b pinning current gap semantics; SC-1/1b annotations) and the decisions went to the digest (D-6) / M5-3 scope.
- Notable: SC-19/SC-20 are unobservable until ruleType/severity are persisted → folded into M1-1b, proposed as D-7.

### [M0-5] — Postgres test rig
- Outcome: **done.** `db/rig/` (auth.user_id() shim reading `test.user_id` GUC, Data-API roles, ST-004-mirror grants, migration applier) + `db/tests/` Vitest+pg suite; every test in a rolled-back transaction; RLS tests run as role `authenticated`.
- Blocker found + resolved: the committed `20260407_analysis_tables_and_triggers` migration cannot compile (`v_transitions RECORD[]` — F23). Rig applies it with body-validation off and overlays `db/rig/compat/compute_predictions.sql` (verbatim minus the one dead declaration, provisional until M0-6 diffs production).
- Honesty fix: ISO-9 originally passed vacuously (empty jwks); now seeds a key row and is a `test.fails` pin proving F4 is real.

### [M0-4] — Framework seed recovery (F5)
- Outcome: **done.** `scripts/seed-frameworks.ts` recovered from git history (`2362290^`), converted to `db/seed/dsm5-bipolar.sql` via a mechanical generator (data literals copy-pasted verbatim, escaping programmatic — zero retyping of clinical values). Idempotent natural-key upserts; also assigns existing tenants + seeds the 3 default custom items. Reference copy at `db/seed/reference/` for clinical diffing. AC verified: fresh DB + migrations + seed → SC-1 insert computes MANIC / +3 / {manic:3, depressive:0}.

### [M0-3] — Mobile test infra (+F12)
- Outcome: **done.** jest-expo ~55 + @testing-library/react-native; `generateUUID` exported and tested (shape + 1000-call uniqueness). Declared `react-native-paper@^5.15.3` and `@expo/vector-icons@~15.1.1` as direct deps (were undeclared — F12). Note: `npx expo install` failed through the session proxy; versions pinned to the lockfile's existing resolution instead.

### [M0-2] — Web test infra
- Outcome: **done.** Vitest 4 + jsdom + testing-library; `extractScore` exported from Reports.tsx (no behavior change) and covered for RPT-1/3/4 slices (TEXT computedMood, NULL quick-log fields, per-pole counts). `npm test` + `npm run build` both green.

### [D-1…D-5] — Digest answered (Maria, in chat)
- D-1 harness adopted · D-2 invite repair approved (audit first) · D-3 rig approved · D-4 **split: F6 early as M1-1b** (decided after F8 walkthrough) · D-5 CI approved. All recorded in DECISIONS.md Answered; BACKLOG unblocked accordingly.

---
## Session summary — 2026-07-08 (harness bootstrap)
- **Done:** M0-1 consistency read (full codebase survey: web, mobile, database, migrations, issues); authored the autonomous-run harness (requirements, build-spec, TEST_CASES, BACKLOG, QUESTIONS, DECISIONS, RUNLOG, CLAUDE.md rules), modeled on MoodyMeals' doc set.
- **Blocked:** M0-5 (rig — D-3), M1-10/11 (invite repair — D-2), M5-3 (scoring defects — D-4); the harness itself awaits D-1.
- **Needs visual review:** none (docs only).
- **Test suite:** N/A — no test infra yet (M0-2/M0-3 are next).
- **Next up:** on D-1 approval → M0-2 (web test infra), M0-3 (mobile test infra), M0-4 (seed recovery), then M1-1 (ST-077).

### [M0-1] — Consistency read (docs + code end-to-end)
- Outcome: **done.** 22 findings (F1–F22) logged to QUESTIONS.md before writing any spec content; the 5 decision-forcing ones posted as digest D-1…D-5. Nothing resolved unilaterally.
- Highlights: invite pipeline likely broken as-migrated (F1/F2/F3); `jwks` has no RLS (F4); **no framework seed left in the repo** — a fresh DB scores NULL (F5); severity computed then discarded + episode peakSeverity hardcoded (F6); mobile has two undeclared dependencies incl. its UI library (F12); docs drift on computed-column shapes (F10) and the retired `/api/mobile/*` endpoints (F20).
- Cross-check: every TEST_CASES ID referenced by BACKLOG exists; every BACKLOG task maps to an ST-issue or a filed finding; TEST_CASES fixture roles match the RLS policy set.
- Docs written: `docs/requirements.md`, `docs/build-spec.md`, `docs/TEST_CASES.md` (129 cases across 15 sections, 3 ⚠️ safety sections), `docs/BACKLOG.md` (M0–M6 + Phase F pointer), `docs/QUESTIONS.md` (Q1–Q9, F1–F22), `docs/DECISIONS.md` (D-1…D-5), this file, CLAUDE.md autonomous-runs section.
