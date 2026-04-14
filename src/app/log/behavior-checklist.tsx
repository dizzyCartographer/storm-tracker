"use client";

import { useState } from "react";

export interface BehaviorItem {
  key: string;
  category: string;
  categoryName: string;
  label: string;
  description: string;
  recognitionExamples: string[] | null;
  sortOrder: number;
  categorySortOrder: number;
}

interface BehaviorChecklistProps {
  checked: Set<string>;
  onToggle: (itemKey: string) => void;
  items: BehaviorItem[];
}

// Category-level emojis and colors
const categoryConfig: Record<string, { emoji: string; color: string; bgActive: string }> = {
  manic: { emoji: "\u{1F534}", color: "text-red-600", bgActive: "bg-red-700" },
  depressive: { emoji: "\u{1F535}", color: "text-blue-600", bgActive: "bg-blue-700" },
};

// Per-criterion emojis
const criterionEmojis: Record<string, string> = {
  // Manic
  "elevated-expansive-irritable-mood": "\u{1F525}", // 🔥
  "inflated-self-image": "\u{1F451}", // 👑
  "decreased-need-for-sleep": "\u{1F971}", // 🥱
  "pressured-speech": "\u{1F5E3}\u{FE0F}", // 🗣️
  "racing-thoughts": "\u{1F4AD}", // 💭
  "distractibility": "\u{1F4A5}", // 💥
  "goal-directed-activity": "\u{1F680}", // 🚀
  "risky-reckless-activities": "\u{26A0}\u{FE0F}", // ⚠️
  // Depressive
  "depressed-mood": "\u{1F614}", // 😔
  "diminished-interest": "\u{1F6AB}", // 🚫
  "weight-appetite-change": "\u{1F37D}\u{FE0F}", // 🍽️
  "insomnia-hypersomnia": "\u{1F634}", // 😴
  "psychomotor-change": "\u{1FA7A}", // 🩺
  "fatigue-loss-of-energy": "\u{1F50B}", // 🔋
  "worthlessness-guilt": "\u{1F494}", // 💔
  "diminished-concentration": "\u{1F635}", // 😵
  "thoughts-of-death": "\u{1F6A8}", // 🚨
};

// Sub-group labels based on criterion type
const criterionSubGroups: Record<string, { items: string[]; label: string }[]> = {
  manic: [
    { items: ["elevated-expansive-irritable-mood"], label: "Gate Criterion (required)" },
    { items: ["inflated-self-image", "decreased-need-for-sleep", "pressured-speech", "racing-thoughts", "distractibility", "goal-directed-activity", "risky-reckless-activities"], label: "B Criteria" },
  ],
  depressive: [
    { items: ["depressed-mood", "diminished-interest"], label: "Core Criteria (at least one required)" },
    { items: ["weight-appetite-change", "insomnia-hypersomnia", "psychomotor-change", "fatigue-loss-of-energy", "worthlessness-guilt", "diminished-concentration", "thoughts-of-death"], label: "Standard Criteria" },
  ],
};

function ExamplesPanel({ examples, isOpen, onToggle }: { examples: string[]; isOpen: boolean; onToggle: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-500 hover:bg-gray-300 shrink-0"
        title="This might look like..."
      >
        ?
      </button>
      {isOpen && (
        <div className="mt-1.5 w-full rounded-md border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-600">
          <p className="mb-1 font-medium text-gray-500 italic">This might look like:</p>
          <ul className="space-y-0.5 list-disc pl-4">
            {examples.map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export function BehaviorChecklist({ checked, onToggle, items }: BehaviorChecklistProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Group items by category
  const categories = new Map<string, { name: string; sortOrder: number; items: BehaviorItem[] }>();
  for (const item of items) {
    if (!categories.has(item.category)) {
      categories.set(item.category, { name: item.categoryName, sortOrder: item.categorySortOrder, items: [] });
    }
    categories.get(item.category)!.items.push(item);
  }

  const sortedCategories = Array.from(categories.entries())
    .sort(([, a], [, b]) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      {sortedCategories.map(([catSlug, cat]) => {
        const config = categoryConfig[catSlug] || { emoji: "", color: "text-gray-600", bgActive: "bg-gray-900" };
        const subGroups = criterionSubGroups[catSlug];
        const itemsByKey = new Map(cat.items.map((item) => [item.key, item]));

        return (
          <div key={catSlug} className="w-full min-w-0">
            <p className={`text-sm font-semibold uppercase tracking-wide ${config.color}`}>
              {config.emoji && <span className="mr-1">{config.emoji}</span>}
              {cat.name}
            </p>

            {subGroups ? (
              // Render with sub-group labels
              <div className="mt-2 space-y-3">
                {subGroups.map((group) => {
                  const groupItems = group.items
                    .map((key) => itemsByKey.get(key))
                    .filter((item): item is BehaviorItem => !!item);

                  if (groupItems.length === 0) return null;

                  return (
                    <div key={group.label}>
                      <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                        {group.label}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {groupItems.map((item) => {
                          const emoji = criterionEmojis[item.key];
                          const isChecked = checked.has(item.key);
                          const isExpanded = expandedItem === item.key;
                          const isSafety = item.key === "thoughts-of-death";

                          return (
                            <div key={item.key} className="flex flex-wrap items-start">
                              <label
                                className={`flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 ${
                                  isChecked
                                    ? isSafety
                                      ? "bg-red-600 text-white"
                                      : `${config.bgActive} text-white`
                                    : isSafety
                                      ? "border border-red-300 text-red-700 hover:bg-red-50"
                                      : "border border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => onToggle(item.key)}
                                  className="sr-only"
                                />
                                {emoji && <span className="text-sm leading-none">{emoji}</span>}
                                <span className="leading-tight">{item.label}</span>
                                {item.recognitionExamples && item.recognitionExamples.length > 0 && (
                                  <ExamplesPanel
                                    examples={item.recognitionExamples}
                                    isOpen={isExpanded}
                                    onToggle={() => setExpandedItem(isExpanded ? null : item.key)}
                                  />
                                )}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Fallback: flat list
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {cat.items
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((item) => {
                    const emoji = criterionEmojis[item.key];
                    const isChecked = checked.has(item.key);

                    return (
                      <label
                        key={item.key}
                        className={`flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 ${
                          isChecked
                            ? `${config.bgActive} text-white`
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggle(item.key)}
                          className="sr-only"
                        />
                        {emoji && <span className="text-sm leading-none">{emoji}</span>}
                        <span className="leading-tight">{item.label}</span>
                      </label>
                    );
                  })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
