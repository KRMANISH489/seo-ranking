import type { BrokenLink } from "./proTypes";

async function checkOne(url: string): Promise<BrokenLink> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CodAbhiSEOBot/2.0)",
      },
    });
    // Some servers block HEAD
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CodAbhiSEOBot/2.0)",
        },
      });
    }
    clearTimeout(timer);
    return {
      url,
      status: res.status,
      ok: res.status >= 200 && res.status < 400,
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      url,
      status: null,
      ok: false,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }
}

export async function checkBrokenLinks(urls: string[], limit = 15): Promise<BrokenLink[]> {
  const unique = [...new Set(urls)].slice(0, limit);
  const results: BrokenLink[] = [];
  // sequential-ish batches to avoid hammering
  for (let i = 0; i < unique.length; i += 5) {
    const batch = unique.slice(i, i + 5);
    const part = await Promise.all(batch.map(checkOne));
    results.push(...part);
  }
  return results;
}
