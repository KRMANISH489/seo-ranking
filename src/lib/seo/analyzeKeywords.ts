import { STOPWORDS, WEAK_FOCUS_WORDS } from "./stopwords";
import type { KeywordItem, KeywordReport, KeywordSuggestion } from "./types";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !/^\d+$/.test(t));
}

function ngrams(tokens: string[], n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    const slice = tokens.slice(i, i + n);
    if (slice.some((w) => STOPWORDS.has(w))) {
      // allow bigrams/trigrams if not ALL stopwords and ends aren't pure stop
      if (n === 1) continue;
      if (STOPWORDS.has(slice[0]) || STOPWORDS.has(slice[n - 1])) continue;
      if (slice.every((w) => STOPWORDS.has(w))) continue;
    }
    out.push(slice.join(" "));
  }
  return out;
}

function containsPhrase(haystack: string, phrase: string): boolean {
  return haystack.toLowerCase().includes(phrase.toLowerCase());
}

function scoreKeyword(
  keyword: string,
  count: number,
  density: number,
  flags: { inTitle: boolean; inH1: boolean; inMeta: boolean; inUrl: boolean },
  wordCount: number
): KeywordItem {
  const words = keyword.split(" ");
  const isSingle = words.length === 1;
  const isStop = isSingle && STOPWORDS.has(keyword);
  const isWeak = isSingle && WEAK_FOCUS_WORDS.has(keyword);
  const tooShort = keyword.length < 3;
  const stuffed = density >= 3.5 && count >= 5;
  const rare = count === 1 && wordCount > 200;

  let verdict: KeywordItem["verdict"] = "good";
  let reason = "Balanced usage and appears in key SEO locations.";
  let suggestion: string | undefined;
  let score = 55;

  if (flags.inTitle) score += 15;
  if (flags.inH1) score += 12;
  if (flags.inMeta) score += 8;
  if (flags.inUrl) score += 5;
  if (words.length >= 2) score += 8;
  if (words.length >= 3) score += 4;
  if (density >= 0.5 && density <= 2.5) score += 10;
  if (count >= 3) score += 5;

  if (isStop || tooShort) {
    verdict = "bad";
    reason = "This is a stop/generic word — useless as a target keyword.";
    suggestion = "Drop this as a focus keyword. Target a specific topic phrase instead.";
    score = Math.min(score, 15);
  } else if (stuffed) {
    verdict = "stuffed";
    reason = `Keyword density is ${density.toFixed(1)}% — looks like stuffing to search engines.`;
    suggestion = `Reduce repeats of "${keyword}" and use natural synonyms / related phrases.`;
    score = Math.min(score, 25);
  } else if (isWeak) {
    verdict = "weak";
    reason = "Too generic to rank for. Competitors with niche terms will beat this.";
    suggestion = `Make it specific — e.g. pair with your niche: "${keyword} for [your niche]".`;
    score = Math.min(score, 40);
  } else if (!flags.inTitle && !flags.inH1 && count >= 3) {
    verdict = "weak";
    reason = "Shows up in content but missing from title and H1 — wasted ranking signal.";
    suggestion = `Add "${keyword}" naturally into the page title and main H1.`;
    score = Math.max(30, score - 20);
  } else if (rare && !flags.inTitle) {
    verdict = "weak";
    reason = "Appears only once — not strong enough to target as a primary keyword.";
    suggestion = `If this matters, use "${keyword}" 2–4 more times naturally across headings and body.`;
    score = Math.max(25, score - 15);
  } else if (density > 0 && density < 0.3 && flags.inTitle) {
    verdict = "weak";
    reason = "In title but barely supported in body content.";
    suggestion = `Expand content around "${keyword}" so the page actually matches search intent.`;
    score = Math.max(35, score - 10);
  } else if (flags.inTitle || flags.inH1) {
    verdict = "good";
    reason = "Well placed in important on-page SEO elements.";
  }

  score = Math.max(0, Math.min(100, score));

  return {
    keyword,
    count,
    density: Number(density.toFixed(2)),
    ...flags,
    score,
    verdict,
    reason,
    suggestion,
  };
}

function intentFor(keyword: string): KeywordSuggestion["estimatedIntent"] {
  const k = keyword.toLowerCase();
  if (/\b(buy|price|pricing|cheap|deal|order|shop|discount|cost)\b/.test(k)) {
    return "transactional";
  }
  if (/\b(best|vs|review|compare|top|alternative)\b/.test(k)) {
    return "commercial";
  }
  if (/\b(login|signin|dashboard|account|official)\b/.test(k)) {
    return "navigational";
  }
  return "informational";
}

function pluralizeHint(word: string): string[] {
  const hints: string[] = [];
  if (!word.endsWith("s") && word.length > 3) hints.push(`${word}s`);
  if (word.endsWith("y") && word.length > 3) hints.push(`${word.slice(0, -1)}ies`);
  return hints;
}

export function analyzeKeywords(input: {
  title: string;
  description: string;
  h1: string[];
  bodyText: string;
  url: string;
}): KeywordReport {
  const { title, description, h1, bodyText, url } = input;
  const tokens = tokenize(bodyText);
  const wordCount = tokens.filter((t) => !STOPWORDS.has(t)).length;
  const uniqueWords = new Set(tokens.filter((t) => !STOPWORDS.has(t))).size;

  const uni = ngrams(tokens, 1);
  const bi = ngrams(tokens, 2);
  const tri = ngrams(tokens, 3);

  const counts = new Map<string, number>();
  for (const phrase of [...uni, ...bi, ...tri]) {
    // skip pure stopword unigrams already filtered; skip very long rare noise
    if (phrase.length < 3) continue;
    counts.set(phrase, (counts.get(phrase) || 0) + 1);
  }

  const titleL = title.toLowerCase();
  const metaL = description.toLowerCase();
  const h1L = h1.join(" ").toLowerCase();
  const urlL = decodeURIComponent(url).toLowerCase();

  const items: KeywordItem[] = [];
  for (const [keyword, count] of counts.entries()) {
    // keep meaningful frequency: unigrams >=2, multi >=2, or present in title/h1
    const parts = keyword.split(" ").length;
    const inTitle = containsPhrase(titleL, keyword);
    const inH1 = containsPhrase(h1L, keyword);
    if (count < 2 && !inTitle && !inH1) continue;
    if (parts === 1 && STOPWORDS.has(keyword) && !inTitle) continue;

    const density = wordCount > 0 ? (count / Math.max(wordCount, 1)) * 100 : 0;
    // For multi-word, density vs total tokens is fine as relative signal
    items.push(
      scoreKeyword(
        keyword,
        count,
        density,
        {
          inTitle,
          inH1,
          inMeta: containsPhrase(metaL, keyword),
          inUrl: containsPhrase(urlL, keyword.replace(/\s+/g, "-")) || containsPhrase(urlL, keyword.replace(/\s+/g, "")),
        },
        wordCount
      )
    );
  }

  items.sort((a, b) => b.score - a.score || b.count - a.count);

  const topPhrases = items.filter((i) => i.keyword.includes(" ")).slice(0, 15);
  const primaryCandidates = items
    .filter((i) => i.verdict === "good")
    .slice(0, 12);
  const weakKeywords = items.filter((i) => i.verdict === "weak").slice(0, 12);
  const badKeywords = items.filter((i) => i.verdict === "bad").slice(0, 10);
  const stuffedKeywords = items.filter((i) => i.verdict === "stuffed").slice(0, 8);

  const suggestions: KeywordSuggestion[] = [];
  const seen = new Set<string>();

  const pushSug = (s: KeywordSuggestion) => {
    const key = s.keyword.toLowerCase();
    if (seen.has(key) || key.length < 4) return;
    seen.add(key);
    suggestions.push(s);
  };

  // Primary from best scoring multi-word phrases
  for (const p of topPhrases.slice(0, 5)) {
    pushSug({
      keyword: p.keyword,
      type: p.inTitle || p.inH1 ? "primary" : "secondary",
      reason: p.inTitle
        ? "Already aligned with title — strengthen this as your main target."
        : "High relevance in content — strong candidate for primary/secondary keyword.",
      estimatedIntent: intentFor(p.keyword),
    });
  }

  // Missing: strong body phrases not in title
  for (const p of items) {
    if (p.keyword.split(" ").length < 2) continue;
    if (p.count >= 3 && !p.inTitle && !p.inH1 && p.verdict !== "bad") {
      pushSug({
        keyword: p.keyword,
        type: "missing",
        reason: `Used ${p.count}× in body but missing from title/H1 — easy ranking win if added.`,
        estimatedIntent: intentFor(p.keyword),
      });
    }
  }

  // Long-tail suggestions from top unigrams + modifiers
  const topUnis = items
    .filter((i) => !i.keyword.includes(" ") && i.verdict !== "bad" && i.count >= 3)
    .slice(0, 6);

  const modifiers = ["guide", "checklist", "tools", "examples", "best practices", "how to", "for beginners", "2026"];
  for (const u of topUnis) {
    for (const mod of modifiers.slice(0, 3)) {
      const phrase = `${u.keyword} ${mod}`;
      if (!containsPhrase(bodyText, phrase)) {
        pushSug({
          keyword: phrase,
          type: "long-tail",
          reason: `Long-tail around "${u.keyword}" — easier to rank than the bare term.`,
          estimatedIntent: intentFor(phrase),
        });
      }
    }
    for (const alt of pluralizeHint(u.keyword)) {
      pushSug({
        keyword: alt,
        type: "secondary",
        reason: `Related form of "${u.keyword}" — use for natural variation (avoid stuffing one form).`,
        estimatedIntent: intentFor(alt),
      });
    }
  }

  // If title keyword is weak, suggest replacing
  const titleTokens = tokenize(title).filter((t) => !STOPWORDS.has(t));
  for (const t of titleTokens.slice(0, 4)) {
    if (WEAK_FOCUS_WORDS.has(t) || t.length < 4) {
      const better = topPhrases[0]?.keyword || topUnis[0]?.keyword;
      if (better) {
        pushSug({
          keyword: better,
          type: "primary",
          reason: `Title relies on weak word "${t}". Prefer a specific phrase like "${better}".`,
          estimatedIntent: intentFor(better),
        });
      }
    }
  }

  if (suggestions.length === 0 && topUnis[0]) {
    pushSug({
      keyword: `${topUnis[0].keyword} guide`,
      type: "long-tail",
      reason: "Start with a clear long-tail topic based on your strongest content term.",
      estimatedIntent: "informational",
    });
  }

  return {
    primaryCandidates,
    weakKeywords,
    badKeywords,
    stuffedKeywords,
    suggestions: suggestions.slice(0, 18),
    wordCount,
    uniqueWords,
    topPhrases,
  };
}
