import { requireUser } from "@/lib/auth-utils";
import { createTenant } from "@/lib/actions/tenant-actions";
import { Nav } from "@/app/_components/nav";

export default async function CreateProjectPage() {
  await requireUser();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-2xl font-bold">Create a Tracking Project</h1>
        <p className="mt-2 text-sm text-gray-600">
          A project tracks one teen. You can invite other caregivers later.
        </p>
        <form action={createTenant} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Teen&apos;s name or nickname
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Alex"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Create project
          </button>
        </form>
      </main>
    </>
  );
}
