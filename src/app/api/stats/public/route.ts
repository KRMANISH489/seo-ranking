import { NextResponse } from "next/server";
import { listAudits } from "@/lib/store/audits";
import { listMonitors } from "@/lib/store/monitors";

/** Public trust / usage stats for homepage (no secrets). */
export async function GET() {
  try {
    const [audits, monitors] = await Promise.all([listAudits(), listMonitors()]);
    const activeMonitors = monitors.filter((m) => m.active).length;
    const avgScore =
      audits.length > 0
        ? Math.round(audits.reduce((s, a) => s + a.overallScore, 0) / audits.length)
        : null;

    return NextResponse.json(
      {
        auditsRun: audits.length,
        activeMonitors,
        avgScore,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { auditsRun: 0, activeMonitors: 0, avgScore: null, updatedAt: new Date().toISOString() },
      { status: 200 }
    );
  }
}
