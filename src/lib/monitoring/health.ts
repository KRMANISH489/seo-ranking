import type { MonitorSite } from "@/lib/store/monitors";

export type HealthStatus = "green" | "yellow" | "red" | "gray";

export type HealthInfo = {
  status: HealthStatus;
  label: string;
  reason: string;
};

/** Traffic-light health from last SEO score + Google rank. */
export function monitorHealth(m: Pick<MonitorSite, "lastScore" | "lastBestRank" | "lastRunAt" | "active">): HealthInfo {
  if (!m.active) {
    return { status: "gray", label: "Paused", reason: "Weekly monitoring is paused." };
  }

  if (m.lastScore == null) {
    return {
      status: "gray",
      label: "Pending",
      reason: "Waiting for first scored check.",
    };
  }

  const score = m.lastScore;
  const rank = m.lastBestRank;
  const staleDays =
    m.lastRunAt != null
      ? (Date.now() - new Date(m.lastRunAt).getTime()) / (1000 * 60 * 60 * 24)
      : null;

  if (staleDays != null && staleDays > 10) {
    return {
      status: "yellow",
      label: "Stale",
      reason: `Last check ${Math.floor(staleDays)} days ago — run weekly job.`,
    };
  }

  // Red: weak SEO or buried in SERP
  if (score < 55 || (rank != null && rank > 50)) {
    return {
      status: "red",
      label: "Needs work",
      reason:
        rank != null && rank > 50
          ? `SEO ${score} · rank #${rank} (page ${Math.ceil(rank / 10)}+)`
          : `SEO score ${score} is below healthy range`,
    };
  }

  // Yellow: okay but not strong
  if (score < 75 || (rank != null && rank > 20)) {
    return {
      status: "yellow",
      label: "Watch",
      reason:
        rank != null
          ? `SEO ${score} · best rank #${rank}`
          : `SEO score ${score} — improve to reach green`,
    };
  }

  // Green
  return {
    status: "green",
    label: "Good",
    reason:
      rank != null
        ? `SEO ${score} · best rank #${rank}`
        : `SEO score ${score} looks healthy`,
  };
}

export function healthCounts(monitors: MonitorSite[]) {
  const counts = { green: 0, yellow: 0, red: 0, gray: 0 };
  for (const m of monitors) {
    counts[monitorHealth(m).status] += 1;
  }
  return counts;
}

export const healthStyles: Record<
  HealthStatus,
  { dot: string; badge: string; card: string }
> = {
  green: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
    card: "border-emerald-200 bg-emerald-50/60",
  },
  yellow: {
    dot: "bg-amber-400",
    badge: "bg-amber-400/20 text-amber-800 border-amber-200",
    card: "border-amber-200 bg-amber-50/70",
  },
  red: {
    dot: "bg-rose-500",
    badge: "bg-rose-500/15 text-rose-700 border-rose-200",
    card: "border-rose-200 bg-rose-50/70",
  },
  gray: {
    dot: "bg-slate-400",
    badge: "bg-slate-400/15 text-slate-600 border-slate-200",
    card: "border-[var(--line)] bg-white",
  },
};
