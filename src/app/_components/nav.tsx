"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

const viewLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/history", label: "History" },
  { href: "/reports", label: "Reports" },
  { href: "/documents", label: "Docs" },
  { href: "/projects", label: "Projects" },
];

export function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold">
          Storm Tracker
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/log"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 mr-2"
          >
            + Log
          </Link>
          {viewLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm ${
                pathname.startsWith(link.href)
                  ? "font-medium text-gray-900 bg-gray-100"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="ml-2 flex items-center gap-1 border-l border-gray-200 pl-2">
            <Link
              href="/profile"
              className={`rounded-md px-3 py-1.5 text-sm ${
                pathname === "/profile"
                  ? "font-medium text-gray-900 bg-gray-100"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Profile
            </Link>
            <SignOutButton />
          </div>
        </div>

        {/* Mobile: Log button + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/log"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Log
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-3 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {viewLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-md px-3 py-2 text-sm ${
                  pathname.startsWith(link.href)
                    ? "font-medium text-gray-900 bg-gray-100"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-1 flex flex-col gap-1 border-t border-gray-100 pt-2">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className={`rounded-md px-3 py-2 text-sm ${
                  pathname === "/profile"
                    ? "font-medium text-gray-900 bg-gray-100"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Profile
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
