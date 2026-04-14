import { Nav } from "@/app/_components/nav";

export default function ProjectsLoading() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-36 rounded bg-gray-200" />
          <div className="mt-4 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-4">
                <div className="h-5 w-40 rounded bg-gray-200" />
                <div className="mt-2 h-3 w-64 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
