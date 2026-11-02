import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { listAudits } from "@/lib/store/audits";
import { listMonitors } from "@/lib/store/monitors";
import { emailStatus } from "@/lib/email/sendReport";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [audits, monitors] = await Promise.all([listAudits(), listMonitors()]);
  const activeMonitors = monitors.filter((m) => m.active);
  const avgScore =
    audits.length > 0
      ? Math.round(audits.reduce((s, a) => s + a.overallScore, 0) / audits.length)
      : null;

  const ranked = monitors.filter((m) => m.lastBestRank != null);
  const bestRanks = ranked.map((m) => m.lastBestRank as number);
  const avgBestRank =
    bestRanks.length > 0
      ? Math.round(bestRanks.reduce((s, n) => s + n, 0) / bestRanks.length)
      : null;

  return NextResponse.json({
    admin: session.email,
    totals: {
      audits: audits.length,
      monitors: monitors.length,
      activeMonitors: activeMonitors.length,
      pausedMonitors: monitors.length - activeMonitors.length,
      avgScore,
      avgBestRank,
      weeklyEmailsSent: monitors.reduce((s, m) => s + m.weeklyReportsSent, 0),
    },
    recentAudits: audits.slice(0, 8),
    recentMonitors: monitors.slice(0, 8),
    system: emailStatus(),
  });
}
