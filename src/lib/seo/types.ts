export type Severity = "critical" | "warning" | "info" | "pass";

export interface SeoIssue {
  id: string;
  category: string;
  severity: Severity;
  title: string;
  message: string;
  recommendation: string;
  currentValue?: string;
}

export interface MetaTags {
  title: string | null;
  titleLength: number;
  description: string | null;
  descriptionLength: number;
  canonical: string | null;
  robots: string | null;
  viewport: string | null;
  charset: string | null;
  language: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogUrl: string | null;
  ogType: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  favicon: string | null;
}

export interface HeadingInfo {
  h1: string[];
  h2: string[];
  h3: string[];
  h4: string[];
  h5: string[];
  h6: string[];
  hierarchyIssues: string[];
}

export interface ImageInfo {
  total: number;
  withAlt: number;
  withoutAlt: number;
  emptyAlt: number;
  missingAltExamples: string[];
}

export interface LinkInfo {
  internal: number;
  external: number;
  nofollow: number;
  brokenCandidates: number;
  internalSamples: string[];
  externalSamples: string[];
}

export interface KeywordItem {
  keyword: string;
  count: number;
  density: number;
  inTitle: boolean;
  inH1: boolean;
  inMeta: boolean;
  inUrl: boolean;
  score: number;
  verdict: "good" | "weak" | "bad" | "stuffed";
  reason: string;
  suggestion?: string;
}

export interface KeywordSuggestion {
  keyword: string;
  type: "primary" | "secondary" | "long-tail" | "missing";
  reason: string;
  estimatedIntent: "informational" | "commercial" | "navigational" | "transactional";
}

export interface KeywordReport {
  primaryCandidates: KeywordItem[];
  weakKeywords: KeywordItem[];
  badKeywords: KeywordItem[];
  stuffedKeywords: KeywordItem[];
  suggestions: KeywordSuggestion[];
  wordCount: number;
  uniqueWords: number;
  topPhrases: KeywordItem[];
}

export interface TechnicalSeo {
  https: boolean;
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  robotsTxtUrl: string | null;
  sitemapUrl: string | null;
  hasStructuredData: boolean;
  structuredDataTypes: string[];
  hasHreflang: boolean;
  hreflangCount: number;
  contentLength: number;
  loadTimeMs: number | null;
}

export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
  weight: number;
}

export interface AiKeywordVerdict {
  keyword: string;
  verdict: "good" | "weak" | "bad" | "stuffed";
  reason: string;
  betterAlternative?: string;
}

export interface AiInsight {
  enabled: boolean;
  model: string | null;
  error: string | null;
  strategistSummary: string | null;
  primaryKeyword: string | null;
  suggestedTitle: string | null;
  suggestedMetaDescription: string | null;
  suggestedH1: string | null;
  keywordVerdicts: AiKeywordVerdict[];
  suggestedKeywords: KeywordSuggestion[];
  priorityActions: string[];
  contentGaps: string[];
}

export interface SeoAnalysisResult {
  url: string;
  analyzedAt: string;
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
  categoryScores: CategoryScore[];
  meta: MetaTags;
  headings: HeadingInfo;
  images: ImageInfo;
  links: LinkInfo;
  technical: TechnicalSeo;
  issues: SeoIssue[];
  keywords: KeywordReport;
  pageTextPreview: string;
  ai: AiInsight;
}
