"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveDailyLog } from "@/lib/actions/entry-actions";
import type { ParsedEntry } from "@/app/api/parse-journal/route";

interface BehaviorItem {
  key: string;
  category: string;
  categoryName: string;
  label: string;
  description: string;
}

const categoryColors: Record<string, { active: string; inactive: string }> = {
  manic: {
    active: "border-red-600 bg-red-700 text-white",
    inactive: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  },
  depressive: {
    active: "border-blue-600 bg-blue-700 text-white",
    inactive: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
};

const moodLabels: Record<string, string> = {
  MANIC: "Manic",
  DEPRESSIVE: "Depressive",
  NEUTRAL: "Neutral",
  MIXED: "Mixed",
};

const moodColors: Record<string, string> = {
  MANIC: "bg-orange-100 text-orange-800 border-orange-300",
  DEPRESSIVE: "bg-blue-100 text-blue-800 border-blue-300",
  NEUTRAL: "bg-gray-100 text-gray-800 border-gray-300",
  MIXED: "bg-purple-100 text-purple-800 border-purple-300",
};

const dayQualityLabels: Record<string, string> = {
  GOOD: "Good",
  NEUTRAL: "Neutral",
  BAD: "Bad",
  MIXED: "Mixed",
};

const impairmentDomainLabels: Record<string, string> = {
  SCHOOL_WORK: "School / Work",
  FAMILY_LIFE: "Family Life",
  FRIENDSHIPS: "Friendships",
  SELF_CARE: "Self-Care",
  SAFETY_CONCERN: "Safety Concern",
};

const impairmentColors: Record<string, string> = {
  NONE: "bg-gray-100 text-gray-600",
  PRESENT: "bg-yellow-100 text-yellow-800",
  SEVERE: "bg-red-100 text-red-800",
};

const confidenceColors: Record<string, string> = {
  HIGH: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-red-100 text-red-800",
};

export function JournalImportForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ParsedEntry | null>(null);
  const [saved, setSaved] = useState(false);

  // Editable fields after parsing
  const [editDate, setEditDate] = useState("");
  const [editMood, setEditMood] = useState("");
  const [editDayQuality, setEditDayQuality] = useState("");
  const [editBehaviorKeys, setEditBehaviorKeys] = useState<string[]>([]);
  const [editImpairments, setEditImpairments] = useState<Record<string, string>>({});
  const [editNotes, setEditNotes] = useState("");

  async function handleParse() {
    if (!text.trim()) return;
    setError("");
    setParsing(true);
    setResult(null);
    setSaved(false);

    try {
      const res = await fetch("/api/parse-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, tenantId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to parse journal entry");
        return;
      }

      const parsed: ParsedEntry = await res.json();
      setResult(parsed);
      setEditDate(parsed.date ?? new Date().toISOString().slice(0, 10));
      setEditMood(parsed.mood);
      setEditDayQuality(parsed.dayQuality);
      setEditBehaviorKeys([...parsed.behaviorKeys]);
      setEditImpairments({ ...parsed.impairments });
      setEditNotes(parsed.notes);
    } catch {
      setError("Network error — please try again");
    } finally {
      setParsing(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const res = await saveDailyLog({
        tenantId,
        mood: editMood as "MANIC" | "DEPRESSIVE" | "NEUTRAL" | "MIXED",
        dayQuality: editDayQuality as "GOOD" | "NEUTRAL" | "BAD" | "MIXED",
        behaviorKeys: editBehaviorKeys,
        impairments: editImpairments,
        notes: editNotes || undefined,
        date: editDate,
      });

      if ("error" in res) {
        setError(res.error ?? "Unknown error");
        return;
      }

      setSaved(true);
    } catch {
      setError("Failed to save entry");
    } finally {
      setSaving(false);
    }
  }

  function handleNewEntry() {
    setText("");
    setResult(null);
    setSaved(false);
    setError("");
  }

  function toggleBehavior(key: string) {
    setEditBehaviorKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function cycleImpairment(domain: string) {
    const levels = ["NONE", "PRESENT", "SEVERE"];
    const current = editImpairments[domain] ?? "NONE";
    const next = levels[(levels.indexOf(current) + 1) % levels.length];
    setEditImpairments((prev) => ({ ...prev, [domain]: next }));
  }

  // Step 1: Input
  if (!result && !saved) {
    return (
      <div className="mt-6 space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your journal entry or notes here...

Example: 'Tuesday was really rough. He barely slept the night before and was incredibly irritable all day. Snapped at his sister over nothing, then cried in his room for an hour. Refused to go to school. Said he didn't see the point of anything.'"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm leading-relaxed focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          rows={10}
          disabled={parsing}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={handleParse}
          disabled={parsing || !text.trim()}
          className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {parsing ? "Analyzing..." : "Analyze Entry"}
        </button>
      </div>
    );
  }

  // Step 3: Saved confirmation
  if (saved) {
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="font-medium text-green-800">Entry saved successfully!</p>
          <p className="mt-1 text-sm text-green-700">
            The journal entry for {editDate} has been saved to your project.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleNewEntry}
            className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Import Another Entry
          </button>
          <button
            onClick={() => router.push("/history")}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View History
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Review & Edit
  return (
    <div className="mt-6 space-y-6">
      {/* Confidence & Reasoning */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">AI Confidence:</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${confidenceColors[result!.confidence]}`}
          >
            {result!.confidence}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600">{result!.reasoning}</p>
      </div>

      {/* Follow-up Questions */}
      {result!.followUpQuestions.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">Follow-up questions:</p>
          <ul className="mt-2 space-y-1">
            {result!.followUpQuestions.map((q, i) => (
              <li key={i} className="text-sm text-amber-700">
                {i + 1}. {q}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-600">
            You can edit the fields below to incorporate answers, or add details to the notes.
          </p>
        </div>
      )}

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          value={editDate}
          onChange={(e) => setEditDate(e.target.value)}
          className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
      </div>

      {/* Mood & Day Quality */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Mood</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {(["MANIC", "DEPRESSIVE", "NEUTRAL", "MIXED"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setEditMood(m)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  editMood === m
                    ? moodColors[m]
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {moodLabels[m]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Day Quality</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {(["GOOD", "NEUTRAL", "BAD", "MIXED"] as const).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setEditDayQuality(q)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  editDayQuality === q
                    ? "border-gray-800 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {dayQualityLabels[q]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Behaviors */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Detected Behaviors
          <span className="ml-2 text-xs font-normal text-gray-400">
            Click to toggle
          </span>
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {editBehaviorKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleBehavior(key)}
              className="rounded-full border border-gray-800 bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
            >
              {key.replace(/-/g, " ")} ×
            </button>
          ))}
          {editBehaviorKeys.length === 0 && (
            <span className="text-xs text-gray-400">None detected</span>
          )}
        </div>
      </div>

      {/* Impairments */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Impairment Levels
          <span className="ml-2 text-xs font-normal text-gray-400">
            Click to cycle: None → Present → Severe
          </span>
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(impairmentDomainLabels).map(([domain, label]) => (
            <button
              key={domain}
              type="button"
              onClick={() => cycleImpairment(domain)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                impairmentColors[editImpairments[domain] ?? "NONE"]
              }`}
            >
              {label}: {editImpairments[domain] ?? "NONE"}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm leading-relaxed focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          rows={5}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Entry"}
        </button>
        <button
          onClick={() => {
            setResult(null);
            setSaved(false);
          }}
          disabled={saving}
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Back to Edit Text
        </button>
      </div>

      {/* Original text reference */}
      <details className="rounded-lg border border-gray-200">
        <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-500">
          Original journal text
        </summary>
        <div className="border-t px-4 py-3 text-sm text-gray-600 whitespace-pre-wrap">
          {text}
        </div>
      </details>
    </div>
  );
}
