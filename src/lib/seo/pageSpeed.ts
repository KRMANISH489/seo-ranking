import { createHash } from "crypto";
import type { PageSpeedMetrics } from "./proTypes";
import { loadJson, persistJson } from "@/lib/store/persist";

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h — avoids burning daily PSI quota

type CachedPsi = {
  savedAt: string;
  metrics: PageSpeedMetrics;
};

function empty(error: string | null = null): PageSpeedMetrics {
  return {
    enabled: false,
    error,
    strategy: "mobile",
    performance: null,
    accessibility: null,
    bestPractices: null,
    seo: null,
    lcpMs: null,
    cls: null,
    inpMs: null,
    fcpMs: null,
    ttfbMs: null,
    reportUrl: null,
  };
}

function reportLink(pageUrl: string): string {
  return `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(pageUrl)}`;
}

function scoreOf(category: { score?: number } | undefined): number | null {
  if (!category || typeof category.score !== "number") return null;
  return Math.round(category.score * 100);
}

function msOf(audits: Record<string, { numericValue?: number }>, key: string): number | null {
  const v = audits?.[key]?.numericValue;
  return typeof v === "number" ? Math.round(v) : null;
}

function cacheKey(pageUrl: string, strategy: string): string {
  const hash = createHash("sha1").update(`${strategy}:${pageUrl}`).digest("hex").slice(0, 24);
  return `psi-cache/${hash}.json`;
}

function friendlyPsiError(status: number, body: string, pageUrl: string): string {
  if (status === 429 || /quota exceeded|rate.?limit/i.test(body)) {
    return (
      "PageSpeed daily quota exceeded. Add a free Google API key (PAGESPEED_API_KEY) " +
      "or uncheck PageSpeed for this run. You can still open the live report: " +
      reportLink(pageUrl)
    );
  }
  if (status === 400) {
    return "PageSpeed could not analyze this URL (blocked, invalid, or unreachable).";
  }
  if (status === 403) {
    return "PageSpeed API key rejected or API not enabled. Check PAGESPEED_API_KEY in Google Cloud.";
  }
  return `PageSpeed temporarily unavailable (${status}). Try again later or open ${reportLink(pageUrl)}`;
}

export async function fetchPageSpeed(
  pageUrl: string,
  strategy: "mobile" | "desktop" = "mobile"
): Promise<PageSpeedMetrics> {
  const link = reportLink(pageUrl);

  try {
    const key = cacheKey(pageUrl, strategy);
    const cached = await loadJson<CachedPsi | null>(key, null);
    if (cached?.metrics && cached.savedAt) {
      const age = Date.now() - new Date(cached.savedAt).getTime();
      if (age >= 0 && age < CACHE_TTL_MS && !cached.metrics.error) {
        return { ...cached.metrics, reportUrl: cached.metrics.reportUrl || link };
      }
    }

    const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url", pageUrl);
    endpoint.searchParams.set("strategy", strategy);
    // Fewer categories = smaller payload; performance + seo cover most SEO needs
    endpoint.searchParams.append("category", "performance");
    endpoint.searchParams.append("category", "seo");
    endpoint.searchParams.append("category", "accessibility");
    endpoint.searchParams.append("category", "best-practices");

    const apiKey = process.env.PAGESPEED_API_KEY?.trim();
    if (apiKey) endpoint.searchParams.set("key", apiKey);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    const res = await fetch(endpoint.toString(), { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      const text = await res.text();
      return {
        ...empty(friendlyPsiError(res.status, text, pageUrl)),
        enabled: true,
        strategy,
        reportUrl: link,
      };
    }

    const data = await res.json();
    const cats = data?.lighthouseResult?.categories || {};
    const audits = data?.lighthouseResult?.audits || {};

    const metrics: PageSpeedMetrics = {
      enabled: true,
      error: null,
      strategy,
      performance: scoreOf(cats.performance),
      accessibility: scoreOf(cats.accessibility),
      bestPractices: scoreOf(cats["best-practices"]),
      seo: scoreOf(cats.seo),
      lcpMs: msOf(audits, "largest-contentful-paint"),
      cls:
        typeof audits?.["cumulative-layout-shift"]?.numericValue === "number"
          ? Number(audits["cumulative-layout-shift"].numericValue.toFixed(3))
          : null,
      inpMs: msOf(audits, "interaction-to-next-paint") ?? msOf(audits, "experimental-interaction-to-next-paint"),
      fcpMs: msOf(audits, "first-contentful-paint"),
      ttfbMs: msOf(audits, "server-response-time"),
      reportUrl: link,
    };

    try {
      await persistJson(key, { savedAt: new Date().toISOString(), metrics } satisfies CachedPsi);
    } catch {
      // cache write is best-effort
    }

    return metrics;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "PageSpeed request failed";
    const aborted = /aborted|timeout/i.test(msg);
    return {
      ...empty(
        aborted
          ? `PageSpeed timed out. Open the live report instead: ${link}`
          : `${msg}. Open report: ${link}`
      ),
      enabled: true,
      strategy,
      reportUrl: link,
    };
  }
}
