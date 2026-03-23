import { requireUser } from "@/lib/auth-utils";
import { getUserTenants } from "@/lib/actions/tenant-actions";
import { Nav } from "@/app/_components/nav";
import Link from "next/link";

export default async function SettingsPage() {
  await requireUser();
  const tenants = await getUserTenants();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tracking Projects</h2>
            <Link
              href="/settings/create-project"
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              New project
            </Link>
          </div>

          {tenants.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              No projects yet.{" "}
              <Link
                href="/settings/create-project"
                className="font-medium text-gray-900 underline"
              >
                Create your first tracking project
              </Link>{" "}
              to get started.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {tenants.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-sm text-gray-500">Role: {t.role.toLowerCase().replace("_", " ")}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
