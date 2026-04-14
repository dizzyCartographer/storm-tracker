import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import { useProject } from "../lib/project-context";
import { getEntriesByRange, type EntryRow } from "../lib/api";

const moodColors: Record<string, { bg: string; text: string; dot: string }> = {
  MANIC: { bg: "bg-[#FDF4E8]", text: "text-[#9A5B13]", dot: "bg-[#D4913A]" },
  DEPRESSIVE: { bg: "bg-[#E0F2F1]", text: "text-[#1A5E6C]", dot: "bg-[#3B9DAD]" },
  MIXED: { bg: "bg-[#EDE5F5]", text: "text-[#5E3D8A]", dot: "bg-[#8A6BBF]" },
  NEUTRAL: { bg: "bg-[#EDF5F3]", text: "text-[#4A6B64]", dot: "bg-[#8FABA4]" },
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const domainLabels: Record<string, string> = {
  SCHOOL_WORK: "School/Work",
  FAMILY_LIFE: "Family Life",
  FRIENDSHIPS: "Friendships",
  SELF_CARE: "Self-care",
  SAFETY_CONCERN: "Safety Concern",
};

const dayQualityLabels: Record<string, string> = {
  GOOD: "Good",
  NEUTRAL: "Neutral",
  BAD: "Bad",
  MIXED: "Mixed",
};

function getMoodStyle(mood: string | null) {
  if (!mood) return moodColors.NEUTRAL;
  const key = mood.replace("_SUBTHRESHOLD", "");
  return moodColors[key] || moodColors.NEUTRAL;
}

function getClassification(entry: EntryRow): string | null {
  if (entry.computedMood && typeof entry.computedMood === "object") {
    return (entry.computedMood as Record<string, string>).classification;
  }
  return null;
}

export default function History() {
  const { selectedTenant, loading: projectLoading } = useProject();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!selectedTenant) return;
    setLoading(true);
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
    try {
      const data = await getEntriesByRange(selectedTenant.id, startDate, endDate);
      setEntries(data);
    } catch (err) {
      console.error("History load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant?.id, year, month]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
    setSelectedDate(null);
  }

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = new Date(year, month - 1).toLocaleString("en-US", { month: "long" });

  // Map entries by date
  const entryMap = new Map<string, EntryRow[]>();
  for (const entry of entries) {
    const key = entry.date.slice(0, 10);
    const existing = entryMap.get(key) ?? [];
    existing.push(entry);
    entryMap.set(key, existing);
  }

  const selectedEntries = selectedDate ? entryMap.get(selectedDate) ?? [] : [];

  if (projectLoading) {
    return <p className="text-[#475569] py-8 text-center">Loading...</p>;
  }

  if (!selectedTenant) {
    return (
      <div className="text-center py-12">
        <p className="text-[#475569]">No projects yet. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="rounded-lg px-3 py-1.5 text-sm hover:bg-[#F0FDFA] text-[#475569]">
          &larr; Prev
        </button>
        <h1 className="text-lg font-bold text-[#0F172A]">
          {monthName} {year}
        </h1>
        <button onClick={nextMonth} className="rounded-lg px-3 py-1.5 text-sm hover:bg-[#F0FDFA] text-[#475569]">
          Next &rarr;
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-7 gap-1 text-center">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-xs font-medium text-[#94A3B8] py-1">
              {d}
            </div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEntries = entryMap.get(dateStr);
            const isSelected = selectedDate === dateStr;
            const isToday =
              day === now.getDate() &&
              month === now.getMonth() + 1 &&
              year === now.getFullYear();

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative rounded-lg p-2 text-sm transition-colors ${
                  isSelected
                    ? "ring-2 ring-[#0D9488] bg-[#F0FDFA]"
                    : "hover:bg-[#F0FDFA]"
                } ${isToday ? "font-bold" : ""}`}
              >
                <span className={dayEntries ? "font-semibold text-[#0F172A]" : "text-[#94A3B8]"}>
                  {day}
                </span>
                {dayEntries && (
                  <div className="mt-0.5 flex justify-center gap-0.5">
                    {dayEntries.map((e) => {
                      const cls = getClassification(e);
                      const style = getMoodStyle(cls);
                      return (
                        <span key={e.id} className={`inline-block h-2 w-2 rounded-full ${style.dot}`} />
                      );
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading && <p className="mt-4 text-sm text-[#94A3B8] text-center">Loading...</p>}

      {/* Selected date entries */}
      {selectedDate && selectedEntries.length > 0 && (
        <div className="mt-6 space-y-3">
          {selectedEntries.length > 1 && new Set(selectedEntries.map((e) => e.userId)).size > 1 && (
            <p className="text-xs font-medium text-[#5E3D8A] bg-[#EDE5F5] rounded-lg px-3 py-2">
              Multiple observers logged this day — compare entries below.
            </p>
          )}
          {selectedEntries.map((entry) => {
            const classification = getClassification(entry);
            const style = getMoodStyle(classification);
            const isQuickLog = !entry.behaviorKeys || entry.behaviorKeys.length === 0;
            const impairments = (entry.impairments ?? {}) as Record<string, string>;
            const activeImpairments = Object.entries(impairments).filter(([, v]) => v !== "NONE");

            return (
              <div key={entry.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                      {classification || entry.mood}
                    </span>
                    <span className="text-xs text-[#475569]">
                      {dayQualityLabels[entry.dayQuality] ?? entry.dayQuality}
                    </span>
                    {isQuickLog && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706]">
                        quick log
                      </span>
                    )}
                  </div>
                  <Link to={`/log/${entry.id}`} className="text-xs text-[#0D9488] hover:underline">
                    View
                  </Link>
                </div>

                {entry.behaviorKeys && entry.behaviorKeys.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {entry.behaviorKeys.map((key: string) => (
                      <span key={key} className="text-xs px-2 py-0.5 rounded-lg bg-[#F0FDFA] text-[#0D9488] border border-[#CCFBF1]">
                        {key.replace(/-/g, " ")}
                      </span>
                    ))}
                  </div>
                )}

                {activeImpairments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {activeImpairments.map(([domain, severity]) => (
                      <span
                        key={domain}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          severity === "SEVERE"
                            ? "bg-[#FEF2F2] text-[#DC2626]"
                            : "bg-[#FFFBEB] text-[#D97706]"
                        }`}
                      >
                        {domainLabels[domain] ?? domain}
                      </span>
                    ))}
                  </div>
                )}

                {entry.notes && (
                  <p className="text-xs text-[#94A3B8] truncate">{entry.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedDate && selectedEntries.length === 0 && !loading && (
        <p className="mt-6 text-sm text-[#94A3B8] text-center">No entries for this date.</p>
      )}
    </div>
  );
}
