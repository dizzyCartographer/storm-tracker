import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { getEntryById, type EntryRow } from "../lib/api";

const moodColors: Record<string, { bg: string; text: string }> = {
  MANIC: { bg: "bg-[#FDF4E8]", text: "text-[#9A5B13]" },
  DEPRESSIVE: { bg: "bg-[#E0F2F1]", text: "text-[#1A5E6C]" },
  MIXED: { bg: "bg-[#EDE5F5]", text: "text-[#5E3D8A]" },
  NEUTRAL: { bg: "bg-[#EDF5F3]", text: "text-[#4A6B64]" },
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

function getMoodStyle(mood: string | null) {
  if (!mood) return moodColors.NEUTRAL;
  const key = mood.replace("_SUBTHRESHOLD", "");
  return moodColors[key] || moodColors.NEUTRAL;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function LogDetail() {
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<EntryRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getEntryById(id)
      .then((e) => setEntry(e))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="text-[#475569] py-8 text-center">Loading...</p>;
  }

  if (!entry) {
    return (
      <div className="text-center py-12">
        <p className="text-[#475569]">Entry not found.</p>
        <Link to="/dashboard" className="text-[#0D9488] text-sm mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const classification =
    entry.computedMood && typeof entry.computedMood === "object"
      ? (entry.computedMood as Record<string, string>).classification
      : null;
  const style = getMoodStyle(classification);
  const isQuickLog = !entry.behaviorKeys || entry.behaviorKeys.length === 0;
  const impairments = (entry.impairments ?? {}) as Record<string, string>;
  const activeImpairments = Object.entries(impairments).filter(([, v]) => v !== "NONE");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#0F172A]">{formatDate(entry.date)}</h1>
        <Link
          to={`/log?date=${entry.date}`}
          className="text-sm text-[#0D9488] hover:underline"
        >
          Edit
        </Link>
      </div>

      {/* Classification */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${style.bg} ${style.text}`}>
            {classification || entry.mood}
          </span>
          <span className="text-sm text-[#475569]">
            Day quality: {dayQualityLabels[entry.dayQuality] ?? entry.dayQuality}
          </span>
          {isQuickLog && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706]">
              quick log
            </span>
          )}
        </div>

        {classification && classification !== entry.mood && (
          <p className="text-xs text-[#94A3B8] mt-2">
            Reported mood: {entry.mood} (overridden by behavioral analysis)
          </p>
        )}
      </div>

      {/* Behaviors */}
      {entry.behaviorKeys && entry.behaviorKeys.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-2">Behaviors Logged</h2>
          <div className="flex flex-wrap gap-2">
            {entry.behaviorKeys.map((key: string) => (
              <span
                key={key}
                className="text-xs px-2 py-1 rounded-lg bg-[#F0FDFA] text-[#0D9488] border border-[#CCFBF1]"
              >
                {key.replace(/-/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Impairments */}
      {activeImpairments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-2">Impairments</h2>
          <div className="space-y-1">
            {activeImpairments.map(([domain, severity]) => (
              <div key={domain} className="flex items-center justify-between text-sm">
                <span className="text-[#475569]">{domainLabels[domain] ?? domain}</span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    severity === "SEVERE"
                      ? "bg-[#FEF2F2] text-[#DC2626]"
                      : "bg-[#FFFBEB] text-[#D97706]"
                  }`}
                >
                  {severity === "SEVERE" ? "Severe" : "Present"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missed meds */}
      {entry.missedMedIds && entry.missedMedIds.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-2">Missed Medications</h2>
          <div className="flex flex-wrap gap-2">
            {entry.missedMedIds.map((id: string) => (
              <span
                key={id}
                className="text-xs px-2 py-1 rounded-full bg-[#FFFBEB] text-[#D97706]"
              >
                {id}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {entry.notes && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-2">Notes</h2>
          <p className="text-sm text-[#475569] whitespace-pre-wrap">{entry.notes}</p>
        </div>
      )}

      {/* Menstrual */}
      {entry.menstrualSeverity && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-2">Menstrual</h2>
          <span className="text-xs px-2 py-1 rounded-full bg-[#FCE7F3] text-[#EC4899]">
            {entry.menstrualSeverity}
          </span>
        </div>
      )}

      <Link
        to="/dashboard"
        className="text-sm text-[#0D9488] hover:underline mt-4 inline-block"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
