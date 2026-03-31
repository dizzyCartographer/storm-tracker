import { requireUser } from "@/lib/auth-utils";
import { getEntryDetail } from "@/lib/actions/entry-actions";
import { getTenantBehaviorItems } from "@/lib/analysis/framework-loader";
import { getCustomItems } from "@/lib/actions/custom-item-actions";
import { getStrategies } from "@/lib/actions/strategy-actions";
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
  const categoryForItem = Object.fromEntries(behaviorItems.map((i) => [i.key, i.category]));

  const behaviorKeys = entry.behaviorKeys;
  const customItemIds = entry.customItemIds;
  const impairments = entry.impairments;

  const activeImpairments = Object.entries(impairments).filter(([, severity]) => severity !== "NONE");

  // Load custom item labels and strategy names
  const customItems = customItemIds.length > 0 ? await getCustomItems(entry.tenantId) : [];
  const strategyIds = (entry.strategyIds as string[]) ?? [];
  const allStrategies = strategyIds.length > 0 ? await getStrategies(entry.tenantId) : [];
  const strategyLabelMap = Object.fromEntries(allStrategies.map((s) => [s.id, s.name]));
  const customLabelMap = Object.fromEntries(customItems.map((i) => [i.id, i.label]));

  const manicKeys = behaviorKeys.filter((key) => categoryForItem[key] === "manic");
  const depressiveKeys = behaviorKeys.filter((key) => categoryForItem[key] === "depressive");
  const otherKeys = behaviorKeys.filter((key) => !categoryForItem[key] || (categoryForItem[key] !== "manic" && categoryForItem[key] !== "depressive"));

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl p-4 md:p-6">
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

        {/* Behaviors — grouped by pole */}
        {behaviorKeys.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Criteria</h2>
            {manicKeys.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-red-600 uppercase tracking-wider mb-1">Manic</p>
                <div className="flex flex-wrap gap-1.5">
                  {manicKeys.map((key) => (
                    <span key={key} className="rounded-md bg-red-50 text-red-800 px-2.5 py-1 text-sm">
                      {behaviorLabelMap[key] ?? key}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {depressiveKeys.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Depressive</p>
                <div className="flex flex-wrap gap-1.5">
                  {depressiveKeys.map((key) => (
                    <span key={key} className="rounded-md bg-blue-50 text-blue-800 px-2.5 py-1 text-sm">
                      {behaviorLabelMap[key] ?? key}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {otherKeys.length > 0 && (
              <div className="mt-2">
                <div className="flex flex-wrap gap-1.5">
                  {otherKeys.map((key) => (
                    <span key={key} className="rounded-md bg-gray-100 px-2.5 py-1 text-sm">
                      {behaviorLabelMap[key] ?? key}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Custom items */}
        {customItemIds.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Custom</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {customItemIds.map((itemId) => (
                <span key={itemId} className="rounded-md bg-gray-100 px-2.5 py-1 text-sm">
                  {customLabelMap[itemId] ?? itemId}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Strategies */}
        {strategyIds.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Strategies Used</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {strategyIds.map((id) => (
                <span key={id} className="rounded-md bg-green-50 text-green-800 px-2.5 py-1 text-sm">
                  {strategyLabelMap[id] ?? id}
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
              {activeImpairments.map(([domain, severity]) => (
                <p key={domain} className="text-sm">
                  <span className="font-medium">{domainLabels[domain] ?? domain}</span>
                  {" — "}
                  <span className={severity === "SEVERE" ? "text-red-600 font-medium" : ""}>
                    {severityLabels[severity]}
                  </span>
                </p>
              ))}
            </div>
          </section>
        )}

        {/* Menstrual */}
        {entry.menstrualSeverity && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Menstrual</h2>
            <p className="mt-2 text-sm">Period: {entry.menstrualSeverity.toLowerCase()}</p>
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
