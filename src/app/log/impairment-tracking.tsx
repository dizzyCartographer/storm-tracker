"use client";

const DOMAINS = [
  { key: "SCHOOL_WORK", label: "School or work" },
  { key: "FAMILY_LIFE", label: "Family life" },
  { key: "FRIENDSHIPS", label: "Friendships" },
  { key: "SELF_CARE", label: "Self-care" },
  { key: "SAFETY_CONCERN", label: "Safety concern" },
] as const;

const SEVERITIES = ["NONE", "PRESENT", "SEVERE"] as const;

const severityLabels: Record<string, string> = {
  NONE: "None",
  PRESENT: "Present",
  SEVERE: "Severe",
};

interface ImpairmentTrackingProps {
  values: Record<string, string>;
  onChange: (domain: string, severity: string) => void;
}

export function ImpairmentTracking({ values, onChange }: ImpairmentTrackingProps) {
  return (
    <div className="space-y-3">
      {DOMAINS.map((domain) => (
        <div key={domain.key} className="flex items-center justify-between">
          <span className="text-sm font-medium">{domain.label}</span>
          <div className="flex gap-1">
            {SEVERITIES.map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => onChange(domain.key, sev)}
                className={`rounded px-3 py-1 text-xs font-medium ${
                  values[domain.key] === sev
                    ? sev === "SEVERE"
                      ? "bg-red-600 text-white"
                      : sev === "PRESENT"
                        ? "bg-yellow-500 text-white"
                        : "bg-gray-900 text-white"
                    : "border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {severityLabels[sev]}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
