import { requireUser } from "@/lib/auth-utils";
import { getEntryDetail } from "@/lib/actions/entry-actions";
import { getTenantBehaviorItems } from "@/lib/analysis/framework-loader";
import { Nav } from "@/app/_components/nav";
import Link from "next/link";
import { notFound } from "next/navigation";

const moodLabels: Record<string, string> = {
  MANIC: "Manic",
  DEPRESSIVE: "Depressive",
  NEUTRAL: "Neutral",
  MIXED: "Mixed",
};

const moodColors: Record<string, string> = {
  MANIC: "bg-orange-100 text-orange-800",
  DEPRESSIVE: "bg-blue-100 text-blue-800",
  NEUTRAL: "bg-gray-100 text-gray-800",
  MIXED: "bg-purple-100 text-purple-800",
};

const dayQualityLabels: Record<string, string> = {
  GOOD: "Good",
  NEUTRAL: "Neutral",
  BAD: "Bad",
  MIXED: "Mixed",
};

const domainLabels: Record<string, string> = {
  SCHOOL_WORK: "School/Work",
  FAMILY_LIFE: "Family Life",
  FRIENDSHIPS: "Friendships",
  SELF_CARE: "Self-care",
  SAFETY_CONCERN: "Safety Concern",
};

const severityLabels: Record<string, string> = {
  NONE: "None",
  PRESENT: "Present",
  SEVERE: "Severe",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function LogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const entry = await getEntryDetail(id);

  if (!entry) notFound();

  const { items: behaviorItems } = await getTenantBehaviorItems(entry.tenantId);
  const behaviorLabelMap = Object.fromEntries(behaviorItems.map((i) => [i.key, i.label]));

  const activeImpairments = entry.impairments.filter((i) => i.severity !== "NONE");

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl p-6">
        <div className="mb-6">
          <Link href={`/history?tenant=${entry.tenantId}`} className="text-sm text-gray-500 hover:text-gray-900">
            &larr; Back to history
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{formatDate(entry.date)}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {entry.tenant.name} &middot; logged by {entry.user.name}
            </p>
          </div>
          {entry.isOwn && (
            <Link
              href={`/log?tenant=${entry.tenantId}&entry=${entry.id}`}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Edit
            </Link>
          )}
        </div>

        {/* Mood classification */}
        <div className="mt-6 flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${moodColors[entry.displayMood] ?? moodColors.NEUTRAL}`}>
            {moodLabels[entry.displayMood] ?? entry.displayMood}
          </span>
          {entry.hasBehaviorDetail && entry.displayMood !== entry.mood && (
            <span className="text-sm text-gray-400 italic">
              reported {(moodLabels[entry.mood] ?? entry.mood).toLowerCase()}
            </span>
          )}
          {!entry.hasBehaviorDetail && (
            <span className="text-sm text-amber-500">quick log only</span>
          )}
          <span className="text-sm text-gray-500">
            {dayQualityLabels[entry.dayQuality] ?? entry.dayQuality} day
          </span>
        </div>

        {/* Behaviors */}
        {entry.behaviorChecks.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Behaviors</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {entry.behaviorChecks.map((bc) => (
                <span key={bc.id} className="rounded-md bg-gray-100 px-2.5 py-1 text-sm">
                  {behaviorLabelMap[bc.itemKey] ?? bc.itemKey}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Custom items */}
        {entry.customChecks.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Custom</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {entry.customChecks.map((cc) => (
                <span key={cc.id} className="rounded-md bg-gray-100 px-2.5 py-1 text-sm">
                  {cc.item.label}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Impairments */}
        {activeImpairments.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Impairments</h2>
            <div className="mt-2 space-y-1">
              {activeImpairments.map((imp) => (
                <p key={imp.id} className="text-sm">
                  <span className="font-medium">{domainLabels[imp.domain] ?? imp.domain}</span>
                  {" — "}
                  <span className={imp.severity === "SEVERE" ? "text-red-600 font-medium" : ""}>
                    {severityLabels[imp.severity]}
                  </span>
                </p>
              ))}
            </div>
          </section>
        )}

        {/* Menstrual */}
        {entry.menstrualLog && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Menstrual</h2>
            <p className="mt-2 text-sm">Period: {entry.menstrualLog.severity.toLowerCase()}</p>
          </section>
        )}

        {/* Attachments */}
        {entry.attachments.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Attachments ({entry.attachments.length})
            </h2>
            <ul className="mt-2 space-y-2">
              {entry.attachments.map((a) => (
                <li key={a.id}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                      {a.fileType.startsWith("image/") ? "IMG" : a.fileType === "application/pdf" ? "PDF" : "FILE"}
                    </span>
                    <span className="truncate">{a.fileName}</span>
                    <span className="flex-shrink-0 text-xs text-gray-400">
                      {a.fileSize < 1024 * 1024
                        ? `${(a.fileSize / 1024).toFixed(1)} KB`
                        : `${(a.fileSize / (1024 * 1024)).toFixed(1)} MB`}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Notes */}
        {entry.notes && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Notes</h2>
            <div className="mt-2 rounded-md border border-gray-200 p-4 text-sm text-gray-700 whitespace-pre-wrap">
              {entry.notes}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
