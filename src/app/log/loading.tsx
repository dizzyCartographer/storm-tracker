import { Nav } from "@/app/_components/nav";

export default function LogLoading() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-md p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-36 rounded bg-gray-200" />
          <div className="h-10 w-full rounded bg-gray-100" />
          <div className="h-10 w-full rounded bg-gray-100" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-full rounded bg-gray-100" />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
