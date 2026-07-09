-- db/seed/dsm5-bipolar.sql — DSM-5 Bipolar diagnostic framework seed
-- Recovered value-for-value from scripts/seed-frameworks.ts (deleted in ST-071;
-- source: `git show 2362290^:scripts/seed-frameworks.ts`, reference copy in db/seed/reference/).
-- Idempotent: natural-key upserts only (ON CONFLICT DO NOTHING / WHERE NOT EXISTS);
-- safe to run on a fresh database or re-run on an already-seeded one.
-- ⚠️ CLINICAL CONFIG — value changes are CLINICAL-REVIEW gated (see docs/build-spec.md §3).

BEGIN;

INSERT INTO "diagnostic_frameworks" ("id","slug","name","version","description","updatedAt")
VALUES (gen_random_uuid()::text, 'dsm5-bipolar', 'DSM-5 Bipolar Disorder', '2.0', 'Diagnostic criteria for bipolar I, bipolar II, and related disorders per the DSM-5. Criterion-level checklist with recognition examples.', CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "criterion_poles" ("id","slug","name","direction","sortOrder","frameworkId")
SELECT gen_random_uuid()::text, 'manic', 'Manic', 1, 0, f."id"
FROM "diagnostic_frameworks" f WHERE f."slug" = 'dsm5-bipolar'
ON CONFLICT ("frameworkId","slug") DO NOTHING;

INSERT INTO "criterion_poles" ("id","slug","name","direction","sortOrder","frameworkId")
SELECT gen_random_uuid()::text, 'depressive', 'Depressive', -1, 1, f."id"
FROM "diagnostic_frameworks" f WHERE f."slug" = 'dsm5-bipolar'
ON CONFLICT ("frameworkId","slug") DO NOTHING;

INSERT INTO "criteria" ("id","number","name","criterionType","poleId")
SELECT gen_random_uuid()::text, 0, 'Elevated, expansive, or irritable mood', 'GATE', p."id"
FROM "criterion_poles" p JOIN "diagnostic_frameworks" f ON f."id" = p."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND p."slug" = 'manic'
ON CONFLICT ("poleId","number") DO NOTHING;

INSERT INTO "criteria" ("id","number","name","criterionType","poleId")
SELECT gen_random_uuid()::text, 1, 'Inflated self-esteem / grandiosity', 'STANDARD', p."id"
FROM "criterion_poles" p JOIN "diagnostic_frameworks" f ON f."id" = p."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND p."slug" = 'manic'
ON CONFLICT ("poleId","number") DO NOTHING;

INSERT INTO "criteria" ("id","number","name","criterionType","poleId")
SELECT gen_random_uuid()::text, 2, 'Decreased need for sleep', 'STANDARD', p."id"
FROM "criterion_poles" p JOIN "diagnostic_frameworks" f ON f."id" = p."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND p."slug" = 'manic'
ON CONFLICT ("poleId","number") DO NOTHING;

INSERT INTO "criteria" ("id","number","name","criterionType","poleId")
SELECT gen_random_uuid()::text, 3, 'More talkative / pressure of speech', 'STANDARD', p."id"
FROM "criterion_poles" p JOIN "diagnostic_frameworks" f ON f."id" = p."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND p."slug" = 'manic'
ON CONFLICT ("poleId","number") DO NOTHING;

INSERT INTO "criteria" ("id","number","name","criterionType","poleId")
SELECT gen_random_uuid()::text, 4, 'Flight of ideas / racing thoughts', 'STANDARD', p."id"
FROM "criterion_poles" p JOIN "diagnostic_frameworks" f ON f."id" = p."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND p."slug" = 'manic'
ON CONFLICT ("poleId","number") DO NOTHING;

INSERT INTO "criteria" ("id","number","name","criterionType","poleId")
SELECT gen_random_uuid()::text, 5, 'Distractibility', 'STANDARD', p."id"
FROM "criterion_poles" p JOIN "diagnostic_frameworks" f ON f."id" = p."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND p."slug" = 'manic'
ON CONFLICT ("poleId","number") DO NOTHING;

INSERT INTO "criteria" ("id","number","name","criterionType","poleId")
SELECT gen_random_uuid()::text, 6, 'Increase in goal-directed activity / psychomotor agitation', 'STANDARD', p."id"
FROM "criterion_poles" p JOIN "diagnostic_frameworks" f ON f."id" = p."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND p."slug" = 'manic'
ON CONFLICT ("poleId","number") DO NOTHING;

INSERT INTO "criteria" ("id","number","name","criterionType","poleId")
SELECT gen_random_uuid()::text, 7, 'Excessive involvement in risky activities', 'STANDARD', p."id"
FROM "criterion_poles" p JOIN "diagnostic_frameworks" f ON f."id" = p."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND p."slug" = 'manic'
ON CONFLICT ("poleId","number") DO NOTHING;

INSERT INTO "criteria" ("id","number","name","criterionType","poleId")
SELECT gen_random_uuid()::text, 1, 'Depressed mood most of the day', 'CORE', p."id"
FROM "criterion_poles" p JOIN "diagnostic_frameworks" f ON f."id" = p."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND p."slug" = 'depressive'
ON CONFLICT ("poleId","number") DO NOTHING;

INSERT INTO "criteria" ("id","number","name","criterionType","poleId")
SELECT gen_random_uuid()::text, 2, 'Markedly diminished interest / pleasure', 'CORE', p."id"
FROM "criterion_poles" p JOIN "diagnostic_frameworks" f ON f."id" = p."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND p."slug" = 'depressive'
ON CONFLICT ("poleId","number") DO NOTHING;

INSERT INTO "criteria" ("id","number","name","criterionType","poleId")
SELECT gen_random_uuid()::text, 3, 'Significant weight/appetite change', 'STANDARD', p."id"
FROM "criterion_poles" p JOIN "diagnostic_frameworks" f ON f."id" = p."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND p."slug" = 'depressive'
ON CONFLICT ("poleId","number") DO NOTHING;

INSERT INTO "criteria" ("id","number","name","criterionType","poleId")
SELECT gen_random_uuid()::text, 4, 'Insomnia or hypersomnia', 'STANDARD', p."id"
FROM "criterion_poles" p JOIN "diagnostic_frameworks" f ON f."id" = p."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND p."slug" = 'depressive'
ON CONFLICT ("poleId","number") DO NOTHING;

INSERT INTO "criteria" ("id","number","name","criterionType","poleId")
SELECT gen_random_uuid()::text, 5, 'Psychomotor agitation or retardation', 'STANDARD', p."id"
FROM "criterion_poles" p JOIN "diagnostic_frameworks" f ON f."id" = p."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND p."slug" = 'depressive'
ON CONFLICT ("poleId","number") DO NOTHING;

INSERT INTO "criteria" ("id","number","name","criterionType","poleId")
SELECT gen_random_uuid()::text, 6, 'Fatigue / loss of energy', 'STANDARD', p."id"
FROM "criterion_poles" p JOIN "diagnostic_frameworks" f ON f."id" = p."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND p."slug" = 'depressive'
ON CONFLICT ("poleId","number") DO NOTHING;

INSERT INTO "criteria" ("id","number","name","criterionType","poleId")
SELECT gen_random_uuid()::text, 7, 'Feelings of worthlessness / excessive guilt', 'STANDARD', p."id"
FROM "criterion_poles" p JOIN "diagnostic_frameworks" f ON f."id" = p."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND p."slug" = 'depressive'
ON CONFLICT ("poleId","number") DO NOTHING;

INSERT INTO "criteria" ("id","number","name","criterionType","poleId")
SELECT gen_random_uuid()::text, 8, 'Diminished ability to think / concentrate', 'STANDARD', p."id"
FROM "criterion_poles" p JOIN "diagnostic_frameworks" f ON f."id" = p."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND p."slug" = 'depressive'
ON CONFLICT ("poleId","number") DO NOTHING;

INSERT INTO "criteria" ("id","number","name","criterionType","poleId")
SELECT gen_random_uuid()::text, 9, 'Recurrent thoughts of death / suicidal ideation', 'STANDARD', p."id"
FROM "criterion_poles" p JOIN "diagnostic_frameworks" f ON f."id" = p."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND p."slug" = 'depressive'
ON CONFLICT ("poleId","number") DO NOTHING;

INSERT INTO "framework_behavior_categories" ("id","slug","name","sortOrder","frameworkId")
SELECT gen_random_uuid()::text, 'manic', 'Manic', 0, f."id"
FROM "diagnostic_frameworks" f WHERE f."slug" = 'dsm5-bipolar'
ON CONFLICT ("frameworkId","slug") DO NOTHING;

INSERT INTO "framework_behavior_categories" ("id","slug","name","sortOrder","frameworkId")
SELECT gen_random_uuid()::text, 'depressive', 'Depressive', 1, f."id"
FROM "diagnostic_frameworks" f WHERE f."slug" = 'dsm5-bipolar'
ON CONFLICT ("frameworkId","slug") DO NOTHING;

INSERT INTO "behavior_definitions" ("id","itemKey","label","description","recognitionExamples","isSafetyConcern","sortOrder","categoryId")
SELECT gen_random_uuid()::text, 'elevated-expansive-irritable-mood', 'Mood is abnormally elevated, expansive, or irritable', 'Gate criterion — at least one mood presentation must be present before other manic criteria count', '["Unusually happy, giddy, or \"up\" for no clear reason","Wired, buzzy, euphoric energy that doesn''t match the situation","Explosive anger way out of proportion to what happened","Sudden rage that comes out of nowhere, no real trigger","Acting like everything is amazing when it objectively isn''t","Grinning, laughing, or being \"on\" in a way that feels off","Irritable and snapping at everyone over nothing"]', FALSE, 0, c."id"
FROM "framework_behavior_categories" c JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND c."slug" = 'manic'
ON CONFLICT ("categoryId","itemKey") DO NOTHING;
INSERT INTO "behavior_criterion_mappings" ("id","behaviorId","criterionId")
SELECT gen_random_uuid()::text, bd."id", cr."id"
FROM "behavior_definitions" bd
JOIN "framework_behavior_categories" c ON c."id" = bd."categoryId"
JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'manic'
JOIN "criteria" cr ON cr."poleId" = p."id" AND cr."number" = 0
WHERE bd."itemKey" = 'elevated-expansive-irritable-mood'
ON CONFLICT ("behaviorId","criterionId") DO NOTHING;

INSERT INTO "behavior_definitions" ("id","itemKey","label","description","recognitionExamples","isSafetyConcern","sortOrder","categoryId")
SELECT gen_random_uuid()::text, 'inflated-self-image', 'Inflated self-image or grandiosity', 'B1 — Inflated self-esteem or grandiosity', '["Talking like they''re the best at everything, untouchable","Making grand plans that are wildly unrealistic","Believing they have special abilities, connections, or status","Dismissing anyone who questions them — \"you just don''t get it\"","Acting invincible, like consequences don''t apply to them","Sudden expertise in things they know little about"]', FALSE, 1, c."id"
FROM "framework_behavior_categories" c JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND c."slug" = 'manic'
ON CONFLICT ("categoryId","itemKey") DO NOTHING;
INSERT INTO "behavior_criterion_mappings" ("id","behaviorId","criterionId")
SELECT gen_random_uuid()::text, bd."id", cr."id"
FROM "behavior_definitions" bd
JOIN "framework_behavior_categories" c ON c."id" = bd."categoryId"
JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'manic'
JOIN "criteria" cr ON cr."poleId" = p."id" AND cr."number" = 1
WHERE bd."itemKey" = 'inflated-self-image'
ON CONFLICT ("behaviorId","criterionId") DO NOTHING;

INSERT INTO "behavior_definitions" ("id","itemKey","label","description","recognitionExamples","isSafetyConcern","sortOrder","categoryId")
SELECT gen_random_uuid()::text, 'decreased-need-for-sleep', 'Decreased need for sleep', 'B2 — Decreased need for sleep (not just insomnia — they feel rested on less)', '["Sleeping 2–4 hours and bouncing up full of energy","Staying up all night but not seeming tired the next day","Claiming they don''t need sleep, or that sleep is a waste of time","Irregular pattern — up and down all night, can''t settle","Going days with minimal sleep without crashing"]', FALSE, 2, c."id"
FROM "framework_behavior_categories" c JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND c."slug" = 'manic'
ON CONFLICT ("categoryId","itemKey") DO NOTHING;
INSERT INTO "behavior_criterion_mappings" ("id","behaviorId","criterionId")
SELECT gen_random_uuid()::text, bd."id", cr."id"
FROM "behavior_definitions" bd
JOIN "framework_behavior_categories" c ON c."id" = bd."categoryId"
JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'manic'
JOIN "criteria" cr ON cr."poleId" = p."id" AND cr."number" = 2
WHERE bd."itemKey" = 'decreased-need-for-sleep'
ON CONFLICT ("behaviorId","criterionId") DO NOTHING;

INSERT INTO "behavior_definitions" ("id","itemKey","label","description","recognitionExamples","isSafetyConcern","sortOrder","categoryId")
SELECT gen_random_uuid()::text, 'pressured-speech', 'Pressured speech', 'B3 — More talkative than usual or pressure to keep talking', '["Talking fast, loud, and hard to interrupt","Jumping from one sentence to the next without breathing","Dominating every conversation, not letting anyone get a word in","Talking at people rather than with them","Volume and speed are turned up compared to their baseline","Rambling voicemails, walls of text messages"]', FALSE, 3, c."id"
FROM "framework_behavior_categories" c JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND c."slug" = 'manic'
ON CONFLICT ("categoryId","itemKey") DO NOTHING;
INSERT INTO "behavior_criterion_mappings" ("id","behaviorId","criterionId")
SELECT gen_random_uuid()::text, bd."id", cr."id"
FROM "behavior_definitions" bd
JOIN "framework_behavior_categories" c ON c."id" = bd."categoryId"
JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'manic'
JOIN "criteria" cr ON cr."poleId" = p."id" AND cr."number" = 3
WHERE bd."itemKey" = 'pressured-speech'
ON CONFLICT ("behaviorId","criterionId") DO NOTHING;

INSERT INTO "behavior_definitions" ("id","itemKey","label","description","recognitionExamples","isSafetyConcern","sortOrder","categoryId")
SELECT gen_random_uuid()::text, 'racing-thoughts', 'Racing thoughts or flight of ideas', 'B4 — Flight of ideas or subjective experience of racing thoughts', '["Bouncing between topics mid-sentence","Starting to say one thing and veering into something totally different","Saying \"my brain won''t stop\" or \"I can''t turn it off\"","Making connections between unrelated things that don''t track","Ideas coming so fast they can''t finish one before starting the next"]', FALSE, 4, c."id"
FROM "framework_behavior_categories" c JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND c."slug" = 'manic'
ON CONFLICT ("categoryId","itemKey") DO NOTHING;
INSERT INTO "behavior_criterion_mappings" ("id","behaviorId","criterionId")
SELECT gen_random_uuid()::text, bd."id", cr."id"
FROM "behavior_definitions" bd
JOIN "framework_behavior_categories" c ON c."id" = bd."categoryId"
JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'manic'
JOIN "criteria" cr ON cr."poleId" = p."id" AND cr."number" = 4
WHERE bd."itemKey" = 'racing-thoughts'
ON CONFLICT ("behaviorId","criterionId") DO NOTHING;

INSERT INTO "behavior_definitions" ("id","itemKey","label","description","recognitionExamples","isSafetyConcern","sortOrder","categoryId")
SELECT gen_random_uuid()::text, 'distractibility', 'Distractibility', 'B5 — Distractibility (attention too easily drawn to unimportant things)', '["Can''t stay on one task, pulled away by every little thing","Losing the thread of a conversation mid-sentence","Starting something and immediately pivoting to something else","Attention grabbed by irrelevant background noise, objects, or thoughts","Unable to follow through on even simple requests"]', FALSE, 5, c."id"
FROM "framework_behavior_categories" c JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND c."slug" = 'manic'
ON CONFLICT ("categoryId","itemKey") DO NOTHING;
INSERT INTO "behavior_criterion_mappings" ("id","behaviorId","criterionId")
SELECT gen_random_uuid()::text, bd."id", cr."id"
FROM "behavior_definitions" bd
JOIN "framework_behavior_categories" c ON c."id" = bd."categoryId"
JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'manic'
JOIN "criteria" cr ON cr."poleId" = p."id" AND cr."number" = 5
WHERE bd."itemKey" = 'distractibility'
ON CONFLICT ("behaviorId","criterionId") DO NOTHING;

INSERT INTO "behavior_definitions" ("id","itemKey","label","description","recognitionExamples","isSafetyConcern","sortOrder","categoryId")
SELECT gen_random_uuid()::text, 'goal-directed-activity', 'Increase in goal-directed activity or physical agitation', 'B6 — Increase in goal-directed activity (social, work, sexual) or psychomotor agitation', '["Starting a dozen projects, plans, or tasks all at once","Suddenly reorganizing the house, launching a business, writing a book — at 2 AM","Pacing, can''t sit still, restless physical energy","Cleaning, organizing, or doing tasks with frantic intensity","Working on something obsessively without stopping to eat or rest","Amped up, wired, more physical energy than usual","Fidgeting, bouncing, tapping — body won''t settle"]', FALSE, 6, c."id"
FROM "framework_behavior_categories" c JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND c."slug" = 'manic'
ON CONFLICT ("categoryId","itemKey") DO NOTHING;
INSERT INTO "behavior_criterion_mappings" ("id","behaviorId","criterionId")
SELECT gen_random_uuid()::text, bd."id", cr."id"
FROM "behavior_definitions" bd
JOIN "framework_behavior_categories" c ON c."id" = bd."categoryId"
JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'manic'
JOIN "criteria" cr ON cr."poleId" = p."id" AND cr."number" = 6
WHERE bd."itemKey" = 'goal-directed-activity'
ON CONFLICT ("behaviorId","criterionId") DO NOTHING;

INSERT INTO "behavior_definitions" ("id","itemKey","label","description","recognitionExamples","isSafetyConcern","sortOrder","categoryId")
SELECT gen_random_uuid()::text, 'risky-reckless-activities', 'Excessive involvement in risky or reckless activities', 'B7 — Excessive involvement in activities with high potential for painful consequences', '["Spending money they don''t have on things they don''t need","Reckless driving, substance use, or sexual behavior that''s out of character","Making huge decisions impulsively — quitting a job, signing a lease, buying a car","Dressing, acting, or talking in ways that are totally unlike them","Breaking things, hitting, or getting physically aggressive","Doing things they''d normally never do and can''t explain afterward","Picking fights or provoking people without caring about consequences"]', FALSE, 7, c."id"
FROM "framework_behavior_categories" c JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND c."slug" = 'manic'
ON CONFLICT ("categoryId","itemKey") DO NOTHING;
INSERT INTO "behavior_criterion_mappings" ("id","behaviorId","criterionId")
SELECT gen_random_uuid()::text, bd."id", cr."id"
FROM "behavior_definitions" bd
JOIN "framework_behavior_categories" c ON c."id" = bd."categoryId"
JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'manic'
JOIN "criteria" cr ON cr."poleId" = p."id" AND cr."number" = 7
WHERE bd."itemKey" = 'risky-reckless-activities'
ON CONFLICT ("behaviorId","criterionId") DO NOTHING;

INSERT INTO "behavior_definitions" ("id","itemKey","label","description","recognitionExamples","isSafetyConcern","sortOrder","categoryId")
SELECT gen_random_uuid()::text, 'depressed-mood', 'Depressed mood most of the day', '#1 (Core) — Depressed mood most of the day, nearly every day', '["Sad, down, flat, or \"empty\" most of the day","Saying things feel hopeless or pointless","Crying spells or tearing up for no clear reason","Looking defeated, heavy, or checked out","Describing everything in bleak terms — nothing good, nothing ahead","In teens: may show up as persistent irritability instead of sadness"]', FALSE, 0, c."id"
FROM "framework_behavior_categories" c JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND c."slug" = 'depressive'
ON CONFLICT ("categoryId","itemKey") DO NOTHING;
INSERT INTO "behavior_criterion_mappings" ("id","behaviorId","criterionId")
SELECT gen_random_uuid()::text, bd."id", cr."id"
FROM "behavior_definitions" bd
JOIN "framework_behavior_categories" c ON c."id" = bd."categoryId"
JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'depressive'
JOIN "criteria" cr ON cr."poleId" = p."id" AND cr."number" = 1
WHERE bd."itemKey" = 'depressed-mood'
ON CONFLICT ("behaviorId","criterionId") DO NOTHING;

INSERT INTO "behavior_definitions" ("id","itemKey","label","description","recognitionExamples","isSafetyConcern","sortOrder","categoryId")
SELECT gen_random_uuid()::text, 'diminished-interest', 'Markedly diminished interest or pleasure', '#2 (Core) — Markedly diminished interest or pleasure in all or almost all activities', '["No motivation for things they usually love","Stopped reaching out to friends, avoiding social contact","Turning down activities they''d normally jump at","\"I just don''t care\" about hobbies, plans, or people","Withdrawing from the family — staying in their room, not engaging","Going through the motions without any spark or enjoyment"]', FALSE, 1, c."id"
FROM "framework_behavior_categories" c JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND c."slug" = 'depressive'
ON CONFLICT ("categoryId","itemKey") DO NOTHING;
INSERT INTO "behavior_criterion_mappings" ("id","behaviorId","criterionId")
SELECT gen_random_uuid()::text, bd."id", cr."id"
FROM "behavior_definitions" bd
JOIN "framework_behavior_categories" c ON c."id" = bd."categoryId"
JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'depressive'
JOIN "criteria" cr ON cr."poleId" = p."id" AND cr."number" = 2
WHERE bd."itemKey" = 'diminished-interest'
ON CONFLICT ("behaviorId","criterionId") DO NOTHING;

INSERT INTO "behavior_definitions" ("id","itemKey","label","description","recognitionExamples","isSafetyConcern","sortOrder","categoryId")
SELECT gen_random_uuid()::text, 'weight-appetite-change', 'Significant change in weight or appetite', '#3 — Significant weight loss or gain, or decrease/increase in appetite', '["Eating noticeably more than usual, emotional eating, cravings","Barely eating, skipping meals, food feels unappealing","Noticeable weight gain or loss without trying","Relationship with food has clearly shifted from their baseline"]', FALSE, 2, c."id"
FROM "framework_behavior_categories" c JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND c."slug" = 'depressive'
ON CONFLICT ("categoryId","itemKey") DO NOTHING;
INSERT INTO "behavior_criterion_mappings" ("id","behaviorId","criterionId")
SELECT gen_random_uuid()::text, bd."id", cr."id"
FROM "behavior_definitions" bd
JOIN "framework_behavior_categories" c ON c."id" = bd."categoryId"
JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'depressive'
JOIN "criteria" cr ON cr."poleId" = p."id" AND cr."number" = 3
WHERE bd."itemKey" = 'weight-appetite-change'
ON CONFLICT ("behaviorId","criterionId") DO NOTHING;

INSERT INTO "behavior_definitions" ("id","itemKey","label","description","recognitionExamples","isSafetyConcern","sortOrder","categoryId")
SELECT gen_random_uuid()::text, 'insomnia-hypersomnia', 'Insomnia or hypersomnia', '#4 — Insomnia or hypersomnia nearly every day', '["Sleeping way more than usual, can''t get out of bed","Trouble falling asleep or staying asleep","Waking up in the middle of the night and lying there for hours","Napping during the day on top of a full night''s sleep","Sleep schedule is all over the place"]', FALSE, 3, c."id"
FROM "framework_behavior_categories" c JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND c."slug" = 'depressive'
ON CONFLICT ("categoryId","itemKey") DO NOTHING;
INSERT INTO "behavior_criterion_mappings" ("id","behaviorId","criterionId")
SELECT gen_random_uuid()::text, bd."id", cr."id"
FROM "behavior_definitions" bd
JOIN "framework_behavior_categories" c ON c."id" = bd."categoryId"
JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'depressive'
JOIN "criteria" cr ON cr."poleId" = p."id" AND cr."number" = 4
WHERE bd."itemKey" = 'insomnia-hypersomnia'
ON CONFLICT ("behaviorId","criterionId") DO NOTHING;

INSERT INTO "behavior_definitions" ("id","itemKey","label","description","recognitionExamples","isSafetyConcern","sortOrder","categoryId")
SELECT gen_random_uuid()::text, 'psychomotor-change', 'Psychomotor agitation or slowing', '#5 — Psychomotor agitation or retardation nearly every day', '["Moving in slow motion — slow to get up, walk, respond","Long pauses before answering questions","Physically restless but emotionally flat (agitated depression)","Pacing or hand-wringing paired with low mood","Unexplained headaches, stomachaches, or body aches with no medical cause","Looking physically heavy, like gravity is pulling harder on them"]', FALSE, 4, c."id"
FROM "framework_behavior_categories" c JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND c."slug" = 'depressive'
ON CONFLICT ("categoryId","itemKey") DO NOTHING;
INSERT INTO "behavior_criterion_mappings" ("id","behaviorId","criterionId")
SELECT gen_random_uuid()::text, bd."id", cr."id"
FROM "behavior_definitions" bd
JOIN "framework_behavior_categories" c ON c."id" = bd."categoryId"
JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'depressive'
JOIN "criteria" cr ON cr."poleId" = p."id" AND cr."number" = 5
WHERE bd."itemKey" = 'psychomotor-change'
ON CONFLICT ("behaviorId","criterionId") DO NOTHING;

INSERT INTO "behavior_definitions" ("id","itemKey","label","description","recognitionExamples","isSafetyConcern","sortOrder","categoryId")
SELECT gen_random_uuid()::text, 'fatigue-loss-of-energy', 'Fatigue or loss of energy', '#6 — Fatigue or loss of energy nearly every day', '["Dragging, sluggish, can''t get going no matter what","Saying \"I''m so tired\" constantly even after sleeping","Simple tasks (shower, getting dressed) feel like climbing a mountain","Needing rest after minimal effort"]', FALSE, 5, c."id"
FROM "framework_behavior_categories" c JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND c."slug" = 'depressive'
ON CONFLICT ("categoryId","itemKey") DO NOTHING;
INSERT INTO "behavior_criterion_mappings" ("id","behaviorId","criterionId")
SELECT gen_random_uuid()::text, bd."id", cr."id"
FROM "behavior_definitions" bd
JOIN "framework_behavior_categories" c ON c."id" = bd."categoryId"
JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'depressive'
JOIN "criteria" cr ON cr."poleId" = p."id" AND cr."number" = 6
WHERE bd."itemKey" = 'fatigue-loss-of-energy'
ON CONFLICT ("behaviorId","criterionId") DO NOTHING;

INSERT INTO "behavior_definitions" ("id","itemKey","label","description","recognitionExamples","isSafetyConcern","sortOrder","categoryId")
SELECT gen_random_uuid()::text, 'worthlessness-guilt', 'Feelings of worthlessness or excessive guilt', '#7 — Feelings of worthlessness or excessive/inappropriate guilt', '["Saying they''re a burden, a failure, not good enough","Apologizing constantly for things that aren''t their fault","Convinced they''ve let everyone down","Talking about themselves in harsh, absolute terms — \"I ruin everything\"","Guilt that''s way out of proportion to the situation","Believing they don''t deserve good things or help"]', FALSE, 6, c."id"
FROM "framework_behavior_categories" c JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND c."slug" = 'depressive'
ON CONFLICT ("categoryId","itemKey") DO NOTHING;
INSERT INTO "behavior_criterion_mappings" ("id","behaviorId","criterionId")
SELECT gen_random_uuid()::text, bd."id", cr."id"
FROM "behavior_definitions" bd
JOIN "framework_behavior_categories" c ON c."id" = bd."categoryId"
JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'depressive'
JOIN "criteria" cr ON cr."poleId" = p."id" AND cr."number" = 7
WHERE bd."itemKey" = 'worthlessness-guilt'
ON CONFLICT ("behaviorId","criterionId") DO NOTHING;

INSERT INTO "behavior_definitions" ("id","itemKey","label","description","recognitionExamples","isSafetyConcern","sortOrder","categoryId")
SELECT gen_random_uuid()::text, 'diminished-concentration', 'Diminished ability to think or concentrate', '#8 — Diminished ability to think or concentrate, or indecisiveness', '["Can''t focus on a show, a book, or a conversation","Unable to make simple decisions — paralyzed by small choices","Staring into space, zoned out, mentally foggy","Taking much longer to do things that are usually easy","Forgetting things they''d normally remember","Saying \"I can''t think straight\""]', FALSE, 7, c."id"
FROM "framework_behavior_categories" c JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND c."slug" = 'depressive'
ON CONFLICT ("categoryId","itemKey") DO NOTHING;
INSERT INTO "behavior_criterion_mappings" ("id","behaviorId","criterionId")
SELECT gen_random_uuid()::text, bd."id", cr."id"
FROM "behavior_definitions" bd
JOIN "framework_behavior_categories" c ON c."id" = bd."categoryId"
JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'depressive'
JOIN "criteria" cr ON cr."poleId" = p."id" AND cr."number" = 8
WHERE bd."itemKey" = 'diminished-concentration'
ON CONFLICT ("behaviorId","criterionId") DO NOTHING;

INSERT INTO "behavior_definitions" ("id","itemKey","label","description","recognitionExamples","isSafetyConcern","sortOrder","categoryId")
SELECT gen_random_uuid()::text, 'thoughts-of-death', 'Recurrent thoughts of death or suicidal ideation', '#9 — Recurrent thoughts of death, suicidal ideation, or attempt', '["Any mention of death, dying, or not wanting to be here","\"Everyone would be better off without me\"","Talking about being a burden in a way that implies the world is better without them","Giving away belongings, saying goodbye in unusual ways","Researching methods or writing notes","Expressing hopelessness about the future in absolute terms","Always flag this — even if you''re not sure. Better to be safe."]', TRUE, 8, c."id"
FROM "framework_behavior_categories" c JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId"
WHERE f."slug" = 'dsm5-bipolar' AND c."slug" = 'depressive'
ON CONFLICT ("categoryId","itemKey") DO NOTHING;
INSERT INTO "behavior_criterion_mappings" ("id","behaviorId","criterionId")
SELECT gen_random_uuid()::text, bd."id", cr."id"
FROM "behavior_definitions" bd
JOIN "framework_behavior_categories" c ON c."id" = bd."categoryId"
JOIN "diagnostic_frameworks" f ON f."id" = c."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'depressive'
JOIN "criteria" cr ON cr."poleId" = p."id" AND cr."number" = 9
WHERE bd."itemKey" = 'thoughts-of-death'
ON CONFLICT ("behaviorId","criterionId") DO NOTHING;

INSERT INTO "mood_descriptor_mappings" ("id","moodValue","satisfiesGate","addsCriterionId","poleId","frameworkId")
SELECT gen_random_uuid()::text, 'MANIC', TRUE, NULL, p."id", f."id"
FROM "diagnostic_frameworks" f
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'manic'
WHERE f."slug" = 'dsm5-bipolar'
ON CONFLICT ("frameworkId","moodValue","poleId") DO NOTHING;

INSERT INTO "mood_descriptor_mappings" ("id","moodValue","satisfiesGate","addsCriterionId","poleId","frameworkId")
SELECT gen_random_uuid()::text, 'MIXED', TRUE, NULL, p."id", f."id"
FROM "diagnostic_frameworks" f
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'manic'
WHERE f."slug" = 'dsm5-bipolar'
ON CONFLICT ("frameworkId","moodValue","poleId") DO NOTHING;

INSERT INTO "mood_descriptor_mappings" ("id","moodValue","satisfiesGate","addsCriterionId","poleId","frameworkId")
SELECT gen_random_uuid()::text, 'DEPRESSIVE', FALSE, cr."id", p."id", f."id"
FROM "diagnostic_frameworks" f
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'depressive'
JOIN "criterion_poles" ap ON ap."frameworkId" = f."id" AND ap."slug" = 'depressive'
JOIN "criteria" cr ON cr."poleId" = ap."id" AND cr."number" = 1
WHERE f."slug" = 'dsm5-bipolar'
ON CONFLICT ("frameworkId","moodValue","poleId") DO NOTHING;

INSERT INTO "mood_descriptor_mappings" ("id","moodValue","satisfiesGate","addsCriterionId","poleId","frameworkId")
SELECT gen_random_uuid()::text, 'MIXED', FALSE, cr."id", p."id", f."id"
FROM "diagnostic_frameworks" f
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'depressive'
JOIN "criterion_poles" ap ON ap."frameworkId" = f."id" AND ap."slug" = 'depressive'
JOIN "criteria" cr ON cr."poleId" = ap."id" AND cr."number" = 1
WHERE f."slug" = 'dsm5-bipolar'
ON CONFLICT ("frameworkId","moodValue","poleId") DO NOTHING;

INSERT INTO "classification_rules" ("id","classificationLabel","ruleType","gateRequired","minStandardCriteria","coreRequired","gateOnlyAdjustment","minOppositeCriteria","mixedLabel","priority","poleId","frameworkId")
SELECT gen_random_uuid()::text, 'MANIC', 'DSM5_FULL', TRUE, 3, FALSE, 1, 0, NULL, 10, p."id", f."id"
FROM "diagnostic_frameworks" f
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'manic'
WHERE f."slug" = 'dsm5-bipolar'
AND NOT EXISTS (SELECT 1 FROM "classification_rules" r WHERE r."frameworkId" = f."id" AND r."poleId" = p."id" AND r."classificationLabel" = 'MANIC' AND r."ruleType" = 'DSM5_FULL');

INSERT INTO "classification_rules" ("id","classificationLabel","ruleType","gateRequired","minStandardCriteria","coreRequired","gateOnlyAdjustment","minOppositeCriteria","mixedLabel","priority","poleId","frameworkId")
SELECT gen_random_uuid()::text, 'MANIC', 'SUBTHRESHOLD', TRUE, 2, FALSE, 0, 0, NULL, 5, p."id", f."id"
FROM "diagnostic_frameworks" f
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'manic'
WHERE f."slug" = 'dsm5-bipolar'
AND NOT EXISTS (SELECT 1 FROM "classification_rules" r WHERE r."frameworkId" = f."id" AND r."poleId" = p."id" AND r."classificationLabel" = 'MANIC' AND r."ruleType" = 'SUBTHRESHOLD');

INSERT INTO "classification_rules" ("id","classificationLabel","ruleType","gateRequired","minStandardCriteria","coreRequired","gateOnlyAdjustment","minOppositeCriteria","mixedLabel","priority","poleId","frameworkId")
SELECT gen_random_uuid()::text, 'DEPRESSIVE', 'DSM5_FULL', FALSE, 5, TRUE, 0, 0, NULL, 10, p."id", f."id"
FROM "diagnostic_frameworks" f
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'depressive'
WHERE f."slug" = 'dsm5-bipolar'
AND NOT EXISTS (SELECT 1 FROM "classification_rules" r WHERE r."frameworkId" = f."id" AND r."poleId" = p."id" AND r."classificationLabel" = 'DEPRESSIVE' AND r."ruleType" = 'DSM5_FULL');

INSERT INTO "classification_rules" ("id","classificationLabel","ruleType","gateRequired","minStandardCriteria","coreRequired","gateOnlyAdjustment","minOppositeCriteria","mixedLabel","priority","poleId","frameworkId")
SELECT gen_random_uuid()::text, 'DEPRESSIVE', 'SUBTHRESHOLD', FALSE, 3, TRUE, 0, 0, NULL, 5, p."id", f."id"
FROM "diagnostic_frameworks" f
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'depressive'
WHERE f."slug" = 'dsm5-bipolar'
AND NOT EXISTS (SELECT 1 FROM "classification_rules" r WHERE r."frameworkId" = f."id" AND r."poleId" = p."id" AND r."classificationLabel" = 'DEPRESSIVE' AND r."ruleType" = 'SUBTHRESHOLD');

INSERT INTO "classification_rules" ("id","classificationLabel","ruleType","gateRequired","minStandardCriteria","coreRequired","gateOnlyAdjustment","minOppositeCriteria","mixedLabel","priority","poleId","frameworkId")
SELECT gen_random_uuid()::text, 'MIXED', 'DSM5_FULL', TRUE, 3, FALSE, 0, 3, 'MIXED', 15, p."id", f."id"
FROM "diagnostic_frameworks" f
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'manic'
WHERE f."slug" = 'dsm5-bipolar'
AND NOT EXISTS (SELECT 1 FROM "classification_rules" r WHERE r."frameworkId" = f."id" AND r."poleId" = p."id" AND r."classificationLabel" = 'MIXED' AND r."ruleType" = 'DSM5_FULL');

INSERT INTO "classification_rules" ("id","classificationLabel","ruleType","gateRequired","minStandardCriteria","coreRequired","gateOnlyAdjustment","minOppositeCriteria","mixedLabel","priority","poleId","frameworkId")
SELECT gen_random_uuid()::text, 'MIXED', 'DSM5_FULL', FALSE, 5, TRUE, 0, 3, 'MIXED', 15, p."id", f."id"
FROM "diagnostic_frameworks" f
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'depressive'
WHERE f."slug" = 'dsm5-bipolar'
AND NOT EXISTS (SELECT 1 FROM "classification_rules" r WHERE r."frameworkId" = f."id" AND r."poleId" = p."id" AND r."classificationLabel" = 'MIXED' AND r."ruleType" = 'DSM5_FULL');

INSERT INTO "episode_thresholds" ("id","episodeLabel","confidenceLevel","minDays","requiresDsmSymptoms","poleId","frameworkId")
SELECT gen_random_uuid()::text, 'MANIC', 'DSM5_MET', 7, TRUE, p."id", f."id"
FROM "diagnostic_frameworks" f
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'manic'
WHERE f."slug" = 'dsm5-bipolar'
AND NOT EXISTS (SELECT 1 FROM "episode_thresholds" t WHERE t."frameworkId" = f."id" AND t."poleId" = p."id" AND t."episodeLabel" = 'MANIC' AND t."confidenceLevel" = 'DSM5_MET' AND t."minDays" = 7);

INSERT INTO "episode_thresholds" ("id","episodeLabel","confidenceLevel","minDays","requiresDsmSymptoms","poleId","frameworkId")
SELECT gen_random_uuid()::text, 'HYPOMANIC', 'DSM5_MET', 4, TRUE, p."id", f."id"
FROM "diagnostic_frameworks" f
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'manic'
WHERE f."slug" = 'dsm5-bipolar'
AND NOT EXISTS (SELECT 1 FROM "episode_thresholds" t WHERE t."frameworkId" = f."id" AND t."poleId" = p."id" AND t."episodeLabel" = 'HYPOMANIC' AND t."confidenceLevel" = 'DSM5_MET' AND t."minDays" = 4);

INSERT INTO "episode_thresholds" ("id","episodeLabel","confidenceLevel","minDays","requiresDsmSymptoms","poleId","frameworkId")
SELECT gen_random_uuid()::text, 'MANIC', 'PRODROMAL_CONCERN', 4, FALSE, p."id", f."id"
FROM "diagnostic_frameworks" f
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'manic'
WHERE f."slug" = 'dsm5-bipolar'
AND NOT EXISTS (SELECT 1 FROM "episode_thresholds" t WHERE t."frameworkId" = f."id" AND t."poleId" = p."id" AND t."episodeLabel" = 'MANIC' AND t."confidenceLevel" = 'PRODROMAL_CONCERN' AND t."minDays" = 4);

INSERT INTO "episode_thresholds" ("id","episodeLabel","confidenceLevel","minDays","requiresDsmSymptoms","poleId","frameworkId")
SELECT gen_random_uuid()::text, 'HYPOMANIC', 'PRODROMAL_CONCERN', 2, FALSE, p."id", f."id"
FROM "diagnostic_frameworks" f
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'manic'
WHERE f."slug" = 'dsm5-bipolar'
AND NOT EXISTS (SELECT 1 FROM "episode_thresholds" t WHERE t."frameworkId" = f."id" AND t."poleId" = p."id" AND t."episodeLabel" = 'HYPOMANIC' AND t."confidenceLevel" = 'PRODROMAL_CONCERN' AND t."minDays" = 2);

INSERT INTO "episode_thresholds" ("id","episodeLabel","confidenceLevel","minDays","requiresDsmSymptoms","poleId","frameworkId")
SELECT gen_random_uuid()::text, 'DEPRESSIVE', 'DSM5_MET', 14, TRUE, p."id", f."id"
FROM "diagnostic_frameworks" f
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'depressive'
WHERE f."slug" = 'dsm5-bipolar'
AND NOT EXISTS (SELECT 1 FROM "episode_thresholds" t WHERE t."frameworkId" = f."id" AND t."poleId" = p."id" AND t."episodeLabel" = 'DEPRESSIVE' AND t."confidenceLevel" = 'DSM5_MET' AND t."minDays" = 14);

INSERT INTO "episode_thresholds" ("id","episodeLabel","confidenceLevel","minDays","requiresDsmSymptoms","poleId","frameworkId")
SELECT gen_random_uuid()::text, 'DEPRESSIVE', 'PRODROMAL_CONCERN', 7, FALSE, p."id", f."id"
FROM "diagnostic_frameworks" f
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'depressive'
WHERE f."slug" = 'dsm5-bipolar'
AND NOT EXISTS (SELECT 1 FROM "episode_thresholds" t WHERE t."frameworkId" = f."id" AND t."poleId" = p."id" AND t."episodeLabel" = 'DEPRESSIVE' AND t."confidenceLevel" = 'PRODROMAL_CONCERN' AND t."minDays" = 7);

INSERT INTO "episode_thresholds" ("id","episodeLabel","confidenceLevel","minDays","requiresDsmSymptoms","poleId","frameworkId")
SELECT gen_random_uuid()::text, 'DEPRESSIVE', 'PRODROMAL_CONCERN', 5, FALSE, p."id", f."id"
FROM "diagnostic_frameworks" f
JOIN "criterion_poles" p ON p."frameworkId" = f."id" AND p."slug" = 'depressive'
WHERE f."slug" = 'dsm5-bipolar'
AND NOT EXISTS (SELECT 1 FROM "episode_thresholds" t WHERE t."frameworkId" = f."id" AND t."poleId" = p."id" AND t."episodeLabel" = 'DEPRESSIVE' AND t."confidenceLevel" = 'PRODROMAL_CONCERN' AND t."minDays" = 5);

INSERT INTO "signal_rules" ("id","signalId","title","descriptionTemplate","level","windowDays","minOccurrences","trendCompare","trendMinLate","frameworkId")
SELECT gen_random_uuid()::text, 'sleep-disruption', 'Sleep disruption pattern', 'Sleep issues logged {count} of the last {window} days. Persistent sleep changes are one of the earliest prodromal indicators.', 'WARNING', 7, 3, FALSE, 0, f."id"
FROM "diagnostic_frameworks" f WHERE f."slug" = 'dsm5-bipolar'
AND NOT EXISTS (SELECT 1 FROM "signal_rules" s WHERE s."frameworkId" = f."id" AND s."signalId" = 'sleep-disruption');
INSERT INTO "signal_behaviors" ("id","signalRuleId","behaviorId")
SELECT gen_random_uuid()::text, s."id", bd."id"
FROM "signal_rules" s
JOIN "diagnostic_frameworks" f ON f."id" = s."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "framework_behavior_categories" c ON c."frameworkId" = f."id"
JOIN "behavior_definitions" bd ON bd."categoryId" = c."id" AND bd."itemKey" = 'decreased-need-for-sleep'
WHERE s."signalId" = 'sleep-disruption'
ON CONFLICT ("signalRuleId","behaviorId") DO NOTHING;
INSERT INTO "signal_behaviors" ("id","signalRuleId","behaviorId")
SELECT gen_random_uuid()::text, s."id", bd."id"
FROM "signal_rules" s
JOIN "diagnostic_frameworks" f ON f."id" = s."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "framework_behavior_categories" c ON c."frameworkId" = f."id"
JOIN "behavior_definitions" bd ON bd."categoryId" = c."id" AND bd."itemKey" = 'insomnia-hypersomnia'
WHERE s."signalId" = 'sleep-disruption'
ON CONFLICT ("signalRuleId","behaviorId") DO NOTHING;

INSERT INTO "signal_rules" ("id","signalId","title","descriptionTemplate","level","windowDays","minOccurrences","trendCompare","trendMinLate","frameworkId")
SELECT gen_random_uuid()::text, 'escalating-irritability', 'Escalating irritability', 'Irritability and rage behaviors are increasing over the last {window} days. This pattern often precedes a manic or mixed episode.', 'WARNING', 14, 2, TRUE, 2, f."id"
FROM "diagnostic_frameworks" f WHERE f."slug" = 'dsm5-bipolar'
AND NOT EXISTS (SELECT 1 FROM "signal_rules" s WHERE s."frameworkId" = f."id" AND s."signalId" = 'escalating-irritability');
INSERT INTO "signal_behaviors" ("id","signalRuleId","behaviorId")
SELECT gen_random_uuid()::text, s."id", bd."id"
FROM "signal_rules" s
JOIN "diagnostic_frameworks" f ON f."id" = s."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "framework_behavior_categories" c ON c."frameworkId" = f."id"
JOIN "behavior_definitions" bd ON bd."categoryId" = c."id" AND bd."itemKey" = 'elevated-expansive-irritable-mood'
WHERE s."signalId" = 'escalating-irritability'
ON CONFLICT ("signalRuleId","behaviorId") DO NOTHING;
INSERT INTO "signal_behaviors" ("id","signalRuleId","behaviorId")
SELECT gen_random_uuid()::text, s."id", bd."id"
FROM "signal_rules" s
JOIN "diagnostic_frameworks" f ON f."id" = s."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "framework_behavior_categories" c ON c."frameworkId" = f."id"
JOIN "behavior_definitions" bd ON bd."categoryId" = c."id" AND bd."itemKey" = 'risky-reckless-activities'
WHERE s."signalId" = 'escalating-irritability'
ON CONFLICT ("signalRuleId","behaviorId") DO NOTHING;

INSERT INTO "signal_rules" ("id","signalId","title","descriptionTemplate","level","windowDays","minOccurrences","trendCompare","trendMinLate","frameworkId")
SELECT gen_random_uuid()::text, 'energy-volatility', 'Energy level volatility', 'Energy levels are swinging between high and low ({count} switches in {window} days). This instability can signal mood cycling.', 'INFO', 7, 2, FALSE, 0, f."id"
FROM "diagnostic_frameworks" f WHERE f."slug" = 'dsm5-bipolar'
AND NOT EXISTS (SELECT 1 FROM "signal_rules" s WHERE s."frameworkId" = f."id" AND s."signalId" = 'energy-volatility');
INSERT INTO "signal_behaviors" ("id","signalRuleId","behaviorId")
SELECT gen_random_uuid()::text, s."id", bd."id"
FROM "signal_rules" s
JOIN "diagnostic_frameworks" f ON f."id" = s."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "framework_behavior_categories" c ON c."frameworkId" = f."id"
JOIN "behavior_definitions" bd ON bd."categoryId" = c."id" AND bd."itemKey" = 'goal-directed-activity'
WHERE s."signalId" = 'energy-volatility'
ON CONFLICT ("signalRuleId","behaviorId") DO NOTHING;
INSERT INTO "signal_behaviors" ("id","signalRuleId","behaviorId")
SELECT gen_random_uuid()::text, s."id", bd."id"
FROM "signal_rules" s
JOIN "diagnostic_frameworks" f ON f."id" = s."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "framework_behavior_categories" c ON c."frameworkId" = f."id"
JOIN "behavior_definitions" bd ON bd."categoryId" = c."id" AND bd."itemKey" = 'fatigue-loss-of-energy'
WHERE s."signalId" = 'energy-volatility'
ON CONFLICT ("signalRuleId","behaviorId") DO NOTHING;

INSERT INTO "signal_rules" ("id","signalId","title","descriptionTemplate","level","windowDays","minOccurrences","trendCompare","trendMinLate","frameworkId")
SELECT gen_random_uuid()::text, 'safety-concern', 'Safety concern detected', 'References to death, self-harm, or safety concerns were logged on {count} recent day(s). Please discuss with a clinician.', 'ALERT', 7, 1, FALSE, 0, f."id"
FROM "diagnostic_frameworks" f WHERE f."slug" = 'dsm5-bipolar'
AND NOT EXISTS (SELECT 1 FROM "signal_rules" s WHERE s."frameworkId" = f."id" AND s."signalId" = 'safety-concern');
INSERT INTO "signal_behaviors" ("id","signalRuleId","behaviorId")
SELECT gen_random_uuid()::text, s."id", bd."id"
FROM "signal_rules" s
JOIN "diagnostic_frameworks" f ON f."id" = s."frameworkId" AND f."slug" = 'dsm5-bipolar'
JOIN "framework_behavior_categories" c ON c."frameworkId" = f."id"
JOIN "behavior_definitions" bd ON bd."categoryId" = c."id" AND bd."itemKey" = 'thoughts-of-death'
WHERE s."signalId" = 'safety-concern'
ON CONFLICT ("signalRuleId","behaviorId") DO NOTHING;

-- Assign every existing tenant to the framework (no-op on fresh databases).
INSERT INTO "tenant_frameworks" ("id","tenantId","frameworkId")
SELECT gen_random_uuid()::text, t."id", f."id"
FROM "tenants" t CROSS JOIN "diagnostic_frameworks" f WHERE f."slug" = 'dsm5-bipolar'
ON CONFLICT ("tenantId","frameworkId") DO NOTHING;

-- Default custom checklist items (observational items moved out of the DSM checklist in Phase 16).
INSERT INTO "custom_checklist_items" ("id","label","tenantId")
SELECT gen_random_uuid()::text, 'Denies anything wrong', t."id"
FROM "tenants" t
WHERE NOT EXISTS (SELECT 1 FROM "custom_checklist_items" i WHERE i."tenantId" = t."id" AND i."label" = 'Denies anything wrong');
INSERT INTO "custom_checklist_items" ("id","label","tenantId")
SELECT gen_random_uuid()::text, 'Mood energy swings', t."id"
FROM "tenants" t
WHERE NOT EXISTS (SELECT 1 FROM "custom_checklist_items" i WHERE i."tenantId" = t."id" AND i."label" = 'Mood energy swings');
INSERT INTO "custom_checklist_items" ("id","label","tenantId")
SELECT gen_random_uuid()::text, 'Unusual anxiety panic', t."id"
FROM "tenants" t
WHERE NOT EXISTS (SELECT 1 FROM "custom_checklist_items" i WHERE i."tenantId" = t."id" AND i."label" = 'Unusual anxiety panic');

COMMIT;
