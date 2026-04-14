"use client";

import { useState, useRef, useEffect } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function parseDate(value: string): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m - 1, day: d };
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function DatePicker({
  value,
  onChange,
  className,
  placeholder = "Select a date",
  minYear = 1950,
  maxYear,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
}) {
  const currentYear = new Date().getFullYear();
  const effectiveMaxYear = maxYear ?? currentYear;
  const years = Array.from({ length: effectiveMaxYear - minYear + 1 }, (_, i) => effectiveMaxYear - i);

  const parsed = parseDate(value);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.year ?? currentYear);
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? new Date().getMonth());
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const totalDays = daysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  function selectDay(day: number) {
    onChange(formatDate(viewYear, viewMonth, day));
    setOpen(false);
  }

  function clear() {
    onChange("");
    setOpen(false);
  }

  const displayValue = parsed
    ? `${MONTHS[parsed.month]} ${parsed.day}, ${parsed.year}`
    : "";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={className ?? "mt-1 flex w-full items-center justify-between rounded-md border border-gray-300 px-3 py-2 text-sm text-left"}
      >
        <span className={displayValue ? "text-gray-900" : "text-gray-400"}>
          {displayValue || placeholder}
        </span>
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-72 rounded-md border border-gray-200 bg-white p-3 shadow-lg">
          {/* Year / Month selectors */}
          <div className="flex items-center gap-2 mb-3">
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 text-center text-xs font-medium text-gray-400 mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5 text-center text-sm">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const isSelected =
                parsed?.year === viewYear &&
                parsed?.month === viewMonth &&
                parsed?.day === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`rounded py-1 hover:bg-gray-100 ${
                    isSelected ? "bg-gray-900 text-white hover:bg-gray-800" : ""
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Clear */}
          {value && (
            <button
              type="button"
              onClick={clear}
              className="mt-2 w-full text-center text-xs text-gray-400 hover:text-gray-600"
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  );
}
