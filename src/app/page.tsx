"use client";

import { useState } from "react";
import { AnalyzerForm, type AnalyzeOptionsInput } from "@/components/AnalyzerForm";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { BrandLogo } from "@/components/BrandLogo";
import type { ProAuditResult } from "@/lib/seo/proTypes";

const featureCards = [
  {
    title: "Live Google position tracking",
    body: "See exact SERP placement for target keywords with a live Google position tracking tool built for agencies.",
  },
  {
    title: "Weekly reports by email",
    body: "Clients receive score, rank movement, and a clear fix plan in automated client SEO reports every week.",
  },
  {
    title: "Agency dashboard control",
    body: "Keep continuous SEO monitoring active from the agency dashboard, then pause anytime when a retainer ends.",
  },
  {
    title: "SERP rank improvement tips",
    body: "Turn audit findings into prioritized actions that support measurable SERP rank improvement over time.",
  },
];

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
      <div className="pointer-events-none absolute inset-0 grid-noise opacity-40" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8 max-w-3xl animate-fade-up">
          <div className="mb-5">
            <BrandLogo href="https://codabhi-dev.vercel.app/" size="lg" showTagline external />
          </div>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
            Automated SEO audit tool
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            Weekly reports &amp; Google monitoring
            <span className="block text-[var(--accent-2)]">for every client, automatically.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            CodAbhi is an automated SEO monitoring platform for agencies. Enter a client URL and
            email, run a full SEO audit with live Google rank checks, then deliver weekly reports
            through continuous SEO monitoring — including white label SEO client reports your
            retainers can rely on.
          </p>
        </header>

        <AnalyzerForm onSubmit={runAudit} loading={loading} />

        {loading && (
          <div className="glass mt-8 animate-fade-up rounded-2xl p-8 text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            <p className="font-display text-lg font-semibold">
              Running full audit + Google rank…
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              SEO suite · live SERP position · weekly reports to client inbox · save monitor
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-[rgba(251,113,133,0.35)] bg-[rgba(251,113,133,0.1)] p-4 text-[#fecdd3]">
            {error}
          </div>
        )}

        {result && <ResultsDashboard result={result} />}

        {!result && !loading && (
          <>
            <section className="mt-10 grid gap-4 animate-fade-up-delay sm:grid-cols-2 lg:grid-cols-4">
              {featureCards.map((card) => (
                <div key={card.title} className="glass rounded-2xl p-5">
                  <h2 className="font-display text-lg font-semibold">{card.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{card.body}</p>
                </div>
              ))}
            </section>

            <section className="mt-14 grid items-center gap-8 animate-fade-up lg:grid-cols-2">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  Why agencies choose weekly reports automation
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
                  Manual decks waste billable hours. CodAbhi combines an automated SEO audit tool,
                  weekly SEO rank tracker checks, PageSpeed insights, and broken-link scanning so
                  your team can focus on strategy while scheduled SEO audit reports keep clients
                  informed. Track Google keyword rankings weekly without rebuilding slides from
                  scratch.
                </p>
                <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">
                  Positioning stays clear for commercial searchers looking for agency rank
                  monitoring software: run the audit, email the client, and keep continuous SEO
                  monitoring running from your agency dashboard until the engagement wraps.
                </p>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg)]">
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

            <section className="mt-14 max-w-3xl animate-fade-up">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Automated client SEO reports that scale
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
                Freelancers and agencies often need white label SEO client reports that look
                polished without a design sprint. CodAbhi packages score summaries, keyword
                movement, and prioritized fixes into email-ready weekly reports. Pair that with a
                live Google position tracking tool and you have an automated SEO monitoring
                platform that proves progress every week.
              </p>
              <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">
                Use it as your weekly SEO rank tracker for retainers, competitive reviews, or
                onboarding audits. Enable crawl, PageSpeed, and broken-link modules when you want
                deeper technical coverage, then let continuous SEO monitoring send the next round
                of automated PageSpeed and broken link monitor signals alongside ranking updates.
              </p>
            </section>

            <section className="mt-14 max-w-3xl animate-fade-up">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                How continuous SEO monitoring works
              </h2>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-base leading-relaxed text-[var(--muted)]">
                <li>
                  Paste the client site URL, email, and target keywords for Google ranking checks.
                </li>
                <li>
                  Run the automated SEO audit tool to capture on-page health, technical warnings,
                  and live SERP positions.
                </li>
                <li>
                  Deliver automated client SEO reports immediately, then keep weekly reports
                  flowing with continuous SEO monitoring.
                </li>
                <li>
                  Review SERP rank improvement trends in History, compare competitors, and pause
                  monitoring from the agency dashboard when needed.
                </li>
              </ol>
              <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
                Whether you need scheduled SEO audit reports, a weekly SEO rank tracker, or full
                agency rank monitoring software for multiple domains, CodAbhi keeps the workflow
                hands-off so client communication stays consistent and credible.
              </p>
            </section>

            <section className="mt-14 max-w-3xl animate-fade-up">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Built for SERP rank improvement workflows
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
                Ranking gains rarely come from a single checklist. Teams that track Google keyword
                rankings weekly spot regressions early, prioritize content and technical fixes, and
                show clients a transparent timeline. CodAbhi surfaces actionable findings — not
                vanity scores — so your next sprint targets the issues most likely to move
                positions.
              </p>
              <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">
                Start with one URL today. Turn on weekly reports, verify delivery to the client
                inbox, and treat CodAbhi as the automated SEO monitoring platform that sits beside
                your content calendar and outreach pipeline.
              </p>
            </section>
          </>
        )}

        <footer className="mt-14 border-t border-[var(--line)] pt-6 text-center text-xs text-[var(--muted)]">
          Built by{" "}
          <a
            href="https://codabhi-dev.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--accent)] hover:underline"
          >
            CodAbhi
          </a>{" "}
          · CODE · CREATE · DELIVER
        </footer>
      </div>
    </main>
  );
}
