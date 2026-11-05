"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/admin/AdminGate";
import { HealthBadge } from "@/components/admin/HealthBadge";
import { healthCounts, healthStyles, monitorHealth } from "@/lib/monitoring/health";
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

  const counts = healthCounts(monitors);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">Clients & monitors</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Client URL save hota hai pehli audit pe — har week auto-check. Status: green / yellow / red.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["green", "Good", counts.green],
            ["yellow", "Watch", counts.yellow],
            ["red", "Needs work", counts.red],
            ["gray", "Pending / paused", counts.gray],
          ] as const
        ).map(([key, label, value]) => (
          <div
            key={key}
            className={`rounded-2xl border p-4 ${healthStyles[key].card}`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              <span className={`h-2.5 w-2.5 rounded-full ${healthStyles[key].dot}`} />
              {label}
            </div>
            <div className="mt-1 font-display text-3xl font-semibold">{value}</div>
          </div>
        ))}
      </div>

      {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

      <div className="mt-6 space-y-3">
        {monitors.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center text-[var(--muted)]">
            No clients yet. Public form pe URL + email se pehli audit → yahan auto save.
          </div>
        )}
        {monitors.map((m) => {
          const health = monitorHealth(m);
          const card = healthStyles[health.status].card;
          return (
            <article key={m.id} className={`rounded-2xl border p-5 ${card}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <HealthBadge monitor={m} />
                    <span className="text-xs text-[var(--muted)]">
                      {m.weeklyReportsSent} weekly reports ·{" "}
                      {m.lastRunAt
                        ? `last check ${new Date(m.lastRunAt).toLocaleDateString()}`
                        : "not checked yet"}
                    </span>
                  </div>
                  <div className="mt-2 font-medium text-[var(--text)]">
                    {m.clientName ? `${m.clientName} · ` : ""}
                    {m.clientEmail}
                  </div>
                  <div className="break-all text-sm text-[var(--muted)]">{m.url}</div>
                  <p className="mt-1 text-xs text-[var(--muted)]">{health.reason}</p>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    KW: {m.keywords.join(", ") || "—"} · score {m.lastScore ?? "—"} · best rank{" "}
                    {m.lastBestRank != null ? `#${m.lastBestRank}` : "—"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {m.lastAuditId ? (
                    <Link
                      href={`/report/${m.lastAuditId}`}
                      className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm"
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
                    className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm"
                  >
                    {m.active ? "Pause" : "Resume"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          );
        })}
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
