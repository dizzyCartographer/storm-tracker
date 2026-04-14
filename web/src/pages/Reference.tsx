import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  getActiveFrameworks,
  getFrameworkPoles,
  getCriteriaByPoles,
  getBehaviorCategories,
  getBehaviorDefinitions,
  getBehaviorCriterionMappings,
  getClassificationRules,
  getEpisodeThresholds,
  type ReferencePole,
  type ReferenceCriterion,
  type ReferenceBehaviorMapping,
  type ReferenceClassificationRule,
  type ReferenceEpisodeThreshold,
  type BehaviorCategoryRow,
  type BehaviorDefinitionRow,
} from "../lib/api";

interface FrameworkData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  poles: (ReferencePole & { criteria: ReferenceCriterion[] })[];
  categories: (BehaviorCategoryRow & {
    behaviors: (BehaviorDefinitionRow & {
      criterionMappings: {
        poleSlug: string;
        poleName: string;
        criterionNumber: number;
        criterionName: string;
        criterionType: string;
      }[];
    })[];
  })[];
  classificationRules: (ReferenceClassificationRule & { poleName: string; poleSlug: string })[];
  episodeThresholds: (ReferenceEpisodeThreshold & { poleName: string; poleSlug: string })[];
}

const categoryEmojis: Record<string, string> = {
  manic: "\u{1F534}",
  depressive: "\u{1F535}",
};

const classificationColors: Record<string, string> = {
  MANIC: "bg-[#FDF4E8] text-[#9A5B13] border-[#F5D5A0]",
  DEPRESSIVE: "bg-[#E0F2F1] text-[#1A5E6C] border-[#B2DFDB]",
  MIXED: "bg-[#EDE5F5] text-[#5E3D8A] border-[#D1C4E9]",
};

const poleColors: Record<string, string> = {
  manic: "text-[#9A5B13] bg-[#FDF4E8] border-[#F5D5A0]",
  depressive: "text-[#1A5E6C] bg-[#E0F2F1] border-[#B2DFDB]",
};

export default function Reference() {
  const [frameworks, setFrameworks] = useState<FrameworkData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferenceData();
  }, []);

  async function loadReferenceData() {
    try {
      const fws = await getActiveFrameworks();
      const results: FrameworkData[] = [];

      for (const fw of fws) {
        const [poles, cats, mappings, rules, thresholds] = await Promise.all([
          getFrameworkPoles(fw.id),
          getBehaviorCategories(fw.id),
          getBehaviorCriterionMappings(fw.id),
          getClassificationRules(fw.id),
          getEpisodeThresholds(fw.id),
        ]);

        // Get criteria for all poles
        const poleIds = poles.map((p) => p.id);
        const criteria = await getCriteriaByPoles(poleIds);

        // Get behavior definitions for all categories
        const catIds = cats.map((c) => c.id);
        const defs = catIds.length > 0 ? await getBehaviorDefinitions(catIds) : [];

        // Build lookup maps
        const criterionMap = new Map(criteria.map((c) => [c.id, c]));
        const poleMap = new Map(poles.map((p) => [p.id, p]));
        // defMap available if needed for future lookups
        void defs;

        // Group criteria by pole
        const polesWithCriteria = poles.map((p) => ({
          ...p,
          criteria: criteria.filter((c) => c.poleId === p.id),
        }));

        // Build behavior criterion mappings grouped by behavior
        const behaviorMappingsMap = new Map<string, ReferenceBehaviorMapping[]>();
        for (const m of mappings) {
          const existing = behaviorMappingsMap.get(m.behaviorId) ?? [];
          existing.push(m);
          behaviorMappingsMap.set(m.behaviorId, existing);
        }

        // Group behaviors by category with resolved criterion mappings
        const categoriesWithBehaviors = cats.map((cat) => ({
          ...cat,
          behaviors: defs
            .filter((d) => d.categoryId === cat.id)
            .map((d) => {
              const bMappings = behaviorMappingsMap.get(d.id) ?? [];
              return {
                ...d,
                criterionMappings: bMappings.map((m) => {
                  const criterion = criterionMap.get(m.criterionId);
                  const pole = criterion ? poleMap.get(criterion.poleId) : null;
                  return {
                    poleSlug: pole?.slug ?? "",
                    poleName: pole?.name ?? "",
                    criterionNumber: criterion?.number ?? 0,
                    criterionName: criterion?.name ?? "",
                    criterionType: criterion?.criterionType ?? "STANDARD",
                  };
                }),
              };
            }),
        }));

        // Resolve pole names on classification rules and thresholds
        const rulesWithPole = rules.map((r) => {
          const pole = poleMap.get(r.poleId);
          return { ...r, poleName: pole?.name ?? "", poleSlug: pole?.slug ?? "" };
        });
        const thresholdsWithPole = thresholds.map((t) => {
          const pole = poleMap.get(t.poleId);
          return { ...t, poleName: pole?.name ?? "", poleSlug: pole?.slug ?? "" };
        });

        results.push({
          ...fw,
          poles: polesWithCriteria,
          categories: categoriesWithBehaviors,
          classificationRules: rulesWithPole,
          episodeThresholds: thresholdsWithPole,
        });
      }

      setFrameworks(results);
    } catch (err) {
      console.error("Failed to load reference data:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <p className="text-[#475569]">Loading reference data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link to="/dashboard" className="text-sm text-[#475569] hover:text-[#0F172A]">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="mb-10">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-2">How Storm Tracker works</h1>
        <p className="text-sm text-[#475569] leading-relaxed">
          Storm Tracker uses clinically grounded diagnostic frameworks to analyze the behavioral
          observations you log. This page explains exactly how each behavior checkbox maps to
          formal DSM-5 criteria, how days are classified, and how episodes are detected. This
          information is provided for transparency — all diagnostic decisions should be made by
          a qualified clinician.
        </p>
      </div>

      {frameworks.length === 0 ? (
        <p className="text-sm text-[#475569]">No diagnostic frameworks are currently configured.</p>
      ) : (
        frameworks.map((fw) => (
          <div key={fw.slug}>
            <div className="mb-8 rounded-xl border border-[#D1E8E4] bg-white p-4">
              <h2 className="font-semibold text-[#0F172A]">{fw.name}</h2>
              {fw.description && (
                <p className="mt-1 text-sm text-[#475569]">{fw.description}</p>
              )}
            </div>
            <FrameworkSection framework={fw} />
          </div>
        ))
      )}
    </div>
  );
}

function CriterionBadge({ mapping }: { mapping: { poleSlug: string; poleName: string; criterionNumber: number; criterionType: string } }) {
  const isGate = mapping.criterionType === "GATE";
  const isCore = mapping.criterionType === "CORE";
  const poleColor = mapping.poleSlug === "manic"
    ? "bg-[#FDF4E8] text-[#9A5B13] border-[#F5D5A0]"
    : "bg-[#E0F2F1] text-[#1A5E6C] border-[#B2DFDB]";

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

function BehaviorRow({ behavior }: { behavior: FrameworkData["categories"][0]["behaviors"][0] }) {
  let parsedExamples: string[] | null = null;
  if (behavior.recognitionExamples) {
    try { parsedExamples = JSON.parse(behavior.recognitionExamples); } catch { /* ignore */ }
  }

  return (
    <div className={`flex flex-col gap-1.5 rounded-xl border px-4 py-3 ${behavior.isSafetyConcern ? "border-[#FECACA] bg-[#FEF2F2]/30" : "border-[#E2F0ED] bg-white"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[#0F172A]">
            {behavior.label}
            {behavior.isSafetyConcern && (
              <span className="ml-2 inline-flex items-center rounded bg-[#FEF2F2] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#DC2626]">
                safety concern
              </span>
            )}
          </p>
          <p className="text-xs text-[#475569]">{behavior.description}</p>
        </div>
      </div>
      {behavior.criterionMappings.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {behavior.criterionMappings.map((m, i) => (
            <CriterionBadge key={i} mapping={m} />
          ))}
        </div>
      )}
      {parsedExamples && parsedExamples.length > 0 && (
        <div className="mt-1">
          <p className="text-[11px] font-medium text-[#94A3B8] italic mb-0.5">This might look like:</p>
          <ul className="text-xs text-[#475569] list-disc pl-4 space-y-0">
            {parsedExamples.map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FrameworkSection({ framework }: { framework: FrameworkData }) {
  return (
    <div className="space-y-10">
      {/* Behavior-to-Criteria Mappings */}
      <section>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-1">Criterion checklist</h2>
        <p className="text-sm text-[#475569] mb-6">
          Each checkbox in Storm Tracker corresponds directly to a DSM-5 diagnostic criterion.
          The &ldquo;this might look like&rdquo; examples under each checkbox help you recognize
          the criterion in everyday teen behavior — check the box if any of the examples fit.
        </p>

        <div className="space-y-8">
          {framework.categories.map((cat) => (
            <div key={cat.slug}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#475569]">
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
        <h2 className="text-lg font-semibold text-[#0F172A] mb-1">DSM-5 criteria reference</h2>
        <p className="text-sm text-[#475569] mb-6">
          These are the formal diagnostic criteria that behaviors are mapped to.
          Understanding the difference between gate, core, and standard criteria is
          key to reading Storm Tracker&apos;s analysis.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {framework.poles.map((pole) => (
            <div key={pole.slug} className={`rounded-xl border p-4 ${poleColors[pole.slug] ?? "bg-[#F0FDFA] border-[#D1E8E4] text-[#475569]"}`}>
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
                          ? "bg-[#FFFBEB] text-[#D97706]"
                          : c.criterionType === "CORE"
                          ? "bg-[#ECFDF5] text-[#059669]"
                          : "bg-white/50 text-[#475569]"
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

        <div className="mt-4 rounded-xl border border-[#D1E8E4] bg-[#F0FDFA] p-4">
          <h4 className="text-sm font-semibold text-[#0F172A] mb-2">Criterion types explained</h4>
          <dl className="space-y-2 text-sm text-[#475569]">
            <div>
              <dt className="inline font-medium">
                <span className="rounded bg-[#FFFBEB] px-1.5 py-0.5 text-xs font-semibold text-[#D97706] mr-1">Gate</span>
              </dt>
              <dd className="inline">
                Must be satisfied before any other criteria on that pole are counted.
                For mania, this means elevated, expansive, or irritable mood must be present.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium">
                <span className="rounded bg-[#ECFDF5] px-1.5 py-0.5 text-xs font-semibold text-[#059669] mr-1">Core</span>
              </dt>
              <dd className="inline">
                At least one core criterion must be present. For depression, either depressed mood
                or loss of interest/pleasure must be observed.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium">
                <span className="rounded bg-[#E2F0ED] px-1.5 py-0.5 text-xs font-semibold text-[#475569] mr-1">Standard</span>
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
        <h2 className="text-lg font-semibold text-[#0F172A] mb-1">How days are classified</h2>
        <p className="text-sm text-[#475569] mb-6">
          Each day&apos;s logged behaviors are evaluated against these rules in priority order.
          The first rule that matches determines the day&apos;s classification. A day with no
          matching rule is classified as <strong>neutral</strong>.
        </p>

        <div className="space-y-3">
          {framework.classificationRules.map((rule, i) => {
            const colorClass = classificationColors[rule.classificationLabel] ?? "bg-[#F0FDFA] text-[#0F172A] border-[#D1E8E4]";
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
              <div key={i} className={`rounded-xl border p-4 ${colorClass}`}>
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

        <div className="mt-4 rounded-xl border border-[#D1E8E4] bg-[#F0FDFA] p-4 text-sm text-[#475569]">
          <p>
            <strong>Subthreshold</strong> classifications indicate that some criteria are present
            but not enough to meet the full DSM-5 threshold. These are still clinically meaningful,
            especially for prodromal tracking.
          </p>
        </div>
      </section>

      {/* Episode Detection */}
      <section>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-1">Episode detection</h2>
        <p className="text-sm text-[#475569] mb-6">
          When multiple consecutive days share the same classification, Storm Tracker evaluates
          whether the pattern meets the duration criteria for a clinical episode.
          A single day gap is allowed for missed logging.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#D1E8E4] text-left">
                <th className="pb-2 pr-4 font-medium text-[#475569]">Episode</th>
                <th className="pb-2 pr-4 font-medium text-[#475569]">Confidence</th>
                <th className="pb-2 pr-4 font-medium text-[#475569]">Min. days</th>
                <th className="pb-2 font-medium text-[#475569]">Requires full DSM criteria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2F0ED]">
              {framework.episodeThresholds.map((t, i) => (
                <tr key={i}>
                  <td className="py-2 pr-4 font-medium text-[#0F172A]">{t.episodeLabel}</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      t.confidenceLevel === "DSM5_MET"
                        ? "bg-[#ECFDF5] text-[#059669]"
                        : "bg-[#FFFBEB] text-[#D97706]"
                    }`}>
                      {t.confidenceLevel === "DSM5_MET" ? "DSM-5 met" : "Prodromal concern"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-[#475569]">{t.minDays} days</td>
                  <td className="py-2 text-[#475569]">{t.requiresDsmSymptoms ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-xl border border-[#D1E8E4] bg-[#F0FDFA] p-4 text-sm text-[#475569] space-y-2">
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
        <h2 className="text-lg font-semibold text-[#0F172A] mb-1">Symptom wave score</h2>
        <p className="text-sm text-[#475569] mb-4">
          The wave graph on the reports page plots a daily score over time. Each day&apos;s score
          is calculated from the number of criteria met on each pole:
        </p>
        <div className="rounded-xl border border-[#D1E8E4] bg-[#F0FDFA] p-4 text-sm text-[#475569] space-y-2">
          <p>
            <strong>Manic criteria</strong> score <span className="font-mono text-[#9A5B13]">+1</span> each.{" "}
            <strong>Depressive criteria</strong> score <span className="font-mono text-[#1A5E6C]">-1</span> each.
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
