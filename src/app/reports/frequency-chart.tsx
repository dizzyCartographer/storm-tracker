"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Human-readable labels for behavior keys
const BEHAVIOR_LABELS: Record<string, string> = {
  "very-little-sleep": "Very little sleep",
  "slept-too-much": "Slept too much",
  "irregular-sleep": "Irregular sleep",
  "no-energy": "No energy",
  "high-energy": "High energy",
  "selective-energy": "Selective energy",
  "psychosomatic": "Psychosomatic",
  "pressured-speech": "Pressured speech",
  "racing-thoughts": "Racing thoughts",
  "euphoria": "Euphoria",
  "grandiose": "Grandiose",
  "nonstop-activity": "Nonstop activity",
  "restless-agitation": "Restless agitation",
  "disproportionate-rage": "Disproportionate rage",
  "reckless-choices": "Reckless choices",
  "bizarre-behavior": "Bizarre behavior",
  "denies-anything-wrong": "Denies anything wrong",
  "sad-empty-hopeless": "Sad / empty / hopeless",
  "lost-interest": "Lost interest",
  "eating-more": "Eating more",
  "eating-less": "Eating less",
  "withdrawn": "Withdrawn",
  "worthless-guilt": "Worthless / guilt",
  "cant-focus": "Can't focus",
  "mentioned-death": "Mentioned death",
  "mood-swings": "Mood swings",
  "agitated-depressed": "Agitated but depressed",
  "unprovoked-temper": "Unprovoked temper",
  "unusual-anxiety": "Unusual anxiety",
  "aggressive-destructive": "Aggressive / destructive",
};

interface FrequencyChartProps {
  data: { key: string; count: number; percentage: number }[];
}

export function FrequencyChart({ data }: FrequencyChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-400">
        No behaviors logged in this range.
      </p>
    );
  }

  const chartData = data.slice(0, 15).map((d) => ({
    name: BEHAVIOR_LABELS[d.key] || d.key,
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
