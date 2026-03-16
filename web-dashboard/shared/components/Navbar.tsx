"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/interested", label: "Interested" },
  { href: "/applied", label: "Applied" },
  { href: "/archived", label: "Archive" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-6 px-6 h-12">
        <span className="text-sm font-semibold text-green-600 dark:text-green-500">
          Job Applyer
        </span>
        <span className="text-zinc-300 dark:text-zinc-700 select-none">|</span>
        {LINKS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                active
                  ? "text-zinc-900 dark:text-zinc-100 font-medium"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
