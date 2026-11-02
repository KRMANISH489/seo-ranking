import { NextResponse } from "next/server";
import { listAudits } from "@/lib/store/audits";

export async function GET() {
  const audits = await listAudits();
  return NextResponse.json({ audits });
}
