"use client";

import { useState, useEffect } from "react";
import { getAnalysis, type AnalysisResult } from "@/lib/actions/analysis-actions";

function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-500 hover:bg-gray-300"
      >
        i
      </button>
      {open && (
        <>
          <span
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <span className="absolute left-0 top-6 z-20 w-64 rounded-md border border-gray-200 bg-white p-3 text-xs text-gray-600 shadow-lg leading-relaxed">
            {text}
          </span>
        </>
      )}
    </span>
  );
}

const classColors: Record<string, string> = {
  MANIC: "bg-orange-100 text-orange-800",
  DEPRESSIVE: "bg-blue-100 text-blue-800",
  MIXED: "bg-purple-100 text-purple-800",
  NEUTRAL: "bg-gray-100 text-gray-600",
};

const severityColors: Record<string, string> = {
  NONE: "text-gray-400",
  MILD: "text-yellow-600",
  MODERATE: "text-orange-600",
  SEVERE: "text-red-600",
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

const signalIcons: Record<string, string> = {
  ALERT: "!!",
  WARNING: "!",
  INFO: "i",
};

const confidenceLabels: Record<string, string> = {
  DSM5_MET: "DSM-5 criteria met",
  PRODROMAL_CONCERN: "Prodromal concern",
};

const confidenceStyles: Record<string, string> = {
  DSM5_MET: "bg-red-100 text-red-700",
  PRODROMAL_CONCERN: "bg-amber-100 text-amber-700",
};

export function AnalysisPanel({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalysis(tenantId).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [tenantId]);

  if (loading) {
    return <p className="mt-6 text-sm text-gray-400">Analyzing entries...</p>;
  }

  if (!data || data.dailyScores.length === 0) {
    return null;
  }

  const recent7 = data.dailyScores.slice(-7);

  return (
    <div className="mt-8 space-y-6">
      {/* Prodrome Signals */}
      {data.signals.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Signals
            <InfoTip text="Signals are early warning patterns detected across recent entries. They flag behavioral trends — like sleep disruption or escalating irritability — that research links to emerging bipolar episodes. These are not diagnoses, but patterns worth discussing with a clinician." />
          </h2>
          <div className="mt-2 space-y-2">
            {data.signals.map((signal) => (
              <div
                key={signal.id}
                className={`rounded-md border px-4 py-3 ${signalColors[signal.level]}`}
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold">
                    {signalIcons[signal.level]}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{signal.title}</p>
                    <p className="mt-0.5 text-xs">{signal.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Episodes */}
      {data.episodes.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Detected Episodes
            <InfoTip text="An episode is a sustained period of manic or depressive symptoms. The DSM-5 (Diagnostic and Statistical Manual) defines specific duration and symptom thresholds: manic episodes require 7+ days, hypomanic 4+ days, and depressive episodes 14+ days. Episodes labeled 'Prodromal concern' haven't met the full DSM-5 criteria yet but show an emerging pattern." />
          </h2>
          <div className="mt-2 space-y-2">
            {data.episodes.map((ep, i) => (
              <div
                key={i}
                className={`rounded-md border px-4 py-3 ${episodeColors[ep.type]}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">
                      {ep.type.charAt(0) + ep.type.slice(1).toLowerCase()} episode
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${confidenceStyles[ep.confidence]}`}>
                      {confidenceLabels[ep.confidence]}
                      <InfoTip text={
                        ep.confidence === "DSM5_MET"
                          ? "This pattern meets the DSM-5 diagnostic criteria for this type of episode based on both symptom count and duration. Share this with your clinician."
                          : "This pattern shows concerning signs but doesn't yet meet the full DSM-5 criteria — either the duration is too short or not enough distinct symptoms were logged. Continue monitoring."
                      } />
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {ep.dayCount} days
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {formatDate(ep.startDate)} — {formatDate(ep.endDate)}
                  {" · "}
                  Peak severity: <span className={severityColors[ep.peakSeverity]}>{ep.peakSeverity.toLowerCase()}</span>
                  {ep.hasSafetyConcern && (
                    <span className="ml-2 font-semibold text-red-600">
                      Safety concern flagged
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[10px] text-gray-500 italic">
                  {ep.criteriaNote}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Day Scores — mini timeline */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Last {recent7.length} Days
          <InfoTip text="Each column represents one day. The numbers show how many DSM-5 diagnostic criteria were observed that day. Orange numbers are manic criteria (out of 7 possible). Blue numbers are depressive criteria (out of 9 possible). The color of each cell shows the day's overall classification. Severity reflects how many criteria were met combined with functional impairment." />
        </h2>
        <div className="mt-2 flex gap-1">
          {recent7.map((day) => (
            <div
              key={day.date + day.userId}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span className="text-[10px] text-gray-400">
                {new Date(day.date + "T00:00:00Z").toLocaleDateString("en-US", {
                  weekday: "narrow",
                })}
              </span>
              <div
                className={`flex h-8 w-full items-center justify-center rounded text-xs font-medium ${classColors[day.score.classification]}`}
                title={`${day.score.classification} — Manic criteria: ${day.score.manicCriteriaCount}/7, Depressive criteria: ${day.score.depressiveCriteriaCount}/9`}
              >
                {day.score.manicCriteriaCount > 0 && (
                  <span className="text-orange-700">{day.score.manicCriteriaCount}</span>
                )}
                {day.score.manicCriteriaCount > 0 && day.score.depressiveCriteriaCount > 0 && (
                  <span className="text-gray-400 mx-0.5">/</span>
                )}
                {day.score.depressiveCriteriaCount > 0 && (
                  <span className="text-blue-700">{day.score.depressiveCriteriaCount}</span>
                )}
                {day.score.manicCriteriaCount === 0 && day.score.depressiveCriteriaCount === 0 && (
                  <span>—</span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${severityColors[day.score.severity]}`}>
                {day.score.severity !== "NONE" ? day.score.severity.toLowerCase() : "—"}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-gray-400">
          DSM-5 criteria count: <span className="text-orange-600">manic</span> / <span className="text-blue-600">depressive</span>
        </p>
      </section>

      {/* Predictions */}
      {data.predictions.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Predictions
            <InfoTip text="Predictions are based on patterns in your logged data — cycle length, recent trends, and day-of-week patterns. They help you anticipate what might be coming so you can prepare. Confidence levels reflect how much data supports each prediction." />
          </h2>
          <div className="mt-2 space-y-2">
            {data.predictions.map((pred) => (
              <div
                key={pred.id}
                className="rounded-md border border-indigo-200 bg-indigo-50 px-4 py-3"
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-indigo-900">{pred.title}</p>
                  <span className={`ml-2 flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    pred.confidence === "HIGH"
                      ? "bg-indigo-200 text-indigo-800"
                      : pred.confidence === "MEDIUM"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 text-gray-600"
                  }`}>
                    {pred.confidence.toLowerCase()} confidence
                  </span>
                </div>
                <p className="mt-1 text-xs text-indigo-800">{pred.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Caregiver Suggestions */}
      {data.suggestions.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Suggestions for You
            <InfoTip text="These are context-aware tips based on current mood patterns, signals, and predictions. They're drawn from clinical guidance for caregivers of teens with bipolar disorder. Adjust based on your knowledge of your teen." />
          </h2>
          <div className="mt-2 space-y-2">
            {data.suggestions.map((sug) => (
              <div
                key={sug.id}
                className={`rounded-md border px-4 py-3 ${
                  sug.priority === "HIGH"
                    ? "border-rose-200 bg-rose-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 border border-gray-200">
                    {sug.category.toLowerCase().replace("_", " ")}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${sug.priority === "HIGH" ? "text-rose-900" : "text-gray-900"}`}>
                      {sug.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">{sug.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Observer Discrepancies */}
      {data.discrepancies.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Observer Discrepancies
            <InfoTip text="These dates had multiple observers who logged entries with different mood classifications. Discrepancies are normal — different caregivers see different behaviors. Discuss these differences to build a more complete picture." />
          </h2>
          <div className="mt-2 space-y-2">
            {data.discrepancies.map((disc) => (
              <div
                key={disc.date}
                className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <p className="text-sm font-semibold text-amber-900">
                  {formatDate(disc.date)}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {disc.entries.map((e, i) => (
                    <span
                      key={i}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${classColors[e.classification]}`}
                    >
                      {e.userName ?? "Unknown"}: {e.mood.toLowerCase()} → {e.classification.toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
