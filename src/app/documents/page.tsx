import { requireUser } from "@/lib/auth-utils";
import { getUserTenants, getDefaultTenantId } from "@/lib/actions/tenant-actions";
import { Nav } from "@/app/_components/nav";
import { ProjectSelector } from "@/app/_components/project-selector";
import { DocumentLibrary } from "./document-library";
import { redirect } from "next/navigation";

export default async function DocumentsPage({
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
  const activeTenant = tenants.find((t) => t.id === activeTenantId) ?? tenants[0];

  return (
    <>
      <Nav accentColor={activeTenant.teenFavoriteColor} />
      <ProjectSelector projects={tenants} activeProjectId={activeTenant.id} />
      <main className="mx-auto max-w-4xl p-4 md:p-6">
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="mt-1 text-sm text-gray-500">
          All uploaded files for <strong>{activeTenant.name}</strong>.
        </p>

        <div className="mt-6">
          <DocumentLibrary tenantId={activeTenant.id} />
        </div>
      </main>
    </>
  );
}
