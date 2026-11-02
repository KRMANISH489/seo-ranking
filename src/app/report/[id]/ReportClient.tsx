"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import type { ProAuditResult } from "@/lib/seo/proTypes";

export function ReportClient() {
  const params = useParams<{ id: string }>();
  const [result, setResult] = useState<ProAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/audits/${params.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Not found");
        setResult(data as ProAuditResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) load();
  }, [params.id]);

  return (
    <main className="relative flex-1">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link href="/history" className="text-sm text-[var(--accent)] hover:underline">
          ← Back to history
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">Saved SEO report</h1>

        {loading && <p className="mt-8 text-[var(--muted)]">Loading report…</p>}
        {error && <p className="mt-8 text-rose-300">{error}</p>}
        {result && <ResultsDashboard result={result} />}
      </div>
    </main>
  );
}
