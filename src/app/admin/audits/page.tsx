"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/admin/AdminGate";
import type { AuditListItem } from "@/lib/seo/proTypes";

function AuditsInner() {
  const [audits, setAudits] = useState<AuditListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/audits");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setAudits(data.audits || []);
    }
    load();
  }, []);

  async function remove(id: string) {
    await fetch(`/api/audits/${id}`, { method: "DELETE" });
    setAudits((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">All audits</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Saved SEO reports across all clients.</p>
      {error && <p className="mt-4 text-rose-300">{error}</p>}

      <div className="mt-6 space-y-3">
        {audits.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center text-[var(--muted)]">No audits stored yet.</div>
        )}
        {audits.map((a) => (
          <article
            key={a.id}
            className="glass flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
          >
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
                {a.primaryKeyword ? ` · ${a.primaryKeyword}` : ""}
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
                className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm"
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
  );
}

export default function AdminAuditsPage() {
  return (
    <AdminGate>
      <AuditsInner />
    </AdminGate>
  );
}
