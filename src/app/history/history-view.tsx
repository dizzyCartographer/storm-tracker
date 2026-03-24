"use client";

import { useState, useEffect, useCallback } from "react";
import { getEntriesByMonth } from "@/lib/actions/entry-actions";
import { EntryDetail } from "./entry-detail";

type Entry = Awaited<ReturnType<typeof getEntriesByMonth>>[number];

const moodColors: Record<string, string> = {
  MANIC: "bg-orange-400",
  DEPRESSIVE: "bg-blue-400",
  NEUTRAL: "bg-gray-300",
  MIXED: "bg-purple-400",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HistoryView({ tenantId, currentUserId, behaviorLabelMap }: { tenantId: string; currentUserId: string; behaviorLabelMap?: Record<string, string> }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const data = await getEntriesByMonth(tenantId, year, month);
    setEntries(data);
    setLoading(false);
  }, [tenantId, year, month]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDate(null);
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDate(null);
  }

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = new Date(year, month - 1).toLocaleString("en-US", {
    month: "long",
  });

  // Map entries by date string
  const entryMap = new Map<string, Entry[]>();
  for (const entry of entries) {
    const key = new Date(entry.date).toISOString().slice(0, 10);
    const existing = entryMap.get(key) ?? [];
    existing.push(entry);
    entryMap.set(key, existing);
  }

  const selectedEntries = selectedDate ? entryMap.get(selectedDate) ?? [] : [];

  return (
    <div className="mt-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded px-3 py-1 text-sm hover:bg-gray-100"
        >
          &larr;
        </button>
        <span className="text-sm font-semibold">
          {monthName} {year}
        </span>
        <button
          onClick={nextMonth}
          className="rounded px-3 py-1 text-sm hover:bg-gray-100"
        >
          &rarr;
        </button>
      </div>

      {/* Calendar grid */}
      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEntries = entryMap.get(dateStr);
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`relative rounded-md p-2 text-sm ${
                isSelected
                  ? "ring-2 ring-gray-900"
                  : "hover:bg-gray-50"
              }`}
            >
              <span className={dayEntries ? "font-semibold" : "text-gray-400"}>
                {day}
              </span>
              {dayEntries && (
                <div className="mt-0.5 flex justify-center gap-0.5">
                  {dayEntries.map((e) => (
                    <span
                      key={e.id}
                      className={`inline-block h-2 w-2 rounded-full ${moodColors[e.displayMood] ?? moodColors.NEUTRAL}`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <p className="mt-4 text-sm text-gray-400">Loading...</p>
      )}

      {/* Entry detail */}
      {selectedDate && selectedEntries.length > 0 && (
        <div className="mt-6 space-y-4">
          {/* Flag when multiple users logged the same day */}
          {new Set(selectedEntries.map((e) => e.user.id)).size > 1 && (
            <p className="text-xs font-medium text-purple-700 bg-purple-50 rounded-md px-3 py-2">
              Multiple observers logged this day — compare entries below.
            </p>
          )}
          {selectedEntries.map((entry) => (
            <EntryDetail key={entry.id} entry={entry} currentUserId={currentUserId} behaviorLabelMap={behaviorLabelMap} />
          ))}
        </div>
      )}

      {selectedDate && selectedEntries.length === 0 && !loading && (
        <p className="mt-6 text-sm text-gray-500">No entries for this date.</p>
      )}
    </div>
  );
}
