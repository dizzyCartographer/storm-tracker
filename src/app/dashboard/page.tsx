import { requireUser } from "@/lib/auth-utils";
import { Nav } from "@/app/_components/nav";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {user.name}.</p>
      </main>
    </>
  );
}
