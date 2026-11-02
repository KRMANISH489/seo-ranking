export interface RankResult {
  keyword: string;
  position: number | null;
  found: boolean;
  page: number | null;
  matchedUrl: string | null;
  matchedTitle: string | null;
  topCompetitors: { position: number; title: string; link: string }[];
  provider: "serper" | "serpapi" | "none";
  error: string | null;
  checkedAt: string;
  location: string;
}

export interface RankingReport {
  enabled: boolean;
  targetDomain: string;
  results: RankResult[];
  bestPosition: number | null;
  summary: string;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^www\./, "").split("/")[0];
  }
}

function domainMatches(link: string, targetDomain: string): boolean {
  try {
    const host = new URL(link).hostname.replace(/^www\./, "").toLowerCase();
    const target = targetDomain.replace(/^www\./, "").toLowerCase();
    return host === target || host.endsWith(`.${target}`);
  } catch {
    return false;
  }
}

async function searchSerper(keyword: string, num = 100): Promise<{
  organic: { title?: string; link?: string; position?: number }[];
  error?: string;
}> {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key) return { organic: [], error: "SERPER_API_KEY missing" };

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: keyword,
      num: Math.min(num, 100),
      gl: process.env.SERP_GL || "in",
      hl: process.env.SERP_HL || "en",
    }),
  });

  if (!res.ok) {
    return { organic: [], error: `Serper error ${res.status}: ${(await res.text()).slice(0, 160)}` };
  }
  const data = await res.json();
  return { organic: data.organic || [] };
}

async function searchSerpApi(keyword: string): Promise<{
  organic: { title?: string; link?: string; position?: number }[];
  error?: string;
}> {
  const key = process.env.SERPAPI_KEY?.trim();
  if (!key) return { organic: [], error: "SERPAPI_KEY missing" };

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", keyword);
  url.searchParams.set("api_key", key);
  url.searchParams.set("num", "100");
  url.searchParams.set("gl", process.env.SERP_GL || "in");
  url.searchParams.set("hl", process.env.SERP_HL || "en");

  const res = await fetch(url.toString());
  if (!res.ok) {
    return { organic: [], error: `SerpAPI error ${res.status}` };
  }
  const data = await res.json();
  return { organic: data.organic_results || [] };
}

export async function checkKeywordRank(
  keyword: string,
  targetUrlOrDomain: string
): Promise<RankResult> {
  const targetDomain = hostnameOf(targetUrlOrDomain);
  const checkedAt = new Date().toISOString();
  const location = `${process.env.SERP_GL || "in"}/${process.env.SERP_HL || "en"}`;

  const empty = (provider: RankResult["provider"], error: string | null): RankResult => ({
    keyword,
    position: null,
    found: false,
    page: null,
    matchedUrl: null,
    matchedTitle: null,
    topCompetitors: [],
    provider,
    error,
    checkedAt,
    location,
  });

  try {
    let organic: { title?: string; link?: string; position?: number }[] = [];
    let provider: RankResult["provider"] = "none";
    let error: string | null = null;

    if (process.env.SERPER_API_KEY?.trim()) {
      const r = await searchSerper(keyword);
      organic = r.organic;
      provider = "serper";
      error = r.error || null;
    } else if (process.env.SERPAPI_KEY?.trim()) {
      const r = await searchSerpApi(keyword);
      organic = r.organic;
      provider = "serpapi";
      error = r.error || null;
    } else {
      return empty(
        "none",
        "Add SERPER_API_KEY (https://serper.dev) or SERPAPI_KEY for real Google rankings."
      );
    }

    if (error && organic.length === 0) return empty(provider, error);

    const topCompetitors = organic.slice(0, 10).map((item, idx) => ({
      position: item.position || idx + 1,
      title: item.title || "",
      link: item.link || "",
    }));

    for (let i = 0; i < organic.length; i++) {
      const item = organic[i];
      const link = item.link || "";
      if (!link) continue;
      if (domainMatches(link, targetDomain)) {
        const position = item.position || i + 1;
        return {
          keyword,
          position,
          found: true,
          page: Math.ceil(position / 10),
          matchedUrl: link,
          matchedTitle: item.title || null,
          topCompetitors,
          provider,
          error: null,
          checkedAt,
          location,
        };
      }
    }

    return {
      keyword,
      position: null,
      found: false,
      page: null,
      matchedUrl: null,
      matchedTitle: null,
      topCompetitors,
      provider,
      error: null,
      checkedAt,
      location,
    };
  } catch (err) {
    return empty(
      "none",
      err instanceof Error ? err.message : "Rank check failed"
    );
  }
}

export async function buildRankingReport(
  targetUrl: string,
  keywords: string[]
): Promise<RankingReport> {
  const targetDomain = hostnameOf(targetUrl);
  const unique = [...new Set(keywords.map((k) => k.trim()).filter(Boolean))].slice(0, 5);

  if (unique.length === 0) {
    return {
      enabled: false,
      targetDomain,
      results: [],
      bestPosition: null,
      summary: "No target keywords provided for rank tracking.",
    };
  }

  const results: RankResult[] = [];
  for (const kw of unique) {
    results.push(await checkKeywordRank(kw, targetUrl));
  }

  const positions = results.filter((r) => r.position != null).map((r) => r.position as number);
  const bestPosition = positions.length ? Math.min(...positions) : null;
  const missingKey = results.some((r) => r.provider === "none");

  let summary = "";
  if (missingKey) {
    summary = results[0]?.error || "SERP API key required for live Google rank.";
  } else if (bestPosition != null) {
    summary = `Best Google rank: #${bestPosition} for tracked keywords (domain ${targetDomain}).`;
  } else {
    summary = `Not found in top 100 Google results for tracked keywords (${targetDomain}).`;
  }

  return {
    enabled: !missingKey,
    targetDomain,
    results,
    bestPosition,
    summary,
  };
}

export function rankingSpeedTips(report: RankingReport): string[] {
  const tips: string[] = [];
  for (const r of report.results) {
    if (!r.found || r.position == null) {
      tips.push(
        `"${r.keyword}": not in top 100 — publish a focused landing page, earn links, and match search intent tightly.`
      );
      continue;
    }
    if (r.position === 1) {
      tips.push(`"${r.keyword}": holding #1 — refresh content monthly and defend with internal links.`);
    } else if (r.position <= 3) {
      tips.push(
        `"${r.keyword}": #${r.position} — push to #1 with richer content, faster LCP, and 2–3 high-quality backlinks.`
      );
    } else if (r.position <= 10) {
      tips.push(
        `"${r.keyword}": page 1 at #${r.position} — expand topical coverage, improve title CTR, add FAQ schema.`
      );
    } else if (r.position <= 20) {
      tips.push(
        `"${r.keyword}": #${r.position} (page 2) — quick wins: stronger H1/title match, internal links from homepage, fix CWV.`
      );
    } else {
      tips.push(
        `"${r.keyword}": #${r.position} — treat as new opportunity: rewrite for intent, build supporting articles, outreach links.`
      );
    }
  }
  return tips.slice(0, 8);
}
