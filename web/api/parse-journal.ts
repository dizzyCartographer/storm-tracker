import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod/v4";
import { getSessionUser, getJwtFromCookies, neonFetchServer } from "./_auth.js";

const parsedEntrySchema = z.object({
  date: z
    .string()
    .describe("The date of the entry in YYYY-MM-DD format. Extract from text if mentioned, otherwise null.")
    .nullable(),
  mood: z
    .enum(["MANIC", "DEPRESSIVE", "NEUTRAL", "MIXED"])
    .describe("Overall mood classification based on the described behaviors"),
  dayQuality: z
    .enum(["GOOD", "NEUTRAL", "BAD", "MIXED"])
    .describe("Overall quality of the day"),
  behaviorKeys: z
    .array(z.string())
    .describe("Array of behavior item keys that match behaviors described in the text"),
  impairments: z
    .record(z.string(), z.enum(["NONE", "PRESENT", "SEVERE"]))
    .describe("Impairment levels for domains: SCHOOL_WORK, FAMILY_LIFE, FRIENDSHIPS, SELF_CARE, SAFETY_CONCERN"),
  notes: z
    .string()
    .describe("A cleaned-up version of the journal entry suitable for the notes field. Preserve the caregiver's voice."),
  confidence: z
    .enum(["HIGH", "MEDIUM", "LOW"])
    .describe("How confident the extraction is based on detail in the text"),
  reasoning: z
    .string()
    .describe("Brief explanation of why these behaviors and mood were selected"),
  followUpQuestions: z
    .array(z.string())
    .describe("1-3 clarifying questions to ask the caregiver to improve accuracy"),
});

export type ParsedEntry = z.infer<typeof parsedEntrySchema>;

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { text, tenantId } = await request.json();
  if (!text || !tenantId) {
    return new Response(JSON.stringify({ error: "text and tenantId are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get JWT for Neon Data API queries (membership check + framework data)
  const jwt = await getJwtFromCookies(request);
  if (!jwt) {
    return new Response(JSON.stringify({ error: "Failed to get auth token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify membership (RLS handles this — if query returns nothing, not a member)
  const memberRes = await neonFetchServer(
    `/tenant_members?"tenantId"=eq.${tenantId}&"userId"=eq.${user.id}&limit=1`,
    jwt
  );
  if (!memberRes.ok) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const members = await memberRes.json();
  if (!members || members.length === 0) {
    return new Response(JSON.stringify({ error: "Not a member of this project" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Load behavior definitions for the tenant's framework
  const behaviorItems = await loadBehaviorItems(tenantId, jwt);

  const behaviorReference = behaviorItems
    .map(
      (b) =>
        `- key: "${b.itemKey}" | label: "${b.label}" | description: "${b.description}"${
          b.recognitionExamples ? ` | examples: ${b.recognitionExamples}` : ""
        }`
    )
    .join("\n");

  const result = await generateObject({
    model: anthropic("claude-sonnet-4-20250514"),
    schema: parsedEntrySchema,
    prompt: `You are helping a caregiver of a teen with suspected bipolar disorder convert freeform journal entries into structured behavioral observations.

BEHAVIOR CHECKLIST — only use these exact keys:
${behaviorReference}

IMPAIRMENT DOMAINS — rate each as NONE, PRESENT, or SEVERE:
- SCHOOL_WORK: School or work functioning
- FAMILY_LIFE: Family relationships and home life
- FRIENDSHIPS: Peer relationships and social life
- SELF_CARE: Hygiene, eating, sleeping routines
- SAFETY_CONCERN: Any safety-related concerns

MOOD CLASSIFICATION:
- MANIC: Elevated, expansive, or irritable mood with increased energy
- DEPRESSIVE: Sad, empty, hopeless, or withdrawn
- MIXED: Features of both manic and depressive states
- NEUTRAL: No significant mood disturbance

DAY QUALITY:
- GOOD: Positive overall day
- BAD: Difficult overall day
- NEUTRAL: Neither notably good nor bad
- MIXED: Both good and bad elements

INSTRUCTIONS:
1. Read the journal entry carefully
2. Identify which behavior checklist items match what's described — be conservative, only select items clearly supported by the text
3. Classify the overall mood and day quality
4. Rate impairment in each domain based on what's described (default to NONE if not mentioned)
5. Generate 1-3 follow-up questions that would help fill in gaps
6. Include your reasoning

JOURNAL ENTRY:
${text}`,
  });

  return new Response(JSON.stringify(result.object), {
    headers: { "Content-Type": "application/json" },
  });
}

async function loadBehaviorItems(
  tenantId: string,
  jwt: string
): Promise<{ itemKey: string; label: string; description: string; recognitionExamples: string | null }[]> {
  // Get framework ID for this tenant
  const tfRes = await neonFetchServer(
    `/tenant_frameworks?"tenantId"=eq.${tenantId}&select="frameworkId"&limit=1`,
    jwt
  );
  if (!tfRes.ok) return [];
  const tfs = await tfRes.json();
  if (!tfs || tfs.length === 0) return [];
  const frameworkId = tfs[0].frameworkId;

  // Get behavior categories for the framework
  const catRes = await neonFetchServer(
    `/framework_behavior_categories?"frameworkId"=eq.${frameworkId}&select=id&order="sortOrder".asc`,
    jwt
  );
  if (!catRes.ok) return [];
  const cats = await catRes.json();
  if (!cats || cats.length === 0) return [];

  const catIds = cats.map((c: { id: string }) => c.id);
  const inClause = catIds.map((id: string) => `"${id}"`).join(",");

  // Get behavior definitions
  const defRes = await neonFetchServer(
    `/behavior_definitions?"categoryId"=in.(${inClause})&select="itemKey",label,description,"recognitionExamples"&order="sortOrder".asc`,
    jwt
  );
  if (!defRes.ok) return [];
  return defRes.json();
}
