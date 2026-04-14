import { requireUser } from "@/lib/auth-utils";
import { getUserTenants } from "@/lib/actions/tenant-actions";
import { Nav } from "@/app/_components/nav";
import { CreateProjectForm } from "./create-project-form";

export default async function CreateProjectPage() {
  await requireUser();
  const existingProjects = await getUserTenants();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-md p-4 md:p-6">
        <h1 className="text-2xl font-bold">Create a Tracking Project</h1>
        <p className="mt-2 text-sm text-gray-600">
          A project tracks one teen. You can invite other caregivers later.
        </p>
        <CreateProjectForm
          existingProjects={existingProjects.map((p) => ({ id: p.id, name: p.name }))}
        />
      </main>
    </>
  );
}
