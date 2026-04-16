# Application Architecture Standards

_This document defines architectural conventions for all applications. It is the source of truth when existing code contradicts these patterns — the conventions win._

## Before Writing Any Code: Technology Justification

No framework, library, or service may be chosen without a written justification document. Before any project begins, answer the following questions in writing:

1. **Is any part of this app public or SEO-dependent?** If no, SSR frameworks (Next.js, Nuxt, Remix) are eliminated.
2. **Is every page behind authentication?** If yes, the app is a SPA. First-paint optimization for anonymous users is irrelevant.
3. **What is the data access pattern?** (CRUD, real-time subscriptions, analytics, file storage, etc.)
4. **Where does business logic run?** Default answer: the database. Justify any exception.
5. **What authorization model is required?** Default answer: RLS. Justify any exception.
6. **What platforms will this run on?** (Web only, mobile only, both?) If both, they are separate clients sharing the same database API.
7. **What third-party APIs require server-side secrets?** Only these justify server-side code.
8. **Does the ORM support the authorization model?** If using RLS, the ORM must not bypass it. If it connects as database owner (e.g., Prisma), it is incompatible.

Then propose a stack where **every choice maps to a specific answer above.** If a tool's primary value prop doesn't map to any answer, it's the wrong tool. The justification must be reviewed and approved before writing code.

### Before any schema is written: Data model approval

After the technology justification is approved, write out the full data model in plain language before creating any migration or schema file. This includes:
- Every table/entity with its purpose
- Every column with its type and why it exists
- Which tables are normalized reference data vs. flattened transactional data
- Which columns store computed/derived values and what triggers populate them
- RLS policy descriptions for each table
- JSONB column contents and what they store

Every table, column, and relationship must be justified:
- **Why does this table exist?** What entity does it represent and why can't it be a column on another table?
- **Why is this normalized vs. flattened?** What specific criteria (independent lifecycle, shared reference, query pattern) drove the decision?
- **Why is this computed here?** What triggers the computation, what inputs does it use, and why can't it be done elsewhere?
- **What are the alternatives you considered and rejected?** Name at least one alternative for any non-obvious decision and explain why it was worse.

The user is the architect. Every decision must be transparent and defensible. If a choice was made for convenience, say so — don't dress it up as best practice. If a choice is opinionated, present it as a recommendation with tradeoffs, not a conclusion.

The data model must be reviewed and approved before any schema code is written. No migrations, no ORM models, no seed scripts until the user says yes. Do not proceed on assumptions about what the user wants — ask.

### Dependency additions require justification and approval.

Every npm package, library, or service added to the project is a commitment. Before adding a dependency:
- **What does it do?** One sentence.
- **Why can't we do this without it?** What's the alternative (built-in API, manual implementation, different library)?
- **Does it fit the architecture?** A dependency that pushes toward patterns we've rejected (server-side query wrappers, compute-on-read, bypassing RLS) is disqualified regardless of convenience.
- **What's the maintenance cost?** Is it actively maintained? Does it have breaking changes often? Does it pull in a large transitive dependency tree?

Do not silently install packages. Present the dependency, the justification, and get approval.

### One-way-door decisions require options and tradeoffs.

A one-way-door decision is a choice that is genuinely expensive to reverse — meaning reversal requires significant rework, data migration, or downtime. Not every decision is one-way-door. Most aren't.

**A decision qualifies as one-way-door only if ALL of these are true:**
- **Data or users are affected.** Reverting would require migrating data, breaking user sessions, or losing state — not just changing code.
- **Multiple systems depend on it.** The choice is load-bearing across components (e.g., both web and mobile depend on the auth provider).
- **Switching cost is measured in days, not hours.** If you could swap it out in an afternoon, it's not one-way-door.

**Examples that ARE one-way-door:** Database engine, auth provider, hosting platform (when data/config is entangled), ID strategy (UUIDs vs auto-increment after data exists).

**Examples that are NOT one-way-door:** Migration runner, CSS framework, charting library, file structure conventions, build tool. These can be switched with bounded effort and no data impact.

**Do not inflate.** If a decision doesn't meet the criteria above, don't present it as high-stakes. State the actual switching cost honestly. Framing routine choices as architectural decisions wastes time and creates artificial dependency on the person presenting the options (see [[gender-bias-management]], Pattern 5).

**Do not classify decisions without evidence.** Always present all three criteria — what data/users are affected, which systems depend on it, and the realistic switching cost. You may state your belief that a decision is one-way-door, but the evidence must come first. The user decides.

For genuine one-way-door decisions, present:
- At least two viable options
- The tradeoffs of each (what you gain, what you lose, what it constrains)
- A recommendation with explicit reasoning

The user picks.

### No change deploys to production without preview verification.

Any change that could affect a running production app must:
1. Go on a feature branch
2. Deploy to a preview environment
3. Be verified working in that environment (by actually testing it, not by reading the code)
4. Be reviewed by the user before merge

"It looks right" is not verification. "I tested it in preview and here's what I saw" is.

### When there are multiple implementation paths, present options.

Do not silently choose an implementation approach. When there is more than one way to build something (where logic runs, how data is stored, what pattern is used), present the options with tradeoffs. Examples of decisions that were made silently and caused rework:
- Scoring logic in TypeScript vs. Postgres triggers
- Server actions vs. direct database API access
- Join tables vs. JSONB columns
- Custom JWT infrastructure vs. built-in auth plugin

The user is the architect. The builder presents options. The architect decides.

### Inventory external service dependencies at project start.

Before writing code, identify every external service the project depends on and document:
- **Account/enrollment requirements** — What needs to be set up? How long does approval take? (e.g., Apple Developer enrollment takes days, not minutes)
- **Credentials and tokens** — What API keys, tokens, or secrets are needed? Where are they configured?
- **Environment-specific behavior** — How does the service behave differently in dev, preview, and production? (e.g., Vercel preview URLs are dynamic, trusted origins must account for them)
- **Rate limits and costs** — What are the usage limits? What triggers billing?

Discovering these mid-build creates blockers. Discovering them at deployment creates emergencies.

### Product decisions require explicit answers before implementation.

Many implementation choices are actually product decisions. They shape what the app *is*, not just how it's built. These decisions must not be made by the builder — they must be surfaced, discussed, and decided by the architect.

Before building any feature, the following categories of decisions must have explicit, documented answers. If the requirements don't cover them, **ask — don't assume.**

**Data identity and uniqueness:**
- What constitutes a unique record? (One entry per day? Per user per day? Multiple per day?)
- What's the primary entity and what's scoped to it? (Is a "project" a teen? A tracking goal? A time period?)
- Can records be edited after creation? Deleted? By whom?

**Business logic and algorithms:**
- How are scores, classifications, or statuses computed? What are the exact rules?
- What thresholds, weights, or formulas are used? Who decides these — clinical research, the user, or convention?
- Can computed results be manually overridden? When?

**Data model complexity:**
- How generic does this need to be? (One hardcoded framework, or a system that supports arbitrary frameworks?)
- Is this reference data that will grow over time, or a fixed set?
- Who maintains this data — the system, an admin, or the end user?

**Storage and providers:**
- Where do files go? (Database, object storage, which provider?)
- What are the size limits, type restrictions, retention policies?

**Entity relationships:**
- What's the relationship between the core entities? (Can a teen span multiple projects? Can a caregiver be in multiple projects?)
- What gets deleted when a parent is deleted? What's preserved?

**Mutability and lifecycle:**
- What can change after it's created? What's immutable?
- What has a soft delete vs. hard delete?
- What has history/audit requirements?

**Identity and keys:**
- What ID strategy? (UUID, auto-increment, CUID, ULID?) UUIDs are unguessable (security). Auto-increment leaks record count. ULIDs sort chronologically. Each has tradeoffs.

**Timestamps and timezones:**
- Are dates stored as UTC? User's local timezone? Date-only or datetime?
- What does "April 7" mean — midnight UTC or midnight in the user's timezone?
- Which timestamps matter? (Created, updated, both, neither?)

**Null semantics:**
- Is "no value" null or an empty string? Is "no behaviors checked" an empty array or null?
- These seem trivial until you're writing queries and RLS policies against them.

**Enum strategy:**
- Postgres enums, string columns with app-level validation, or lookup tables?
- Postgres enums are hard to modify after creation. Strings are flexible but unvalidated. Lookup tables are queryable but add joins.

**Text field limits:**
- Is a freeform notes field unbounded? 500 characters? 10,000?
- What about names, descriptions, other string fields?

**Multi-tenancy model:**
- Row-level (shared tables filtered by tenant ID), schema-per-tenant, or database-per-tenant?
- Each has different isolation, cost, and complexity tradeoffs.

**History and versioning:**
- When a record is updated, is the previous version preserved?
- Is there an audit trail of who changed what and when?

**Cascade behavior:**
- When a parent is deleted, what happens to children? (Cascade delete, orphan, soft delete parent only?)
- What gets hard deleted vs. soft deleted?

**Ordering defaults:**
- Are lists sorted by creation date, modification date, alphabetical, or user-defined order?
- Is that sort stored or computed?

**The builder's responsibility:** When requirements don't address these categories, stop and ask. Present what assumptions you'd need to make if the user doesn't specify, so they can see the gap and fill it.

**The architect's responsibility:** Provide enough context for the builder to present informed options. A requirements intake tool or template that walks through these categories before a project starts will prevent most silent decisions.

### Three environments from day one: local, staging, production.

Every project must have three fully functional environments before any feature development begins:

- **Local** — runs entirely on the developer's machine. Own database instance (or isolated schema). No dependency on remote services for core functionality. Used for development and testing.
- **Staging** — deployed to the same hosting platform as production, with its own database, its own auth config, its own secrets. Mirrors production exactly. Every change lands here first. Used for verification before promoting to production.
- **Production** — the live app. Never receives a direct deploy. Changes only arrive via promotion from staging after verification.

Each environment has its own:
- Database instance (not shared schemas, not branches — separate instances)
- Auth configuration and secrets
- Third-party API keys (use sandbox/test keys for local and staging where available)
- Environment variables documented in `.env.example`

**The deployment flow is: local → staging → production. No shortcuts.** "Deploying to production to test" is never acceptable. If staging doesn't exist yet, it's the first thing that gets built — before any feature work.

### Default stack for authenticated CRUD apps:
- **View:** Vite + React (web) or Expo/React Native (mobile)
- **Controller:** Database API layer (Neon Data API, PostgREST, Supabase)
- **Model:** Postgres with RLS, triggers, and functions
- **Auth:** JWT-issuing provider (Better Auth, Supabase Auth, Auth0)
- **Hosting:** Static hosting / CDN (Vercel, Cloudflare Pages, Netlify)
- **Server runtime:** None, unless third-party API secrets require it

Deviate from this default only when the justification document demonstrates why.

## Lessons Learned

These are hard-won rules from real project rework. They are not suggestions.

1. **Pick the framework last, not first.** Define the architecture (auth model, data access, computation model) first. The framework falls out of that. Never pick a framework because it's popular.
2. **Never modify shared infrastructure for a new platform.** If mobile needs something, it gets its own config. Shared config changes must be tested against all platforms before deploying.
3. **Don't build custom infrastructure when the tool has it built in.** Before writing infrastructure code, exhaustively check what existing tools provide.
4. **Feature branches for anything that touches production.** Any change that could affect a running app goes on a feature branch with a preview deployment, verified working, before merge.
5. **"It works" means you tested it.** Every claim of "working" must be backed by actual execution — run the app, hit the endpoint, see the result. Code that looks right is not code that works.
6. **Get the data model approved before writing code.** Show the schema first. Get a yes. Then build.
7. **Prisma and RLS don't mix.** Prisma connects as database owner and bypasses RLS. Prisma's shadow database can't run RLS migrations referencing custom functions. If your auth model depends on RLS, don't use Prisma.
8. **Don't start the next phase without explicit approval.** Wait for the user to say proceed.
9. **Understand deployment constraints early.** Check hosting requirements, third-party enrollment timelines, and environment-specific behavior before writing code.
10. **No compute-on-read. Ever. Not "for now."** Every "we'll persist it later" becomes a rewrite phase. Persist at write time from the start.
11. **One source of truth for authorization.** RLS in Postgres, consistently applied. Not "RLS for mobile, app-level for web."
12. **Existing code is not a reference architecture.** Code that predates these standards is debt, not precedent. New features follow these conventions regardless of what the existing code does.

### Rollback plan for every risky change.

Before deploying any change that could break a running system, document:
- **What could go wrong?** Be specific. "Auth might break" is not a rollback plan.
- **How do we detect it?** What does the user see? What error shows up?
- **How do we revert?** Exact steps to get back to the working state. If it's a database migration, how do you roll it back? If it's a config change, what was the previous value?

If you can't describe how to revert a change, it's not ready to deploy.

### Plans are written after architecture is approved, not before.

Development plans depend on the technology justification and data model being finalized. A plan written before those decisions are locked will be rewritten when assumptions turn out to be wrong. The sequence is:

1. Requirements intake
2. Technology justification → approval
3. Data model → approval
4. Development plan → approval
5. Code

Do not skip ahead. Do not write a plan to "figure it out as we go." Each step depends on the one before it.

### New requirements get an impact assessment.

When a new requirement surfaces during development, do not simply add it to a backlog. Before it's accepted, assess:
- **Does this change the data model?** If yes, it triggers the data model approval process.
- **Does this conflict with an existing decision?** If yes, surface the conflict.
- **What's the blast radius?** Does it affect one screen, multiple features, or the core architecture?
- **Can it be deferred?** Not everything needs to be built now.

A bullet point on a list is not a requirement. A requirement has an impact assessment.

### Risk assessment before risky changes.

Before any change that touches auth, database schema, production config, or shared infrastructure, present:
- **What this change does.**
- **What could go wrong.** Be specific — "sessions could break for all users" not "there might be issues."
- **Likelihood and severity.** Is this a theoretical risk or a likely one?
- **Mitigation.** How are we reducing the risk? (Feature branch, preview deploy, rollback plan.)

Do not present risky changes as straightforward. If there is risk, say so plainly.

### Domain-specific logic must be validated.

If the app implements logic from a specialized domain (clinical criteria, financial rules, legal requirements, scientific formulas), that logic must be reviewed by someone with domain expertise before it ships. The builder interpreting a clinical manual and coding the result is not validation. Present the implemented rules in plain language so they can be verified against the source material.

### The builder tests locally before the user tests anything.

Before presenting any feature, change, or fix to the user:
1. Run it locally
2. Test the happy path
3. Test at least one error/edge case
4. Confirm it actually works — screens load, data saves, reads return correct results

"Ready for testing" means the builder has already tested it and it works. The user's testing is for acceptance and feedback, not for finding crashes and missing tables. Do not ask the user to test something you haven't run yourself.

## Known Risks in This Project

These are consequences of decisions that predate these standards. They are not blockers for forward progress, but they represent real liability.

### Risk: Repeated corrections not sticking.

Custom endpoints, compute-on-read, and silent decisions were corrected multiple times in conversation before these standards were written. Conversation-level feedback is not durable — it gets lost across sessions. These standards exist to make corrections permanent. If a pattern addressed in this document recurs, the standards doc needs to be re-read before continuing, not the conversation history.

### Risk: No automated test coverage.

The conventions file says "unit tests co-located" but no tests have been written. No integration tests. No end-to-end tests. The only testing has been manual "does the page load." For an app handling health data with clinical logic, this is a significant gap. Any future testing strategy should prioritize the scoring/classification logic and RLS policy verification.

### Risk: Full data layer rewrite required for web.

Every server action, API route, and server component that fetches data needs to move to Neon Data API. This is not a refactor — it's rebuilding the entire data access layer. This cost exists because the architecture was wrong from the start. The web app is planned for sunset, which limits the blast radius, but until it's sunset it's running on a non-compliant architecture that bypasses RLS.

### Risk: Scoring algorithm not clinically validated.

The DSM-5 behavior-to-criterion mappings, classification thresholds, gate criteria logic, and wave score formula were implemented from the builder's interpretation of clinical literature. They have not been reviewed by a clinician. For an app that presents results to clinicians for diagnostic purposes, unvalidated scoring logic is a liability.

## Core Principle

The database is the application. Clients — whether web, mobile, or CLI — are rendering layers that read and write to the database. Business logic lives in the database, not in application code.

## Data Access

### The database is the API.

Use a database API layer (e.g., Neon Data API, PostgREST, Supabase) that auto-generates REST endpoints from the schema. Clients authenticate with JWTs. Authorization is enforced by row-level security (RLS) policies in Postgres. Do not write custom API endpoints for data access.

### No server-side query wrappers.

Do not create API routes, server actions, serverless functions, or backend services that exist solely to query the database and return results. If the data is in the database, the client reads it through the database API. If you're writing a GET endpoint, you're doing it wrong.

### No custom write endpoints for simple CRUD.

If a write is a straightforward insert or update with no derived computation, it goes through the database API. RLS policies enforce permissions. No application-layer authorization checks needed.

## Computation

### Computation happens at write time. Always.

When business logic produces a derived result (score, classification, status, aggregate, detection, recommendation), that result is persisted to the database at the moment the input data is written. Read paths query stored data. Read paths never compute.

**Wrong:** A read path that fetches raw data, runs analysis, and returns computed results.
**Right:** The write persists raw data AND all derived data. Reads return what's stored.

### Computation lives in the database.

Triggers, stored functions, and computed columns handle derived data. When a row is inserted or updated, the database computes and stores all downstream results. This keeps computation co-located with the data and ensures it runs regardless of which client initiated the write.

### If computation is too complex for SQL, use a minimal write endpoint.

Some logic (AI inference, external API calls) can't run in Postgres. In these cases — and only these cases — a custom write endpoint is justified. The endpoint must persist all computed results before returning. The read path is still the database API.

## Authorization

### RLS is the only authorization layer.

Row-level security policies enforce who can read and write what. The JWT carries the user identity. Postgres evaluates policies on every query. Do not duplicate these checks in application code.

### New tables get RLS policies in the same migration.

No table should exist without RLS policies. Add them when you create the table, not later.

## Data Modeling

### Normalize reference data. Flatten transactional data.

Reference data (lookup tables, configuration, definitions, frameworks) should be normalized into its own tables with foreign keys. This data changes infrequently, is shared across records, and benefits from relational integrity.

Transactional data (log entries, events, user-generated records) should be flattened. Store related values as JSONB columns on the parent row rather than creating join tables when:

- The related data is selected from a fixed set at write time (e.g., checked behavior keys, selected strategy IDs, missed medication IDs)
- The related data has no independent lifecycle — it doesn't get updated separately from the parent record
- You don't need to query or aggregate across the related data independent of the parent

**Normalize:**
- Behavior definitions, diagnostic criteria, classification rules (reference data shared across entries)
- Users, tenants, medications, strategies (entities with their own lifecycle)

**Flatten:**
- Which behaviors were checked on a given entry → `behaviorKeys: jsonb` on the entry row
- Which strategies were used on a given entry → `strategyIds: jsonb` on the entry row
- Impairment ratings for a given entry → `impairments: jsonb` on the entry row

### Persist computed values as columns, not derived views.

If a value is computed from other fields on the same row or related rows, store it as a column. `computedMood`, `computedScore`, `hasBehaviorDetail` — these are written once at save time, not recalculated on read.

### Persist analysis results as their own tables.

If analysis produces structured output (detected episodes, signals, predictions, suggestions), each gets its own table with a foreign key to the parent entity (e.g., tenant). Results are replaced wholesale when the underlying data changes — delete old rows, insert new ones. Reports and dashboards read these tables directly.

## What this means in practice

- **Adding a new read feature?** Query the database API. No backend code.
- **Adding a new write feature with derived data?** Write a Postgres trigger/function, or a minimal endpoint that persists everything. Read path is still the database API.
- **Adding a new entity?** Create the table, add RLS policies, add to the database API. No endpoint, no server action.
- **Existing code does it differently?** Ignore the existing code. Follow these conventions. Existing patterns that predate this document are architectural debt, not precedent.
