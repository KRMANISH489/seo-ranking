/** Canonical public origin for SEO (canonical, OG, sitemap, robots). */
export const SITE_URL =
  process.env.APP_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://seo-ranking-sigma.vercel.app";

export const SITE_NAME = "CodAbhi SEO";

/** Keep under ~155 chars for SERP snippets */
export const SITE_DESCRIPTION =
  "Agency SEO rank tracker with live Google positions, technical audits, Local/GMB checks, and white-label client reports on a schedule.";

export const SITE_TITLE = "Agency SEO Rank Tracker & Client Reports | CodAbhi";
