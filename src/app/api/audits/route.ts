import { NextResponse } from "next/server";
import { getStorageMode, listAudits } from "@/lib/store/audits";

export async function GET() {
  const audits = await listAudits();
  return NextResponse.json({
    audits,
    storage: getStorageMode(),
    hint:
      getStorageMode() === "filesystem"
        ? "Vercel ephemeral storage — connect Vercel Blob (BLOB_READ_WRITE_TOKEN) so history persists."
        : null,
  });
}
