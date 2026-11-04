import { NextRequest, NextResponse } from "next/server";
import { getAudit } from "@/lib/store/audits";
import { buildAuditPdf } from "@/lib/pdf/report";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const audit = await getAudit(id);
  if (!audit) {
    return NextResponse.json({ error: "Audit not found." }, { status: 404 });
  }

  const pdf = await buildAuditPdf(audit);
  const filename = `codabhi-seo-${id.slice(0, 8)}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
