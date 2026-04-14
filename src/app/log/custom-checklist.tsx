"use client";

interface CustomItem {
  id: string;
  label: string;
}

interface CustomChecklistProps {
  items: CustomItem[];
  checked: Set<string>;
  onToggle: (itemId: string) => void;
}

export function CustomChecklist({ items, checked, onToggle }: CustomChecklistProps) {
  if (items.length === 0) return null;

  return (
    <fieldset>
      <legend className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        Custom
      </legend>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 px-3 py-2.5 hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={checked.has(item.id)}
              onChange={() => onToggle(item.id)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">{item.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
