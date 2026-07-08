# DECISIONS.md — the decision digest
After every autonomous run, Claude Code posts **3–5 ranked, one-minute-answerable decisions** here. Maria answers inline; **answers are canon** (top of the authority order). Overflow and deep detail live in QUESTIONS.md. Resolved items move to Answered with the date. An unanswered item that now blocks work may reappear once, marked ⏫ — never nagged beyond that.

Format per item:
**D-[n]. [one-line question]** → Options: a) … b) … (recommended: x) → Blocks: [what]
**Maria:** _answer here_

---
## Digest — 2026-07-08 (harness bootstrap + consistency read) — 5 open items, ranked by unblock value

**D-1. Adopt this autonomous-run harness as written?** The new files (`docs/requirements.md`, `docs/build-spec.md`, `docs/TEST_CASES.md`, `docs/BACKLOG.md`, this file, `docs/QUESTIONS.md`, `docs/RUNLOG.md`) + the "Autonomous Runs" section in CLAUDE.md, with authority order DECISIONS/QUESTIONS answers > build-spec > requirements > context docs. Note one deliberate deviation from MoodyMeals: files live in `docs/` (not repo root) so ContextStore/Obsidian can see them — you review and answer digests in your own tools.
→ Options: a) adopt as written (recommended) b) adopt but move protocol files to repo root like Moody c) tweak (say what)
→ Blocks: everything — the protocol is only canon once you bless it.
**Maria:** _____

**D-2. Invite pipeline repair bundle (F1/F2/F3/F16 — invites are likely broken in production).** `accept_invite()` targets columns that don't exist as migrated, `invite-details` queries table names that don't match the schema, and sign-in drops the `?redirect=` back to the invite. Proposal: one repair migration (fix `accept_invite` to use the real `used` boolean + real `tenant_members` columns; fix `create_tenant_with_owner` the same way) + rewrite `invite-details` on the correct tables with env-driven config + honor the redirect param. Schema-drift audit (M0-6) runs first to see what production actually has.
→ Options: a) approve the bundle, audit first (recommended) b) audit only, decide after c) invites aren't worth fixing yet — park
→ Blocks: M1-10, M1-11, all of M4 (multi-user), and possibly real invites today.
**Maria:** _____

**D-3. Test rig approach: local Postgres 16 + `auth.user_id()` shim + recovered SQL seed, run by Vitest?** Details in build-spec §5.1. This is how the clinical scoring rules and RLS policies finally get automated tests (ST-005) without touching Neon. The shim replaces the Neon-only `pg_session_jwt` extension in tests; RLS tests run under a real non-owner role.
→ Options: a) approve (recommended) b) prefer Neon ephemeral branches as the rig (needs ST-004 grants first, network + creds every run) c) discuss
→ Blocks: M0-5 → M0-7 → every ⚠️ clinical/RLS test → the "tests before commit" rule having teeth.
**Maria:** _____

**D-4. Scoring defects: pin now, fix in Phase D — or fix sooner?** F6 (severity computed then thrown away; episode `peakSeverity` hardcoded MODERATE), F8 (documented withdrawal-trend signal never implemented), F9 (episodes re-derive counts instead of reading the persisted ones), F7 (predictions coupled to episodes' temp table). All change clinical output, so they're CLINICAL-REVIEW either way. Proposal: tests pin current behavior now (SC-21, EP-11, SIG-8, PRD-7); fixes bundle in M5-3 with your review.
→ Options: a) pin now, fix in M5 (recommended — Phase D is the clinical-review phase) b) fix F6+F9 sooner (they affect what clinicians see in reports) c) discuss
→ Blocks: M5-3 ordering; nothing immediate.
**Maria:** _____

**D-5. Add GitHub Actions CI to run the three test suites on push?** Free for public/private repos at this scale; your architecture standards require approval for any new external service. Keeps overnight runs honest (a red suite blocks merge) even when no session is live.
→ Options: a) yes, minimal CI: web + mobile + db suites on push to staging (recommended) b) not yet — suites run only inside sessions
→ Blocks: nothing today; raises the floor on every future run.
**Maria:** _____

---
## Answered (canon)
*(empty — answers move here with dates)*
