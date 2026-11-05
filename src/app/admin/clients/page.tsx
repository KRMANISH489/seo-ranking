"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/admin/AdminGate";
import { HealthBadge } from "@/components/admin/HealthBadge";
import {
  healthCounts,
  healthStyles,
  monitorHealth,
  type HealthStatus,
} from "@/lib/monitoring/health";
import type { MonitorSite } from "@/lib/store/monitors";

type FilterKey = "all" | HealthStatus;
type SortKey = "recent" | "score" | "rank" | "name";

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function ScoreRing({ score }: { score: number | null }) {
  const v = score ?? 0;
  const r = 28;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, v)) / 100;
  const color =
    score == null ? "#94a3b8" : score >= 75 ? "#10b981" : score >= 55 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 72 72" className="h-16 w-16 -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#e8eef5" strokeWidth="7" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          className="transition-[stroke-dasharray] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-lg font-bold leading-none">{score ?? "—"}</span>
        <span className="text-[9px] uppercase tracking-wider text-[var(--muted)]">SEO</span>
      </div>
    </div>
  );
}

function Trend({
  current,
  previous,
  invert = false,
}: {
  current: number | null | undefined;
  previous: number | null | undefined;
  invert?: boolean;
}) {
  if (current == null || previous == null || current === previous) return null;
  const up = current > previous;
  const good = invert ? !up : up;
  const delta = Math.abs(current - previous);
  return (
    <span className={`text-xs font-semibold ${good ? "text-emerald-600" : "text-rose-600"}`}>
      {up ? "▲" : "▼"} {delta}
    </span>
  );
}

function ClientsInner() {
  const [monitors, setMonitors] = useState<MonitorSite[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/monitors");
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed to load clients");
      return;
    }
    setError(null);
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
    setMessage(active ? "Monitoring resumed" : "Monitoring paused");
  }

  async function runNow(id: string) {
    setRunningId(id);
    setMessage("Running live audit + rank + email…");
    setError(null);
    const res = await fetch("/api/monitors/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    setRunningId(null);
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
    setConfirmDelete(null);
    if (expanded === id) setExpanded(null);
    setMessage("Client removed from monitoring");
  }

  function copyText(label: string, text: string) {
    navigator.clipboard?.writeText(text).then(
      () => setMessage(`${label} copied`),
      () => setError("Copy failed")
    );
  }

  const counts = healthCounts(monitors);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = monitors.filter((m) => {
      const health = monitorHealth(m).status;
      if (filter !== "all" && health !== filter) return false;
      if (!q) return true;
      return (
        m.url.toLowerCase().includes(q) ||
        m.clientEmail.toLowerCase().includes(q) ||
        (m.clientName || "").toLowerCase().includes(q) ||
        m.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });

    list = [...list].sort((a, b) => {
      if (sort === "score") return (b.lastScore ?? -1) - (a.lastScore ?? -1);
      if (sort === "rank") {
        const ar = a.lastBestRank ?? 9999;
        const br = b.lastBestRank ?? 9999;
        return ar - br;
      }
      if (sort === "name") {
        return (a.clientName || a.clientEmail).localeCompare(b.clientName || b.clientEmail);
      }
      return +new Date(b.updatedAt) - +new Date(a.updatedAt);
    });
    return list;
  }, [monitors, filter, query, sort]);

  const filterChips: { key: FilterKey; label: string; value: number }[] = [
    { key: "all", label: "All", value: monitors.length },
    { key: "green", label: "Good", value: counts.green },
    { key: "yellow", label: "Watch", value: counts.yellow },
    { key: "red", label: "Needs work", value: counts.red },
    { key: "gray", label: "Pending", value: counts.gray },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Client command center</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Live health for every saved URL — filter, inspect, re-run, pause.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium hover:border-[var(--accent)]"
        >
          Refresh
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {filterChips.map((chip) => {
          const active = filter === chip.key;
          const style =
            chip.key === "all"
              ? active
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--line)] bg-white text-[var(--muted)]"
              : active
                ? healthStyles[chip.key].badge
                : "border-[var(--line)] bg-white text-[var(--muted)]";
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilter(chip.key)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${style}`}
            >
              {chip.key !== "all" ? (
                <span className={`h-2 w-2 rounded-full ${healthStyles[chip.key].dot}`} />
              ) : null}
              {chip.label}
              <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px]">{chip.value}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, URL, keyword…"
          className="input-seo min-w-0 flex-1"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="input-seo sm:w-48"
        >
          <option value="recent">Sort: recent</option>
          <option value="score">Sort: score</option>
          <option value="rank">Sort: best rank</option>
          <option value="name">Sort: name</option>
        </select>
      </div>

      {message && (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {loading && (
          <div className="rounded-2xl border border-[var(--line)] bg-white p-8 text-center text-[var(--muted)]">
            Loading clients…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-10 text-center">
            <p className="font-display text-lg font-bold">No clients in this view</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {monitors.length === 0
                ? "Public form pe pehli audit (Save URL + weekly auto-check ON) → yahan auto aayega."
                : "Filter / search clear karke try karo."}
            </p>
            <Link href="/" className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline">
              Open public audit →
            </Link>
          </div>
        )}

        {filtered.map((m) => {
          const health = monitorHealth(m);
          const open = expanded === m.id;
          const days = daysSince(m.lastRunAt);
          const nextDue = days == null ? null : Math.max(0, 7 - days);
          const isRunning = runningId === m.id;

          return (
            <article
              key={m.id}
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                open ? "border-[var(--accent)] shadow-[0_12px_40px_rgba(10,132,255,0.12)]" : "border-[var(--line)]"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpanded(open ? null : m.id)}
                className="flex w-full flex-col gap-4 p-4 text-left sm:flex-row sm:items-center sm:p-5"
              >
                <ScoreRing score={m.lastScore} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <HealthBadge monitor={m} />
                    {!m.active ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                        Paused
                      </span>
                    ) : null}
                    <Trend current={m.lastScore} previous={m.previousScore} />
                  </div>
                  <div className="mt-2 font-display text-lg font-bold tracking-tight">
                    {m.clientName || hostnameOf(m.url)}
                  </div>
                  <div className="truncate text-sm text-[var(--muted)]">{m.clientEmail}</div>
                  <div className="mt-0.5 truncate text-xs text-[var(--muted)]">{hostnameOf(m.url)}</div>
                </div>

                <div className="flex flex-wrap gap-3 text-center sm:gap-5">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      Rank
                    </div>
                    <div className="font-display text-xl font-bold">
                      {m.lastBestRank != null ? `#${m.lastBestRank}` : "—"}
                    </div>
                    <Trend current={m.lastBestRank} previous={m.previousBestRank} invert />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      Reports
                    </div>
                    <div className="font-display text-xl font-bold">{m.weeklyReportsSent}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      Check
                    </div>
                    <div className="font-display text-sm font-bold">
                      {days == null ? "Never" : days === 0 ? "Today" : `${days}d ago`}
                    </div>
                    {nextDue != null && m.active ? (
                      <div className="text-[10px] text-[var(--muted)]">
                        {nextDue === 0 ? "Due now" : `~${nextDue}d to next`}
                      </div>
                    ) : null}
                  </div>
                </div>

                <span className="hidden text-[var(--muted)] sm:block">{open ? "▲" : "▼"}</span>
              </button>

              {open ? (
                <div className="border-t border-[var(--line)] bg-[var(--bg)] px-4 py-4 sm:px-5">
                  <p className="text-sm text-[var(--muted)]">{health.reason}</p>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-[var(--line)] bg-white p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                        Website
                      </div>
                      <p className="mt-1 break-all text-sm font-medium">{m.url}</p>
                      <button
                        type="button"
                        className="mt-2 text-xs font-semibold text-[var(--accent)] hover:underline"
                        onClick={() => copyText("URL", m.url)}
                      >
                        Copy URL
                      </button>
                    </div>
                    <div className="rounded-xl border border-[var(--line)] bg-white p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                        Keywords
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(m.keywords.length ? m.keywords : ["—"]).map((k) => (
                          <span
                            key={k}
                            className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2 py-0.5 text-[11px]"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {m.lastRunAt ? (
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-[11px] text-[var(--muted)]">
                        <span>Weekly cadence</span>
                        <span>{Math.min(100, Math.round(((days ?? 0) / 7) * 100))}% of week used</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className={`h-full rounded-full transition-all ${
                            (days ?? 0) > 7 ? "bg-rose-500" : "bg-[var(--accent)]"
                          }`}
                          style={{ width: `${Math.min(100, ((days ?? 0) / 7) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {m.lastAuditId ? (
                      <Link
                        href={`/report/${m.lastAuditId}`}
                        className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium hover:border-[var(--accent)]"
                      >
                        Open report
                      </Link>
                    ) : null}
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium"
                    >
                      Visit site
                    </a>
                    <button
                      type="button"
                      onClick={() => copyText("Email", m.clientEmail)}
                      className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium"
                    >
                      Copy email
                    </button>
                    <button
                      type="button"
                      disabled={isRunning}
                      onClick={() => runNow(m.id)}
                      className="rounded-xl btn-brand px-3 py-2 text-sm font-semibold text-[var(--accent-on)] disabled:opacity-60"
                    >
                      {isRunning ? "Running…" : "Run check now"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(m.id, !m.active)}
                      className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium"
                    >
                      {m.active ? "Pause monitoring" : "Resume monitoring"}
                    </button>
                    {confirmDelete === m.id ? (
                      <button
                        type="button"
                        onClick={() => remove(m.id)}
                        className="rounded-xl border border-rose-400 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                      >
                        Confirm delete
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(m.id)}
                        className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-rose-600"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
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
