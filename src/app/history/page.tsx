import { requireUser } from "@/lib/auth-utils";
import { getUserTenants, getDefaultTenantId } from "@/lib/actions/tenant-actions";
import { getTenantBehaviorItems } from "@/lib/analysis/framework-loader";
import { Nav } from "@/app/_components/nav";
import { ProjectSelector } from "@/app/_components/project-selector";
import { redirect } from "next/navigation";
import { HistoryView } from "./history-view";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const user = await requireUser();
  const tenants = await getUserTenants();
  const params = await searchParams;

  if (tenants.length === 0) {
    redirect("/projects/create");
  }

  const defaultTenantId = await getDefaultTenantId();
  const activeTenantId = params.tenant ?? defaultTenantId ?? tenants[0].id;
  const activeTenant = tenants.find((t) => t.id === activeTenantId) ?? tenants[0];
  const { items: behaviorItems } = await getTenantBehaviorItems(activeTenant.id);
  const behaviorLabelMap = Object.fromEntries(behaviorItems.map((i) => [i.key, i.label]));

  return (
    <>
      <Nav accentColor={activeTenant.teenFavoriteColor} />
      <ProjectSelector projects={tenants} activeProjectId={activeTenant.id} />
      <main className="mx-auto max-w-4xl p-4 md:p-6">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="mt-1 text-sm text-gray-500">
          Viewing entries for {activeTenant.name}
        </p>

        <HistoryView tenantId={activeTenant.id} currentUserId={user.id} behaviorLabelMap={behaviorLabelMap} />
      </main>
    </>
  );
}
