import type { PageSpeedMetrics } from "./proTypes";

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

function scoreOf(category: { score?: number } | undefined): number | null {
  if (!category || typeof category.score !== "number") return null;
  return Math.round(category.score * 100);
}

function msOf(audits: Record<string, { numericValue?: number }>, key: string): number | null {
  const v = audits?.[key]?.numericValue;
  return typeof v === "number" ? Math.round(v) : null;
}

export async function fetchPageSpeed(
  pageUrl: string,
  strategy: "mobile" | "desktop" = "mobile"
): Promise<PageSpeedMetrics> {
  try {
    const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url", pageUrl);
    endpoint.searchParams.set("strategy", strategy);
    endpoint.searchParams.append("category", "performance");
    endpoint.searchParams.append("category", "accessibility");
    endpoint.searchParams.append("category", "best-practices");
    endpoint.searchParams.append("category", "seo");

    const apiKey = process.env.PAGESPEED_API_KEY?.trim();
    if (apiKey) endpoint.searchParams.set("key", apiKey);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    const res = await fetch(endpoint.toString(), { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      const text = await res.text();
      return {
        ...empty(`PageSpeed API error (${res.status}): ${text.slice(0, 180)}`),
        enabled: true,
        strategy,
      };
    }

    const data = await res.json();
    const cats = data?.lighthouseResult?.categories || {};
    const audits = data?.lighthouseResult?.audits || {};

    return {
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
      reportUrl: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(pageUrl)}`,
    };
  } catch (err) {
    return {
      ...empty(err instanceof Error ? err.message : "PageSpeed request failed"),
      enabled: true,
      strategy,
    };
  }
}
