"use client";

import { getEntriesByMonth } from "@/lib/actions/entry-actions";
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

export function EntryDetail({
  entry,
  currentUserId,
  behaviorLabelMap,
  strategyLabelMap,
  medLabelMap,
}: {
  entry: Entry & { displayMood?: string; hasBehaviorDetail?: boolean };
  currentUserId: string;
  behaviorLabelMap?: Record<string, string>;
  strategyLabelMap?: Record<string, string>;
  medLabelMap?: Record<string, string>;
}) {
  const displayMood = entry.displayMood ?? entry.mood;
  const behaviorKeys = entry.behaviorKeys;
  const hasBehaviorDetail = entry.hasBehaviorDetail ?? behaviorKeys.length > 0;
  const behaviorLabels = behaviorKeys.map((key) => {
    return behaviorLabelMap?.[key] ?? key;
  });

  const impairments = entry.impairments;
  const activeImpairments = Object.entries(impairments).filter(
    ([, severity]) => severity !== "NONE"
  );

  return (
    <div className="rounded-md border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${moodColors[displayMood] ?? moodColors.NEUTRAL}`}>
            {moodLabels[displayMood] ?? displayMood.charAt(0) + displayMood.slice(1).toLowerCase()}
          </span>
          {hasBehaviorDetail && displayMood !== entry.mood && (
            <span className="text-xs text-gray-400 italic">
              reported {(moodLabels[entry.mood] ?? entry.mood).toLowerCase()}
            </span>
          )}
          {!hasBehaviorDetail && (
            <span className="text-xs text-amber-500">quick log only</span>
          )}
          <span className="text-xs text-gray-500">
            {entry.dayQuality.charAt(0) + entry.dayQuality.slice(1).toLowerCase()} day
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/log/${entry.id}`}
            className="text-xs text-gray-500 hover:text-gray-900 underline"
          >
            View
          </Link>
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

      {activeImpairments.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase">Impairments</p>
          <div className="mt-1 space-y-0.5">
            {activeImpairments.map(([domain, severity]) => (
              <p key={domain} className="text-xs">
                <span className="font-medium">{domainLabels[domain]}</span>
                {" — "}
                <span className={severity === "SEVERE" ? "text-red-600 font-medium" : ""}>
                  {severityLabels[severity]}
                </span>
              </p>
            ))}
          </div>
        </div>
      )}

      {strategyLabelMap && (() => {
        const sIds = (entry.strategyIds as string[] | undefined) ?? [];
        return sIds.length > 0 ? (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">Strategies</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {sIds.map((id) => (
                <span key={id} className="rounded bg-green-50 text-green-800 px-2 py-0.5 text-xs">
                  {strategyLabelMap[id] ?? id}
                </span>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {medLabelMap && (() => {
        const mIds = (entry.missedMedIds as string[] | undefined) ?? [];
        return mIds.length > 0 ? (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">Missed Medications</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {mIds.map((id) => (
                <span key={id} className="rounded bg-amber-50 text-amber-800 px-2 py-0.5 text-xs">
                  {medLabelMap[id] ?? id}
                </span>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {entry.menstrualSeverity && (
        <p className="mt-3 text-xs text-gray-500">
          Period: {entry.menstrualSeverity.toLowerCase()}
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
