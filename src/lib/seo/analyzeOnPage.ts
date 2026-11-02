import * as cheerio from "cheerio";
import type {
  HeadingInfo,
  ImageInfo,
  LinkInfo,
  MetaTags,
  SeoIssue,
  TechnicalSeo,
} from "./types";
import type { FetchedPage } from "./fetchPage";

function absUrl(base: string, href: string | undefined): string | null {
  if (!href) return null;
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

export function extractMeta($: cheerio.CheerioAPI, pageUrl: string): MetaTags {
  const title = $("title").first().text().trim() || null;
  const description =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="description"]').attr("content")?.trim() ||
    null;

  const getOg = (p: string) =>
    $(`meta[property="og:${p}"]`).attr("content")?.trim() || null;
  const getTw = (n: string) =>
    $(`meta[name="twitter:${n}"]`).attr("content")?.trim() || null;

  const canonical =
    $('link[rel="canonical"]').attr("href")?.trim() ||
    absUrl(pageUrl, $('link[rel="canonical"]').attr("href")) ||
    null;

  const favicon =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    $('link[rel="apple-touch-icon"]').attr("href") ||
    null;

  return {
    title,
    titleLength: title?.length || 0,
    description,
    descriptionLength: description?.length || 0,
    canonical: canonical ? absUrl(pageUrl, canonical) || canonical : null,
    robots: $('meta[name="robots"]').attr("content")?.trim() || null,
    viewport: $('meta[name="viewport"]').attr("content")?.trim() || null,
    charset:
      $("meta[charset]").attr("charset") ||
      $('meta[http-equiv="Content-Type"]').attr("content") ||
      null,
    language: $("html").attr("lang")?.trim() || null,
    ogTitle: getOg("title"),
    ogDescription: getOg("description"),
    ogImage: getOg("image"),
    ogUrl: getOg("url"),
    ogType: getOg("type"),
    twitterCard: getTw("card"),
    twitterTitle: getTw("title"),
    twitterDescription: getTw("description"),
    twitterImage: getTw("image"),
    favicon: favicon ? absUrl(pageUrl, favicon) : null,
  };
}

export function extractHeadings($: cheerio.CheerioAPI): HeadingInfo {
  const grab = (tag: string) =>
    $(tag)
      .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
      .get()
      .filter(Boolean);

  const h1 = grab("h1");
  const h2 = grab("h2");
  const h3 = grab("h3");
  const h4 = grab("h4");
  const h5 = grab("h5");
  const h6 = grab("h6");

  const hierarchyIssues: string[] = [];
  if (h1.length === 0) hierarchyIssues.push("No H1 found.");
  if (h1.length > 1) hierarchyIssues.push(`Multiple H1 tags (${h1.length}). Use one clear H1.`);
  if (h2.length === 0 && (h3.length > 0 || h4.length > 0)) {
    hierarchyIssues.push("Skipped H2 — heading levels should not jump.");
  }

  return { h1, h2, h3, h4, h5, h6, hierarchyIssues };
}

export function extractImages($: cheerio.CheerioAPI): ImageInfo {
  const imgs = $("img").toArray();
  let withAlt = 0;
  let withoutAlt = 0;
  let emptyAlt = 0;
  const missingAltExamples: string[] = [];

  for (const el of imgs) {
    const alt = $(el).attr("alt");
    const src = $(el).attr("src") || $(el).attr("data-src") || "(no src)";
    if (alt === undefined) {
      withoutAlt++;
      if (missingAltExamples.length < 5) missingAltExamples.push(src);
    } else if (alt.trim() === "") {
      emptyAlt++;
    } else {
      withAlt++;
    }
  }

  return {
    total: imgs.length,
    withAlt,
    withoutAlt,
    emptyAlt,
    missingAltExamples,
  };
}

export function extractLinks($: cheerio.CheerioAPI, pageUrl: string): LinkInfo {
  const origin = new URL(pageUrl).origin;
  let internal = 0;
  let external = 0;
  let nofollow = 0;
  let brokenCandidates = 0;
  const internalSamples: string[] = [];
  const externalSamples: string[] = [];

  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") || "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      return;
    }
    const abs = absUrl(pageUrl, href);
    if (!abs) {
      brokenCandidates++;
      return;
    }
    const rel = ($(el).attr("rel") || "").toLowerCase();
    if (rel.includes("nofollow")) nofollow++;

    try {
      const u = new URL(abs);
      if (u.origin === origin) {
        internal++;
        if (internalSamples.length < 6) internalSamples.push(abs);
      } else {
        external++;
        if (externalSamples.length < 6) externalSamples.push(abs);
      }
    } catch {
      brokenCandidates++;
    }
  });

  return {
    internal,
    external,
    nofollow,
    brokenCandidates,
    internalSamples,
    externalSamples,
  };
}

export function extractBodyText($: cheerio.CheerioAPI): string {
  const clone = $.root().clone();
  clone.find("script, style, noscript, svg, iframe, nav, footer").remove();
  return clone.find("body").text().replace(/\s+/g, " ").trim();
}

export function extractStructuredData($: cheerio.CheerioAPI): string[] {
  const types: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html();
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      const list = Array.isArray(data) ? data : [data];
      for (const item of list) {
        if (item?.["@type"]) {
          const t = item["@type"];
          if (Array.isArray(t)) types.push(...t.map(String));
          else types.push(String(t));
        }
        if (item?.["@graph"] && Array.isArray(item["@graph"])) {
          for (const g of item["@graph"]) {
            if (g?.["@type"]) types.push(String(g["@type"]));
          }
        }
      }
    } catch {
      // ignore invalid JSON-LD
    }
  });
  return [...new Set(types)];
}

export function buildTechnical(
  page: FetchedPage,
  $: cheerio.CheerioAPI,
  bodyText: string
): TechnicalSeo {
  const structured = extractStructuredData($);
  const hreflang = $('link[rel="alternate"][hreflang]').length;

  return {
    https: page.finalUrl.startsWith("https://"),
    hasRobotsTxt: page.robotsTxt !== null,
    hasSitemap: page.sitemapFound,
    robotsTxtUrl: page.robotsTxtUrl,
    sitemapUrl: page.sitemapUrl,
    hasStructuredData: structured.length > 0,
    structuredDataTypes: structured,
    hasHreflang: hreflang > 0,
    hreflangCount: hreflang,
    contentLength: bodyText.length,
    loadTimeMs: page.loadTimeMs,
  };
}

export function buildIssues(input: {
  meta: MetaTags;
  headings: HeadingInfo;
  images: ImageInfo;
  links: LinkInfo;
  technical: TechnicalSeo;
  wordCount: number;
}): SeoIssue[] {
  const { meta, headings, images, links, technical, wordCount } = input;
  const issues: SeoIssue[] = [];

  const add = (issue: SeoIssue) => issues.push(issue);

  // Title
  if (!meta.title) {
    add({
      id: "title-missing",
      category: "Meta",
      severity: "critical",
      title: "Missing title tag",
      message: "Search engines have no clear title to show in results.",
      recommendation: "Add a unique <title> of 50–60 characters with your primary keyword near the start.",
    });
  } else {
    add({
      id: "title-present",
      category: "Meta",
      severity: "pass",
      title: "Title tag found",
      message: `Title length: ${meta.titleLength} characters.`,
      recommendation: "Keep titles unique per page and front-load the main keyword.",
      currentValue: meta.title,
    });
    if (meta.titleLength < 30) {
      add({
        id: "title-short",
        category: "Meta",
        severity: "warning",
        title: "Title too short",
        message: `Only ${meta.titleLength} chars — weak for CTR and keyword coverage.`,
        recommendation: "Expand to ~50–60 characters with a clear benefit + keyword.",
        currentValue: meta.title,
      });
    } else if (meta.titleLength > 60) {
      add({
        id: "title-long",
        category: "Meta",
        severity: "warning",
        title: "Title may be truncated",
        message: `${meta.titleLength} chars — Google often truncates past ~60.`,
        recommendation: "Trim to 50–60 characters; put the keyword first.",
        currentValue: meta.title,
      });
    }
  }

  // Description
  if (!meta.description) {
    add({
      id: "desc-missing",
      category: "Meta",
      severity: "critical",
      title: "Missing meta description",
      message: "No description for search snippets — Google may invent a weak one.",
      recommendation: "Write a compelling 140–160 character meta description with a CTA.",
    });
  } else {
    add({
      id: "desc-present",
      category: "Meta",
      severity: "pass",
      title: "Meta description found",
      message: `Description length: ${meta.descriptionLength} characters.`,
      recommendation: "Include primary keyword once and a clear call to action.",
      currentValue: meta.description,
    });
    if (meta.descriptionLength < 70) {
      add({
        id: "desc-short",
        category: "Meta",
        severity: "warning",
        title: "Meta description too short",
        message: `${meta.descriptionLength} chars — underuses the snippet.`,
        recommendation: "Aim for 140–160 characters.",
        currentValue: meta.description,
      });
    } else if (meta.descriptionLength > 160) {
      add({
        id: "desc-long",
        category: "Meta",
        severity: "warning",
        title: "Meta description may truncate",
        message: `${meta.descriptionLength} chars — likely cut off in SERPs.`,
        recommendation: "Keep it under 160 characters.",
        currentValue: meta.description,
      });
    }
  }

  // Headings
  if (headings.h1.length === 0) {
    add({
      id: "h1-missing",
      category: "Content",
      severity: "critical",
      title: "No H1 heading",
      message: "Missing the main on-page topic signal.",
      recommendation: "Add one H1 that matches search intent and includes the primary keyword.",
    });
  } else if (headings.h1.length === 1) {
    add({
      id: "h1-ok",
      category: "Content",
      severity: "pass",
      title: "Single H1 present",
      message: "Good heading structure signal.",
      recommendation: "Keep H1 unique and aligned with the title keyword.",
      currentValue: headings.h1[0],
    });
  } else {
    add({
      id: "h1-multiple",
      category: "Content",
      severity: "warning",
      title: "Multiple H1 tags",
      message: `${headings.h1.length} H1s dilute topical focus.`,
      recommendation: "Use exactly one H1; demote others to H2/H3.",
      currentValue: headings.h1.join(" | "),
    });
  }

  for (const h of headings.hierarchyIssues) {
    if (h.includes("Skipped")) {
      add({
        id: "heading-skip",
        category: "Content",
        severity: "info",
        title: "Heading hierarchy jump",
        message: h,
        recommendation: "Use H1 → H2 → H3 in order for accessibility and SEO clarity.",
      });
    }
  }

  if (headings.h2.length === 0 && wordCount > 300) {
    add({
      id: "h2-missing",
      category: "Content",
      severity: "warning",
      title: "No H2 subheadings",
      message: "Long content without H2s is harder to scan and rank for subtopics.",
      recommendation: "Break content into H2 sections targeting secondary keywords.",
    });
  }

  // Content length
  if (wordCount < 150) {
    add({
      id: "thin-content",
      category: "Content",
      severity: "critical",
      title: "Thin content",
      message: `Only ~${wordCount} meaningful words — unlikely to rank for competitive queries.`,
      recommendation: "Aim for 600+ useful words (or more for competitive topics) that answer the query fully.",
    });
  } else if (wordCount < 400) {
    add({
      id: "short-content",
      category: "Content",
      severity: "warning",
      title: "Content is short",
      message: `~${wordCount} words — may be fine for simple pages, weak for blog/guide intent.`,
      recommendation: "Add FAQs, examples, and deeper coverage of the primary keyword topic.",
    });
  } else {
    add({
      id: "content-ok",
      category: "Content",
      severity: "pass",
      title: "Solid content length",
      message: `~${wordCount} meaningful words detected.`,
      recommendation: "Keep improving depth, originality, and freshness.",
    });
  }

  // Images
  if (images.total === 0) {
    add({
      id: "no-images",
      category: "Media",
      severity: "info",
      title: "No images found",
      message: "Visuals can improve engagement and image-search traffic.",
      recommendation: "Add relevant images with descriptive alt text.",
    });
  } else if (images.withoutAlt > 0) {
    add({
      id: "alt-missing",
      category: "Media",
      severity: "warning",
      title: "Images missing alt text",
      message: `${images.withoutAlt} of ${images.total} images have no alt attribute.`,
      recommendation: "Write descriptive alt text with context (not keyword stuffing).",
      currentValue: images.missingAltExamples.join(", "),
    });
  } else {
    add({
      id: "alt-ok",
      category: "Media",
      severity: "pass",
      title: "Image alt attributes present",
      message: `All ${images.total} images include an alt attribute.`,
      recommendation: "Ensure alts are descriptive, not stuffed with keywords.",
    });
  }

  if (images.emptyAlt > 0) {
    add({
      id: "alt-empty",
      category: "Media",
      severity: "info",
      title: "Empty alt attributes",
      message: `${images.emptyAlt} image(s) use empty alt="" (OK only for decorative images).`,
      recommendation: "Use empty alt only for decorative images; describe meaningful ones.",
    });
  }

  // Links
  if (links.internal === 0) {
    add({
      id: "no-internal",
      category: "Links",
      severity: "warning",
      title: "No internal links",
      message: "Internal links help crawlability and topical authority.",
      recommendation: "Link to 3–8 related pages with descriptive anchor text.",
    });
  } else {
    add({
      id: "internal-ok",
      category: "Links",
      severity: "pass",
      title: "Internal links found",
      message: `${links.internal} internal link(s) detected.`,
      recommendation: "Use keyword-relevant anchors (natural, not spammy).",
    });
  }

  if (links.external === 0) {
    add({
      id: "no-external",
      category: "Links",
      severity: "info",
      title: "No external links",
      message: "Citing quality sources can support E-E-A-T for informational pages.",
      recommendation: "Link out to authoritative references where helpful.",
    });
  }

  // Technical
  if (!technical.https) {
    add({
      id: "no-https",
      category: "Technical",
      severity: "critical",
      title: "Not using HTTPS",
      message: "HTTP sites are flagged as insecure and lose ranking trust.",
      recommendation: "Enable HTTPS with a valid SSL certificate and redirect HTTP → HTTPS.",
    });
  } else {
    add({
      id: "https-ok",
      category: "Technical",
      severity: "pass",
      title: "HTTPS enabled",
      message: "Secure connection detected.",
      recommendation: "Keep certificate valid and fix mixed-content issues.",
    });
  }

  if (!meta.viewport) {
    add({
      id: "no-viewport",
      category: "Technical",
      severity: "critical",
      title: "Missing viewport meta",
      message: "Page may fail mobile-friendly checks.",
      recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
    });
  } else {
    add({
      id: "viewport-ok",
      category: "Technical",
      severity: "pass",
      title: "Viewport meta present",
      message: "Mobile viewport configured.",
      recommendation: "Test real mobile usability in Search Console.",
      currentValue: meta.viewport,
    });
  }

  if (!meta.language) {
    add({
      id: "no-lang",
      category: "Technical",
      severity: "warning",
      title: "Missing html lang",
      message: "Language not declared for browsers/screen readers/search.",
      recommendation: 'Set <html lang="en"> (or your content language).',
    });
  }

  if (!meta.canonical) {
    add({
      id: "no-canonical",
      category: "Technical",
      severity: "warning",
      title: "No canonical URL",
      message: "Duplicate URL variants may split ranking signals.",
      recommendation: "Add a self-referencing canonical to the preferred URL.",
    });
  } else {
    add({
      id: "canonical-ok",
      category: "Technical",
      severity: "pass",
      title: "Canonical tag found",
      message: "Canonical URL is set.",
      recommendation: "Ensure it points to the preferred indexable version.",
      currentValue: meta.canonical,
    });
  }

  if (meta.robots && /noindex/i.test(meta.robots)) {
    add({
      id: "noindex",
      category: "Technical",
      severity: "critical",
      title: "Page is set to noindex",
      message: `robots meta: ${meta.robots}`,
      recommendation: "Remove noindex if this page should appear in search results.",
      currentValue: meta.robots,
    });
  }

  if (!technical.hasRobotsTxt) {
    add({
      id: "no-robots-txt",
      category: "Technical",
      severity: "warning",
      title: "robots.txt not found",
      message: "Crawlers have no crawl rules file at /robots.txt.",
      recommendation: "Add a robots.txt and reference your sitemap.",
    });
  } else {
    add({
      id: "robots-txt-ok",
      category: "Technical",
      severity: "pass",
      title: "robots.txt found",
      message: "Crawl rules file is reachable.",
      recommendation: "Don't accidentally disallow important pages.",
      currentValue: technical.robotsTxtUrl || undefined,
    });
  }

  if (!technical.hasSitemap) {
    add({
      id: "no-sitemap",
      category: "Technical",
      severity: "warning",
      title: "XML sitemap not found",
      message: "No sitemap detected at common locations / robots.txt reference.",
      recommendation: "Publish sitemap.xml and submit it in Google Search Console.",
    });
  } else {
    add({
      id: "sitemap-ok",
      category: "Technical",
      severity: "pass",
      title: "Sitemap detected",
      message: "XML sitemap appears available.",
      recommendation: "Keep it updated when you publish/remove URLs.",
      currentValue: technical.sitemapUrl || undefined,
    });
  }

  // Social
  if (!meta.ogTitle || !meta.ogDescription || !meta.ogImage) {
    add({
      id: "og-incomplete",
      category: "Social",
      severity: "warning",
      title: "Incomplete Open Graph tags",
      message: "Missing og:title, og:description, and/or og:image.",
      recommendation: "Add full OG tags for better link previews on social/chat apps.",
    });
  } else {
    add({
      id: "og-ok",
      category: "Social",
      severity: "pass",
      title: "Open Graph tags look complete",
      message: "og:title, og:description, and og:image found.",
      recommendation: "Use a 1200×630 image for best previews.",
    });
  }

  if (!meta.twitterCard) {
    add({
      id: "twitter-missing",
      category: "Social",
      severity: "info",
      title: "Twitter card meta missing",
      message: "No twitter:card tag — previews may fall back to OG.",
      recommendation: 'Add twitter:card = "summary_large_image" plus title/description/image.',
    });
  }

  if (!meta.favicon) {
    add({
      id: "no-favicon",
      category: "Social",
      severity: "info",
      title: "Favicon not detected",
      message: "No favicon link tag found in HTML.",
      recommendation: "Add a favicon for brand recognition in SERPs and tabs.",
    });
  }

  if (!technical.hasStructuredData) {
    add({
      id: "no-schema",
      category: "Technical",
      severity: "warning",
      title: "No structured data (JSON-LD)",
      message: "Rich results need schema markup (Article, FAQ, Product, Org, etc.).",
      recommendation: "Add relevant JSON-LD schema and validate in Rich Results Test.",
    });
  } else {
    add({
      id: "schema-ok",
      category: "Technical",
      severity: "pass",
      title: "Structured data found",
      message: `Types: ${technical.structuredDataTypes.join(", ")}`,
      recommendation: "Validate markup and keep it matching visible content.",
    });
  }

  if (technical.loadTimeMs && technical.loadTimeMs > 3000) {
    add({
      id: "slow-ttfb",
      category: "Performance",
      severity: "warning",
      title: "Slow server response",
      message: `HTML fetched in ~${technical.loadTimeMs}ms (from this checker).`,
      recommendation: "Improve TTFB with caching, CDN, and lighter server work. Also run PageSpeed Insights.",
    });
  } else if (technical.loadTimeMs) {
    add({
      id: "speed-ok",
      category: "Performance",
      severity: "pass",
      title: "Reasonable HTML fetch time",
      message: `Fetched in ~${technical.loadTimeMs}ms from this server.`,
      recommendation: "Still measure Core Web Vitals (LCP, INP, CLS) in the field.",
    });
  }

  return issues;
}
