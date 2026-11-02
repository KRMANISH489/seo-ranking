import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  AiInsight,
  AiKeywordVerdict,
  KeywordReport,
  KeywordSuggestion,
  MetaTags,
  SeoIssue,
} from "./types";

const EMPTY_AI: AiInsight = {
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

interface EnrichInput {
  url: string;
  meta: MetaTags;
  h1: string[];
  h2: string[];
  pageTextPreview: string;
  overallScore: number;
  grade: string;
  issues: SeoIssue[];
  keywords: KeywordReport;
}

interface AiJsonResponse {
  strategistSummary?: string;
  primaryKeyword?: string;
  suggestedTitle?: string;
  suggestedMetaDescription?: string;
  suggestedH1?: string;
  keywordVerdicts?: AiKeywordVerdict[];
  suggestedKeywords?: KeywordSuggestion[];
  priorityActions?: string[];
  contentGaps?: string[];
}

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY?.trim() || null;
}

function getModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
}

function buildPrompt(input: EnrichInput): string {
  const topPhrases = input.keywords.topPhrases.slice(0, 12).map((k) => k.keyword);
  const primary = input.keywords.primaryCandidates.slice(0, 8).map((k) => ({
    keyword: k.keyword,
    density: k.density,
    inTitle: k.inTitle,
    inH1: k.inH1,
    verdict: k.verdict,
  }));
  const weak = input.keywords.weakKeywords.slice(0, 8).map((k) => k.keyword);
  const bad = [
    ...input.keywords.badKeywords.slice(0, 6),
    ...input.keywords.stuffedKeywords.slice(0, 4),
  ].map((k) => ({ keyword: k.keyword, verdict: k.verdict, density: k.density }));

  const criticalIssues = input.issues
    .filter((i) => i.severity === "critical" || i.severity === "warning")
    .slice(0, 12)
    .map((i) => `${i.severity}: ${i.title} — ${i.message}`);

  return `You are a senior SEO strategist. Analyze this page like an SEO team would.

URL: ${input.url}
Score: ${input.overallScore}/100 (grade ${input.grade})
Title: ${input.meta.title || "(missing)"}
Meta description: ${input.meta.description || "(missing)"}
H1: ${input.h1.join(" | ") || "(missing)"}
H2 sample: ${input.h2.slice(0, 8).join(" | ") || "(none)"}
Word count (approx meaningful): ${input.keywords.wordCount}

Heuristic top phrases: ${JSON.stringify(topPhrases)}
Heuristic primary candidates: ${JSON.stringify(primary)}
Heuristic weak keywords: ${JSON.stringify(weak)}
Heuristic bad/stuffed: ${JSON.stringify(bad)}
Key issues: ${JSON.stringify(criticalIssues)}

Page text preview:
"""
${input.pageTextPreview.slice(0, 2500)}
"""

Return ONLY valid JSON (no markdown) with this exact shape:
{
  "strategistSummary": "2-4 sentence executive SEO summary in plain language",
  "primaryKeyword": "best single primary keyword/phrase to target",
  "suggestedTitle": "improved title tag <= 60 chars",
  "suggestedMetaDescription": "improved meta description 140-160 chars",
  "suggestedH1": "improved H1",
  "keywordVerdicts": [
    {
      "keyword": "string from page or title",
      "verdict": "good|weak|bad|stuffed",
      "reason": "why this keyword is good/bad for ranking",
      "betterAlternative": "optional better phrase"
    }
  ],
  "suggestedKeywords": [
    {
      "keyword": "phrase",
      "type": "primary|secondary|long-tail|missing",
      "reason": "why target this",
      "estimatedIntent": "informational|commercial|navigational|transactional"
    }
  ],
  "priorityActions": ["action 1", "action 2", "action 3", "action 4", "action 5"],
  "contentGaps": ["topic/angle missing from page that searchers want"]
}

Rules:
- Be specific to THIS page/business, not generic advice.
- Mark clearly bad focus keywords (too generic, branded-only noise, stuffing, stop-words as focus).
- Suggest realistic keywords this page can actually rank for.
- Prefer English unless the page content is clearly another language — then match that language.
- keywordVerdicts: include 6-12 items mixing good and bad.
- suggestedKeywords: 8-12 items.
- priorityActions: ordered by impact.`;
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function normalizeSuggestions(raw: KeywordSuggestion[] | undefined): KeywordSuggestion[] {
  if (!Array.isArray(raw)) return [];
  const allowedType = new Set(["primary", "secondary", "long-tail", "missing"]);
  const allowedIntent = new Set([
    "informational",
    "commercial",
    "navigational",
    "transactional",
  ]);

  return raw
    .filter((s) => s && typeof s.keyword === "string" && s.keyword.trim())
    .map((s) => ({
      keyword: String(s.keyword).trim(),
      type: (allowedType.has(s.type) ? s.type : "secondary") as KeywordSuggestion["type"],
      reason: String(s.reason || "AI-recommended keyword target.").trim(),
      estimatedIntent: (allowedIntent.has(s.estimatedIntent)
        ? s.estimatedIntent
        : "informational") as KeywordSuggestion["estimatedIntent"],
    }))
    .slice(0, 14);
}

function normalizeVerdicts(raw: AiKeywordVerdict[] | undefined): AiKeywordVerdict[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set(["good", "weak", "bad", "stuffed"]);
  return raw
    .filter((v) => v && typeof v.keyword === "string" && v.keyword.trim())
    .map((v) => ({
      keyword: String(v.keyword).trim(),
      verdict: (allowed.has(v.verdict) ? v.verdict : "weak") as AiKeywordVerdict["verdict"],
      reason: String(v.reason || "AI review.").trim(),
      betterAlternative: v.betterAlternative
        ? String(v.betterAlternative).trim()
        : undefined,
    }))
    .slice(0, 14);
}

export async function enrichWithAI(input: EnrichInput): Promise<AiInsight> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      ...EMPTY_AI,
      enabled: false,
      error: "GEMINI_API_KEY missing. Add it to .env.local to enable AI SEO strategist.",
    };
  }

  const modelName = getModel();

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.35,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent([
      {
        text: "You are CodAbhi SEO AI, an expert SEO strategist. Respond with strict JSON only.",
      },
      { text: buildPrompt(input) },
    ]);

    const content = result.response.text();
    if (!content) {
      return {
        ...EMPTY_AI,
        enabled: true,
        model: modelName,
        error: "Gemini returned an empty response.",
      };
    }

    const parsed = JSON.parse(stripJsonFence(content)) as AiJsonResponse;

    return {
      enabled: true,
      model: modelName,
      error: null,
      strategistSummary: parsed.strategistSummary?.trim() || null,
      primaryKeyword: parsed.primaryKeyword?.trim() || null,
      suggestedTitle: parsed.suggestedTitle?.trim() || null,
      suggestedMetaDescription: parsed.suggestedMetaDescription?.trim() || null,
      suggestedH1: parsed.suggestedH1?.trim() || null,
      keywordVerdicts: normalizeVerdicts(parsed.keywordVerdicts),
      suggestedKeywords: normalizeSuggestions(parsed.suggestedKeywords),
      priorityActions: Array.isArray(parsed.priorityActions)
        ? parsed.priorityActions.map(String).filter(Boolean).slice(0, 8)
        : [],
      contentGaps: Array.isArray(parsed.contentGaps)
        ? parsed.contentGaps.map(String).filter(Boolean).slice(0, 8)
        : [],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gemini request failed.";
    return {
      ...EMPTY_AI,
      enabled: true,
      model: modelName,
      error: message,
    };
  }
}

/** @deprecated Use enrichWithAI — kept for older imports */
export const enrichWithOpenAI = enrichWithAI;

export function mergeAiIntoKeywords(
  keywords: KeywordReport,
  ai: AiInsight
): KeywordReport {
  if (!ai.enabled || ai.error || ai.suggestedKeywords.length === 0) {
    return keywords;
  }

  const seen = new Set(ai.suggestedKeywords.map((s) => s.keyword.toLowerCase()));
  const leftovers = keywords.suggestions.filter((s) => !seen.has(s.keyword.toLowerCase()));

  return {
    ...keywords,
    suggestions: [...ai.suggestedKeywords, ...leftovers].slice(0, 18),
  };
}

export function aiIssues(ai: AiInsight): SeoIssue[] {
  if (!ai.enabled || ai.error) return [];

  const issues: SeoIssue[] = [];

  if (ai.primaryKeyword) {
    issues.push({
      id: "ai-primary-keyword",
      category: "Content",
      severity: "info",
      title: `AI primary keyword: "${ai.primaryKeyword}"`,
      message: "Gemini selected this as the strongest ranking target for the page.",
      recommendation: `Put "${ai.primaryKeyword}" in title, H1, meta description, and first 100 words.`,
    });
  }

  for (const v of ai.keywordVerdicts
    .filter((x) => x.verdict === "bad" || x.verdict === "stuffed")
    .slice(0, 5)) {
    issues.push({
      id: `ai-kw-${v.verdict}-${v.keyword}`,
      category: "Content",
      severity: v.verdict === "stuffed" ? "critical" : "warning",
      title: `AI says ${v.verdict}: "${v.keyword}"`,
      message: v.reason,
      recommendation: v.betterAlternative
        ? `Use "${v.betterAlternative}" instead.`
        : "Do not use this as a focus keyword.",
    });
  }

  return issues;
}
