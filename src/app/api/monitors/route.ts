import { NextRequest, NextResponse } from "next/server";
import {
  deleteMonitor,
  listMonitors,
  setMonitorActive,
} from "@/lib/store/monitors";
import { emailStatus } from "@/lib/email/sendReport";
import { authorizeAdmin } from "@/lib/admin/authorize";

export async function GET(req: NextRequest) {
  if (!(await authorizeAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const monitors = await listMonitors();
  return NextResponse.json({ monitors, status: emailStatus() });
}

export async function PATCH(req: NextRequest) {
  if (!(await authorizeAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (typeof body.active === "boolean") {
    const updated = await setMonitorActive(id, body.active);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ monitor: updated });
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  if (!(await authorizeAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteMonitor(id);
  return NextResponse.json({ ok: true });
}
