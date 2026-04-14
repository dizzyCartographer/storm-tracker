import { Nav } from "@/app/_components/nav";

export default function DashboardLoading() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-4 w-64 rounded bg-gray-100" />
          <div className="mt-6 grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-4">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="mt-2 h-3 w-full rounded bg-gray-100" />
                <div className="mt-1 h-3 w-3/4 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
