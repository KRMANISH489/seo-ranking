import {
  healthStyles,
  monitorHealth,
  type HealthStatus,
} from "@/lib/monitoring/health";
import type { MonitorSite } from "@/lib/store/monitors";

export function HealthBadge({
  monitor,
  showReason = false,
}: {
  monitor: Pick<MonitorSite, "lastScore" | "lastBestRank" | "lastRunAt" | "active">;
  showReason?: boolean;
}) {
  const health = monitorHealth(monitor);
  const style = healthStyles[health.status];

  return (
    <div className="inline-flex flex-col gap-1">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${style.badge}`}
      >
        <span className={`h-2 w-2 rounded-full ${style.dot}`} />
        {health.label}
      </span>
      {showReason ? (
        <span className="text-[11px] text-[var(--muted)]">{health.reason}</span>
      ) : null}
    </div>
  );
}

export function HealthDot({ status }: { status: HealthStatus }) {
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${healthStyles[status].dot}`}
      title={status}
    />
  );
}
