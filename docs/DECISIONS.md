# DECISIONS.md — the decision digest
After every autonomous run, Claude Code posts **3–5 ranked, one-minute-answerable decisions** here. Maria answers inline; **answers are canon** (top of the authority order). Overflow and deep detail live in QUESTIONS.md. Resolved items move to Answered with the date. An unanswered item that now blocks work may reappear once, marked ⏫ — never nagged beyond that.

Format per item:
**D-[n]. [one-line question]** → Options: a) … b) … (recommended: x) → Blocks: [what]
**Maria:** _answer here_

---
## Digest — 2026-07-08 (harness bootstrap + consistency read) — 1 open item remaining

**D-4. Scoring defects: pin now, fix in Phase D — or fix sooner?** F6 (severity computed then thrown away; episode `peakSeverity` hardcoded MODERATE — **and Reports.tsx line 313 prints "Peak severity" on every possible episode in the clinician report**), F8 (documented withdrawal-trend signal never implemented), F9 (episodes re-derive counts instead of reading the persisted ones), F7 (predictions coupled to episodes' temp table). All change clinical output, so they're CLINICAL-REVIEW either way.
→ Options (revised 2026-07-09 after Maria flagged the bundle as unclear — it mixed wrong-output defects with internal-hygiene defects):
   a) split: fix **F6** as soon as the rig exists (it misinforms clinicians today); park F7/F8/F9 to M5 (recommended)
   b) fix all four early
   c) pin all four now, fix everything in M5 (original recommendation)
→ Blocks: M5-3 ordering; whether near-term clinician reports carry a wrong severity label.
**Maria:** _____

---
## Answered (canon)

**D-1. Adopt the autonomous-run harness as written (files in `docs/`, authority order as stated)?**
**Maria:** a) adopt as written (2026-07-09, in chat) → ANSWERED, canon.

**D-2. Invite pipeline repair bundle (F1/F2/F3/F16) — repair migration + invite-details rewrite + redirect fix, schema-drift audit first?**
**Maria:** a) approve the bundle, audit first (2026-07-09, in chat) → ANSWERED, canon. M1-10/M1-11 unblocked pending M0-6 audit results.

**D-3. Test rig: local Postgres 16 + `auth.user_id()` shim + recovered SQL seed, run by Vitest (build-spec §5.1)?**
**Maria:** a) approve (2026-07-09, in chat) → ANSWERED, canon. M0-5 unblocked.

**D-5. Minimal GitHub Actions CI running the three suites on push to staging?**
**Maria:** a) yes (2026-07-09, in chat) → ANSWERED, canon. Added as backlog task M0-8.
