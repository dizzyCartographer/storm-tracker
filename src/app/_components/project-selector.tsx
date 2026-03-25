"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface Project {
  id: string;
  name: string;
  teenFavoriteColor: string | null;
  teenPhotoUrl: string | null;
}

export function ProjectSelector({
  projects,
  activeProjectId,
}: {
  projects: Project[];
  activeProjectId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const active = projects.find((p) => p.id === activeProjectId) ?? projects[0];

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

  if (projects.length <= 1) return null;

  function selectProject(id: string) {
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tenant", id);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="border-b border-gray-100 bg-white" ref={ref}>
      <div className="mx-auto max-w-4xl px-4">
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex w-full items-center gap-2 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            {active.teenFavoriteColor && (
              <span
                className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: active.teenFavoriteColor }}
              />
            )}
            <span className="font-medium">{active.name}</span>
            <svg
              className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {open && (
            <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectProject(p.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                    p.id === active.id ? "font-medium text-gray-900 bg-gray-50" : "text-gray-600"
                  }`}
                >
                  {p.teenFavoriteColor ? (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: p.teenFavoriteColor }}
                    />
                  ) : (
                    <span className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0 bg-gray-300" />
                  )}
                  {p.name}
                  {p.id === active.id && (
                    <svg className="ml-auto h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
