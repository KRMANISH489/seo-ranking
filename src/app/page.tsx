"use client";

import { useState } from "react";
import { AnalyzerForm, type AnalyzeOptionsInput } from "@/components/AnalyzerForm";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { BrandLogo } from "@/components/BrandLogo";
import type { ProAuditResult } from "@/lib/seo/proTypes";

const workflow = [
  {
    step: "01",
    title: "Audit the client site",
    body: "On-page health, technical warnings, PageSpeed, and broken links in one automated SEO audit tool run.",
  },
  {
    step: "02",
    title: "Track live Google rank",
    body: "See exact SERP placement for target keywords with a weekly SEO rank tracker built for agencies.",
  },
  {
    step: "03",
    title: "Send weekly reports",
    body: "White label SEO client reports land in the client inbox every week with continuous SEO monitoring.",
  },
];

function ScorePanel() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.1)] sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[rgba(10,132,255,0.12)] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-[rgba(0,194,168,0.12)] blur-2xl" />

      <div className="relative flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] sm:text-xs">
          SEO health
        </p>
        <span className="rounded-full bg-[rgba(0,194,168,0.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-2)]">
          Live
        </span>
      </div>

      <div className="relative mx-auto mt-5 flex h-36 w-36 items-center justify-center sm:mt-6 sm:h-44 sm:w-44">
        <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="46" fill="none" stroke="#e8eef5" strokeWidth="10" />
          <circle
            className="hero-score-arc"
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="url(#homeScoreGrad)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="homeScoreGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0a84ff" />
              <stop offset="100%" stopColor="#00c2a8" />
            </linearGradient>
          </defs>
        </svg>
        <div className="text-center">
          <p className="font-display text-4xl font-bold tracking-tight sm:text-5xl">92</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Score
          </p>
        </div>
      </div>

      <div className="relative mt-5 space-y-3 sm:mt-6">
        {[
          ["Keyword rank", "#4 · page 1", "text-[var(--accent)]"],
          ["Weekly reports", "ON", "text-[var(--accent-2)]"],
          ["Monitoring", "Continuous", "text-[var(--text)]"],
        ].map(([label, value, color]) => (
          <div
            key={label}
            className="flex items-center justify-between border-t border-[var(--line)] pt-3 text-sm"
          >
            <span className="text-[var(--muted)]">{label}</span>
            <span className={`font-bold ${color}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProAuditResult | null>(null);

  async function runAudit(url: string, options: AnalyzeOptionsInput) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, ...options, save: true, sendEmail: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data as ProAuditResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex-1">
      <section className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-noise opacity-70" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[rgba(10,132,255,0.1)] blur-3xl" />

        <div className="relative mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
          <div className="animate-fade-up">
            <div className="mb-5 sm:mb-6">
              <BrandLogo href="https://codabhi-dev.vercel.app/" size="lg" showTagline external />
            </div>

            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent)] shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-2)]" />
              New · Automated SEO suite
            </p>

            <h1 className="mt-4 max-w-xl font-display text-[2.15rem] font-bold leading-[1.08] tracking-[-0.04em] text-[var(--text)] sm:mt-5 sm:text-5xl lg:text-[3.4rem]">
              Rank tracking &amp;{" "}
              <span className="text-gradient">weekly reports</span> on autopilot
            </h1>

            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--muted)] sm:mt-5 sm:text-lg">
              Modern SEO audit tool for agencies — live Google positions, white label client
              reports, continuous monitoring without the spreadsheet grind.
            </p>

            <div className="mt-6 max-w-xl sm:mt-8">
              <AnalyzerForm onSubmit={runAudit} loading={loading} />
            </div>
          </div>

          <div className="hero-float relative mx-auto w-full max-w-sm animate-fade-up-delay sm:max-w-md">
            <ScorePanel />
          </div>
        </div>
      </section>

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6 sm:pb-16">
        {loading && (
          <div className="mt-6 animate-fade-up rounded-3xl border border-[var(--line)] bg-white p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            <p className="font-display text-lg font-bold">Running full audit + Google rank…</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Live SERP · weekly reports · save monitor</p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            {error}
          </div>
        )}

        {result && <ResultsDashboard result={result} />}

        {!result && !loading && (
          <>
            <section className="mt-4 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm sm:mt-6 sm:p-8">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                How continuous SEO monitoring works
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-[var(--muted)] sm:text-base">
                One workflow from first audit to weekly client SEO reports — agency rank monitoring
                software, not a one-off checklist.
              </p>
              <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {workflow.map((item) => (
                  <li key={item.step} className="rounded-2xl bg-[var(--bg)] p-5">
                    <p className="font-display text-sm font-bold tracking-[0.16em] text-[var(--accent)]">
                      {item.step}
                    </p>
                    <h3 className="mt-3 font-display text-lg font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="mt-10 grid items-center gap-8 sm:mt-14 lg:grid-cols-2">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  Why agencies automate weekly reports
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                  Manual decks waste billable hours. CodAbhi combines an automated SEO audit tool,
                  weekly SEO rank tracker checks, PageSpeed insights, and broken-link scanning so
                  your team focuses on SERP rank improvement while scheduled SEO audit reports keep
                  clients informed.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                  Run the audit, email the client, and keep continuous SEO monitoring running from
                  the agency dashboard until the engagement wraps.
                </p>
              </div>
              <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/seo-dashboard.jpg"
                  alt="CodAbhi SEO automated audit dashboard with weekly Google rank monitoring and client report delivery"
                  width={960}
                  height={540}
                  className="h-auto w-full"
                  decoding="async"
                />
              </div>
            </section>

            <section className="mt-10 max-w-3xl sm:mt-14">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Automated client SEO reports that scale
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                Freelancers and agencies need white label SEO client reports without a design
                sprint. CodAbhi packages score summaries, keyword movement, and prioritized fixes
                into email-ready weekly reports — paired with a live Google position tracking tool.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                Use it as your weekly SEO rank tracker for retainers, competitive reviews, or
                onboarding audits. Enable crawl, PageSpeed, and broken-link modules when you want
                deeper coverage, then let continuous SEO monitoring send the next round alongside
                ranking updates.
              </p>
            </section>

            <section className="mt-10 max-w-3xl sm:mt-14">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Built for SERP rank improvement
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                Teams that track Google keyword rankings weekly spot regressions early and show
                clients a transparent timeline. CodAbhi surfaces actionable findings — not vanity
                scores — so your next sprint targets the issues most likely to move positions.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                Start with one URL today. Turn on weekly reports and treat CodAbhi as the automated
                SEO monitoring platform beside your content calendar and outreach pipeline.
              </p>
            </section>
          </>
        )}

        <footer className="mt-14 border-t border-[var(--line)] pt-6 text-center text-xs text-[var(--muted)] sm:mt-16">
          Built by{" "}
          <a
            href="https://codabhi-dev.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--accent)] hover:underline"
          >
            CodAbhi
          </a>{" "}
          · CODE · CREATE · DELIVER
        </footer>
      </div>
    </main>
  );
}
