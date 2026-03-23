import { requireUser } from "@/lib/auth-utils";
import { getUserTenants } from "@/lib/actions/tenant-actions";
import { Nav } from "@/app/_components/nav";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage({
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

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{activeTenant.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, {user.name}.
            </p>
          </div>
          <Link
            href={`/log?tenant=${activeTenant.id}`}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            New log entry
          </Link>
        </div>

        {tenants.length > 1 && (
          <div className="mt-4 flex gap-2">
            {tenants.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard?tenant=${t.id}`}
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

        <p className="mt-8 text-gray-500">No entries yet. Start by logging today.</p>
      </main>
    </>
  );
}
