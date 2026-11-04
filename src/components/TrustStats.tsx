"use client";

import { useEffect, useState } from "react";

type PublicStats = {
  auditsRun: number;
  activeMonitors: number;
  avgScore: number | null;
};

export function TrustStats() {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    fetch("/api/stats/public")
      .then((r) => r.json())
      .then((d) =>
        setStats({
          auditsRun: Number(d.auditsRun) || 0,
          activeMonitors: Number(d.activeMonitors) || 0,
          avgScore: typeof d.avgScore === "number" ? d.avgScore : null,
        })
      )
      .catch(() => setStats({ auditsRun: 0, activeMonitors: 0, avgScore: null }));
  }, []);

  const items = [
    {
      label: "Audits run",
      value: stats ? String(stats.auditsRun) : "—",
    },
    {
      label: "Active monitors",
      value: stats ? String(stats.activeMonitors) : "—",
    },
    {
      label: "Avg SEO score",
      value: stats?.avgScore != null ? String(stats.avgScore) : "—",
    },
    {
      label: "Built by",
      value: "CodAbhi",
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-[var(--line)] bg-white/90 px-3 py-3 shadow-sm sm:px-4"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            {item.label}
          </p>
          <p className="mt-1 font-display text-lg font-bold tracking-tight text-[var(--text)] sm:text-xl">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
