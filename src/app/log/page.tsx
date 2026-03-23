import { requireUser } from "@/lib/auth-utils";
import { getUserTenants } from "@/lib/actions/tenant-actions";
import { Nav } from "@/app/_components/nav";
import { redirect } from "next/navigation";
import { QuickLogForm } from "./quick-log-form";

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  await requireUser();
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
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-2xl font-bold">Daily Log</h1>
        <p className="mt-1 text-sm text-gray-500">
          Logging for {activeTenant.name}
        </p>
        <QuickLogForm tenantId={activeTenant.id} />
      </main>
    </>
  );
}
