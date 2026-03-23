import { requireUser } from "@/lib/auth-utils";
import { Nav } from "@/app/_components/nav";

export default async function ReportsPage() {
  await requireUser();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="mt-2 text-gray-600">
          Symptom wave graph, PDF export, and episode analysis.
        </p>
      </main>
    </>
  );
}
