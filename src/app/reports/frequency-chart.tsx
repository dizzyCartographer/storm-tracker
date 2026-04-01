"use client";

interface FrequencyChartProps {
  data: { key: string; count: number; percentage: number }[];
  behaviorLabelMap?: Record<string, string>;
}

export function FrequencyChart({ data, behaviorLabelMap }: FrequencyChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-400">
        No behaviors logged in this range.
      </p>
    );
  }

  const chartData = data.slice(0, 15).map((d) => ({
    name: behaviorLabelMap?.[d.key] || d.key,
    count: d.count,
    percentage: d.percentage,
  }));

  const maxCount = Math.max(...chartData.map((d) => d.count));

  return (
    <div className="space-y-2">
      {chartData.map((d) => (
        <div key={d.name} className="flex items-start gap-3">
          <p className="w-48 shrink-0 text-right text-xs text-gray-700 leading-tight pt-0.5">
            {d.name}
          </p>
          <div className="flex flex-1 items-center gap-2">
            <div className="flex-1 h-5 rounded bg-gray-100">
              <div
                className="h-5 rounded bg-indigo-500"
                style={{ width: `${(d.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-xs text-gray-500 w-16">
              {d.count}d ({d.percentage}%)
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
