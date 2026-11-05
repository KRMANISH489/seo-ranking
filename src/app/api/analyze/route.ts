import { NextRequest, NextResponse } from "next/server";
import { proAnalyzeUrl } from "@/lib/seo/proAnalyze";
import { saveAudit } from "@/lib/store/audits";
import { updateMonitorRun, upsertMonitor } from "@/lib/store/monitors";
import { sendAuditEmails } from "@/lib/email/sendReport";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    const clientEmail = typeof body?.clientEmail === "string" ? body.clientEmail.trim() : "";
    const clientName = typeof body?.clientName === "string" ? body.clientName.trim() : "";
    const keywordsRaw = typeof body?.keywords === "string" ? body.keywords : "";
    const keywords = keywordsRaw
      .split(",")
      .map((k: string) => k.trim())
      .filter(Boolean);

    if (!url) {
      return NextResponse.json({ error: "Please provide a website URL." }, { status: 400 });
    }
    if (!clientEmail || !isValidEmail(clientEmail)) {
      return NextResponse.json(
        { error: "Valid client email is required for reports & weekly monitoring." },
        { status: 400 }
      );
    }

    try {
      const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      // eslint-disable-next-line no-new
      new URL(withProto);
    } catch {
      return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
    }

    const deepCrawl = body?.deepCrawl !== false;
    const pageSpeed = body?.pageSpeed !== false;
    const checkBrokenLinks = body?.checkBrokenLinks !== false;
    const checkRank = body?.checkRank !== false;
    const localSeo = body?.localSeo !== false;
    const businessQuery =
      typeof body?.businessQuery === "string" ? body.businessQuery.trim() : "";
    const gbpUrl = typeof body?.gbpUrl === "string" ? body.gbpUrl.trim() : "";
    const weeklyMonitor = body?.weeklyMonitor !== false;
    const maxCrawlPages = Math.min(Number(body?.maxCrawlPages) || 5, 8);
    const save = body?.save !== false;
    const sendEmail = body?.sendEmail !== false;

    const result = await proAnalyzeUrl(url, {
      deepCrawl,
      pageSpeed,
      checkBrokenLinks,
      maxCrawlPages,
      keywords,
      checkRank,
      localSeo,
      businessQuery: businessQuery || null,
      gbpUrl: gbpUrl || null,
    });

    result.clientEmail = clientEmail;

    // Persist first so History/Admin keep data even if email is slow or fails
    let monitorId: string | null = null;
    if (weeklyMonitor) {
      const monitor = await upsertMonitor({
        url: result.url,
        clientEmail,
        clientName: clientName || undefined,
        keywords:
          keywords.length > 0
            ? keywords
            : result.ai.primaryKeyword
              ? [result.ai.primaryKeyword]
              : result.keywords.suggestions.slice(0, 3).map((s) => s.keyword),
        active: true,
      });
      monitorId = monitor.id;
      result.monitorId = monitorId;
    }

    const saved = save ? await saveAudit(result) : result;

    // Seed admin traffic-light status from the first client check
    if (monitorId && saved.id) {
      try {
        await updateMonitorRun(monitorId, {
          lastAuditId: saved.id,
          lastScore: saved.overallScore,
          lastBestRank: saved.ranking?.bestPosition ?? null,
          countWeeklyEmail: false,
        });
      } catch {
        // ignore — audit itself already persisted
      }
    }

    if (sendEmail) {
      saved.emailDelivery = await sendAuditEmails({
        audit: saved,
        clientEmail,
        isWeekly: false,
      });
      // Refresh stored audit with email delivery status (best-effort)
      if (save && saved.id) {
        try {
          await saveAudit(saved);
        } catch {
          // ignore secondary write
        }
      }
    }

    return NextResponse.json(saved);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
