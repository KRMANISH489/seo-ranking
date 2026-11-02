import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { sendTestEmail } from "@/lib/email/sendReport";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const to =
    (typeof body?.to === "string" && body.to.trim()) ||
    process.env.ADMIN_EMAIL?.trim() ||
    process.env.SMTP_USER?.trim() ||
    "";

  if (!to) {
    return NextResponse.json({ error: "No recipient email." }, { status: 400 });
  }

  const result = await sendTestEmail(to);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, to });
}
