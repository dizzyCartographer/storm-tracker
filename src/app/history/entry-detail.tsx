"use client";

import { getEntriesByMonth } from "@/lib/actions/entry-actions";
import { BEHAVIOR_ITEMS } from "@/lib/behavior-items";
import Link from "next/link";

type Entry = Awaited<ReturnType<typeof getEntriesByMonth>>[number];

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

const severityLabels: Record<string, string> = {
  NONE: "None",
  PRESENT: "Present",
  SEVERE: "Severe",
};

const domainLabels: Record<string, string> = {
  SCHOOL_WORK: "School/Work",
  FAMILY_LIFE: "Family Life",
  FRIENDSHIPS: "Friendships",
  SELF_CARE: "Self-care",
  SAFETY_CONCERN: "Safety Concern",
};

export function EntryDetail({ entry, currentUserId }: { entry: Entry; currentUserId: string }) {
  const behaviorLabels = entry.behaviorChecks.map((bc) => {
    const item = BEHAVIOR_ITEMS.find((i) => i.key === bc.itemKey);
    return item ? item.label : bc.itemKey;
  });

  const activeImpairments = entry.impairments.filter(
    (i) => i.severity !== "NONE"
  );

  return (
    <div className="rounded-md border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${moodColors[entry.mood]}`}>
            {moodLabels[entry.mood]}
          </span>
          <span className="text-xs text-gray-500">
            {entry.dayQuality.charAt(0) + entry.dayQuality.slice(1).toLowerCase()} day
          </span>
        </div>
        <div className="flex items-center gap-2">
          {entry.user.id === currentUserId && (
            <Link
              href={`/log?tenant=${entry.tenantId}&entry=${entry.id}`}
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

      {behaviorLabels.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase">Behaviors</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {behaviorLabels.map((label) => (
              <span
                key={label}
                className="rounded bg-gray-100 px-2 py-0.5 text-xs"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {entry.customChecks.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase">Custom</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {entry.customChecks.map((cc) => (
              <span
                key={cc.id}
                className="rounded bg-gray-100 px-2 py-0.5 text-xs"
              >
                {cc.item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {activeImpairments.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase">Impairments</p>
          <div className="mt-1 space-y-0.5">
            {activeImpairments.map((imp) => (
              <p key={imp.id} className="text-xs">
                <span className="font-medium">{domainLabels[imp.domain]}</span>
                {" — "}
                <span className={imp.severity === "SEVERE" ? "text-red-600 font-medium" : ""}>
                  {severityLabels[imp.severity]}
                </span>
              </p>
            ))}
          </div>
        </div>
      )}

      {entry.menstrualLog && (
        <p className="mt-3 text-xs text-gray-500">
          Period: {entry.menstrualLog.severity.toLowerCase()}
        </p>
      )}

      {entry.notes && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase">Notes</p>
          <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
            {entry.notes}
          </p>
        </div>
      )}
    </div>
  );
}
