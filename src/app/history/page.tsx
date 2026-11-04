"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AuditListItem } from "@/lib/seo/proTypes";

export default function HistoryPage() {
  const [audits, setAudits] = useState<AuditListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageHint, setStorageHint] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/audits");
      const data = await res.json();
      setAudits(data.audits || []);
      setStorageHint(typeof data.hint === "string" ? data.hint : null);
    } catch {
      setError("Could not load history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    await fetch(`/api/audits/${id}`, { method: "DELETE" });
    setAudits((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <main className="relative flex-1">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Audit history</h1>
        <p className="mt-2 text-[var(--muted)]">Saved professional reports — reopen or export PDF anytime.</p>

        {loading && <p className="mt-8 text-sm text-[var(--muted)]">Loading…</p>}
        {error && <p className="mt-8 text-sm text-rose-600">{error}</p>}
        {storageHint && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">History may reset on Vercel</p>
            <p className="mt-1">{storageHint}</p>
            <p className="mt-2 text-xs">
              Vercel Dashboard → Storage → Create Blob Store → connect this project → Redeploy.
            </p>
          </div>
        )}

        {!loading && audits.length === 0 && (
          <div className="glass mt-8 rounded-2xl p-8 text-center">
            <p className="text-[var(--muted)]">No audits yet.</p>
            <Link href="/" className="mt-3 inline-block text-[var(--accent)] hover:underline">
              Run your first pro audit →
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-3">
          {audits.map((a) => (
            <article key={a.id} className="glass flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-2xl font-semibold text-[var(--accent)]">
                    {a.overallScore}
                  </span>
                  <span className="text-sm text-[var(--muted)]">Grade {a.grade}</span>
                </div>
                <div className="mt-1 break-all text-sm font-medium">{a.url}</div>
                <div className="mt-1 text-xs text-[var(--muted)]">
                  {new Date(a.analyzedAt).toLocaleString()}
                  {a.primaryKeyword ? ` · KW: ${a.primaryKeyword}` : ""}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/report/${a.id}`}
                  className="rounded-lg btn-brand px-3 py-1.5 text-sm font-semibold text-[var(--accent-on)]"
                >
                  Open
                </Link>
                <a
                  href={`/api/audits/${a.id}/pdf`}
                  className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)]"
                >
                  PDF
                </a>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  className="rounded-lg border border-rose-400/30 px-3 py-1.5 text-sm text-rose-300"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
