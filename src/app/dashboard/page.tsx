import { requireUser } from "@/lib/auth-utils";
import { getUserTenants } from "@/lib/actions/tenant-actions";
import { getRecentEntries } from "@/lib/actions/entry-actions";
import { Nav } from "@/app/_components/nav";
import { AnalysisPanel } from "./analysis-panel";
import Link from "next/link";
import { redirect } from "next/navigation";

const moodColors: Record<string, string> = {
  MANIC: "bg-orange-100 text-orange-800",
  DEPRESSIVE: "bg-blue-100 text-blue-800",
  NEUTRAL: "bg-gray-100 text-gray-800",
  MIXED: "bg-purple-100 text-purple-800",
};

const dayQualityIcons: Record<string, string> = {
  GOOD: "Good",
  NEUTRAL: "Neutral",
  BAD: "Bad",
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const user = await requireUser();
  const tenants = await getUserTenants();
  const params = await searchParams;

  if (tenants.length === 0) {
    redirect("/settings/create-project");
  }

  const activeTenantId = params.tenant ?? tenants[0].id;
  const activeTenant = tenants.find((t) => t.id === activeTenantId) ?? tenants[0];
  const entries = await getRecentEntries(activeTenant.id);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{activeTenant.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, {user.name}.
            </p>
          </div>
          <Link
            href={`/log?tenant=${activeTenant.id}`}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            New log entry
          </Link>
        </div>

        {tenants.length > 1 && (
          <div className="mt-4 flex gap-2">
            {tenants.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard?tenant=${t.id}`}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  t.id === activeTenant.id
                    ? "bg-gray-900 text-white"
                    : "border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {t.name}
              </Link>
            ))}
          </div>
        )}

        <AnalysisPanel tenantId={activeTenant.id} />

        {entries.length === 0 ? (
          <p className="mt-8 text-gray-500">
            No entries yet. Start by logging today.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Recent entries
            </h2>
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-md border border-gray-200 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {formatDate(entry.date)}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${moodColors[entry.mood]}`}
                    >
                      {entry.mood.charAt(0) + entry.mood.slice(1).toLowerCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {dayQualityIcons[entry.dayQuality]} day
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.user.id === user.id && (
                      <Link
                        href={`/log?tenant=${activeTenant.id}&entry=${entry.id}`}
                        className="text-xs text-gray-500 hover:text-gray-900 underline"
                      >
                        Edit
                      </Link>
                    )}
                    <span className="text-xs text-gray-400">
                      by {entry.user.name}
                    </span>
                  </div>
                </div>
                {entry.behaviorChecks.length > 0 && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    {entry.behaviorChecks.length} behavior{entry.behaviorChecks.length !== 1 ? "s" : ""} logged
                  </p>
                )}
                {entry.impairments.filter((i) => i.severity !== "NONE").length > 0 && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {entry.impairments.filter((i) => i.severity !== "NONE").length} impairment{entry.impairments.filter((i) => i.severity !== "NONE").length !== 1 ? "s" : ""}
                  </p>
                )}
                {entry.notes && (
                  <p className="mt-1.5 text-sm text-gray-600 line-clamp-2">
                    {entry.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
