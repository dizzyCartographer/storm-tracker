import { NextRequest } from "next/server";
import {
  requireMobileUser,
  requireTenantMembership,
  errorResponse,
} from "@/lib/mobile-auth";
import {
  loadTenantFrameworks,
  getTenantBehaviorItems,
} from "@/lib/analysis/framework-loader";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const userId = await requireMobileUser(request);
    const { tenantId } = await params;

    await requireTenantMembership(userId, tenantId);

    const [frameworks, behaviorItems] = await Promise.all([
      loadTenantFrameworks(tenantId),
      getTenantBehaviorItems(tenantId),
    ]);

    // Serialize frameworks — convert Map to Record for JSON
    const serialized = frameworks.map((fw) => ({
      id: fw.id,
      slug: fw.slug,
      name: fw.name,
      poles: fw.poles,
      behaviors: fw.behaviors,
      classificationRules: fw.classificationRules,
      episodeThresholds: fw.episodeThresholds,
      signalRules: fw.signalRules,
      moodMappings: fw.moodMappings,
      // behaviorMap is a Map — convert to Record for JSON serialization
      behaviorMap: Object.fromEntries(fw.behaviorMap),
    }));

    return Response.json({
      frameworks: serialized,
      behaviorItems: behaviorItems.items,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
