"use client";

import { useState } from "react";
import { saveDailyLog } from "@/lib/actions/entry-actions";
import { useRouter } from "next/navigation";
import { BehaviorChecklist } from "./behavior-checklist";
import { CustomChecklist } from "./custom-checklist";
import { ImpairmentTracking } from "./impairment-tracking";
import { NotesField } from "./notes-field";
import { MenstrualTracking } from "./menstrual-tracking";

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

interface CustomItem {
  id: string;
  label: string;
}

function CollapsibleSection({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 text-sm font-medium text-gray-700"
      >
        <span>{open ? "▾" : "▸"}</span>
        {title}
        {badge !== undefined && badge > 0 && (
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs">
            {badge}
          </span>
        )}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function DailyLogForm({
  tenantId,
  customItems,
}: {
  tenantId: string;
  customItems: CustomItem[];
}) {
  const router = useRouter();
  const [mood, setMood] = useState<string>("");
  const [dayQuality, setDayQuality] = useState<string>("");
  const [checkedBehaviors, setCheckedBehaviors] = useState<Set<string>>(new Set());
  const [checkedCustom, setCheckedCustom] = useState<Set<string>>(new Set());
  const [impairments, setImpairments] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [menstrual, setMenstrual] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleBehavior(key: string) {
    setCheckedBehaviors((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleCustom(id: string) {
    setCheckedCustom((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function setImpairment(domain: string, severity: string) {
    setImpairments((prev) => ({ ...prev, [domain]: severity }));
  }

  const impairmentCount = Object.values(impairments).filter(
    (v) => v && v !== "NONE"
  ).length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mood || !dayQuality) {
      setError("Mood and day quality are required");
      return;
    }
    setError("");
    setLoading(true);

    const impairmentEntries = Object.entries(impairments)
      .filter(([, sev]) => sev)
      .map(([domain, severity]) => ({
        domain: domain as "SCHOOL_WORK" | "FAMILY_LIFE" | "FRIENDSHIPS" | "SELF_CARE" | "SAFETY_CONCERN",
        severity: severity as "NONE" | "PRESENT" | "SEVERE",
      }));

    const result = await saveDailyLog({
      tenantId,
      mood: mood as "MANIC" | "DEPRESSIVE" | "NEUTRAL" | "MIXED",
      dayQuality: dayQuality as "GOOD" | "NEUTRAL" | "BAD",
      behaviorKeys: Array.from(checkedBehaviors),
      customItemIds: Array.from(checkedCustom),
      impairments: impairmentEntries.length > 0 ? impairmentEntries : undefined,
      notes: notes.trim() || undefined,
      menstrualSeverity: menstrual as "LIGHT" | "MEDIUM" | "HEAVY" | null,
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
      {/* Quick Log — always visible */}
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

      {/* Expandable sections */}
      <CollapsibleSection
        title="Behavior checklist"
        badge={checkedBehaviors.size + checkedCustom.size}
      >
        <BehaviorChecklist checked={checkedBehaviors} onToggle={toggleBehavior} />
        {customItems.length > 0 && (
          <div className="mt-4">
            <CustomChecklist
              items={customItems}
              checked={checkedCustom}
              onToggle={toggleCustom}
            />
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Impairment tracking" badge={impairmentCount}>
        <ImpairmentTracking values={impairments} onChange={setImpairment} />
      </CollapsibleSection>

      <CollapsibleSection title="Notes">
        <NotesField value={notes} onChange={setNotes} />
      </CollapsibleSection>

      <CollapsibleSection title="Menstrual tracking">
        <MenstrualTracking value={menstrual} onChange={setMenstrual} />
      </CollapsibleSection>

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
