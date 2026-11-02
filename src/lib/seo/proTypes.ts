import type { RankingReport } from "./googleRank";
import type { SeoAnalysisResult, SeoIssue } from "./types";

export type PriorityLevel = "P0" | "P1" | "P2";

export interface PriorityAction {
  id: string;
  level: PriorityLevel;
  title: string;
  detail: string;
  category: string;
  impact: "high" | "medium" | "low";
}

export interface SerpPreview {
  title: string;
  url: string;
  description: string;
  titleTruncated: boolean;
  descriptionTruncated: boolean;
  displayUrl: string;
}

export interface BrokenLink {
  url: string;
  status: number | null;
  ok: boolean;
  error?: string;
}

export interface PageSpeedMetrics {
  enabled: boolean;
  error: string | null;
  strategy: "mobile" | "desktop";
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
  lcpMs: number | null;
  cls: number | null;
  inpMs: number | null;
  fcpMs: number | null;
  ttfbMs: number | null;
  reportUrl: string | null;
}

export interface CrawledPageSummary {
  url: string;
  status: number | null;
  score: number | null;
  grade: string | null;
  title: string | null;
  h1Count: number;
  wordCount: number;
  issuesCritical: number;
  issuesWarning: number;
  error?: string;
}

export interface SiteCrawlReport {
  enabled: boolean;
  pagesAnalyzed: number;
  averageScore: number | null;
  pages: CrawledPageSummary[];
}

export interface ProAuditExtras {
  id: string;
  serp: SerpPreview;
  priorityActions: PriorityAction[];
  brokenLinks: BrokenLink[];
  pageSpeed: PageSpeedMetrics;
  crawl: SiteCrawlReport;
  ranking?: RankingReport;
  clientEmail?: string | null;
  monitorId?: string | null;
  emailDelivery?: {
    sent: string[];
    skipped: string | null;
    error: string | null;
  };
  options: {
    deepCrawl: boolean;
    pageSpeed: boolean;
    checkBrokenLinks: boolean;
  };
}

export interface ProAuditResult extends SeoAnalysisResult, ProAuditExtras {}

export interface AuditListItem {
  id: string;
  url: string;
  overallScore: number;
  grade: string;
  analyzedAt: string;
  primaryKeyword: string | null;
  summary: string;
}

export interface CompareResult {
  id: string;
  createdAt: string;
  yours: ProAuditResult;
  competitor: ProAuditResult;
  delta: {
    score: number;
    gradeYours: string;
    gradeCompetitor: string;
    winner: "yours" | "competitor" | "tie";
    categoryDeltas: { category: string; yours: number; competitor: number; delta: number }[];
    keywordEdge: string[];
    notes: string[];
  };
}

export function buildSerpPreview(result: SeoAnalysisResult): SerpPreview {
  const title = result.meta.title || result.ai.suggestedTitle || "Untitled page";
  const description =
    result.meta.description ||
    result.ai.suggestedMetaDescription ||
    result.pageTextPreview.slice(0, 160) ||
    "No meta description set.";
  let displayUrl = result.url;
  try {
    const u = new URL(result.url);
    displayUrl = `${u.hostname}${u.pathname}`.replace(/\/$/, "");
  } catch {
    // keep raw
  }
  return {
    title: title.slice(0, 70),
    url: result.url,
    description: description.slice(0, 170),
    titleTruncated: title.length > 60,
    descriptionTruncated: description.length > 160,
    displayUrl,
  };
}

export function buildPriorityActions(
  result: SeoAnalysisResult,
  extras?: { brokenCount?: number; pageSpeedPerf?: number | null }
): PriorityAction[] {
  const actions: PriorityAction[] = [];
  const critical = result.issues.filter((i) => i.severity === "critical");
  const warnings = result.issues.filter((i) => i.severity === "warning");

  for (const issue of critical.slice(0, 5)) {
    actions.push({
      id: `p0-${issue.id}`,
      level: "P0",
      title: issue.title,
      detail: issue.recommendation,
      category: issue.category,
      impact: "high",
    });
  }

  if (result.ai.primaryKeyword) {
    actions.push({
      id: "p0-primary-kw",
      level: "P0",
      title: `Lock primary keyword: ${result.ai.primaryKeyword}`,
      detail: "Place in title, H1, meta description, URL slug (if possible), and first 100 words.",
      category: "Keywords",
      impact: "high",
    });
  }

  for (const issue of warnings.slice(0, 6)) {
    actions.push({
      id: `p1-${issue.id}`,
      level: "P1",
      title: issue.title,
      detail: issue.recommendation,
      category: issue.category,
      impact: "medium",
    });
  }

  if ((extras?.brokenCount || 0) > 0) {
    actions.push({
      id: "p1-broken-links",
      level: "P1",
      title: `Fix ${extras?.brokenCount} broken link(s)`,
      detail: "Broken links waste crawl budget and hurt UX/trust signals.",
      category: "Links",
      impact: "medium",
    });
  }

  if (extras?.pageSpeedPerf != null && extras.pageSpeedPerf < 70) {
    actions.push({
      id: "p1-pagespeed",
      level: "P1",
      title: `Improve mobile performance (PSI ${extras.pageSpeedPerf})`,
      detail: "Optimize LCP images, reduce JS, improve TTFB via CDN/caching.",
      category: "Performance",
      impact: "high",
    });
  }

  for (const gap of result.ai.contentGaps.slice(0, 4)) {
    actions.push({
      id: `p2-gap-${gap.slice(0, 24)}`,
      level: "P2",
      title: "Fill content gap",
      detail: gap,
      category: "Content",
      impact: "low",
    });
  }

  for (const tip of result.ai.priorityActions.slice(0, 4)) {
    if (actions.some((a) => a.detail === tip || a.title === tip)) continue;
    actions.push({
      id: `p2-ai-${actions.length}`,
      level: "P2",
      title: tip.slice(0, 80),
      detail: tip,
      category: "Strategy",
      impact: "medium",
    });
  }

  return actions.slice(0, 18);
}

export function issueCounts(issues: SeoIssue[]) {
  return {
    critical: issues.filter((i) => i.severity === "critical").length,
    warning: issues.filter((i) => i.severity === "warning").length,
    info: issues.filter((i) => i.severity === "info").length,
    pass: issues.filter((i) => i.severity === "pass").length,
  };
}
