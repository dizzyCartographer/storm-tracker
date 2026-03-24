import { requireUser } from "@/lib/auth-utils";
import { getUserTenants } from "@/lib/actions/tenant-actions";
import { getTenantBehaviorItems } from "@/lib/analysis/framework-loader";
import { Nav } from "@/app/_components/nav";
import Link from "next/link";
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
    redirect("/settings/create-project");
  }

  const activeTenantId = params.tenant ?? tenants[0].id;
  const activeTenant = tenants.find((t) => t.id === activeTenantId) ?? tenants[0];
  const { items: behaviorItems } = await getTenantBehaviorItems(activeTenant.id);
  const behaviorLabelMap = Object.fromEntries(behaviorItems.map((i) => [i.key, i.label]));

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="mt-1 text-sm text-gray-500">
          Viewing entries for {activeTenant.name}
        </p>

        {tenants.length > 1 && (
          <div className="mt-4 flex gap-2">
            {tenants.map((t) => (
              <Link
                key={t.id}
                href={`/history?tenant=${t.id}`}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  t.id === activeTenant.id
                    ? "bg-gray-900 text-white"
                    : "border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {t.name}
              </Link>
            ))}
          </div>
        )}

        <HistoryView tenantId={activeTenant.id} currentUserId={user.id} behaviorLabelMap={behaviorLabelMap} />
      </main>
    </>
  );
}
