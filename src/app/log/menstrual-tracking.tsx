"use client";

const SEVERITIES = ["LIGHT", "MEDIUM", "HEAVY"] as const;

const labels: Record<string, string> = {
  LIGHT: "Light",
  MEDIUM: "Medium",
  HEAVY: "Heavy",
};

interface MenstrualTrackingProps {
  value: string | null;
  onChange: (severity: string | null) => void;
}

export function MenstrualTracking({ value, onChange }: MenstrualTrackingProps) {
  return (
    <div>
      <p className="text-sm font-medium">Period today?</p>
      <div className="mt-2 flex gap-2">
        {SEVERITIES.map((sev) => (
          <button
            key={sev}
            type="button"
            onClick={() => onChange(value === sev ? null : sev)}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              value === sev
                ? "bg-gray-900 text-white"
                : "border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {labels[sev]}
          </button>
        ))}
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-1 text-xs text-gray-500 hover:text-gray-900"
        >
          Clear
        </button>
      )}
    </div>
  );
}
