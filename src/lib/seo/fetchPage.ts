export interface FetchedPage {
  url: string;
  finalUrl: string;
  html: string;
  loadTimeMs: number;
  status: number;
  robotsTxt: string | null;
  sitemapFound: boolean;
  sitemapUrl: string | null;
  robotsTxtUrl: string | null;
}

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return new URL(url).toString();
}

async function safeFetchText(url: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SEOAuditBot/1.0; +https://localhost/seo-analyzer)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function fetchPage(inputUrl: string): Promise<FetchedPage> {
  const url = normalizeUrl(inputUrl);
  const origin = new URL(url).origin;

  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  const res = await fetch(url, {
    signal: controller.signal,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SEOAuditBot/1.0; +https://localhost/seo-analyzer)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
  });
  clearTimeout(timer);

  if (!res.ok) {
    throw new Error(`Could not fetch page (HTTP ${res.status}). Check the URL and try again.`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
    // Still try — some servers omit/mislabel content-type
  }

  const html = await res.text();
  const loadTimeMs = Date.now() - start;
  const finalUrl = res.url || url;

  const robotsTxtUrl = `${origin}/robots.txt`;
  const robotsTxt = await safeFetchText(robotsTxtUrl);

  let sitemapUrl: string | null = `${origin}/sitemap.xml`;
  let sitemapFound = false;

  if (robotsTxt) {
    const match = robotsTxt.match(/Sitemap:\s*(\S+)/i);
    if (match?.[1]) {
      sitemapUrl = match[1].trim();
    }
  }

  const sitemapBody = sitemapUrl ? await safeFetchText(sitemapUrl) : null;
  if (sitemapBody && (sitemapBody.includes("<urlset") || sitemapBody.includes("<sitemapindex"))) {
    sitemapFound = true;
  } else if (sitemapUrl !== `${origin}/sitemap.xml`) {
    const fallback = await safeFetchText(`${origin}/sitemap.xml`);
    if (fallback && (fallback.includes("<urlset") || fallback.includes("<sitemapindex"))) {
      sitemapFound = true;
      sitemapUrl = `${origin}/sitemap.xml`;
    } else {
      sitemapUrl = null;
    }
  } else {
    sitemapUrl = null;
  }

  return {
    url,
    finalUrl,
    html,
    loadTimeMs,
    status: res.status,
    robotsTxt,
    sitemapFound,
    sitemapUrl,
    robotsTxtUrl: robotsTxt !== null ? robotsTxtUrl : null,
  };
}
