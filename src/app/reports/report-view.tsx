"use client";

import { useState } from "react";
import { getReportData, type ReportData } from "@/lib/actions/report-actions";
import { WaveGraph } from "./wave-graph";
import { FrequencyChart } from "./frequency-chart";

const IMPAIRMENT_LABELS: Record<string, string> = {
  SCHOOL_WORK: "School / Work",
  FAMILY_LIFE: "Family Life",
  FRIENDSHIPS: "Friendships",
  SELF_CARE: "Self-Care",
  SAFETY_CONCERN: "Safety Concern",
};

const episodeColors: Record<string, string> = {
  MANIC: "border-orange-300 bg-orange-50",
  HYPOMANIC: "border-yellow-300 bg-yellow-50",
  DEPRESSIVE: "border-blue-300 bg-blue-50",
  MIXED: "border-purple-300 bg-purple-50",
};

const signalColors: Record<string, string> = {
  ALERT: "border-red-300 bg-red-50 text-red-800",
  WARNING: "border-amber-300 bg-amber-50 text-amber-800",
  INFO: "border-blue-200 bg-blue-50 text-blue-700",
};

interface ReportViewProps {
  tenantId: string;
  tenantName: string;
  behaviorLabelMap?: Record<string, string>;
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

export function ReportView({ tenantId, tenantName, behaviorLabelMap }: ReportViewProps) {
  const range = defaultRange();
  const [fromDate, setFromDate] = useState(range.from);
  const [toDate, setToDate] = useState(range.to);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function generate() {
    setLoading(true);
    const result = await getReportData(tenantId, fromDate, toDate);
    setData(result);
    setLoading(false);
    setLoaded(true);
  }

  return (
    <div className="space-y-6">
      {/* Date range controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            max={toDate}
            className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            min={fromDate}
            max={new Date().toISOString().slice(0, 10)}
            className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>
        {data && data.days.length > 0 && (
          <button
            onClick={() => printReport()}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Export PDF
          </button>
        )}
      </div>

      {!loaded && !loading && (
        <p className="text-sm text-gray-400">
          Select a date range and click Generate Report.
        </p>
      )}

      {loaded && (!data || data.days.length === 0) && (
        <p className="text-sm text-gray-400">No entries found in this range.</p>
      )}

      {data && data.days.length > 0 && (
        <div id="report-content" className="space-y-8">
          {/* Header + Project Info for print */}
          <div className="hidden print:block">
            <h1 className="text-xl font-bold">{tenantName} — Behavior Report</h1>
            <p className="text-sm text-gray-500">
              {formatDate(data.dateRange.from)} — {formatDate(data.dateRange.to)}
              {" · "}
              {new Set(data.days.map((d) => d.date)).size} days logged
            </p>
          </div>

          {/* Project Info */}
          {data.projectInfo && (
            <section className="rounded-md border border-gray-200 p-4 print:border-0 print:p-0">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Patient Information
              </h2>
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                {data.projectInfo.teenFullName && (
                  <>
                    <span className="text-gray-500">Name</span>
                    <span>{data.projectInfo.teenFullName}{data.projectInfo.teenNickname ? ` ("${data.projectInfo.teenNickname}")` : ""}</span>
                  </>
                )}
                {data.projectInfo.teenBirthday && (
                  <>
                    <span className="text-gray-500">Date of Birth</span>
                    <span>{formatDate(new Date(data.projectInfo.teenBirthday).toISOString().slice(0, 10))}</span>
                  </>
                )}
                {data.projectInfo.teenSchool && (
                  <>
                    <span className="text-gray-500">School</span>
                    <span>{data.projectInfo.teenSchool}{data.projectInfo.teenHasIep ? " (IEP)" : ""}</span>
                  </>
                )}
                {data.projectInfo.teenDiagnosis && (
                  <>
                    <span className="text-gray-500">Diagnosis</span>
                    <span>{data.projectInfo.teenDiagnosis}</span>
                  </>
                )}
                {data.projectInfo.teenOtherHealth && (
                  <>
                    <span className="text-gray-500">Other Health</span>
                    <span>{data.projectInfo.teenOtherHealth}</span>
                  </>
                )}
                {data.projectInfo.onsetDate && (
                  <>
                    <span className="text-gray-500">Onset Date</span>
                    <span>{formatDate(new Date(data.projectInfo.onsetDate).toISOString().slice(0, 10))}</span>
                  </>
                )}
                {data.projectInfo.familyHistory && (
                  <>
                    <span className="text-gray-500">Family History</span>
                    <span>{data.projectInfo.familyHistory}</span>
                  </>
                )}
              </div>
              {data.medications.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-500">Active Medications</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {data.medications.map((med, i) => (
                      <span key={i} className="rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs text-green-800">
                        {med.name}{med.dosage ? ` ${med.dosage}` : ""}{med.frequency ? ` (${med.frequency})` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {data.strategies.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-500">Strategies</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {data.strategies.map((s, i) => (
                      <span key={i} className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs text-blue-800">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Days logged" value={new Set(data.days.map((d) => d.date)).size} />
            <StatCard
              label="Manic days"
              value={data.days.filter((d) => d.score.classification === "MANIC").length}
              color="text-orange-600"
            />
            <StatCard
              label="Depressive days"
              value={data.days.filter((d) => d.score.classification === "DEPRESSIVE").length}
              color="text-blue-600"
            />
            <StatCard
              label="Mixed days"
              value={data.days.filter((d) => d.score.classification === "MIXED").length}
              color="text-purple-600"
            />
          </div>

          {/* Wave Graph */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Symptom Wave
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              Manic criteria score positive, depressive criteria score negative.
              {data.days.some((d) => d.hasPeriod) && " Pink bars indicate period days."}
            </p>
            <div className="mt-3">
              <WaveGraph days={data.days} />
            </div>
          </section>

          {/* Episodes */}
          {data.episodes.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Possible Episodes
              </h2>
              <div className="mt-2 space-y-2">
                {data.episodes.map((ep, i) => (
                  <div
                    key={i}
                    className={`rounded-md border px-4 py-3 ${episodeColors[ep.type]}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        Possible {ep.type.charAt(0) + ep.type.slice(1).toLowerCase()} episode
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          ({ep.confidence === "DSM5_MET" ? "Pattern consistent with DSM-5 criteria" : "Emerging pattern of concern"})
                        </span>
                      </p>
                      <span className="text-xs text-gray-500">{ep.dayCount} days</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">
                      {formatDate(ep.startDate)} — {formatDate(ep.endDate)}
                      {" · Peak severity: "}
                      {ep.peakSeverity.toLowerCase()}
                      {ep.hasSafetyConcern && (
                        <span className="ml-2 font-semibold text-red-600">
                          Safety concern flagged
                        </span>
                      )}
                    </p>
                    {(() => {
                      const episodeDays = data.days.filter(
                        (d) => d.date >= ep.startDate && d.date <= ep.endDate
                      );
                      const missedDays = episodeDays.filter((d) => d.missedMedIds.length > 0);
                      return missedDays.length > 0 ? (
                        <p className="mt-1 text-xs text-amber-700">
                          Medications missed on {missedDays.length} of {episodeDays.length} days during this period
                        </p>
                      ) : null;
                    })()}
                    <p className="mt-1 text-[10px] text-gray-500 italic">{ep.criteriaNote}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Signals */}
          {data.signals.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Prodrome Signals
              </h2>
              <div className="mt-2 space-y-2">
                {data.signals.map((s) => (
                  <div
                    key={s.id}
                    className={`rounded-md border px-4 py-3 ${signalColors[s.level]}`}
                  >
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="mt-0.5 text-xs">{s.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Behavior Frequency */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Behavior Frequency (Top 15)
            </h2>
            <div className="mt-3">
              <FrequencyChart data={data.behaviorFrequency} behaviorLabelMap={behaviorLabelMap} />
            </div>
          </section>

          {/* Impairment Summary */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Impairment Summary
            </h2>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 font-medium">Domain</th>
                    <th className="pb-2 font-medium">Present</th>
                    <th className="pb-2 font-medium">Severe</th>
                  </tr>
                </thead>
                <tbody>
                  {data.impairmentSummary.map((imp) => (
                    <tr key={imp.domain} className="border-b border-gray-100">
                      <td className="py-2">{IMPAIRMENT_LABELS[imp.domain] || imp.domain}</td>
                      <td className="py-2">
                        {imp.presentCount > 0 ? (
                          <span className="text-amber-600">{imp.presentCount} days</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-2">
                        {imp.severeCount > 0 ? (
                          <span className="font-medium text-red-600">{imp.severeCount} days</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Caregiver Notes */}
          {data.days.some((d) => d.notes) && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Caregiver Notes
              </h2>
              <div className="mt-2 space-y-3">
                {data.days
                  .filter((d) => d.notes)
                  .map((d) => (
                    <div key={d.date} className="rounded-md border border-gray-200 px-4 py-3">
                      <p className="text-xs font-medium text-gray-500">
                        {formatDate(d.date)}
                        {d.userName && <span className="ml-2 text-gray-400">— {d.userName}</span>}
                      </p>
                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{d.notes}</p>
                    </div>
                  ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-md border border-gray-200 px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color ?? "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function printReport() {
  window.print();
}
