import * as cheerio from "cheerio";
import { fetchPage } from "./fetchPage";
import { analyzeKeywords } from "./analyzeKeywords";
import { computeScores } from "./score";
import { aiIssues, enrichWithAI, mergeAiIntoKeywords } from "./aiEnrich";
import {
  buildIssues,
  buildTechnical,
  extractBodyText,
  extractHeadings,
  extractImages,
  extractLinks,
  extractMeta,
} from "./analyzeOnPage";
import type { AiInsight, SeoAnalysisResult, SeoIssue } from "./types";

export interface AnalyzeOptions {
  skipAi?: boolean;
}

function emptyAi(): AiInsight {
  return {
    enabled: false,
    model: null,
    error: null,
    strategistSummary: null,
    primaryKeyword: null,
    suggestedTitle: null,
    suggestedMetaDescription: null,
    suggestedH1: null,
    keywordVerdicts: [],
    suggestedKeywords: [],
    priorityActions: [],
    contentGaps: [],
  };
}

function keywordIssuesFromReport(result: ReturnType<typeof analyzeKeywords>): SeoIssue[] {
  const issues: SeoIssue[] = [];

  for (const bad of result.badKeywords.slice(0, 5)) {
    issues.push({
      id: `kw-bad-${bad.keyword}`,
      category: "Content",
      severity: "warning",
      title: `Bad focus keyword: "${bad.keyword}"`,
      message: bad.reason,
      recommendation: bad.suggestion || "Replace with a specific, intent-matching phrase.",
      currentValue: `count=${bad.count}, density=${bad.density}%`,
    });
  }

  result.stuffedKeywords.slice(0, 4).forEach((stuffed, idx) => {
    issues.push({
      id: `kw-stuff-${stuffed.keyword}`,
      category: "Content",
      // Only the worst stuffing is critical; rest are warnings (avoids Content score collapsing to 0)
      severity: idx === 0 && stuffed.density >= 5 ? "critical" : "warning",
      title: `Keyword stuffing: "${stuffed.keyword}"`,
      message: stuffed.reason,
      recommendation: stuffed.suggestion || "Reduce repetition and use synonyms.",
      currentValue: `density=${stuffed.density}%`,
    });
  });

  if (result.suggestions[0]) {
    const s = result.suggestions[0];
    issues.push({
      id: "kw-suggest-primary",
      category: "Content",
      severity: "info",
      title: `Recommended primary keyword: "${s.keyword}"`,
      message: s.reason,
      recommendation: `Target "${s.keyword}" in title, H1, first paragraph, and one H2.`,
    });
  }

  if (result.wordCount > 0 && result.primaryCandidates.length === 0) {
    issues.push({
      id: "kw-no-primary",
      category: "Content",
      severity: "warning",
      title: "No strong primary keyword detected",
      message: "Content lacks a clear, well-placed target phrase.",
      recommendation: "Pick one primary phrase and place it in title + H1 + meta description.",
    });
  }

  return issues;
}

export async function analyzeUrl(
  inputUrl: string,
  options: AnalyzeOptions = {}
): Promise<SeoAnalysisResult> {
  const page = await fetchPage(inputUrl);
  const $ = cheerio.load(page.html);

  const meta = extractMeta($, page.finalUrl);
  const headings = extractHeadings($);
  const images = extractImages($);
  const links = extractLinks($, page.finalUrl);
  const bodyText = extractBodyText($);
  const technical = buildTechnical(page, $, bodyText);
  const pageTextPreview = bodyText.slice(0, 400) + (bodyText.length > 400 ? "…" : "");

  let keywords = analyzeKeywords({
    title: meta.title || "",
    description: meta.description || "",
    h1: headings.h1,
    bodyText,
    url: page.finalUrl,
  });

  let issues = [
    ...buildIssues({
      meta,
      headings,
      images,
      links,
      technical,
      wordCount: keywords.wordCount,
    }),
    ...keywordIssuesFromReport(keywords),
  ];

  let { overallScore, grade, categoryScores, summary } = computeScores(issues);

  let ai = emptyAi();
  if (!options.skipAi) {
    ai = await enrichWithAI({
      url: page.finalUrl,
      meta,
      h1: headings.h1,
      h2: headings.h2,
      pageTextPreview: bodyText.slice(0, 2800),
      overallScore,
      grade,
      issues,
      keywords,
    });

    keywords = mergeAiIntoKeywords(keywords, ai);
    issues = [...issues, ...aiIssues(ai, issues)];
    ({ overallScore, grade, categoryScores, summary } = computeScores(issues));

    if (ai.enabled && !ai.error && ai.strategistSummary) {
      summary = ai.strategistSummary;
    }
  }

  return {
    url: page.finalUrl,
    analyzedAt: new Date().toISOString(),
    overallScore,
    grade,
    summary,
    categoryScores,
    meta,
    headings,
    images,
    links,
    technical,
    issues,
    keywords,
    pageTextPreview,
    ai,
  };
}
