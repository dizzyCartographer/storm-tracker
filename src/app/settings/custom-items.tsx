"use client";

import { useState } from "react";
import { addCustomItem, deleteCustomItem } from "@/lib/actions/custom-item-actions";
import { useRouter } from "next/navigation";

interface CustomItem {
  id: string;
  label: string;
}

export function CustomItemsManager({
  tenantId,
  tenantName,
  items: initialItems,
}: {
  tenantId: string;
  tenantName: string;
  items: CustomItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [newLabel, setNewLabel] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setLoading(true);
    const result = await addCustomItem(tenantId, newLabel);
    setLoading(false);
    if (result.success && result.item) {
      setItems([...items, result.item]);
      setNewLabel("");
    }
  }

  async function handleDelete(itemId: string) {
    await deleteCustomItem(itemId);
    setItems(items.filter((i) => i.id !== itemId));
    router.refresh();
  }

  return (
    <div className="mt-4 rounded-md border border-gray-200 p-4">
      <h3 className="text-sm font-semibold">{tenantName} — Custom items</h3>
      {items.length === 0 && (
        <p className="mt-2 text-sm text-gray-500">No custom items yet.</p>
      )}
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-gray-50"
          >
            <span>{item.label}</span>
            <button
              onClick={() => handleDelete(item.id)}
              className="text-xs text-gray-400 hover:text-red-600"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAdd} className="mt-3 flex gap-2">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="New custom behavior..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={loading || !newLabel.trim()}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}
