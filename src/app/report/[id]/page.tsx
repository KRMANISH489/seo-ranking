import { Suspense } from "react";
import { ReportClient } from "./ReportClient";

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-4 py-10 text-[var(--muted)]">Loading report…</main>
      }
    >
      <ReportClient />
    </Suspense>
  );
}
