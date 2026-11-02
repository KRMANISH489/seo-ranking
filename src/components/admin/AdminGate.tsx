"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminShell } from "./AdminShell";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/admin/me", { cache: "no-store" });
        if (!res.ok) {
          router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        const data = await res.json();
        if (!cancelled) setEmail(data.email || "admin");
      } catch {
        router.replace("/admin/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (loading || !email) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
        Checking admin session…
      </div>
    );
  }

  return <AdminShell email={email}>{children}</AdminShell>;
}
