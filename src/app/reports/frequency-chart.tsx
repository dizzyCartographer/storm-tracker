"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

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

  return (
    <div style={{ height: Math.max(200, chartData.length * 28) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
        >
          <XAxis type="number" tick={{ fontSize: 10 }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 10 }}
            width={140}
          />
          <Tooltip
            formatter={(value) => [`${value} days`, "Frequency"]}
          />
          <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
