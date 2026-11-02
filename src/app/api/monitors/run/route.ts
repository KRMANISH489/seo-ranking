import { NextRequest, NextResponse } from "next/server";
import { getMonitor } from "@/lib/store/monitors";
import { runMonitorOnce } from "@/lib/monitoring/runWeekly";
import { authorizeAdmin } from "@/lib/admin/authorize";

export async function POST(req: NextRequest) {
  if (!(await authorizeAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const monitor = await getMonitor(id);
  if (!monitor) return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  if (!monitor.active) {
    return NextResponse.json({ error: "Monitor is paused by admin." }, { status: 400 });
  }

  const result = await runMonitorOnce(monitor);
  return NextResponse.json(result);
}
