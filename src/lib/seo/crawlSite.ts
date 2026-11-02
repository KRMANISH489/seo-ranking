import * as cheerio from "cheerio";
import { analyzeUrl } from "./analyze";
import type { CrawledPageSummary, SiteCrawlReport } from "./proTypes";
import { issueCounts } from "./proTypes";

function sameOrigin(a: string, b: string): boolean {
  try {
    return new URL(a).origin === new URL(b).origin;
  } catch {
    return false;
  }
}

function normalizeInternal(base: string, href: string): string | null {
  try {
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      return null;
    }
    const abs = new URL(href, base).toString().split("#")[0];
    if (!sameOrigin(base, abs)) return null;
    if (/\.(pdf|jpg|jpeg|png|gif|webp|svg|zip|mp4|css|js)(\?|$)/i.test(abs)) return null;
    return abs;
  } catch {
    return null;
  }
}

export function extractInternalLinks(html: string, pageUrl: string, limit = 20): string[] {
  const $ = cheerio.load(html);
  const found: string[] = [];
  const seen = new Set<string>();
  $("a[href]").each((_, el) => {
    const abs = normalizeInternal(pageUrl, ($(el).attr("href") || "").trim());
    if (!abs || seen.has(abs) || abs === pageUrl) return;
    seen.add(abs);
    found.push(abs);
  });
  return found.slice(0, limit);
}

async function summarizePage(url: string): Promise<CrawledPageSummary> {
  try {
    const result = await analyzeUrl(url, { skipAi: true });
    const counts = issueCounts(result.issues);
    return {
      url: result.url,
      status: 200,
      score: result.overallScore,
      grade: result.grade,
      title: result.meta.title,
      h1Count: result.headings.h1.length,
      wordCount: result.keywords.wordCount,
      issuesCritical: counts.critical,
      issuesWarning: counts.warning,
    };
  } catch (err) {
    return {
      url,
      status: null,
      score: null,
      grade: null,
      title: null,
      h1Count: 0,
      wordCount: 0,
      issuesCritical: 0,
      issuesWarning: 0,
      error: err instanceof Error ? err.message : "Failed",
    };
  }
}

export async function crawlInternalPages(
  seedUrl: string,
  html: string,
  options: { maxPages?: number } = {}
): Promise<SiteCrawlReport> {
  const maxPages = options.maxPages ?? 5;
  const links = extractInternalLinks(html, seedUrl, maxPages + 5).slice(0, maxPages);

  if (links.length === 0) {
    return { enabled: true, pagesAnalyzed: 0, averageScore: null, pages: [] };
  }

  const pages: CrawledPageSummary[] = [];
  for (const link of links) {
    pages.push(await summarizePage(link));
  }

  const scored = pages.filter((p) => typeof p.score === "number") as (CrawledPageSummary & {
    score: number;
  })[];
  const averageScore =
    scored.length > 0
      ? Math.round(scored.reduce((s, p) => s + p.score, 0) / scored.length)
      : null;

  return {
    enabled: true,
    pagesAnalyzed: pages.length,
    averageScore,
    pages,
  };
}
