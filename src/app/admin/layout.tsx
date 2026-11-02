import { Suspense } from "react";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="p-8 text-[var(--muted)]">Loading admin…</div>}>{children}</Suspense>;
}
