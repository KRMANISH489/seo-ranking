import { NextRequest, NextResponse } from "next/server";
import { compareUrls } from "@/lib/seo/proAnalyze";
import { saveAudit, saveCompare } from "@/lib/store/audits";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const yours = typeof body?.yours === "string" ? body.yours.trim() : "";
    const competitor = typeof body?.competitor === "string" ? body.competitor.trim() : "";

    if (!yours || !competitor) {
      return NextResponse.json(
        { error: "Provide both yours and competitor URLs." },
        { status: 400 }
      );
    }

    const result = await compareUrls(yours, competitor, {
      deepCrawl: body?.deepCrawl !== false,
      pageSpeed: body?.pageSpeed !== false,
      checkBrokenLinks: body?.checkBrokenLinks !== false,
      maxCrawlPages: 3,
    });

    const yoursSaved = await saveAudit(result.yours);
    const competitorSaved = await saveAudit(result.competitor);
    const compare = await saveCompare({
      yours: yoursSaved,
      competitor: competitorSaved,
      delta: result.delta,
    });

    return NextResponse.json(compare);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Compare failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
