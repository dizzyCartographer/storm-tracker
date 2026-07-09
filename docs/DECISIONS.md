# DECISIONS.md — the decision digest
After every autonomous run, Claude Code posts **3–5 ranked, one-minute-answerable decisions** here. Maria answers inline; **answers are canon** (top of the authority order). Overflow and deep detail live in QUESTIONS.md. Resolved items move to Answered with the date. An unanswered item that now blocks work may reappear once, marked ⏫ — never nagged beyond that.

Format per item:
**D-[n]. [one-line question]** → Options: a) … b) … (recommended: x) → Blocks: [what]
**Maria:** _answer here_

---
## Digest — 2026-07-09 evening (first backlog run: M0 executed) — 2 open items (only 2 genuine ones exist)

**D-6. F26 timing: episode detection currently counts "DSM-full days" more loosely than daily scoring — fix early or in Phase D?** Two halves discovered while building the test suite: (a) the daily trigger's `gateOnlyAdjustment` fires on every gate-met day, so full manic effectively needs gate+4 criteria (docs say gate+3, with +1 only for irritable-only presentations — which the single gate checkbox can't even distinguish); (b) the episode function calls a day DSM-full at raw ≥3 criteria with NO gate/core check at all. Net: "Pattern consistent with DSM-5 criteria" episodes in the clinician report can be over-called relative to your own daily rules. Full detail: QUESTIONS F26.
→ Options: a) treat like F6 — fix right after M1-1b, with your review of the intended rule (recommended: it overstates clinical confidence to clinicians, same class as F6) b) park in M5-3 with the rest c) discuss the intended DSM semantics first
→ Blocks: M5-3 scope; accuracy of episode confidence labels in near-term reports.
**Maria:** _____

**D-7. Persist `ruleType` alongside severity in M1-1b?** You approved a severity column (D-4). Rule-path questions (F26, SC-19/SC-20) are unobservable because only the classification label is stored — storing which rule matched (DSM5_FULL vs SUBTHRESHOLD) makes them testable and lets the UI distinguish "full criteria" days from subthreshold days (it used to, in the TypeScript era). One more column on entries, same migration.
→ Options: a) yes, severity + ruleType in one M1-1b migration (recommended) b) severity only
→ Blocks: SC-19/SC-20 pinning; sharper report language later.
**Maria:** _____

---
## Digest — 2026-07-08 (harness bootstrap + consistency read) — all items answered

---
## Answered (canon)

**D-4. Scoring defects: pin now, fix in Phase D — or fix sooner?** (F6 severity discarded + report prints hardcoded "moderate" peak severity; F8 withdrawal-trend signal documented but dropped in the Postgres port; F7/F9 internal plumbing.)
**Maria:** **Split — fix F6 early** (2026-07-09, in chat, after F8 context) → ANSWERED, canon. F6 lands right after the test rig (new task M1-1b, includes approving the persisted-severity column, CLINICAL-REVIEW on the before/after). F7/F8/F9 stay in M5-3 for Phase D review.

**D-1. Adopt the autonomous-run harness as written (files in `docs/`, authority order as stated)?**
**Maria:** a) adopt as written (2026-07-09, in chat) → ANSWERED, canon.

**D-2. Invite pipeline repair bundle (F1/F2/F3/F16) — repair migration + invite-details rewrite + redirect fix, schema-drift audit first?**
**Maria:** a) approve the bundle, audit first (2026-07-09, in chat) → ANSWERED, canon. M1-10/M1-11 unblocked pending M0-6 audit results.

**D-3. Test rig: local Postgres 16 + `auth.user_id()` shim + recovered SQL seed, run by Vitest (build-spec §5.1)?**
**Maria:** a) approve (2026-07-09, in chat) → ANSWERED, canon. M0-5 unblocked.

**D-5. Minimal GitHub Actions CI running the three suites on push to staging?**
**Maria:** a) yes (2026-07-09, in chat) → ANSWERED, canon. Added as backlog task M0-8.
