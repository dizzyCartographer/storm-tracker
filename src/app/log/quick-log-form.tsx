"use client";

import { useState } from "react";
import { saveDailyLog } from "@/lib/actions/entry-actions";
import { useRouter } from "next/navigation";
import { BehaviorChecklist } from "./behavior-checklist";

const moods = ["MANIC", "DEPRESSIVE", "NEUTRAL", "MIXED"] as const;
const dayQualities = ["GOOD", "NEUTRAL", "BAD"] as const;

const moodLabels: Record<string, string> = {
  MANIC: "Manic",
  DEPRESSIVE: "Depressive",
  NEUTRAL: "Neutral",
  MIXED: "Mixed",
};

const dayQualityLabels: Record<string, string> = {
  GOOD: "Good",
  NEUTRAL: "Neutral",
  BAD: "Bad",
};

export function QuickLogForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [mood, setMood] = useState<string>("");
  const [dayQuality, setDayQuality] = useState<string>("");
  const [checkedBehaviors, setCheckedBehaviors] = useState<Set<string>>(
    new Set()
  );
  const [showChecklist, setShowChecklist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleBehavior(key: string) {
    setCheckedBehaviors((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mood || !dayQuality) {
      setError("Mood and day quality are required");
      return;
    }
    setError("");
    setLoading(true);

    const result = await saveDailyLog({
      tenantId,
      mood: mood as "MANIC" | "DEPRESSIVE" | "NEUTRAL" | "MIXED",
      dayQuality: dayQuality as "GOOD" | "NEUTRAL" | "BAD",
      behaviorKeys: Array.from(checkedBehaviors),
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push(`/dashboard?tenant=${tenantId}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <fieldset>
        <legend className="text-sm font-medium">Overall mood</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {moods.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(m)}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                mood === m
                  ? "bg-gray-900 text-white"
                  : "border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {moodLabels[m]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">How was the day?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {dayQualities.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setDayQuality(q)}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                dayQuality === q
                  ? "bg-gray-900 text-white"
                  : "border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {dayQualityLabels[q]}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <button
          type="button"
          onClick={() => setShowChecklist(!showChecklist)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700"
        >
          <span>{showChecklist ? "▾" : "▸"}</span>
          Behavior checklist
          {checkedBehaviors.size > 0 && (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs">
              {checkedBehaviors.size}
            </span>
          )}
        </button>
        {showChecklist && (
          <div className="mt-3">
            <BehaviorChecklist
              checked={checkedBehaviors}
              onToggle={toggleBehavior}
            />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !mood || !dayQuality}
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save log"}
      </button>
    </form>
  );
}
