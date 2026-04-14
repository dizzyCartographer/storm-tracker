import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useProject } from "../lib/project-context";
import {
  saveEntry,
  getEntryByDate,
  getBehaviorCategories,
  getBehaviorDefinitions,
  getCustomItems,
  getActiveMedications,
  getStrategies,
  getFrameworkId,
  type BehaviorCategoryRow,
  type BehaviorDefinitionRow,
} from "../lib/api";

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

const impairmentDomains = [
  { key: "SCHOOL_WORK", label: "School or work" },
  { key: "FAMILY_LIFE", label: "Family life" },
  { key: "FRIENDSHIPS", label: "Friendships" },
  { key: "SELF_CARE", label: "Self-care" },
  { key: "SAFETY_CONCERN", label: "Safety concern" },
];

const severities = ["NONE", "PRESENT", "SEVERE"] as const;

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
        className="flex w-full items-center gap-2 text-sm font-semibold text-[#475569]"
      >
        <span className="text-xs">{open ? "▾" : "▸"}</span>
        {title}
        {badge !== undefined && badge > 0 && (
          <span className="rounded-full bg-[#CCFBF1] px-2 py-0.5 text-xs text-[#0D9488]">
            {badge}
          </span>
        )}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

interface CurrentUserSession {
  id: string;
}

export default function Log() {
  const { selectedTenant, loading: projectLoading } = useProject();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editDate = searchParams.get("date");

  // Form state
  const todayStr = new Date().toLocaleDateString("en-CA");
  const [date, setDate] = useState(editDate ?? todayStr);
  const [mood, setMood] = useState("");
  const [dayQuality, setDayQuality] = useState("");
  const [checkedBehaviors, setCheckedBehaviors] = useState<Set<string>>(new Set());
  const [checkedCustom, setCheckedCustom] = useState<Set<string>>(new Set());
  const [checkedStrategies, setCheckedStrategies] = useState<Set<string>>(new Set());
  const [missedMeds, setMissedMeds] = useState<Set<string>>(new Set());
  const [impairments, setImpairments] = useState<Record<string, string>>({
    SCHOOL_WORK: "NONE",
    FAMILY_LIFE: "NONE",
    FRIENDSHIPS: "NONE",
    SELF_CARE: "NONE",
    SAFETY_CONCERN: "NONE",
  });
  const [notes, setNotes] = useState("");
  const [menstrual, setMenstrual] = useState<string | null>(null);

  // Reference data
  const [categories, setCategories] = useState<BehaviorCategoryRow[]>([]);
  const [definitions, setDefinitions] = useState<BehaviorDefinitionRow[]>([]);
  const [customItems, setCustomItems] = useState<{ id: string; label: string }[]>([]);
  const [strategiesList, setStrategiesList] = useState<{ id: string; name: string }[]>([]);
  const [medicationsList, setMedicationsList] = useState<{ id: string; name: string; dosage: string | null }[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isExisting, setIsExisting] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID from session
  useEffect(() => {
    fetch("/api/auth/get-session", { credentials: "include" })
      .then((r) => r.json())
      .then((data: { user?: CurrentUserSession }) => {
        if (data?.user?.id) setUserId(data.user.id);
      })
      .catch(() => {});
  }, []);

  // Load reference data
  useEffect(() => {
    if (!selectedTenant) return;
    let cancelled = false;

    async function loadRef() {
      try {
        const [fid, customs, strats, meds] = await Promise.all([
          getFrameworkId(selectedTenant!.id),
          getCustomItems(selectedTenant!.id),
          getStrategies(selectedTenant!.id),
          getActiveMedications(selectedTenant!.id),
        ]);

        if (cancelled) return;
        setCustomItems(customs);
        setStrategiesList(strats);
        setMedicationsList(meds);

        if (fid) {
          const cats = await getBehaviorCategories(fid);
          if (cancelled) return;
          setCategories(cats);
          if (cats.length > 0) {
            const defs = await getBehaviorDefinitions(cats.map((c) => c.id));
            if (!cancelled) setDefinitions(defs);
          }
        }
      } catch (err) {
        console.error("Failed to load reference data:", err);
      }
    }

    loadRef();
    return () => { cancelled = true; };
  }, [selectedTenant?.id]);

  // Check for existing entry when date changes
  const populateFrom = useCallback((data: {
    id: string; mood: string; dayQuality: string; behaviorKeys: string[];
    customItemIds: string[]; strategyIds: string[]; missedMedIds: string[];
    impairments: Record<string, string>; notes: string | null; menstrualSeverity: string | null;
  }) => {
    setMood(data.mood);
    setDayQuality(data.dayQuality);
    setCheckedBehaviors(new Set(data.behaviorKeys ?? []));
    setCheckedCustom(new Set(data.customItemIds ?? []));
    setCheckedStrategies(new Set(data.strategyIds ?? []));
    setMissedMeds(new Set(data.missedMedIds ?? []));
    setImpairments({
      SCHOOL_WORK: "NONE", FAMILY_LIFE: "NONE", FRIENDSHIPS: "NONE",
      SELF_CARE: "NONE", SAFETY_CONCERN: "NONE",
      ...(data.impairments ?? {}),
    });
    setNotes(data.notes ?? "");
    setMenstrual(data.menstrualSeverity);
    setIsExisting(true);
    setExistingId(data.id);
  }, []);

  useEffect(() => {
    if (!selectedTenant) return;
    let cancelled = false;

    async function check() {
      setChecking(true);
      try {
        const existing = await getEntryByDate(selectedTenant!.id, date);
        if (cancelled) return;
        if (existing) {
          populateFrom(existing);
        } else {
          setMood("");
          setDayQuality("");
          setCheckedBehaviors(new Set());
          setCheckedCustom(new Set());
          setCheckedStrategies(new Set());
          setMissedMeds(new Set());
          setImpairments({
            SCHOOL_WORK: "NONE", FAMILY_LIFE: "NONE", FRIENDSHIPS: "NONE",
            SELF_CARE: "NONE", SAFETY_CONCERN: "NONE",
          });
          setNotes("");
          setMenstrual(null);
          setIsExisting(false);
          setExistingId(null);
        }
      } catch {
        // ignore
      }
      if (!cancelled) setChecking(false);
    }

    check();
    return () => { cancelled = true; };
  }, [date, selectedTenant?.id, populateFrom]);

  const impairmentCount = Object.values(impairments).filter((v) => v !== "NONE").length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mood || !dayQuality || !selectedTenant || !userId) {
      setError("Mood and day quality are required");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await saveEntry({
        id: existingId ?? undefined,
        tenantId: selectedTenant.id,
        userId,
        mood,
        dayQuality,
        behaviorKeys: Array.from(checkedBehaviors),
        customItemIds: Array.from(checkedCustom),
        strategyIds: Array.from(checkedStrategies),
        missedMedIds: Array.from(missedMeds),
        impairments,
        notes: notes.trim() || undefined,
        menstrualSeverity: menstrual,
        date,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }

    setLoading(false);
  }

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

  // Group behaviors by category
  const behaviorsByCategory = categories.map((cat) => ({
    ...cat,
    behaviors: definitions.filter((d) => d.categoryId === cat.id),
  }));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-[#0F172A] mb-6">
        {isExisting ? "Update Log" : "Daily Log"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date */}
        <fieldset>
          <legend className="text-sm font-medium text-[#0F172A]">Date</legend>
          <input
            type="date"
            value={date}
            max={todayStr}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 rounded-lg border border-[#D1E8E4] px-3 py-2 text-sm bg-white"
          />
        </fieldset>

        {/* Mood */}
        <fieldset>
          <legend className="text-sm font-medium text-[#0F172A]">Overall mood</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {moods.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  mood === m
                    ? "bg-[#0D9488] text-white shadow-sm"
                    : "bg-white border border-[#D1E8E4] text-[#475569] hover:bg-[#F0FDFA]"
                }`}
              >
                {moodLabels[m]}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Day quality */}
        <fieldset>
          <legend className="text-sm font-medium text-[#0F172A]">How was the day?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {dayQualities.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setDayQuality(q)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  dayQuality === q
                    ? "bg-[#0D9488] text-white shadow-sm"
                    : "bg-white border border-[#D1E8E4] text-[#475569] hover:bg-[#F0FDFA]"
                }`}
              >
                {dayQualityLabels[q]}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Behavior checklist */}
        {behaviorsByCategory.length > 0 && (
          <CollapsibleSection
            title="Behavior checklist"
            badge={checkedBehaviors.size + checkedCustom.size}
            defaultOpen={checkedBehaviors.size > 0}
          >
            {behaviorsByCategory.map((cat) => (
              <div key={cat.id} className="mb-4">
                <h4 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-2">
                  {cat.name}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {cat.behaviors.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        const next = new Set(checkedBehaviors);
                        next.has(b.itemKey) ? next.delete(b.itemKey) : next.add(b.itemKey);
                        setCheckedBehaviors(next);
                      }}
                      title={b.description ?? undefined}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        checkedBehaviors.has(b.itemKey)
                          ? "bg-[#0D9488] text-white"
                          : "bg-white border border-[#D1E8E4] text-[#475569] hover:bg-[#F0FDFA]"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Custom items */}
            {customItems.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-2">
                  Custom
                </h4>
                <div className="flex flex-wrap gap-2">
                  {customItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const next = new Set(checkedCustom);
                        next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                        setCheckedCustom(next);
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        checkedCustom.has(item.id)
                          ? "bg-[#0D9488] text-white"
                          : "bg-white border border-[#D1E8E4] text-[#475569] hover:bg-[#F0FDFA]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* Strategies */}
        {strategiesList.length > 0 && (
          <CollapsibleSection title="Strategies used" badge={checkedStrategies.size}>
            <div className="flex flex-wrap gap-2">
              {strategiesList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    const next = new Set(checkedStrategies);
                    next.has(s.id) ? next.delete(s.id) : next.add(s.id);
                    setCheckedStrategies(next);
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    checkedStrategies.has(s.id)
                      ? "bg-[#059669] text-white"
                      : "bg-white border border-[#D1E8E4] text-[#475569] hover:bg-[#F0FDFA]"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Missed medications */}
        {medicationsList.length > 0 && (
          <CollapsibleSection title="Missed medications" badge={missedMeds.size}>
            <p className="mb-2 text-xs text-[#94A3B8]">
              Meds are assumed taken. Only mark the ones that were missed today.
            </p>
            <div className="flex flex-wrap gap-2">
              {medicationsList.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    const next = new Set(missedMeds);
                    next.has(m.id) ? next.delete(m.id) : next.add(m.id);
                    setMissedMeds(next);
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    missedMeds.has(m.id)
                      ? "bg-[#D97706] text-white"
                      : "bg-white border border-[#D1E8E4] text-[#475569] hover:bg-[#F0FDFA]"
                  }`}
                >
                  {m.name}{m.dosage ? ` ${m.dosage}` : ""}
                </button>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Impairments */}
        <CollapsibleSection title="Impairment tracking" badge={impairmentCount}>
          <div className="space-y-3">
            {impairmentDomains.map((d) => (
              <div key={d.key} className="flex items-center gap-3">
                <span className="text-sm text-[#475569] w-32">{d.label}</span>
                <div className="flex gap-1">
                  {severities.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setImpairments((prev) => ({ ...prev, [d.key]: s }))}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        impairments[d.key] === s
                          ? s === "SEVERE"
                            ? "bg-[#DC2626] text-white"
                            : s === "PRESENT"
                              ? "bg-[#D97706] text-white"
                              : "bg-[#0D9488] text-white"
                          : "bg-white border border-[#D1E8E4] text-[#475569] hover:bg-[#F0FDFA]"
                      }`}
                    >
                      {s === "NONE" ? "None" : s === "PRESENT" ? "Present" : "Severe"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Notes */}
        <CollapsibleSection title="Notes" defaultOpen={!!notes}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="How was the day? Anything notable?"
            className="w-full rounded-lg border border-[#D1E8E4] px-3 py-2 text-sm bg-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          />
        </CollapsibleSection>

        {/* Menstrual */}
        <CollapsibleSection title="Menstrual tracking" defaultOpen={!!menstrual}>
          <div className="flex gap-2">
            {[null, "LIGHT", "MEDIUM", "HEAVY"].map((val) => (
              <button
                key={val ?? "none"}
                type="button"
                onClick={() => setMenstrual(val)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  menstrual === val
                    ? "bg-[#EC4899] text-white"
                    : "bg-white border border-[#D1E8E4] text-[#475569] hover:bg-[#F0FDFA]"
                }`}
              >
                {val === null ? "Not today" : val === "LIGHT" ? "Light" : val === "MEDIUM" ? "Medium" : "Heavy"}
              </button>
            ))}
          </div>
        </CollapsibleSection>

        {/* Status messages */}
        {checking && (
          <p className="text-xs text-[#94A3B8]">Checking for existing entry...</p>
        )}

        {!checking && isExisting && (
          <p className="rounded-lg bg-[#FFFBEB] px-3 py-2 text-xs font-medium text-[#D97706]">
            An entry already exists for this date. Your changes will update the existing entry.
          </p>
        )}

        {error && <p className="text-sm text-[#DC2626]">{error}</p>}

        <button
          type="submit"
          disabled={loading || checking || !mood || !dayQuality}
          className="w-full rounded-lg bg-[#0D9488] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0F766E] disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving..." : isExisting ? "Update log" : "Save log"}
        </button>
      </form>
    </div>
  );
}
