import { Nav } from "@/app/_components/nav";

export default function ReportsLoading() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-36 rounded bg-gray-200" />
          <div className="h-4 w-64 rounded bg-gray-100" />
          <div className="mt-6 h-64 rounded-lg bg-gray-100" />
        </div>
      </main>
    </>
  );
}
