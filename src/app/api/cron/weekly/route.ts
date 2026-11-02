import { NextRequest, NextResponse } from "next/server";
import { runWeeklyAll } from "@/lib/monitoring/runWeekly";
import { authorizeAdmin } from "@/lib/admin/authorize";

function authorizeCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim() || process.env.ADMIN_SECRET?.trim();
  if (!secret) return true;
  const header = req.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const x = req.headers.get("x-cron-secret") || "";
  const query = req.nextUrl.searchParams.get("secret") || "";
  return bearer === secret || x === secret || query === secret;
}

export async function GET(req: NextRequest) {
  // Vercel cron uses Bearer CRON_SECRET; admin dashboard uses cookie session
  if (!(authorizeCron(req) || (await authorizeAdmin(req)))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runWeeklyAll();
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  return GET(req);
}
