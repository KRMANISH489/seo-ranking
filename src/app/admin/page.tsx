"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/admin/AdminGate";
import type { AuditListItem } from "@/lib/seo/proTypes";
import type { MonitorSite } from "@/lib/store/monitors";

type Stats = {
  totals: {
    audits: number;
    monitors: number;
    activeMonitors: number;
    pausedMonitors: number;
    avgScore: number | null;
    avgBestRank: number | null;
    weeklyEmailsSent: number;
  };
  recentAudits: AuditListItem[];
  recentMonitors: MonitorSite[];
  system: {
    smtpConfigured: boolean;
    adminEmail: string | null;
    serpConfigured: boolean;
  };
};

function DashboardInner() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cronMsg, setCronMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/stats");
    if (!res.ok) {
      setError("Could not load dashboard");
      return;
    }
    setStats(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function runWeekly() {
    setCronMsg("Running weekly job…");
    const res = await fetch("/api/cron/weekly", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setCronMsg(data.error || "Cron failed");
      return;
    }
    setCronMsg(`Weekly done · ${data.total} monitors`);
    await load();
  }

  if (!stats) {
    return <p className="text-[var(--muted)]">{error || "Loading dashboard…"}</p>;
  }

  const cards = [
    { label: "Audits", value: stats.totals.audits },
    { label: "Active clients", value: stats.totals.activeMonitors },
    { label: "Avg SEO score", value: stats.totals.avgScore ?? "—" },
    { label: "Avg best rank", value: stats.totals.avgBestRank != null ? `#${stats.totals.avgBestRank}` : "—" },
    { label: "Weekly emails sent", value: stats.totals.weeklyEmailsSent },
    { label: "Paused monitors", value: stats.totals.pausedMonitors },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Admin dashboard</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Backend overview for CodAbhi agency SEO ops.</p>
        </div>
        <button
          type="button"
          onClick={runWeekly}
          className="rounded-xl btn-brand px-4 py-2.5 text-sm font-semibold text-[var(--accent-on)]"
        >
          Run weekly reports now
        </button>
      </div>

      {cronMsg && <p className="mt-3 text-sm text-emerald-300">{cronMsg}</p>}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wider text-[var(--muted)]">{c.label}</div>
            <div className="mt-1 font-display text-3xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="glass rounded-xl p-4 text-sm">
          SMTP: {stats.system.smtpConfigured ? "Ready" : "Not configured"}
        </div>
        <div className="glass rounded-xl p-4 text-sm">
          SERP API: {stats.system.serpConfigured ? "Ready" : "Missing"}
        </div>
        <div className="glass rounded-xl p-4 text-sm">
          Admin email: {stats.system.adminEmail || "—"}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent audits</h2>
            <Link href="/admin/audits" className="text-sm text-[var(--accent)] hover:underline">
              View all
            </Link>
          </div>
          <ul className="space-y-3 text-sm">
            {stats.recentAudits.length === 0 && (
              <li className="text-[var(--muted)]">No audits yet.</li>
            )}
            {stats.recentAudits.map((a) => (
              <li key={a.id} className="border-t border-[var(--line)] pt-3 first:border-0 first:pt-0">
                <div className="flex justify-between gap-2">
                  <span className="truncate font-medium">{a.url}</span>
                  <span className="text-[var(--accent)]">{a.overallScore}</span>
                </div>
                <Link href={`/report/${a.id}`} className="text-xs text-[var(--muted)] hover:text-[var(--accent)]">
                  Open report
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Monitored clients</h2>
            <Link href="/admin/clients" className="text-sm text-[var(--accent)] hover:underline">
              Manage
            </Link>
          </div>
          <ul className="space-y-3 text-sm">
            {stats.recentMonitors.length === 0 && (
              <li className="text-[var(--muted)]">No clients enrolled.</li>
            )}
            {stats.recentMonitors.map((m) => (
              <li key={m.id} className="border-t border-[var(--line)] pt-3 first:border-0 first:pt-0">
                <div className="flex justify-between gap-2">
                  <span className="truncate font-medium">{m.clientEmail}</span>
                  <span className={m.active ? "text-emerald-300" : "text-slate-400"}>
                    {m.active ? "Active" : "Paused"}
                  </span>
                </div>
                <p className="truncate text-xs text-[var(--muted)]">{m.url}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGate>
      <DashboardInner />
    </AdminGate>
  );
}
