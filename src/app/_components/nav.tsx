"use client";

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

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold">
          Storm Tracker
        </Link>
        <div className="flex items-center gap-1">
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
          <div className="ml-2 border-l border-gray-200 pl-2">
            <SignOutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
