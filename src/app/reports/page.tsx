import { requireUser } from "@/lib/auth-utils";
import { getUserTenants, getDefaultTenantId } from "@/lib/actions/tenant-actions";
import { getTenantBehaviorItems } from "@/lib/analysis/framework-loader";
import { Nav } from "@/app/_components/nav";
import { ProjectSelector } from "@/app/_components/project-selector";
import { ReportView } from "./report-view";
import { redirect } from "next/navigation";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  await requireUser();
  const tenants = await getUserTenants();
  const params = await searchParams;

  if (tenants.length === 0) {
    redirect("/projects/create");
  }

  const defaultTenantId = await getDefaultTenantId();
  const activeTenantId = params.tenant ?? defaultTenantId ?? tenants[0].id;
  const activeTenant =
    tenants.find((t) => t.id === activeTenantId) ?? tenants[0];
  const { items: behaviorItems } = await getTenantBehaviorItems(activeTenant.id);
  const behaviorLabelMap = Object.fromEntries(behaviorItems.map((i) => [i.key, i.label]));

  return (
    <>
      <Nav />
      <ProjectSelector projects={tenants} activeProjectId={activeTenant.id} />
      <main className="mx-auto max-w-4xl p-4 md:p-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Symptom wave graph, behavior frequency, and clinical summary for{" "}
          <strong>{activeTenant.name}</strong>.
        </p>

        <div className="mt-6">
          <ReportView tenantId={activeTenant.id} tenantName={activeTenant.name} behaviorLabelMap={behaviorLabelMap} />
        </div>
      </main>

      {/* Print styles */}
      <style>{`
        @media print {
          nav, button, input, .no-print { display: none !important; }
          main { max-width: 100% !important; padding: 0 !important; }
          .hidden.print\\:block { display: block !important; }
        }
      `}</style>
    </>
  );
}
