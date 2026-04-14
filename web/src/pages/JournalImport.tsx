import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useProject } from "../lib/project-context";
import { apiFetch, saveEntry } from "../lib/api";
import { API_BASE_URL } from "../lib/config";

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

const domainLabels: Record<string, string> = {
  SCHOOL_WORK: "School/Work",
  FAMILY_LIFE: "Family Life",
  FRIENDSHIPS: "Friendships",
  SELF_CARE: "Self-care",
  SAFETY_CONCERN: "Safety Concern",
};

interface ParsedEntry {
  date: string | null;
  mood: string;
  dayQuality: string;
  behaviorKeys: string[];
  impairments: Record<string, string>;
  notes: string;
  confidence: string;
  reasoning: string;
  followUpQuestions: string[];
}

export default function JournalImport() {
  const navigate = useNavigate();
  const { selectedTenant } = useProject();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [text, setText] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/auth/get-session`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data?.user?.id) setUserId(data.user.id); })
      .catch(() => {});
  }, []);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parsed, setParsed] = useState<ParsedEntry | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable fields for step 2
  const [editDate, setEditDate] = useState("");
  const [editMood, setEditMood] = useState("");
  const [editDayQuality, setEditDayQuality] = useState("");
  const [editBehaviorKeys, setEditBehaviorKeys] = useState<string[]>([]);
  const [editImpairments, setEditImpairments] = useState<Record<string, string>>({});
  const [editNotes, setEditNotes] = useState("");

  async function handleParse() {
    if (!text.trim() || !selectedTenant) return;
    setParsing(true);
    setParseError("");

    try {
      const res = await apiFetch("/api/parse-journal", {
        method: "POST",
        body: JSON.stringify({ text: text.trim(), tenantId: selectedTenant.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Parse failed" }));
        throw new Error(err.error || `Parse failed: ${res.status}`);
      }
      const data: ParsedEntry = await res.json();
      setParsed(data);
      setEditDate(data.date || new Date().toISOString().slice(0, 10));
      setEditMood(data.mood);
      setEditDayQuality(data.dayQuality);
      setEditBehaviorKeys([...data.behaviorKeys]);
      setEditImpairments({ ...data.impairments });
      setEditNotes(data.notes);
      setStep(2);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse journal entry");
    } finally {
      setParsing(false);
    }
  }

  async function handleSave() {
    if (!selectedTenant || !userId) return;
    setSaving(true);

    try {
      await saveEntry({
        tenantId: selectedTenant.id,
        userId,
        date: editDate,
        mood: editMood,
        dayQuality: editDayQuality,
        behaviorKeys: editBehaviorKeys,
        impairments: editImpairments,
        notes: editNotes,
        customItemIds: [],
        strategyIds: [],
        missedMedIds: [],
        menstrualSeverity: null,
      });
      setStep(3);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  function toggleBehavior(key: string) {
    setEditBehaviorKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function setImpairment(domain: string, level: string) {
    setEditImpairments((prev) => ({ ...prev, [domain]: level }));
  }

  if (!selectedTenant) {
    return (
      <div className="text-center py-12">
        <p className="text-[#475569]">Select a project to import a journal entry.</p>
      </div>
    );
  }

  // Step 1: Paste journal text
  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-[#0F172A]">Import Journal Entry</h1>
        <p className="mt-2 text-sm text-[#475569]">
          Paste a freeform journal entry and AI will extract structured behavioral observations.
        </p>

        <textarea
          className="mt-4 w-full rounded-xl border border-[#D1E8E4] p-4 text-sm bg-white focus:border-[#0D9488] focus:outline-none focus:ring-1 focus:ring-[#0D9488] min-h-[200px]"
          placeholder="Today was really rough. Jake barely slept last night and was bouncing off the walls this morning..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {parseError && <p className="mt-2 text-sm text-[#DC2626]">{parseError}</p>}

        <button
          onClick={handleParse}
          disabled={parsing || !text.trim()}
          className="mt-4 w-full rounded-lg bg-[#0D9488] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0F766E] disabled:opacity-50 transition-colors"
        >
          {parsing ? "Analyzing..." : "Analyze with AI"}
        </button>
      </div>
    );
  }

  // Step 2: Review & Edit
  if (step === 2 && parsed) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-[#0F172A]">Review & Edit</h1>

        {/* AI confidence and reasoning */}
        <div className="mt-4 bg-[#F0FDFA] rounded-xl p-4 border border-[#CCFBF1]">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              parsed.confidence === "HIGH"
                ? "bg-[#ECFDF5] text-[#059669]"
                : parsed.confidence === "MEDIUM"
                ? "bg-[#FFFBEB] text-[#D97706]"
                : "bg-[#FEF2F2] text-[#DC2626]"
            }`}>
              {parsed.confidence} confidence
            </span>
          </div>
          <p className="text-sm text-[#475569]">{parsed.reasoning}</p>
          {parsed.followUpQuestions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-[#94A3B8] mb-1">Follow-up questions:</p>
              <ul className="space-y-1">
                {parsed.followUpQuestions.map((q, i) => (
                  <li key={i} className="text-sm text-[#475569]">• {q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Date */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-[#0F172A]">Date</label>
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="mt-1 rounded-lg border border-[#D1E8E4] px-3 py-2 text-sm bg-white focus:border-[#0D9488] focus:outline-none"
          />
        </div>

        {/* Mood */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-[#0F172A] mb-2">Mood</label>
          <div className="flex flex-wrap gap-2">
            {(["MANIC", "DEPRESSIVE", "NEUTRAL", "MIXED"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setEditMood(m)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  editMood === m
                    ? "bg-[#0D9488] text-white border-[#0D9488]"
                    : "bg-white text-[#475569] border-[#D1E8E4] hover:border-[#0D9488]"
                }`}
              >
                {moodLabels[m]}
              </button>
            ))}
          </div>
        </div>

        {/* Day Quality */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-[#0F172A] mb-2">Day Quality</label>
          <div className="flex flex-wrap gap-2">
            {(["GOOD", "NEUTRAL", "BAD", "MIXED"] as const).map((q) => (
              <button
                key={q}
                onClick={() => setEditDayQuality(q)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  editDayQuality === q
                    ? "bg-[#0D9488] text-white border-[#0D9488]"
                    : "bg-white text-[#475569] border-[#D1E8E4] hover:border-[#0D9488]"
                }`}
              >
                {dayQualityLabels[q]}
              </button>
            ))}
          </div>
        </div>

        {/* Behaviors */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-[#0F172A] mb-2">Behaviors detected</label>
          <div className="flex flex-wrap gap-2">
            {editBehaviorKeys.map((key) => (
              <button
                key={key}
                onClick={() => toggleBehavior(key)}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-[#F0FDFA] text-[#0D9488] border border-[#CCFBF1] hover:bg-[#CCFBF1]"
              >
                {key.replace(/-/g, " ")} ×
              </button>
            ))}
            {editBehaviorKeys.length === 0 && (
              <p className="text-sm text-[#94A3B8]">No behaviors detected</p>
            )}
          </div>
        </div>

        {/* Impairments */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-[#0F172A] mb-2">Impairments</label>
          <div className="space-y-2">
            {Object.entries(domainLabels).map(([domain, label]) => (
              <div key={domain} className="flex items-center justify-between">
                <span className="text-sm text-[#475569]">{label}</span>
                <div className="flex gap-1">
                  {["NONE", "PRESENT", "SEVERE"].map((level) => (
                    <button
                      key={level}
                      onClick={() => setImpairment(domain, level)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        (editImpairments[domain] || "NONE") === level
                          ? level === "SEVERE"
                            ? "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                            : level === "PRESENT"
                            ? "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]"
                            : "bg-[#F0FDFA] text-[#0D9488] border border-[#CCFBF1]"
                          : "bg-white text-[#94A3B8] border border-[#E2F0ED]"
                      }`}
                    >
                      {level.charAt(0) + level.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-[#0F172A]">Notes</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-[#D1E8E4] p-3 text-sm bg-white focus:border-[#0D9488] focus:outline-none min-h-[100px]"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setStep(1)}
            className="rounded-lg border border-[#D1E8E4] px-4 py-2 text-sm text-[#475569] hover:bg-[#F0FDFA] transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-[#0D9488] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0F766E] disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Entry"}
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Success
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="text-4xl mb-4">&#10003;</div>
      <h1 className="text-xl font-bold text-[#0F172A]">Entry Saved</h1>
      <p className="mt-2 text-sm text-[#475569]">
        Your journal entry has been parsed and saved as a daily log.
      </p>
      <div className="mt-6 flex gap-3 justify-center">
        <button
          onClick={() => {
            setText("");
            setParsed(null);
            setStep(1);
          }}
          className="rounded-lg border border-[#D1E8E4] px-4 py-2 text-sm text-[#475569] hover:bg-[#F0FDFA] transition-colors"
        >
          Import Another
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F766E] transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
