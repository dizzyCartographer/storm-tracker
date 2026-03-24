"use client";

import { useState, useEffect, useCallback } from "react";
import { saveDailyLog, getEntryByDate } from "@/lib/actions/entry-actions";
import { useRouter } from "next/navigation";
import { BehaviorChecklist, type BehaviorItem } from "./behavior-checklist";
import { CustomChecklist } from "./custom-checklist";
import { ImpairmentTracking } from "./impairment-tracking";
import { NotesField } from "./notes-field";
import { MenstrualTracking } from "./menstrual-tracking";

const moods = ["MANIC", "DEPRESSIVE", "NEUTRAL", "MIXED"] as const;
const dayQualities = ["GOOD", "NEUTRAL", "BAD", "MIXED"] as const;

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
  MIXED: "Mixed",
};

interface CustomItem {
  id: string;
  label: string;
}

interface InitialData {
  id: string;
  date: string;
  mood: string;
  dayQuality: string;
  behaviorKeys: string[];
  customItemIds: string[];
  impairments: { domain: string; severity: string }[];
  notes: string | null;
  menstrualSeverity: string | null;
}

function CollapsibleSection({
  title,
  badge,
  defaultOpen,
  children,
}: {
  title: string;
  badge?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
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
  initialData,
  behaviorItems,
}: {
  tenantId: string;
  customItems: CustomItem[];
  initialData?: InitialData;
  behaviorItems?: BehaviorItem[];
}) {
  const router = useRouter();
  const isEdit = !!initialData;
  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
  const [date, setDate] = useState<string>(initialData?.date ?? todayStr);
  const [mood, setMood] = useState<string>(initialData?.mood ?? "");
  const [dayQuality, setDayQuality] = useState<string>(initialData?.dayQuality ?? "");
  const [checkedBehaviors, setCheckedBehaviors] = useState<Set<string>>(
    new Set(initialData?.behaviorKeys ?? [])
  );
  const [checkedCustom, setCheckedCustom] = useState<Set<string>>(
    new Set(initialData?.customItemIds ?? [])
  );
  const defaultImpairments: Record<string, string> = {
    SCHOOL_WORK: "NONE",
    FAMILY_LIFE: "NONE",
    FRIENDSHIPS: "NONE",
    SELF_CARE: "NONE",
    SAFETY_CONCERN: "NONE",
  };
  const [impairments, setImpairments] = useState<Record<string, string>>(
    initialData?.impairments
      ? { ...defaultImpairments, ...Object.fromEntries(initialData.impairments.map((i) => [i.domain, i.severity])) }
      : defaultImpairments
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [menstrual, setMenstrual] = useState<string | null>(initialData?.menstrualSeverity ?? null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isExisting, setIsExisting] = useState(isEdit);
  const [error, setError] = useState("");

  const populateFrom = useCallback((data: InitialData) => {
    setMood(data.mood);
    setDayQuality(data.dayQuality);
    setCheckedBehaviors(new Set(data.behaviorKeys));
    setCheckedCustom(new Set(data.customItemIds));
    setImpairments(
      data.impairments.length > 0
        ? { ...defaultImpairments, ...Object.fromEntries(data.impairments.map((i) => [i.domain, i.severity])) }
        : defaultImpairments
    );
    setNotes(data.notes ?? "");
    setMenstrual(data.menstrualSeverity);
    setIsExisting(true);
  }, []);

  const clearForm = useCallback(() => {
    setMood("");
    setDayQuality("");
    setCheckedBehaviors(new Set());
    setCheckedCustom(new Set());
    setImpairments(defaultImpairments);
    setNotes("");
    setMenstrual(null);
    setIsExisting(false);
  }, []);

  // Check for existing entry when date changes (new entries only)
  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;
    async function check() {
      setChecking(true);
      const existing = await getEntryByDate(tenantId, date);
      if (cancelled) return;
      if (existing) {
        populateFrom(existing);
      } else {
        clearForm();
      }
      setChecking(false);
    }
    check();
    return () => { cancelled = true; };
  }, [date, tenantId, isEdit, populateFrom, clearForm]);

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
      date,
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
      {/* Date picker */}
      <fieldset>
        <legend className="text-sm font-medium">Date</legend>
        {isEdit ? (
          <p className="mt-2 text-sm text-gray-500">
            {new Date(date + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        ) : (
          <input
            type="date"
            value={date}
            max={todayStr}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        )}
      </fieldset>

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
        defaultOpen={isEdit && (checkedBehaviors.size > 0 || checkedCustom.size > 0)}
      >
        <BehaviorChecklist checked={checkedBehaviors} onToggle={toggleBehavior} items={behaviorItems ?? []} />
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

      <CollapsibleSection title="Impairment tracking" badge={impairmentCount} defaultOpen={isEdit && impairmentCount > 0}>
        <ImpairmentTracking values={impairments} onChange={setImpairment} />
      </CollapsibleSection>

      <CollapsibleSection title="Notes" defaultOpen={isEdit && !!notes}>
        <NotesField value={notes} onChange={setNotes} />
      </CollapsibleSection>

      <CollapsibleSection title="Menstrual tracking" defaultOpen={isEdit && !!menstrual}>
        <MenstrualTracking value={menstrual} onChange={setMenstrual} />
      </CollapsibleSection>

      {checking && (
        <p className="text-xs text-gray-400">Checking for existing entry...</p>
      )}

      {!isEdit && isExisting && !checking && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          An entry already exists for this date. Your changes will update the existing entry.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || checking || !mood || !dayQuality}
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Saving..." : isEdit || isExisting ? "Update log" : "Save log"}
      </button>
    </form>
  );
}
