"use client";

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
import { type ReportDay } from "@/lib/actions/report-actions";

interface WaveGraphProps {
  days: ReportDay[];
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

const classColors: Record<string, string> = {
  MANIC: "#f97316",
  DEPRESSIVE: "#3b82f6",
  MIXED: "#a855f7",
  NEUTRAL: "#9ca3af",
};

export function WaveGraph({ days }: WaveGraphProps) {
  // Aggregate by date (highest score if multiple entries)
  const byDate = new Map<string, ChartPoint>();

  for (const day of days) {
    const existing = byDate.get(day.date);
    const total =
      day.score.manicCriteriaCount + day.score.depressiveCriteriaCount;
    const existingTotal = existing
      ? existing.manicCriteria + existing.depressiveCriteria
      : 0;

    if (!existing || total > existingTotal) {
      byDate.set(day.date, {
        date: day.date,
        label: new Date(day.date + "T00:00:00Z").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        waveScore: day.score.waveScore,
        manicCriteria: day.score.manicCriteriaCount,
        depressiveCriteria: -day.score.depressiveCriteriaCount, // negative for graph
        classification: day.score.classification,
        severity: day.score.severity,
        period: day.hasPeriod ? -0.3 : null, // small dot below baseline
      });
    } else if (existing && day.hasPeriod) {
      existing.period = -0.3;
    }
  }

  const data = Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        No data in this range.
      </p>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10 }}
            domain={[-9, 7]}
            ticks={[-9, -6, -3, 0, 3, 6]}
            tickFormatter={(v: number) => (v >= 0 ? `+${v}` : `${v}`)}
          />
          <ReferenceLine y={0} stroke="#374151" strokeWidth={1.5} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={28}
            formatter={(value: string) => (
              <span className="text-xs text-gray-600">{value}</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="waveScore"
            name="Wave score"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.1}
            strokeWidth={2}
            dot={(props: Record<string, unknown>) => {
              const { cx, cy, payload } = props as {
                cx: number;
                cy: number;
                payload: ChartPoint;
              };
              const color = classColors[payload.classification] || "#9ca3af";
              return (
                <circle
                  key={payload.date}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={color}
                  stroke="white"
                  strokeWidth={1.5}
                />
              );
            }}
          />
          <Bar
            dataKey="period"
            name="Period"
            fill="#ec4899"
            barSize={6}
            radius={[3, 3, 0, 0]}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[10px] text-gray-400">
        Above 0 = manic criteria · Below 0 = depressive criteria · Dot color =
        day classification
      </p>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold">{d.label}</p>
      <p>
        Classification:{" "}
        <span style={{ color: classColors[d.classification] }}>
          {d.classification.toLowerCase()}
        </span>
      </p>
      <p>
        Manic criteria: {d.manicCriteria}/7 · Depressive:{" "}
        {Math.abs(d.depressiveCriteria)}/9
      </p>
      <p>Severity: {d.severity.toLowerCase()}</p>
      {d.period !== null && (
        <p className="text-pink-600">Period logged</p>
      )}
    </div>
  );
}
