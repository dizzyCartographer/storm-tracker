import { requireUser } from "@/lib/auth-utils";
import { getUserTenants, getDefaultTenantId } from "@/lib/actions/tenant-actions";
import { getTenantBehaviorItems } from "@/lib/analysis/framework-loader";
import { Nav } from "@/app/_components/nav";
import { ReportView } from "./report-view";
import Link from "next/link";
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
      <main className="mx-auto max-w-4xl p-4 md:p-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Symptom wave graph, behavior frequency, and clinical summary for{" "}
          <strong>{activeTenant.name}</strong>.
        </p>

        {tenants.length > 1 && (
          <div className="mt-4 flex gap-2">
            {tenants.map((t) => (
              <Link
                key={t.id}
                href={`/reports?tenant=${t.id}`}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                  t.id === activeTenant.id
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t.teenFavoriteColor && (
                  <span
                    className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: t.teenFavoriteColor }}
                  />
                )}
                {t.name}
              </Link>
            ))}
          </div>
        )}

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
