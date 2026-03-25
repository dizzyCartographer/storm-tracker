import { requireUser } from "@/lib/auth-utils";
import { getUserTenants, getDefaultTenantId } from "@/lib/actions/tenant-actions";
import { Nav } from "@/app/_components/nav";
import Link from "next/link";

export default async function ProjectsPage() {
  await requireUser();
  const tenants = await getUserTenants();
  const defaultTenantId = await getDefaultTenantId();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Projects</h1>
          <Link
            href="/projects/create"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            New project
          </Link>
        </div>

        {tenants.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500">
            No projects yet.{" "}
            <Link
              href="/projects/create"
              className="font-medium text-gray-900 underline"
            >
              Create your first tracking project
            </Link>{" "}
            to get started.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {tenants.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/projects/${t.id}`}
                  className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {t.teenFavoriteColor && (
                      <span
                        className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: t.teenFavoriteColor }}
                      />
                    )}
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-sm text-gray-500">
                        {t.role.toLowerCase().replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.id === defaultTenantId && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Default
                      </span>
                    )}
                    <span className="text-gray-400 text-sm">&rarr;</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
