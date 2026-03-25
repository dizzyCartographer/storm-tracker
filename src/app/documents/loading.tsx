import { Nav } from "@/app/_components/nav";

export default function DocumentsLoading() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-40 rounded bg-gray-200" />
          <div className="h-4 w-64 rounded bg-gray-100" />
          <div className="mt-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 w-full rounded-md border border-gray-200 bg-gray-50" />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
