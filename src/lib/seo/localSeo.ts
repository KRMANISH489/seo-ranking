import type { LocalSeoIssue, LocalSeoListing, LocalSeoReport } from "./proTypes";

export interface LocalSeoOptions {
  enabled?: boolean;
  businessQuery?: string | null;
  gbpUrl?: string | null;
  siteUrl: string;
  pageText?: string | null;
}

type SerperPlace = {
  title?: string;
  address?: string;
  phoneNumber?: string;
  website?: string;
  rating?: number;
  ratingCount?: number;
  type?: string;
  types?: string[];
  category?: string;
  placeId?: string;
  cid?: string | number;
  latitude?: number;
  longitude?: number;
  position?: number;
};

function emptyReport(partial: Partial<LocalSeoReport> = {}): LocalSeoReport {
  return {
    enabled: false,
    error: null,
    query: null,
    score: null,
    grade: null,
    listing: null,
    issues: [],
    napMatch: {
      websiteMatch: null,
      phoneFoundOnSite: null,
      notes: [],
    },
    ...partial,
  };
}

function hostnameOf(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.replace(/^www\./, "").split("/")[0].toLowerCase();
  }
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function gradeFromScore(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function extractQueryFromGbpUrl(raw: string): string | null {
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (!/google\.[^/]+$/i.test(u.hostname) && !u.hostname.includes("google.")) {
      if (u.hostname.includes("maps.app.goo.gl") || u.hostname.includes("goo.gl")) {
        return raw;
      }
      return null;
    }
    const q = u.searchParams.get("q") || u.searchParams.get("query");
    if (q) return q;
    // /maps/place/Name/@lat,lng
    const place = u.pathname.match(/\/maps\/place\/([^/]+)/i);
    if (place?.[1]) return decodeURIComponent(place[1].replace(/\+/g, " "));
    return raw;
  } catch {
    return raw.trim() || null;
  }
}

function pickBestPlace(places: SerperPlace[], siteUrl: string): SerperPlace | null {
  if (!places.length) return null;
  const siteHost = hostnameOf(siteUrl);
  const withSite = places.find((p) => p.website && hostnameOf(p.website) === siteHost);
  if (withSite) return withSite;
  const withSiteLoose = places.find(
    (p) => p.website && hostnameOf(p.website).includes(siteHost.split(".")[0] || siteHost)
  );
  if (withSiteLoose) return withSiteLoose;
  return places[0];
}

function toListing(place: SerperPlace, query: string): LocalSeoListing {
  const categories = [
    ...(place.types || []),
    place.type,
    place.category,
  ].filter((x): x is string => Boolean(x));
  const uniqueCats = [...new Set(categories)];
  return {
    name: place.title || null,
    address: place.address || null,
    phone: place.phoneNumber || null,
    website: place.website || null,
    rating: typeof place.rating === "number" ? place.rating : null,
    reviewCount: typeof place.ratingCount === "number" ? place.ratingCount : null,
    category: place.category || place.type || uniqueCats[0] || null,
    categories: uniqueCats,
    mapsUrl: mapsSearchUrl(place.title ? `${place.title} ${place.address || ""}`.trim() : query),
    placeId: place.placeId || null,
    cid: place.cid != null ? String(place.cid) : null,
    latitude: typeof place.latitude === "number" ? place.latitude : null,
    longitude: typeof place.longitude === "number" ? place.longitude : null,
  };
}

function scoreListing(
  listing: LocalSeoListing,
  siteUrl: string,
  pageText: string | null | undefined
): { score: number; issues: LocalSeoIssue[]; napMatch: LocalSeoReport["napMatch"] } {
  let score = 40;
  const issues: LocalSeoIssue[] = [];
  const notes: string[] = [];
  const siteHost = hostnameOf(siteUrl);

  let websiteMatch: boolean | null = null;
  if (listing.website) {
    websiteMatch = hostnameOf(listing.website) === siteHost || hostnameOf(listing.website).endsWith(`.${siteHost}`) || siteHost.endsWith(`.${hostnameOf(listing.website)}`);
    if (websiteMatch) {
      score += 20;
      issues.push({
        id: "website-match",
        severity: "pass",
        title: "GBP website matches audited site",
        detail: `Listing website points to ${listing.website}`,
      });
      notes.push("Website on Google Business Profile matches the audited domain.");
    } else {
      score -= 10;
      issues.push({
        id: "website-mismatch",
        severity: "critical",
        title: "GBP website does not match site",
        detail: `Listing website is ${listing.website}, but audit URL host is ${siteHost}. Align NAP / website on GBP.`,
      });
      notes.push("Fix Google Business Profile website URL to match the client site.");
    }
  } else {
    score -= 15;
    issues.push({
      id: "missing-website",
      severity: "critical",
      title: "No website on Google Business Profile",
      detail: "Add the business website URL to GBP — it drives Maps → site traffic.",
    });
  }

  let phoneFoundOnSite: boolean | null = null;
  if (listing.phone) {
    score += 10;
    const digits = normalizePhone(listing.phone);
    const last8 = digits.slice(-8);
    if (pageText && last8.length >= 7) {
      const pageDigits = normalizePhone(pageText);
      phoneFoundOnSite = pageDigits.includes(last8);
      if (phoneFoundOnSite) {
        score += 10;
        issues.push({
          id: "phone-nap-ok",
          severity: "pass",
          title: "Phone found on website (NAP)",
          detail: listing.phone,
        });
      } else {
        issues.push({
          id: "phone-nap-missing",
          severity: "warning",
          title: "GBP phone not clearly on website",
          detail: `Add ${listing.phone} in footer/contact for NAP consistency.`,
        });
        notes.push("Publish the same phone number on the website contact/footer.");
      }
    }
  } else {
    score -= 8;
    issues.push({
      id: "missing-phone",
      severity: "warning",
      title: "Missing phone on GBP",
      detail: "Add a local phone number to improve trust and call conversions.",
    });
  }

  if (listing.address) {
    score += 8;
  } else {
    score -= 12;
    issues.push({
      id: "missing-address",
      severity: "critical",
      title: "Missing address on GBP",
      detail: "Complete the business address for local pack eligibility.",
    });
  }

  if (listing.category) {
    score += 7;
  } else {
    issues.push({
      id: "missing-category",
      severity: "warning",
      title: "Primary category missing",
      detail: "Set the most specific primary category on Google Business Profile.",
    });
  }

  if (listing.rating != null) {
    if (listing.rating >= 4.3) score += 10;
    else if (listing.rating >= 3.8) score += 5;
    else {
      score -= 5;
      issues.push({
        id: "low-rating",
        severity: "warning",
        title: `Rating is ${listing.rating.toFixed(1)}`,
        detail: "Improve service quality and request reviews from happy customers.",
      });
    }
  }

  const reviews = listing.reviewCount ?? 0;
  if (reviews >= 50) score += 10;
  else if (reviews >= 15) score += 6;
  else if (reviews >= 5) score += 3;
  else {
    issues.push({
      id: "few-reviews",
      severity: "warning",
      title: `Only ${reviews} Google review(s)`,
      detail: "Aim for a steady flow of authentic reviews (never buy/fake reviews).",
    });
  }

  if (!listing.name) {
    issues.push({
      id: "missing-name",
      severity: "critical",
      title: "Business name missing",
      detail: "Could not read a clear business name from Maps results.",
    });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return {
    score,
    issues,
    napMatch: { websiteMatch, phoneFoundOnSite, notes },
  };
}

async function searchSerperMaps(query: string): Promise<{ places: SerperPlace[]; error?: string }> {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key) {
    return {
      places: [],
      error: "SERPER_API_KEY missing — required for Google Maps / GMB listing lookup.",
    };
  }

  const res = await fetch("https://google.serper.dev/maps", {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      gl: process.env.SERP_GL || "in",
      hl: process.env.SERP_HL || "en",
    }),
  });

  if (!res.ok) {
    return {
      places: [],
      error: `Serper Maps error ${res.status}: ${(await res.text()).slice(0, 180)}`,
    };
  }

  const data = await res.json();
  return { places: Array.isArray(data.places) ? data.places : [] };
}

export async function buildLocalSeoReport(opts: LocalSeoOptions): Promise<LocalSeoReport> {
  const enabled = opts.enabled !== false;
  if (!enabled) {
    return emptyReport({ enabled: false });
  }

  const fromUrl = opts.gbpUrl?.trim() ? extractQueryFromGbpUrl(opts.gbpUrl.trim()) : null;
  const business = opts.businessQuery?.trim() || "";
  let query = business || fromUrl || "";

  if (!query) {
    // Derive from site hostname as last resort
    const host = hostnameOf(opts.siteUrl).replace(/\.(com|in|co\.in|net|org|io)$/i, "");
    query = host.replace(/[-_]/g, " ");
  }

  if (!query) {
    return emptyReport({
      enabled: true,
      error: "Provide business name + city or a Google Maps / GBP URL for Local SEO.",
      query: null,
    });
  }

  try {
    const { places, error } = await searchSerperMaps(query);
    if (error) {
      return emptyReport({ enabled: true, error, query });
    }
    if (!places.length) {
      return emptyReport({
        enabled: true,
        error: `No Google Maps listing found for “${query}”. Try a clearer name + city.`,
        query,
      });
    }

    const best = pickBestPlace(places, opts.siteUrl);
    if (!best) {
      return emptyReport({
        enabled: true,
        error: "Maps returned results but none could be parsed.",
        query,
      });
    }

    const listing = toListing(best, query);
    const scored = scoreListing(listing, opts.siteUrl, opts.pageText);

    return {
      enabled: true,
      error: null,
      query,
      score: scored.score,
      grade: gradeFromScore(scored.score),
      listing,
      issues: scored.issues,
      napMatch: scored.napMatch,
    };
  } catch (err) {
    return emptyReport({
      enabled: true,
      error: err instanceof Error ? err.message : "Local SEO lookup failed",
      query,
    });
  }
}
