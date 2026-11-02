import { NextRequest, NextResponse } from "next/server";
import { deleteAudit, getAudit } from "@/lib/store/audits";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const audit = await getAudit(id);
  if (!audit) {
    return NextResponse.json({ error: "Audit not found." }, { status: 404 });
  }
  return NextResponse.json(audit);
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  await deleteAudit(id);
  return NextResponse.json({ ok: true });
}
