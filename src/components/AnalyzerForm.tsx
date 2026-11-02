"use client";

import { FormEvent, useState } from "react";

export type AnalyzeOptionsInput = {
  deepCrawl: boolean;
  pageSpeed: boolean;
  checkBrokenLinks: boolean;
  checkRank: boolean;
  weeklyMonitor: boolean;
  clientEmail: string;
  clientName: string;
  keywords: string;
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
  const [deepCrawl, setDeepCrawl] = useState(true);
  const [pageSpeed, setPageSpeed] = useState(true);
  const [checkBrokenLinks, setCheckBrokenLinks] = useState(true);
  const [checkRank, setCheckRank] = useState(true);
  const [weeklyMonitor, setWeeklyMonitor] = useState(true);

  function options(): AnalyzeOptionsInput {
    return {
      deepCrawl,
      pageSpeed,
      checkBrokenLinks,
      checkRank,
      weeklyMonitor,
      clientEmail: clientEmail.trim(),
      clientName: clientName.trim(),
      keywords: keywords.trim(),
    };
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim() || !clientEmail.trim() || loading) return;
    onSubmit(url.trim(), options());
  }

  return (
    <form onSubmit={handleSubmit} className="glass animate-fade-up rounded-2xl p-3 sm:p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="relative md:col-span-2">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]">
            https://
          </span>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Client website URL"
            className="w-full rounded-xl border border-transparent bg-[var(--bg)] px-4 py-3.5 pl-20 text-[15px] outline-none focus:border-[rgba(34,224,208,0.5)]"
            disabled={loading}
            required
          />
        </div>

        <input
          type="email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          placeholder="Client email (required for reports)"
          className="w-full rounded-xl border border-transparent bg-[var(--bg)] px-4 py-3.5 text-[15px] outline-none focus:border-[rgba(34,224,208,0.45)]"
          disabled={loading}
          required
        />
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Client name (optional)"
          className="w-full rounded-xl border border-transparent bg-[var(--bg)] px-4 py-3.5 text-[15px] outline-none focus:border-[rgba(34,224,208,0.45)]"
          disabled={loading}
        />

        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Target keywords for Google rank (comma separated)"
          className="w-full rounded-xl border border-transparent bg-[var(--bg)] px-4 py-3.5 text-[15px] outline-none focus:border-[rgba(34,224,208,0.45)] md:col-span-2"
          disabled={loading}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={weeklyMonitor} onChange={(e) => setWeeklyMonitor(e.target.checked)} />
            Weekly auto-check + email
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={checkRank} onChange={(e) => setCheckRank(e.target.checked)} />
            Live Google rank
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={deepCrawl} onChange={(e) => setDeepCrawl(e.target.checked)} />
            Crawl
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={pageSpeed} onChange={(e) => setPageSpeed(e.target.checked)} />
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
          className="btn-brand rounded-xl px-6 py-3.5 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Running pro audit…" : "Start audit + monitoring"}
        </button>
      </div>

      <p className="mt-3 px-1 text-xs text-[var(--muted)]">
        Report emails go to client + admin. Weekly monitoring stays ON until admin pauses it in Monitors.
      </p>
    </form>
  );
}
