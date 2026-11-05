import { randomUUID } from "crypto";
import * as cheerio from "cheerio";
import { analyzeUrl } from "./analyze";
import { fetchPage } from "./fetchPage";
import { checkBrokenLinks } from "./brokenLinks";
import { fetchPageSpeed } from "./pageSpeed";
import { crawlInternalPages } from "./crawlSite";
import {
  buildPriorityActions,
  buildSerpPreview,
  type ProAuditResult,
  type SiteCrawlReport,
  type PageSpeedMetrics,
  type BrokenLink,
  type LocalSeoReport,
} from "./proTypes";
import { extractLinks } from "./analyzeOnPage";
import { buildRankingReport, rankingSpeedTips } from "./googleRank";
import { buildLocalSeoReport } from "./localSeo";

export interface ProAnalyzeOptions {
  deepCrawl?: boolean;
  pageSpeed?: boolean;
  checkBrokenLinks?: boolean;
  maxCrawlPages?: number;
  skipAi?: boolean;
  keywords?: string[];
  checkRank?: boolean;
  localSeo?: boolean;
  businessQuery?: string | null;
  gbpUrl?: string | null;
}

export async function proAnalyzeUrl(
  inputUrl: string,
  options: ProAnalyzeOptions = {}
): Promise<ProAuditResult> {
  const deepCrawl = options.deepCrawl !== false;
  const wantPsi = options.pageSpeed !== false;
  const wantBroken = options.checkBrokenLinks !== false;
  const wantRank = options.checkRank !== false;
  const wantLocal = options.localSeo !== false;
  const maxCrawlPages = options.maxCrawlPages ?? 5;

  // Seed HTML for crawl + link checks (one fetch)
  const seed = await fetchPage(inputUrl);
  const result = await analyzeUrl(inputUrl, { skipAi: options.skipAi });

  const $ = cheerio.load(seed.html);
  const linkInfo = extractLinks($, seed.finalUrl);
  const candidateLinks = [
    ...linkInfo.internalSamples,
    ...linkInfo.externalSamples,
  ].slice(0, 20);

  const crawlPromise: Promise<SiteCrawlReport> = deepCrawl
    ? crawlInternalPages(result.url, seed.html, { maxPages: maxCrawlPages })
    : Promise.resolve({
        enabled: false,
        pagesAnalyzed: 0,
        averageScore: null,
        pages: [],
      });

  const psiPromise: Promise<PageSpeedMetrics> = wantPsi
    ? fetchPageSpeed(result.url, "mobile")
    : Promise.resolve({
        enabled: false,
        error: null,
        strategy: "mobile" as const,
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
      });

  const brokenPromise: Promise<BrokenLink[]> = wantBroken
    ? checkBrokenLinks(candidateLinks, 12)
    : Promise.resolve([]);

  const keywordSeeds = [
    ...(options.keywords || []),
    result.ai.primaryKeyword || "",
    ...result.keywords.suggestions.slice(0, 3).map((s) => s.keyword),
  ].filter(Boolean);

  const rankingPromise = wantRank
    ? buildRankingReport(result.url, keywordSeeds)
    : Promise.resolve(undefined);

  const localSeoPromise: Promise<LocalSeoReport> = wantLocal
    ? buildLocalSeoReport({
        enabled: true,
        businessQuery: options.businessQuery,
        gbpUrl: options.gbpUrl,
        siteUrl: result.url,
        pageText: result.pageTextPreview,
      })
    : Promise.resolve({
        enabled: false,
        error: null,
        query: null,
        score: null,
        grade: null,
        listing: null,
        issues: [],
        napMatch: { websiteMatch: null, phoneFoundOnSite: null, notes: [] },
      });

  const [crawl, pageSpeed, brokenLinks, ranking, localSeo] = await Promise.all([
    crawlPromise,
    psiPromise,
    brokenPromise,
    rankingPromise,
    localSeoPromise,
  ]);

  const brokenOnly = brokenLinks.filter((b) => !b.ok);
  const serp = buildSerpPreview(result);
  const priorityActions = buildPriorityActions(result, {
    brokenCount: brokenOnly.length,
    pageSpeedPerf: pageSpeed.performance,
    localSeo,
  });

  if (ranking) {
    for (const tip of rankingSpeedTips(ranking).slice(0, 4)) {
      priorityActions.unshift({
        id: `rank-${priorityActions.length}`,
        level: ranking.bestPosition != null && ranking.bestPosition <= 10 ? "P1" : "P0",
        title: "Google rank acceleration",
        detail: tip,
        category: "Rankings",
        impact: "high",
      });
    }
  }

  return {
    ...result,
    id: randomUUID(),
    serp,
    priorityActions: priorityActions.slice(0, 22),
    brokenLinks,
    pageSpeed,
    crawl,
    localSeo,
    ranking,
    options: {
      deepCrawl,
      pageSpeed: wantPsi,
      checkBrokenLinks: wantBroken,
      localSeo: wantLocal,
    },
  };
}

export async function compareUrls(
  yoursUrl: string,
  competitorUrl: string,
  options: ProAnalyzeOptions = {}
) {
  // Run both in parallel — competitor can skip deep crawl to save time optionally
  const [yours, competitor] = await Promise.all([
    proAnalyzeUrl(yoursUrl, options),
    proAnalyzeUrl(competitorUrl, {
      ...options,
      maxCrawlPages: Math.min(options.maxCrawlPages ?? 5, 3),
    }),
  ]);

  const categoryDeltas = yours.categoryScores.map((c) => {
    const other = competitor.categoryScores.find((x) => x.category === c.category);
    const comp = other?.score ?? 0;
    return {
      category: c.category,
      yours: c.score,
      competitor: comp,
      delta: c.score - comp,
    };
  });

  const scoreDelta = yours.overallScore - competitor.overallScore;
  const winner: "yours" | "competitor" | "tie" =
    Math.abs(scoreDelta) < 3 ? "tie" : scoreDelta > 0 ? "yours" : "competitor";

  const yourKws = new Set(
    yours.keywords.suggestions.map((k) => k.keyword.toLowerCase())
  );
  const keywordEdge = competitor.keywords.suggestions
    .map((k) => k.keyword)
    .filter((k) => !yourKws.has(k.toLowerCase()))
    .slice(0, 8);

  const notes: string[] = [];
  if (winner === "competitor") {
    notes.push("Competitor currently leads on overall on-page SEO score — close the P0 gaps first.");
  } else if (winner === "yours") {
    notes.push("You lead on overall score — defend with content depth and technical hygiene.");
  } else {
    notes.push("Scores are close — keyword targeting and CWV can decide the ranking edge.");
  }

  if ((competitor.pageSpeed.performance ?? 100) > (yours.pageSpeed.performance ?? 0) + 10) {
    notes.push("Competitor is faster on mobile PageSpeed — prioritize LCP/INP fixes.");
  }
  if (keywordEdge.length) {
    notes.push(`Competitor targets phrases you may be missing: ${keywordEdge.slice(0, 3).join(", ")}.`);
  }

  return { yours, competitor, delta: { score: scoreDelta, gradeYours: yours.grade, gradeCompetitor: competitor.grade, winner, categoryDeltas, keywordEdge, notes } };
}
