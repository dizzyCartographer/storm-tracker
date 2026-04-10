---
id: ST-006
title: Scoring algorithm not clinically validated
type: tech-debt
status: open
priority: high
urgency: low
components:
  - scoring
source: session
created: 2026-04-07
completed:
dev-plan-ref:
---

DSM-5 behavior-to-criterion mappings, classification thresholds, gate criteria logic, and wave score formula were implemented from the builder's interpretation of clinical literature. Not reviewed by a clinician.

**Risk:** Incorrect scoring could mislead caregivers or clinicians. Liability concern.
**Fix:** Clinical review of implemented rules against source DSM-5 criteria.
**When:** Before App Store submission.
