import { Link } from "react-router";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-[#EDF5F4]">
      <h1 className="text-6xl font-bold text-[#D1E8E4]">404</h1>
      <p className="mt-4 text-lg text-[#475569]">Page not found</p>
      <Link
        to="/dashboard"
        className="mt-6 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F766E] transition-colors"
      >
        Back to Dashboard
      </Link>
    </main>
  );
}
