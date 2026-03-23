import { requireUser } from "@/lib/auth-utils";
import { Nav } from "@/app/_components/nav";

export default async function LogPage() {
  await requireUser();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold">Daily Log</h1>
        <p className="mt-2 text-gray-600">
          Quick log, behavior checklist, impairment tracking, and notes.
        </p>
      </main>
    </>
  );
}
