import { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import { useProject } from "../lib/project-context";
import {
  getEntriesByRange,
  getEpisodes,
  getSignals,
  getTenantById,
  getFullMedications,
  getFullStrategies,
  type EntryRow,
  type EpisodeRow,
  type SignalRow,
  type TenantDetail,
  type FullMedicationRow,
  type FullStrategyRow,
} from "../lib/api";

// --- Types ---

interface ReportData {
  entries: EntryRow[];
  episodes: EpisodeRow[];
  signals: SignalRow[];
  tenant: TenantDetail | null;
  medications: FullMedicationRow[];
  strategies: FullStrategyRow[];
  dateRange: { from: string; to: string };
}

interface ChartPoint {
  date: string;
  label: string;
  waveScore: number;
  manicCriteria: number;
  depressiveCriteria: number;
  classification: string;
  severity: string;
  period: number | null;
}

// --- Constants ---

const classColors: Record<string, string> = {
  MANIC: "#D4913A",
  DEPRESSIVE: "#3B9DAD",
  MIXED: "#8A6BBF",
  NEUTRAL: "#8FABA4",
};

const episodeColors: Record<string, string> = {
  MANIC: "border-[#D4913A]/30 bg-[#FDF4E8]",
  HYPOMANIC: "border-[#D4913A]/20 bg-[#FDF4E8]/60",
  DEPRESSIVE: "border-[#3B9DAD]/30 bg-[#E0F2F1]",
  MIXED: "border-[#8A6BBF]/30 bg-[#EDE5F5]",
};

const signalStyleMap: Record<string, string> = {
  ALERT: "border-[#DC2626]/20 bg-[#FEF2F2]",
  WARNING: "border-[#D97706]/20 bg-[#FFFBEB]",
  INFO: "border-[#0D9488]/20 bg-[#F0FDFA]",
};

const IMPAIRMENT_LABELS: Record<string, string> = {
  SCHOOL_WORK: "School / Work",
  FAMILY_LIFE: "Family Life",
  FRIENDSHIPS: "Friendships",
  SELF_CARE: "Self-Care",
  SAFETY_CONCERN: "Safety Concern",
};

// --- Helpers ---

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function extractScore(entry: EntryRow) {
  const mood = entry.computedMood as Record<string, unknown> | null;
  const score = entry.computedScore as Record<string, unknown> | null;
  return {
    classification: (mood?.classification as string) ?? "NEUTRAL",
    waveScore: (mood?.waveScore as number) ?? 0,
    severity: (mood?.severity as string) ?? "NONE",
    manicCriteriaCount: (score?.manic as number) ?? (mood?.criteriaCounts as Record<string, number>)?.manic ?? 0,
    depressiveCriteriaCount: (score?.depressive as number) ?? (mood?.criteriaCounts as Record<string, number>)?.depressive ?? 0,
  };
}

// --- Main Component ---

export default function Reports() {
  const { selectedTenant, loading: projectLoading } = useProject();
  const range = defaultRange();
  const [fromDate, setFromDate] = useState(range.from);
  const [toDate, setToDate] = useState(range.to);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function generate() {
    if (!selectedTenant) return;
    setLoading(true);
    try {
      const [entries, episodes, signals, tenant, medications, strategies] = await Promise.all([
        getEntriesByRange(selectedTenant.id, fromDate, toDate),
        getEpisodes(selectedTenant.id),
        getSignals(selectedTenant.id),
        getTenantById(selectedTenant.id),
        getFullMedications(selectedTenant.id),
        getFullStrategies(selectedTenant.id),
      ]);
      setData({
        entries,
        episodes: episodes.filter((ep) => ep.startDate >= fromDate && ep.startDate <= toDate),
        signals,
        tenant,
        medications,
        strategies,
        dateRange: { from: fromDate, to: toDate },
      });
    } catch (err) {
      console.error("Report generation failed:", err);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Date range controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-[#475569]">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            max={toDate}
            className="mt-1 rounded-lg border border-[#D1E8E4] px-3 py-1.5 text-sm bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569]">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            min={fromDate}
            max={new Date().toISOString().slice(0, 10)}
            className="mt-1 rounded-lg border border-[#D1E8E4] px-3 py-1.5 text-sm bg-white"
          />
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F766E] disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>
        {data && data.entries.length > 0 && (
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-[#D1E8E4] px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#F0FDFA]"
          >
            Export PDF
          </button>
        )}
      </div>

      {!loaded && !loading && (
        <p className="text-sm text-[#94A3B8]">Select a date range and click Generate Report.</p>
      )}

      {loaded && (!data || data.entries.length === 0) && (
        <p className="text-sm text-[#94A3B8]">No entries found in this range.</p>
      )}

      {data && data.entries.length > 0 && (
        <ReportContent data={data} tenantName={selectedTenant.name} />
      )}
    </div>
  );
}

// --- Report Content ---

function ReportContent({ data, tenantName }: { data: ReportData; tenantName: string }) {
  const uniqueDates = new Set(data.entries.map((e) => e.date));
  const scores = data.entries.map((e) => ({ ...e, score: extractScore(e) }));

  const manicDays = scores.filter((d) => d.score.classification.startsWith("MANIC")).length;
  const depressiveDays = scores.filter((d) => d.score.classification.startsWith("DEPRESSIVE")).length;
  const mixedDays = scores.filter((d) => d.score.classification.startsWith("MIXED")).length;

  // Behavior frequency
  const behaviorCounts = new Map<string, number>();
  for (const entry of data.entries) {
    for (const key of entry.behaviorKeys ?? []) {
      behaviorCounts.set(key, (behaviorCounts.get(key) ?? 0) + 1);
    }
  }
  const behaviorFrequency = Array.from(behaviorCounts.entries())
    .map(([key, count]) => ({
      key,
      count,
      percentage: Math.round((count / uniqueDates.size) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // Impairment summary
  const impairmentCounts: Record<string, { present: number; severe: number }> = {};
  for (const entry of data.entries) {
    const impairments = (entry.impairments ?? {}) as Record<string, string>;
    for (const [domain, severity] of Object.entries(impairments)) {
      if (!impairmentCounts[domain]) impairmentCounts[domain] = { present: 0, severe: 0 };
      if (severity === "PRESENT") impairmentCounts[domain].present++;
      else if (severity === "SEVERE") impairmentCounts[domain].severe++;
    }
  }

  return (
    <div id="report-content" className="space-y-8">
      {/* Print header */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold text-[#0F172A]">{tenantName} — Behavior Report</h1>
        <p className="text-sm text-[#475569]">
          {formatDate(data.dateRange.from)} — {formatDate(data.dateRange.to)} · {uniqueDates.size} days logged
        </p>
      </div>

      {/* Patient Info */}
      {data.tenant && <PatientInfo tenant={data.tenant} medications={data.medications} strategies={data.strategies} />}

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Days logged" value={uniqueDates.size} />
        <StatCard label="Manic days" value={manicDays} color="text-[#9A5B13]" />
        <StatCard label="Depressive days" value={depressiveDays} color="text-[#1A5E6C]" />
        <StatCard label="Mixed days" value={mixedDays} color="text-[#5E3D8A]" />
      </div>

      {/* Wave Graph */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#475569]">Symptom Wave</h2>
        <p className="mt-1 text-xs text-[#94A3B8]">
          Manic criteria score positive, depressive criteria score negative.
          {data.entries.some((e) => e.menstrualSeverity) && " Pink bars indicate period days."}
        </p>
        <div className="mt-3">
          <WaveGraph entries={scores} />
        </div>
      </section>

      {/* Episodes */}
      {data.episodes.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#475569]">Possible Episodes</h2>
          <div className="mt-2 space-y-2">
            {data.episodes.map((ep) => (
              <div key={ep.id} className={`rounded-xl border px-4 py-3 ${episodeColors[ep.type] ?? ""}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#0F172A]">
                    Possible {ep.type.charAt(0) + ep.type.slice(1).toLowerCase()} episode
                    <span className="ml-2 text-xs font-normal text-[#475569]">
                      ({ep.confidence === "DSM5_MET" ? "Pattern consistent with DSM-5 criteria" : "Emerging pattern of concern"})
                    </span>
                  </p>
                  <span className="text-xs text-[#475569]">{ep.dayCount} days</span>
                </div>
                <p className="mt-1 text-xs text-[#475569]">
                  {formatDate(ep.startDate)} — {formatDate(ep.endDate)} · Peak severity: {ep.peakSeverity?.toLowerCase()}
                  {ep.hasSafetyConcern && (
                    <span className="ml-2 font-semibold text-[#DC2626]">Safety concern flagged</span>
                  )}
                </p>
                {ep.criteriaNote && <p className="mt-1 text-[10px] text-[#94A3B8] italic">{ep.criteriaNote}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Signals */}
      {data.signals.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#475569]">Prodrome Signals</h2>
          <div className="mt-2 space-y-2">
            {data.signals.map((s) => (
              <div key={s.id} className={`rounded-xl border px-4 py-3 ${signalStyleMap[s.level] ?? ""}`}>
                <p className="text-sm font-semibold text-[#0F172A]">{s.title}</p>
                <p className="mt-0.5 text-xs text-[#475569]">{s.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Behavior Frequency */}
      {behaviorFrequency.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#475569]">Behavior Frequency (Top 15)</h2>
          <div className="mt-3">
            <FrequencyChart data={behaviorFrequency} />
          </div>
        </section>
      )}

      {/* Impairment Summary */}
      {Object.keys(impairmentCounts).length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#475569]">Impairment Summary</h2>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D1E8E4] text-left text-xs text-[#475569]">
                  <th className="pb-2 font-medium">Domain</th>
                  <th className="pb-2 font-medium">Present</th>
                  <th className="pb-2 font-medium">Severe</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(impairmentCounts).map(([domain, counts]) => (
                  <tr key={domain} className="border-b border-[#E2F0ED]">
                    <td className="py-2 text-[#0F172A]">{IMPAIRMENT_LABELS[domain] || domain}</td>
                    <td className="py-2">
                      {counts.present > 0 ? (
                        <span className="text-[#D97706]">{counts.present} days</span>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </td>
                    <td className="py-2">
                      {counts.severe > 0 ? (
                        <span className="font-medium text-[#DC2626]">{counts.severe} days</span>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Caregiver Notes */}
      {data.entries.some((e) => e.notes) && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#475569]">Caregiver Notes</h2>
          <div className="mt-2 space-y-3">
            {data.entries
              .filter((e) => e.notes)
              .map((e) => (
                <div key={e.id} className="rounded-xl border border-[#D1E8E4] px-4 py-3">
                  <p className="text-xs font-medium text-[#475569]">{formatDate(e.date)}</p>
                  <p className="mt-1 text-sm text-[#0F172A] whitespace-pre-wrap">{e.notes}</p>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-[#94A3B8] text-center pt-4 print:pt-8">
        Storm Tracker is an observation tool, not a diagnostic instrument. Always consult a qualified clinician for diagnosis and treatment decisions.
      </p>
    </div>
  );
}

// --- Sub-components ---

function PatientInfo({ tenant, medications, strategies }: { tenant: TenantDetail; medications: FullMedicationRow[]; strategies: FullStrategyRow[] }) {
  const hasInfo = tenant.teenFullName || tenant.teenDiagnosis || tenant.teenSchool;
  if (!hasInfo && medications.length === 0 && strategies.length === 0) return null;

  return (
    <section className="bg-white rounded-xl shadow-sm p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#475569]">Patient Information</h2>
      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        {tenant.teenFullName && (
          <>
            <span className="text-[#475569]">Name</span>
            <span className="text-[#0F172A]">{tenant.teenFullName}{tenant.teenNickname ? ` ("${tenant.teenNickname}")` : ""}</span>
          </>
        )}
        {tenant.teenBirthday && (
          <>
            <span className="text-[#475569]">Date of Birth</span>
            <span className="text-[#0F172A]">{formatDate(new Date(tenant.teenBirthday).toISOString().slice(0, 10))}</span>
          </>
        )}
        {tenant.teenSchool && (
          <>
            <span className="text-[#475569]">School</span>
            <span className="text-[#0F172A]">{tenant.teenSchool}{tenant.teenHasIep ? " (IEP)" : ""}</span>
          </>
        )}
        {tenant.teenDiagnosis && (
          <>
            <span className="text-[#475569]">Diagnosis</span>
            <span className="text-[#0F172A]">{tenant.teenDiagnosis}</span>
          </>
        )}
        {tenant.onsetDate && (
          <>
            <span className="text-[#475569]">Onset Date</span>
            <span className="text-[#0F172A]">{formatDate(new Date(tenant.onsetDate).toISOString().slice(0, 10))}</span>
          </>
        )}
        {tenant.familyHistory && (
          <>
            <span className="text-[#475569]">Family History</span>
            <span className="text-[#0F172A]">{tenant.familyHistory}</span>
          </>
        )}
      </div>
      {medications.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-[#475569]">Active Medications</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {medications.map((med) => (
              <span key={med.id} className="rounded-full bg-[#ECFDF5] border border-[#059669]/20 px-2.5 py-0.5 text-xs text-[#059669]">
                {med.name}{med.dosage ? ` ${med.dosage}` : ""}{med.frequency ? ` (${med.frequency})` : ""}
              </span>
            ))}
          </div>
        </div>
      )}
      {strategies.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-[#475569]">Strategies</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {strategies.map((s) => (
              <span key={s.id} className="rounded-full bg-[#F0FDFA] border border-[#0D9488]/20 px-2.5 py-0.5 text-xs text-[#0D9488]">
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function WaveGraph({ entries }: { entries: (EntryRow & { score: ReturnType<typeof extractScore> })[] }) {
  const byDate = new Map<string, ChartPoint>();

  for (const entry of entries) {
    const existing = byDate.get(entry.date);
    const total = entry.score.manicCriteriaCount + entry.score.depressiveCriteriaCount;
    const existingTotal = existing ? existing.manicCriteria + Math.abs(existing.depressiveCriteria) : 0;

    if (!existing || total > existingTotal) {
      byDate.set(entry.date, {
        date: entry.date,
        label: new Date(entry.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        waveScore: entry.score.waveScore,
        manicCriteria: entry.score.manicCriteriaCount,
        depressiveCriteria: -entry.score.depressiveCriteriaCount,
        classification: entry.score.classification,
        severity: entry.score.severity,
        period: entry.menstrualSeverity ? -0.3 : null,
      });
    } else if (existing && entry.menstrualSeverity) {
      existing.period = -0.3;
    }
  }

  const chartData = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));

  if (chartData.length === 0) {
    return <p className="py-8 text-center text-sm text-[#94A3B8]">No data in this range.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2F0ED" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis
            tick={{ fontSize: 10 }}
            domain={[-9, 7]}
            ticks={[-9, -6, -3, 0, 3, 6]}
            tickFormatter={(v: number) => (v >= 0 ? `+${v}` : `${v}`)}
          />
          <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
          <Tooltip content={<WaveTooltip />} />
          <Legend
            verticalAlign="top"
            height={28}
            formatter={(value: string) => <span className="text-xs text-[#475569]">{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="waveScore"
            name="Wave score"
            stroke="#0D9488"
            fill="#0D9488"
            fillOpacity={0.1}
            strokeWidth={2}
            dot={(props: Record<string, unknown>) => {
              const { cx, cy, payload } = props as { cx: number; cy: number; payload: ChartPoint };
              const color = classColors[payload.classification.replace("_SUBTHRESHOLD", "")] || "#8FABA4";
              return <circle key={payload.date} cx={cx} cy={cy} r={4} fill={color} stroke="white" strokeWidth={1.5} />;
            }}
          />
          <Bar dataKey="period" name="Period" fill="#EC4899" barSize={6} radius={[3, 3, 0, 0]} />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[10px] text-[#94A3B8]">
        Above 0 = manic criteria · Below 0 = depressive criteria · Dot color = day classification
      </p>
    </div>
  );
}

function WaveTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartPoint }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#D1E8E4] bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-[#0F172A]">{d.label}</p>
      <p>
        Classification:{" "}
        <span style={{ color: classColors[d.classification.replace("_SUBTHRESHOLD", "")] }}>
          {d.classification.toLowerCase()}
        </span>
      </p>
      <p>Manic: {d.manicCriteria}/7 · Depressive: {Math.abs(d.depressiveCriteria)}/9</p>
      <p>Severity: {d.severity.toLowerCase()}</p>
      {d.period !== null && <p className="text-pink-600">Period logged</p>}
    </div>
  );
}

function FrequencyChart({ data }: { data: { key: string; count: number; percentage: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.key} className="flex items-start gap-3">
          <p className="w-48 shrink-0 text-right text-xs text-[#0F172A] leading-tight pt-0.5">
            {d.key.replace(/-/g, " ")}
          </p>
          <div className="flex flex-1 items-center gap-2">
            <div className="flex-1 h-5 rounded bg-[#F0FDFA]">
              <div
                className="h-5 rounded bg-[#0D9488]"
                style={{ width: `${(d.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-xs text-[#475569] w-16">
              {d.count}d ({d.percentage}%)
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm px-4 py-3">
      <p className="text-xs text-[#475569]">{label}</p>
      <p className={`text-2xl font-bold ${color ?? "text-[#0F172A]"}`}>{value}</p>
    </div>
  );
}
