import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { requireUser } from "@/lib/auth-utils";
import { getTenantBehaviorItems } from "@/lib/analysis/framework-loader";
import { prisma } from "@/lib/prisma";

const parsedEntrySchema = z.object({
  date: z
    .string()
    .describe(
      "The date of the entry in YYYY-MM-DD format. Extract from the text if mentioned, otherwise null."
    )
    .nullable(),
  mood: z
    .enum(["MANIC", "DEPRESSIVE", "NEUTRAL", "MIXED"])
    .describe("Overall mood classification based on the described behaviors"),
  dayQuality: z
    .enum(["GOOD", "NEUTRAL", "BAD", "MIXED"])
    .describe("Overall quality of the day"),
  behaviorKeys: z
    .array(z.string())
    .describe(
      "Array of behavior item keys that match behaviors described in the text"
    ),
  impairments: z
    .record(
      z.string(),
      z.enum(["NONE", "PRESENT", "SEVERE"])
    )
    .describe(
      "Impairment levels for domains: SCHOOL_WORK, FAMILY_LIFE, FRIENDSHIPS, SELF_CARE, SAFETY_CONCERN"
    ),
  notes: z
    .string()
    .describe(
      "A cleaned-up version of the journal entry suitable for the notes field. Preserve the caregiver's voice and observations but remove redundant metadata."
    ),
  confidence: z
    .enum(["HIGH", "MEDIUM", "LOW"])
    .describe("How confident the extraction is based on detail in the text"),
  reasoning: z
    .string()
    .describe(
      "Brief explanation of why these behaviors and mood were selected"
    ),
  followUpQuestions: z
    .array(z.string())
    .describe(
      "1-3 clarifying questions to ask the caregiver to improve the entry accuracy"
    ),
});

export type ParsedEntry = z.infer<typeof parsedEntrySchema>;

export async function POST(request: Request) {
  const user = await requireUser();

  const { text, tenantId } = await request.json();

  if (!text || !tenantId) {
    return Response.json(
      { error: "text and tenantId are required" },
      { status: 400 }
    );
  }
  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (!membership) {
    return Response.json({ error: "Not a member of this project" }, { status: 403 });
  }

  // Load behavior items for this tenant's framework
  const { items: behaviorItems } = await getTenantBehaviorItems(tenantId);

  const behaviorReference = behaviorItems
    .map(
      (b) =>
        `- key: "${b.key}" | label: "${b.label}" | description: "${b.description}"${b.recognitionExamples ? ` | examples: ${(b.recognitionExamples as string[]).join("; ")}` : ""}`
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

  return Response.json(result.object);
}
