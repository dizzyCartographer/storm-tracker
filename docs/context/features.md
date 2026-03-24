# Functional Requirements

## Multi-Tenant Architecture
- A user creates a **tenant** for a teen; tenants are isolated from one another.
- Standard CRUD permission model: owner can add/remove users and set roles.
- A teen may optionally join their own tenant; their entries are tagged as **self-observations**.
- All entries are timestamped and attributed to the submitting user.
- Discrepancies between caregiver and self-observations should be surfaced in the UI.

---

## Entry Types

### 1. Quick Log (always required)
Minimum viable entry for tired caregivers.

| Field | Options |
|-------|---------|
| Overall mood descriptor | Manic / Depressive / Neutral / Mixed |
| Overall day quality | Good / Neutral / Bad |

### 2. Behavior Checklist
Boolean checklist. Items are based on formal DSM diagnostic criteria and are **not user-editable**. A separate custom section allows caregivers to add their own patterns.

#### SLEEP
- Very little sleep — Got much less sleep than normal
- Slept too much — Way more sleep than normal or couldn't get out of bed
- Irregular sleep pattern — Up and down, couldn't fall asleep, woke repeatedly

#### ENERGY
- No energy today — Dragging, sluggish, couldn't get going
- Unusually high energy — Wired, amped up, more energy than usual
- Selective energy — Too tired for obligations but fine for preferred activities
- Psychosomatic complaints — Headache, stomachache, body aches with no clear medical cause

#### MANIC
- Pressured rapid speech — Talking fast, loud, or impossible to interrupt
- Racing jumping thoughts — Bouncing between topics, can't stay on one thing
- Euphoria without cause — Unusually happy, giddy, or wired for no clear reason
- Grandiose or invincible — Acting like they're the best, special, or can't be touched
- Nonstop goal activity — Starting tons of projects, plans, tasks all at once
- Physical restless agitation — Pacing, can't sit still, excess physical energy
- Disproportionate rage — Explosive anger way beyond what the situation warranted
- Reckless dangerous choices — Risky behavior they'd normally never do
- Bizarre out-of-character — Dressing, acting, or talking in ways that aren't them
- Denies anything wrong — Insists they're fine when they clearly aren't

#### DEPRESSIVE
- Sad empty hopeless — Down, flat, or hopeless most of the day
- Lost all interest — No motivation for things they usually love
- Eating way more — Noticeably increased appetite or food intake
- Eating way less — Skipping meals or barely eating
- Withdrawn from people — Avoiding friends, family, or any social contact
- Worthless excessive guilt — Saying they're a burden, a failure, not enough
- Can't focus decide — Unable to concentrate or make simple decisions
- Mentioned death dying — Any reference to death, not wanting to be here, or self-harm

#### MIXED / CYCLING
- Mood energy swings — Shifted between high and low mood or energy within the day
- Agitated but depressed — Sad or hopeless but also restless, wired, can't settle
- Unprovoked temper explosion — Came out of nowhere, no proportional trigger
- Unusual anxiety panic — Anxious, panicky, or clingy beyond what's typical for them
- Aggressive or destructive — Broke things, hit, or got physically aggressive

#### CUSTOM (user-defined)
Free-form boolean items the caregiver adds to track patterns unique to their teen.

### 3. Impairment Tracking
For each domain, select: **None / Present / Severe**

| Domain |
|--------|
| School or work |
| Family life |
| Friendships |
| Self-care |
| Safety concern |

### 4. Freeform Notes
Rich text / markdown field. Must support long-form entries for detailed recounting of difficult days.

### 5. Menstrual Tracking
- Log period days with bleeding severity (light / medium / heavy).
- Plotted alongside mood data on the symptom graph.

---

## Data Analysis
- **Daily classification** — Evaluate a day's entries and classify it as manic, depressive, mixed, or neutral.
- **Episode detection** — Evaluate runs of days and determine if they meet clinical criteria for a manic, hypomanic, or depressive episode.
- **Prodrome signal** — Flag when logged symptoms are consistent with early bipolar signs even if they don't yet meet full episode criteria.

---

## Reporting
- **PDF export** — All entries over a user-selected date range; quantify frequency of each symptom and impairment domain.
- **Symptom wave graph** — Plot a symptom score over time. Manic symptoms score positive; depressive symptoms score negative. The resulting wave visualizes the individual's bipolar cycle.
  - For teen girls: overlay a generic menstrual cycle wave anchored to the last logged period date, so hormonal and bipolar cycle interactions are visible.

---

## Reminders & Notifications
- Surface behavioral patterns and predict likely upcoming mood states.
- Alert caregivers to watch for specific behaviors based on past cycles and known upcoming triggers.
- Suggest supportive activities during predicted difficult periods.
