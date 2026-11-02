import { proAnalyzeUrl } from "@/lib/seo/proAnalyze";
import { saveAudit } from "@/lib/store/audits";
import {
  listActiveMonitors,
  updateMonitorRun,
  type MonitorSite,
} from "@/lib/store/monitors";
import { sendAuditEmails } from "@/lib/email/sendReport";

export interface WeeklyRunResult {
  monitorId: string;
  url: string;
  ok: boolean;
  auditId?: string;
  score?: number;
  bestRank?: number | null;
  emailsSent?: string[];
  error?: string;
}

export async function runMonitorOnce(monitor: MonitorSite): Promise<WeeklyRunResult> {
  try {
    const audit = await proAnalyzeUrl(monitor.url, {
      deepCrawl: true,
      pageSpeed: true,
      checkBrokenLinks: true,
      maxCrawlPages: 4,
      keywords: monitor.keywords,
      checkRank: true,
    });

    audit.clientEmail = monitor.clientEmail;
    audit.monitorId = monitor.id;

    const email = await sendAuditEmails({
      audit,
      clientEmail: monitor.clientEmail,
      isWeekly: true,
    });
    audit.emailDelivery = email;

    const saved = await saveAudit(audit);
    await updateMonitorRun(monitor.id, {
      lastAuditId: saved.id,
      lastScore: saved.overallScore,
      lastBestRank: saved.ranking?.bestPosition ?? null,
    });

    return {
      monitorId: monitor.id,
      url: monitor.url,
      ok: true,
      auditId: saved.id,
      score: saved.overallScore,
      bestRank: saved.ranking?.bestPosition ?? null,
      emailsSent: email.sent,
      error: email.error || undefined,
    };
  } catch (err) {
    return {
      monitorId: monitor.id,
      url: monitor.url,
      ok: false,
      error: err instanceof Error ? err.message : "Monitor run failed",
    };
  }
}

export async function runWeeklyAll(): Promise<{
  ranAt: string;
  total: number;
  results: WeeklyRunResult[];
}> {
  const monitors = await listActiveMonitors();
  const results: WeeklyRunResult[] = [];

  // Sequential to avoid rate limits / memory spikes
  for (const m of monitors) {
    results.push(await runMonitorOnce(m));
  }

  return {
    ranAt: new Date().toISOString(),
    total: monitors.length,
    results,
  };
}
