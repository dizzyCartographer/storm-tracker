import { requireUser } from "@/lib/auth-utils";
import { getUserTenants, getDefaultTenantId } from "@/lib/actions/tenant-actions";
import { Nav } from "@/app/_components/nav";
import { redirect } from "next/navigation";
import { ProjectSelector } from "@/app/_components/project-selector";
import { JournalImportForm } from "./journal-import-form";

export default async function JournalImportPage({
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
      <Nav />
      <ProjectSelector projects={tenants} activeProjectId={activeTenant.id} />
      <main className="mx-auto w-full px-4 py-4 sm:max-w-2xl sm:px-6 md:max-w-3xl md:px-6">
        <h1 className="text-2xl font-bold">Import Journal Entry</h1>
        <p className="mt-1 text-sm text-gray-500">
          Paste a journal entry or notes and AI will extract structured behavioral data for {activeTenant.name}.
        </p>
        <JournalImportForm tenantId={activeTenant.id} />
      </main>
    </>
  );
}
