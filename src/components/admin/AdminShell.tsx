"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/audits", label: "Audits" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex max-w-7xl gap-0 lg:gap-6">
        <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--bg-elevated)] p-4 lg:flex">
          <div className="space-y-1">
            <BrandLogo href="/admin" size="sm" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Admin panel</p>
          </div>
          <nav className="mt-8 flex flex-col gap-1">
            {links.map((l) => {
              const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-2 text-sm transition ${
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
          <div className="mt-auto space-y-2 border-t border-[var(--line)] pt-4">
            <p className="truncate text-xs text-[var(--muted)]">{email}</p>
            <Link href="/" className="block text-xs text-[var(--accent)] hover:underline">
              ← Public site
            </Link>
            <button
              type="button"
              onClick={logout}
              className="text-xs text-rose-300 hover:underline"
            >
              Logout
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          <div className="mb-6 flex flex-wrap items-center gap-2 lg:hidden">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--muted)]"
              >
                {l.label}
              </Link>
            ))}
            <button type="button" onClick={logout} className="text-xs text-rose-300">
              Logout
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
