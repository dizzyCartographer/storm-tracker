"use client";

import { BEHAVIOR_ITEMS, type BehaviorCategory } from "@/lib/behavior-items";

const CATEGORY_ORDER: { key: BehaviorCategory; label: string }[] = [
  { key: "SLEEP", label: "Sleep" },
  { key: "ENERGY", label: "Energy" },
  { key: "MANIC", label: "Manic" },
  { key: "DEPRESSIVE", label: "Depressive" },
  { key: "MIXED_CYCLING", label: "Mixed / Cycling" },
];

interface BehaviorChecklistProps {
  checked: Set<string>;
  onToggle: (itemKey: string) => void;
}

export function BehaviorChecklist({ checked, onToggle }: BehaviorChecklistProps) {
  return (
    <div className="space-y-6">
      {CATEGORY_ORDER.map((cat) => {
        const items = BEHAVIOR_ITEMS.filter((i) => i.category === cat.key);
        return (
          <fieldset key={cat.key}>
            <legend className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {cat.label}
            </legend>
            <div className="mt-2 space-y-2">
              {items.map((item) => (
                <label
                  key={item.key}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 px-3 py-2.5 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={checked.has(item.key)}
                    onChange={() => onToggle(item.key)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300"
                  />
                  <div>
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="ml-1 text-sm text-gray-500">
                      — {item.description}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
