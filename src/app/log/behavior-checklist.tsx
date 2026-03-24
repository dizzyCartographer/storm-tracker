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
        <fieldset key={catSlug}>
          <legend className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            {cat.name}
          </legend>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {cat.items
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item) => (
                <label
                  key={item.key}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
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
                  {item.label}
                  <InfoTip text={item.description} />
                </label>
              ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
