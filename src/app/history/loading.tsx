import { Nav } from "@/app/_components/nav";

export default function HistoryLoading() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-36 rounded bg-gray-200" />
          <div className="mt-6 grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square rounded bg-gray-100" />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
