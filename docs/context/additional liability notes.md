# Proposed Additions to `app-purpose-and-liability-constraints.md`

Three new sections to integrate into the existing document, plus a housekeeping note. Sections are written in the existing document’s style and can be inserted as new top-level sections or folded into existing ones at your discretion.

-----

## **Crisis Handling Posture**

Storm Tracker is explicitly **not a crisis intervention tool**. This posture must be visible, consistent, and unmissable throughout the app experience.

**Where crisis resources appear:**

- **Onboarding / first run:** Clear acknowledgment that the app is for longitudinal observation, not crisis response, with crisis resources shown before first use.
- **Persistent footer or help menu:** 988 (Suicide & Crisis Lifeline), Crisis Text Line (text HOME to 741741), and “Call 911 or go to the nearest emergency room” available from every screen.
- **Near any symptom entry involving self-harm ideation, suicidal thoughts, or acute safety concerns:** A non-blocking but visible reminder that if the child is in immediate danger, the parent should contact crisis services rather than continue logging.
- **In exported reports:** A header note indicating the report is for clinical discussion, not crisis triage.

**Protective language:**

> “Storm Tracker is designed for longitudinal observation and is not intended for crisis response. If your child is in immediate danger, experiencing a mental health emergency, or expressing suicidal thoughts, contact 988, text HOME to 741741, or call 911.”

**Avoid:**

- Framing the app as a safety monitoring tool.
- Any language implying the app will alert anyone on the parent’s or child’s behalf.
- Predictive or pattern-based alerts that could be misread as safety warnings.

**Rationale:**

Caregivers of children with suspected mood disorders may be logging during or near crisis moments. The app must be clear about its own scope so that parents turn to appropriate resources when needed, and so that the app is not positioned as a substitute for professional crisis response. This is both a user-safety commitment and a liability protection.

-----

## **Predictive Features: Additional Guardrails**

Predictive features are the highest-risk surface for regulatory and liability exposure. The existing framing (“preparation support, not clinical authority”) is correct, and the following guardrails tighten the line between acceptable and unacceptable predictive output.

**Predictive alerts may:**

- Suggest the parent consider preparation for a potentially challenging period.
- Reference observed patterns in neutral terms (“recent observations suggest a period of elevated symptom frequency”).
- Encourage general coping strategies (rest, routine, reduced stimulation, connection with support).
- Suggest the parent consider reaching out to the child’s clinician if patterns persist or intensify.

**Predictive alerts must not:**

- Name a specific episode type as likely (“a manic episode is likely”). Use “a pattern consistent with the criteria you selected has been observed” instead.
- Express confidence levels, probabilities, or percentages. No “72% likelihood.” No “high confidence.”
- Recommend specific clinical actions (medication changes, appointment urgency, hospitalization).
- Predict timing with precision (“expect a difficult day tomorrow”). Use relative, preparatory language instead (“you may want to prepare for the coming days”).
- Reference clinical outcomes the app cannot forecast (hospitalization, medication response, diagnosis confirmation).

**Protective phrasing patterns for predictive features:**

> “Recent observations show a pattern similar to ones you’ve flagged before. You may want to prepare for the coming days and consider coping strategies that have helped previously.”

> “The patterns you’ve logged over the past two weeks suggest a period worth discussing with your clinician, especially if they continue or intensify.”

**Avoid:**

> “A manic episode is likely in the next 3-5 days.” (Clinical prediction.)

> “Symptoms are trending toward hospitalization risk.” (Clinical prediction + outcome forecast.)

> “Based on your data, medication may need adjustment.” (Treatment recommendation.)

**Rationale:**

The line between “preparation support” and “clinical prediction” is the line between a wellness tool and a medical device. Predictive features that forecast specific clinical outcomes, recommend clinical actions, or express quantified confidence could shift the app into FDA Software as a Medical Device (SaMD) territory. Keeping predictive output observational, preparatory, and non-quantified preserves the general wellness positioning.

-----

## **Regulatory Positioning**

Storm Tracker is positioned as a **general wellness and educational tool** under FDA enforcement discretion guidelines for low-risk general wellness products (see FDA guidance: “General Wellness: Policy for Low Risk Devices,” 2019).

**The app does not claim to:**

- Diagnose, cure, mitigate, prevent, or treat any disease or condition.
- Function as a medical device or diagnostic instrument.
- Replace professional clinical evaluation, diagnosis, or treatment.
- Provide clinical decision support to healthcare providers.

**The app does provide:**

- A structured framework for caregivers to document behavioral observations they are already making.
- Organization of those observations against criteria the caregiver has selected.
- Summary reports that caregivers may choose to share with qualified clinicians.
- General educational information about behavioral patterns and coping strategies.

**Disclaimer language to include in ToS, privacy policy, and onboarding:**

> “Storm Tracker is a general wellness and educational tool intended to help caregivers organize behavioral observations for their own reference and for optional discussion with qualified healthcare professionals. Storm Tracker is not a medical device, does not provide medical advice, and does not diagnose, cure, mitigate, prevent, or treat any disease or condition. All diagnostic and treatment decisions must be made by licensed clinicians.”

**What would push Storm Tracker out of this category:**

- Direct integration with clinician workflows or EHRs (moves toward SaMD + HIPAA business associate).
- Clinical decision support features for providers (moves toward SaMD).
- Specific treatment recommendations or medication guidance (moves toward SaMD).
- Claims of diagnostic accuracy, sensitivity, or specificity (moves toward regulated medical device).
- Marketing to providers as a clinical tool rather than to caregivers as a documentation tool.

**HIPAA positioning:**

Storm Tracker is not a HIPAA-covered entity or business associate in its current form. Caregivers enter their own observations and own their data. Reports are caregiver-generated and caregiver-shared. The app does not receive data from healthcare providers, does not transmit data to healthcare providers on the caregiver’s behalf, and does not operate as an agent of any covered entity.

The app is architected to be **HIPAA-ready** — encryption at rest and in transit, minimized data collection, audit logging, vendor selection that supports BAAs — so that if future product development (clinician-facing features, EHR integration, provider partnerships) requires HIPAA compliance, the upgrade path does not require re-platforming.

**Rationale:**

Making the regulatory category explicit, in writing, both internally and in user-facing documentation, protects against positioning drift and makes eventual legal review significantly cheaper. A digital health attorney can pressure-test this framing in a single consult rather than developing it from scratch.

-----

## **Housekeeping Note (not part of the document)**

The existing document ends with the paragraph beginning *“If you want, I can also make a one-page ‘reference checklist’ version…”* This appears to be leftover AI conversation text that was inadvertently included in the committed document. It should be removed before the document is shared with any external party (lawyer, clinician, potential partner, investor). It reads as unintended and undermines the document’s authority in contexts where authority matters.

Everything above this line is proposed content for the document itself. This note is for you, not for the doc.