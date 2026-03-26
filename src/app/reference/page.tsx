import { getReferenceData } from "@/lib/actions/reference-actions";
import type { ReferenceFramework, ReferenceBehavior } from "@/lib/actions/reference-actions";
import Link from "next/link";

const categoryEmojis: Record<string, string> = {
  sleep: "\u{1F4A4}",
  energy: "\u{26A1}",
  manic: "\u{1F525}",
  depressive: "\u{1F4A7}",
  "mixed-cycling": "\u{1F300}",
};

const classificationColors: Record<string, string> = {
  MANIC: "bg-orange-100 text-orange-800 border-orange-200",
  DEPRESSIVE: "bg-blue-100 text-blue-800 border-blue-200",
  MIXED: "bg-purple-100 text-purple-800 border-purple-200",
};

const poleColors: Record<string, string> = {
  manic: "text-orange-700 bg-orange-50 border-orange-200",
  depressive: "text-blue-700 bg-blue-50 border-blue-200",
};

function CriterionBadge({ mapping }: { mapping: ReferenceBehavior["criterionMappings"][0] }) {
  const isGate = mapping.criterionType === "GATE";
  const isCore = mapping.criterionType === "CORE";
  const poleColor = mapping.poleSlug === "manic"
    ? "bg-orange-50 text-orange-700 border-orange-200"
    : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${poleColor}`}>
      {mapping.poleName}
      {isGate ? " Gate" : isCore ? ` Core #${mapping.criterionNumber}` : ` B${mapping.criterionNumber}`}
      {(isGate || isCore) && (
        <span className="ml-0.5 rounded bg-white/60 px-1 text-[10px] font-semibold uppercase">
          {isGate ? "required" : "core"}
        </span>
      )}
    </span>
  );
}

function BehaviorRow({ behavior }: { behavior: ReferenceBehavior }) {
  return (
    <div className={`flex flex-col gap-1.5 rounded-lg border px-4 py-3 ${behavior.isSafetyConcern ? "border-red-200 bg-red-50/30" : "border-gray-100 bg-white"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {behavior.label}
            {behavior.isSafetyConcern && (
              <span className="ml-2 inline-flex items-center rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                safety concern
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500">{behavior.description}</p>
        </div>
      </div>
      {behavior.criterionMappings.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {behavior.criterionMappings.map((m, i) => (
            <CriterionBadge key={i} mapping={m} />
          ))}
        </div>
      ) : (
        <p className="text-xs italic text-gray-400">Observational only — not mapped to a specific DSM criterion</p>
      )}
    </div>
  );
}

function FrameworkSection({ framework }: { framework: ReferenceFramework }) {
  return (
    <div className="space-y-10">
      {/* Behavior-to-Criteria Mappings */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Behavior checklist &amp; diagnostic criteria</h2>
        <p className="text-sm text-gray-500 mb-6">
          Each behavior you can log in Storm Tracker maps to one or more DSM-5 diagnostic criteria.
          The badges show which criterion each behavior satisfies and whether it counts toward the
          manic or depressive pole.
        </p>

        <div className="space-y-8">
          {framework.behaviorCategories.map((cat) => (
            <div key={cat.slug}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {categoryEmojis[cat.slug] && <span>{categoryEmojis[cat.slug]}</span>}
                {cat.name}
              </h3>
              <div className="space-y-2">
                {cat.behaviors.map((beh) => (
                  <BehaviorRow key={beh.itemKey} behavior={beh} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DSM-5 Criteria Reference */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">DSM-5 criteria reference</h2>
        <p className="text-sm text-gray-500 mb-6">
          These are the formal diagnostic criteria that behaviors are mapped to.
          Understanding the difference between gate, core, and standard criteria is
          key to reading Storm Tracker&apos;s analysis.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {framework.poles.map((pole) => (
            <div key={pole.slug} className={`rounded-lg border p-4 ${poleColors[pole.slug] ?? "bg-gray-50 border-gray-200 text-gray-700"}`}>
              <h3 className="mb-3 font-semibold">{pole.name} criteria</h3>
              <div className="space-y-2">
                {pole.criteria.map((c) => {
                  const typeLabel = c.criterionType === "GATE"
                    ? "Gate"
                    : c.criterionType === "CORE"
                    ? "Core"
                    : `#${c.number}`;
                  return (
                    <div key={c.number} className="flex items-start gap-2 text-sm">
                      <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${
                        c.criterionType === "GATE"
                          ? "bg-amber-200 text-amber-800"
                          : c.criterionType === "CORE"
                          ? "bg-emerald-200 text-emerald-800"
                          : "bg-white/50 text-gray-600"
                      }`}>
                        {typeLabel}
                      </span>
                      <span>{c.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Criterion types explained</h4>
          <dl className="space-y-2 text-sm text-gray-600">
            <div>
              <dt className="inline font-medium">
                <span className="rounded bg-amber-200 px-1.5 py-0.5 text-xs font-semibold text-amber-800 mr-1">Gate</span>
              </dt>
              <dd className="inline">
                Must be satisfied before any other criteria on that pole are counted.
                For mania, this means elevated, expansive, or irritable mood must be present.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium">
                <span className="rounded bg-emerald-200 px-1.5 py-0.5 text-xs font-semibold text-emerald-800 mr-1">Core</span>
              </dt>
              <dd className="inline">
                At least one core criterion must be present. For depression, either depressed mood
                or loss of interest/pleasure must be observed.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium">
                <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-semibold text-gray-600 mr-1">Standard</span>
              </dt>
              <dd className="inline">
                Counted criteria — once the gate or core requirements are met, these are tallied
                against the classification thresholds.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Classification Thresholds */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">How days are classified</h2>
        <p className="text-sm text-gray-500 mb-6">
          Each day&apos;s logged behaviors are evaluated against these rules in priority order.
          The first rule that matches determines the day&apos;s classification. A day with no
          matching rule is classified as <strong>neutral</strong>.
        </p>

        <div className="space-y-3">
          {framework.classificationRules.map((rule, i) => {
            const colorClass = classificationColors[rule.classificationLabel] ?? "bg-gray-100 text-gray-800 border-gray-200";
            const requirements: string[] = [];

            if (rule.gateRequired) {
              requirements.push("Gate criterion met");
              if (rule.gateOnlyAdjustment > 0) {
                requirements.push(`${rule.minStandardCriteria} B criteria (${rule.minStandardCriteria + rule.gateOnlyAdjustment} if irritable mood only)`);
              } else {
                requirements.push(`${rule.minStandardCriteria}+ B criteria`);
              }
            }
            if (rule.coreRequired) {
              requirements.push("At least 1 core criterion");
              requirements.push(`${rule.minStandardCriteria}+ total criteria`);
            }
            if (rule.minOppositeCriteria > 0) {
              requirements.push(`${rule.minOppositeCriteria}+ opposite-pole criteria (mixed features)`);
            }

            return (
              <div key={i} className={`rounded-lg border p-4 ${colorClass}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">{rule.classificationLabel}</span>
                  <span className="rounded bg-white/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                    {rule.ruleType === "DSM5_FULL" ? "Full criteria" : "Subthreshold"}
                  </span>
                  <span className="ml-auto text-xs opacity-60">Priority {rule.priority}</span>
                </div>
                <p className="text-xs font-medium mb-1">
                  Primary pole: {rule.poleName}
                </p>
                <ul className="space-y-0.5 text-xs">
                  {requirements.map((req, j) => (
                    <li key={j} className="flex items-center gap-1.5">
                      <span className="text-[10px]">&#x2713;</span> {req}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          <p>
            <strong>Subthreshold</strong> classifications indicate that some criteria are present
            but not enough to meet the full DSM-5 threshold. These are still clinically meaningful,
            especially for prodromal tracking.
          </p>
        </div>
      </section>

      {/* Episode Detection */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Episode detection</h2>
        <p className="text-sm text-gray-500 mb-6">
          When multiple consecutive days share the same classification, Storm Tracker evaluates
          whether the pattern meets the duration criteria for a clinical episode.
          A single day gap is allowed for missed logging.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="pb-2 pr-4 font-medium text-gray-500">Episode</th>
                <th className="pb-2 pr-4 font-medium text-gray-500">Confidence</th>
                <th className="pb-2 pr-4 font-medium text-gray-500">Min. days</th>
                <th className="pb-2 font-medium text-gray-500">Requires full DSM criteria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {framework.episodeThresholds.map((t, i) => (
                <tr key={i}>
                  <td className="py-2 pr-4 font-medium text-gray-900">{t.episodeLabel}</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      t.confidenceLevel === "DSM5_MET"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {t.confidenceLevel === "DSM5_MET" ? "DSM-5 met" : "Prodromal concern"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-700">{t.minDays} days</td>
                  <td className="py-2 text-gray-700">{t.requiresDsmSymptoms ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 space-y-2">
          <p>
            <strong>DSM-5 met</strong> means the consecutive days each individually meet the full
            diagnostic symptom threshold (e.g., gate + 3 B criteria for mania). This is the
            clinical standard.
          </p>
          <p>
            <strong>Prodromal concern</strong> flags patterns that don&apos;t yet meet the full clinical
            bar but are consistent with early bipolar signs. These are designed to surface
            warning signals before a full episode develops.
          </p>
        </div>
      </section>

      {/* Wave Score */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Symptom wave score</h2>
        <p className="text-sm text-gray-500 mb-4">
          The wave graph on the reports page plots a daily score over time. Each day&apos;s score
          is calculated from the number of criteria met on each pole:
        </p>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 space-y-2">
          <p>
            <strong>Manic criteria</strong> score <span className="font-mono text-orange-700">+1</span> each.{" "}
            <strong>Depressive criteria</strong> score <span className="font-mono text-blue-700">-1</span> each.
          </p>
          <p>
            The wave score is the sum: a day with 4 manic criteria and 1 depressive criterion
            would score <span className="font-mono">+3</span>. This produces a wave that visualizes
            the oscillation between manic and depressive poles over time.
          </p>
        </div>
      </section>
    </div>
  );
}

export default async function ReferencePage() {
  const frameworks = await getReferenceData();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">How Storm Tracker works</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Storm Tracker uses clinically grounded diagnostic frameworks to analyze the behavioral
          observations you log. This page explains exactly how each behavior checkbox maps to
          formal DSM-5 criteria, how days are classified, and how episodes are detected. This
          information is provided for transparency — all diagnostic decisions should be made by
          a qualified clinician.
        </p>
      </div>

      {frameworks.length === 0 ? (
        <p className="text-sm text-gray-500">No diagnostic frameworks are currently configured.</p>
      ) : (
        frameworks.map((fw) => (
          <div key={fw.slug}>
            <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="font-semibold text-gray-900">{fw.name}</h2>
              {fw.description && (
                <p className="mt-1 text-sm text-gray-500">{fw.description}</p>
              )}
            </div>
            <FrameworkSection framework={fw} />
          </div>
        ))
      )}
    </main>
  );
}
