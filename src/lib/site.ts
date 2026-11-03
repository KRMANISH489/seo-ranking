/** Canonical public origin for SEO (canonical, OG, sitemap, robots). */
export const SITE_URL =
  process.env.APP_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://seo-ranking-sigma.vercel.app";

export const SITE_NAME = "CodAbhi SEO";

export const SITE_DESCRIPTION =
  "Automated SEO audit tool with live Google position tracking, weekly reports, white label SEO client reports, and continuous SEO monitoring for agencies seeking SERP rank improvement.";
