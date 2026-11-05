"use client";

import { FormEvent, useState } from "react";

export type AnalyzeOptionsInput = {
  deepCrawl: boolean;
  pageSpeed: boolean;
  checkBrokenLinks: boolean;
  checkRank: boolean;
  localSeo: boolean;
  weeklyMonitor: boolean;
  clientEmail: string;
  clientName: string;
  keywords: string;
  businessQuery: string;
  gbpUrl: string;
};

export function AnalyzerForm({
  onSubmit,
  loading,
}: {
  onSubmit: (url: string, options: AnalyzeOptionsInput) => void;
  loading: boolean;
}) {
  const [url, setUrl] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [businessQuery, setBusinessQuery] = useState("");
  const [gbpUrl, setGbpUrl] = useState("");
  const [deepCrawl, setDeepCrawl] = useState(true);
  const [pageSpeed, setPageSpeed] = useState(true);
  const [checkBrokenLinks, setCheckBrokenLinks] = useState(true);
  const [checkRank, setCheckRank] = useState(true);
  const [localSeo, setLocalSeo] = useState(true);
  const [weeklyMonitor, setWeeklyMonitor] = useState(true);

  function options(): AnalyzeOptionsInput {
    return {
      deepCrawl,
      pageSpeed,
      checkBrokenLinks,
      checkRank,
      localSeo,
      weeklyMonitor,
      clientEmail: clientEmail.trim(),
      clientName: clientName.trim(),
      keywords: keywords.trim(),
      businessQuery: businessQuery.trim(),
      gbpUrl: gbpUrl.trim(),
    };
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim() || !clientEmail.trim() || loading) return;
    onSubmit(url.trim(), options());
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-[var(--line)] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-display text-sm font-bold tracking-tight text-[var(--text)]">
            Run client SEO audit
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            URL + email → rank, Local SEO / GMB, weekly reports
          </p>
        </div>
        <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
          Live SERP
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex overflow-hidden rounded-[0.9rem] border border-[rgba(15,23,42,0.1)] bg-white focus-within:border-[rgba(10,132,255,0.55)] focus-within:shadow-[0_0_0_4px_rgba(10,132,255,0.12)] md:col-span-2">
          <span className="flex shrink-0 items-center border-r border-[rgba(15,23,42,0.08)] bg-[var(--bg)] px-3 text-sm text-[var(--muted)] sm:px-4">
            https://
          </span>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="client-site.com"
            className="min-w-0 flex-1 border-0 bg-transparent px-3 py-[0.9rem] text-[15px] text-[var(--text)] outline-none placeholder:text-[#94a3b8] sm:px-4"
            disabled={loading}
            required
          />
        </div>

        <input
          type="email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          placeholder="Client email for weekly reports"
          className="input-seo"
          disabled={loading}
          required
        />
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Client name (optional)"
          className="input-seo"
          disabled={loading}
        />

        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Target keywords (comma separated)"
          className="input-seo md:col-span-2"
          disabled={loading}
        />
        <input
          type="text"
          value={businessQuery}
          onChange={(e) => setBusinessQuery(e.target.value)}
          placeholder="GMB / business name + city (e.g. CodAbhi Patna)"
          className="input-seo"
          disabled={loading}
        />
        <input
          type="text"
          value={gbpUrl}
          onChange={(e) => setGbpUrl(e.target.value)}
          placeholder="Google Maps / GBP link (optional)"
          className="input-seo"
          disabled={loading}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={weeklyMonitor}
              onChange={(e) => setWeeklyMonitor(e.target.checked)}
            />
            Save URL + weekly auto-check
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={localSeo}
              onChange={(e) => setLocalSeo(e.target.checked)}
            />
            Local SEO / GMB
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={checkRank}
              onChange={(e) => setCheckRank(e.target.checked)}
            />
            Google rank
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={deepCrawl}
              onChange={(e) => setDeepCrawl(e.target.checked)}
            />
            Crawl
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={pageSpeed}
              onChange={(e) => setPageSpeed(e.target.checked)}
            />
            PageSpeed
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={checkBrokenLinks}
              onChange={(e) => setCheckBrokenLinks(e.target.checked)}
            />
            Broken links
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !url.trim() || !clientEmail.trim()}
          className="btn-brand shrink-0 rounded-2xl px-6 py-3.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Auditing…" : "Start SEO audit"}
        </button>
      </div>
    </form>
  );
}
