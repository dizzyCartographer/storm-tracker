"use client";

interface NotesFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function NotesField({ value, onChange }: NotesFieldProps) {
  return (
    <div>
      <label htmlFor="notes" className="block text-sm font-medium">
        Notes
      </label>
      <textarea
        id="notes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        placeholder="Detailed observations, context, anything noteworthy about the day..."
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
