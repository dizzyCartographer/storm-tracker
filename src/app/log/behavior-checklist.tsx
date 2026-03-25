"use client";

import { useState } from "react";

export interface BehaviorItem {
  key: string;
  category: string;
  categoryName: string;
  label: string;
  description: string;
  sortOrder: number;
  categorySortOrder: number;
}

interface BehaviorChecklistProps {
  checked: Set<string>;
  onToggle: (itemKey: string) => void;
  items: BehaviorItem[];
}

// Category-level emojis
const categoryEmojis: Record<string, string> = {
  sleep: "\u{1F4A4}",
  energy: "\u{26A1}",
  manic: "\u{1F525}",
  depressive: "\u{1F4A7}",
  "mixed-cycling": "\u{1F300}",
};

// Per-behavior emojis for compact mode
const behaviorEmojis: Record<string, string> = {
  // Sleep
  "very-little-sleep": "\u{1F971}",
  "slept-too-much": "\u{1F634}",
  "irregular-sleep-pattern": "\u{1F503}",
  // Energy
  "no-energy": "\u{1F50B}",
  "unusually-high-energy": "\u{1F3C3}",
  "selective-energy": "\u{1F3AF}",
  "psychosomatic-complaints": "\u{1FA7A}",
  // Manic
  "pressured-rapid-speech": "\u{1F5E3}",
  "racing-jumping-thoughts": "\u{1F4AD}",
  "euphoria-without-cause": "\u{1F929}",
  "grandiose-invincible": "\u{1F451}",
  "nonstop-goal-activity": "\u{1F680}",
  "physical-restless-agitation": "\u{1F3C3}",
  "disproportionate-rage": "\u{1F4A2}",
  "reckless-dangerous-choices": "\u{26A0}",
  "bizarre-out-of-character": "\u{1F3AD}",
  "denies-anything-wrong": "\u{1F648}",
  // Depressive
  "sad-empty-hopeless": "\u{1F614}",
  "lost-all-interest": "\u{1F6AB}",
  "eating-way-more": "\u{1F354}",
  "eating-way-less": "\u{1F6AB}",
  "withdrawn-from-people": "\u{1F6AA}",
  "worthless-excessive-guilt": "\u{1F494}",
  "cant-focus-decide": "\u{1F635}",
  "mentioned-death-dying": "\u{26A0}",
  // Mixed
  "mood-energy-swings": "\u{1F3A2}",
  "agitated-but-depressed": "\u{1F616}",
  "unprovoked-temper-explosion": "\u{1F4A5}",
  "unusual-anxiety-panic": "\u{1F630}",
  "aggressive-or-destructive": "\u{1F4A3}",
};

function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-500 hover:bg-gray-300"
      >
        i
      </button>
      {open && (
        <span className="absolute left-0 top-6 z-10 w-52 rounded-md border border-gray-200 bg-white p-2 text-xs text-gray-600 shadow-md">
          {text}
        </span>
      )}
    </span>
  );
}

export function BehaviorChecklist({ checked, onToggle, items }: BehaviorChecklistProps) {
  // Group items by category, preserving sort order
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
    <div className="space-y-4">
      {sortedCategories.map(([catSlug, cat]) => (
        <div key={catSlug} className="w-full min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            {categoryEmojis[catSlug] && <span className="mr-1">{categoryEmojis[catSlug]}</span>}
            {cat.name}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {cat.items
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item) => {
                const emoji = behaviorEmojis[item.key];
                return (
                  <label
                    key={item.key}
                    className={`flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 ${
                      checked.has(item.key)
                        ? "bg-gray-900 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(item.key)}
                      onChange={() => onToggle(item.key)}
                      className="sr-only"
                    />
                    {emoji && <span className="text-sm leading-none">{emoji}</span>}
                    <span className="leading-tight">{item.label}</span>
                    <InfoTip text={item.description} />
                  </label>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
