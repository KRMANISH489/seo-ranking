"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/admin/AdminGate";
import type { MonitorSite } from "@/lib/store/monitors";

function ClientsInner() {
  const [monitors, setMonitors] = useState<MonitorSite[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/monitors");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load clients");
      return;
    }
    setMonitors(data.monitors || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(id: string, active: boolean) {
    const res = await fetch("/api/monitors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Update failed");
      return;
    }
    setMonitors((prev) => prev.map((m) => (m.id === id ? data.monitor : m)));
  }

  async function runNow(id: string) {
    setMessage("Running audit + rank + email…");
    const res = await fetch("/api/monitors/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Run failed");
      setMessage(null);
      return;
    }
    setMessage(
      `Done · score ${data.score} · rank ${data.bestRank ?? "n/a"} · mailed ${(data.emailsSent || []).join(", ") || "none"}`
    );
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/monitors?id=${id}`, { method: "DELETE" });
    setMonitors((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">Clients & monitors</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Weekly SEO + Google rank emails stay ON until you pause or delete.
      </p>

      {message && <p className="mt-4 text-sm text-emerald-300">{message}</p>}
      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

      <div className="mt-6 space-y-3">
        {monitors.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center text-[var(--muted)]">
            No clients yet. Public audit form enrolls them automatically.
          </div>
        )}
        {monitors.map((m) => (
          <article key={m.id} className="glass rounded-2xl p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                      m.active ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/20 text-slate-300"
                    }`}
                  >
                    {m.active ? "Active" : "Paused"}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {m.weeklyReportsSent} reports sent
                  </span>
                </div>
                <div className="mt-1 font-medium">{m.clientEmail}</div>
                <div className="break-all text-sm text-[var(--muted)]">{m.url}</div>
                <div className="mt-1 text-xs text-[var(--muted)]">
                  KW: {m.keywords.join(", ") || "—"} · last score {m.lastScore ?? "—"} · best rank{" "}
                  {m.lastBestRank != null ? `#${m.lastBestRank}` : "—"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {m.lastAuditId ? (
                  <Link
                    href={`/report/${m.lastAuditId}`}
                    className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm"
                  >
                    Report
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => runNow(m.id)}
                  className="rounded-lg btn-brand px-3 py-1.5 text-sm font-semibold text-[var(--accent-on)]"
                >
                  Run now
                </button>
                <button
                  type="button"
                  onClick={() => toggle(m.id, !m.active)}
                  className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm"
                >
                  {m.active ? "Pause" : "Resume"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  className="rounded-lg border border-rose-400/30 px-3 py-1.5 text-sm text-rose-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function AdminClientsPage() {
  return (
    <AdminGate>
      <ClientsInner />
    </AdminGate>
  );
}
