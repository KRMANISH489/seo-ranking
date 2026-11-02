"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "./BrandLogo";

const links = [
  { href: "/", label: "Audit" },
  { href: "/compare", label: "Compete" },
  { href: "/history", label: "History" },
  { href: "/admin", label: "Admin" },
];

export function AppNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(11,18,32,0.85)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <BrandLogo href="/" size="md" />
          <a
            href="https://codabhi-dev.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="hidden text-xs text-[var(--muted)] hover:text-[var(--accent)] sm:inline"
          >
            codabhi-dev.vercel.app
          </a>
        </div>
        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
