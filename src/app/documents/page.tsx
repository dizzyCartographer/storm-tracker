import { requireUser } from "@/lib/auth-utils";
import { getUserTenants, getDefaultTenantId } from "@/lib/actions/tenant-actions";
import { Nav } from "@/app/_components/nav";
import { DocumentLibrary } from "./document-library";
import Link from "next/link";
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
      <Nav />
      <main className="mx-auto max-w-4xl p-4 md:p-6">
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="mt-1 text-sm text-gray-500">
          All uploaded files for <strong>{activeTenant.name}</strong>.
        </p>

        {tenants.length > 1 && (
          <div className="mt-4 flex gap-2">
            {tenants.map((t) => (
              <Link
                key={t.id}
                href={`/documents?tenant=${t.id}`}
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
          <DocumentLibrary tenantId={activeTenant.id} />
        </div>
      </main>
    </>
  );
}
