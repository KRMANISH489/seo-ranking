"use client";

import { useState } from "react";
import { AnalyzerForm, type AnalyzeOptionsInput } from "@/components/AnalyzerForm";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { BrandLogo } from "@/components/BrandLogo";
import { TrustStats } from "@/components/TrustStats";
import type { ProAuditResult } from "@/lib/seo/proTypes";

const workflow = [
  {
    step: "01",
    title: "Run the first client check",
    body: "Capture on-page health, technical warnings, PageSpeed, broken links, and Local/GMB signals in one pass.",
  },
  {
    step: "02",
    title: "Track live Google positions",
    body: "See exact SERP placement for the keywords you care about — plus competitor leaders when a term is missing.",
  },
  {
    step: "03",
    title: "Keep the URL on schedule",
    body: "CodAbhi saves the client site, re-checks on a weekly cadence, and emails a white-label PDF until you pause.",
  },
];

const faqs = [
  {
    q: "Who is this for?",
    a: "Agencies, freelancers, and in-house growth teams that need an agency SEO rank tracker plus clear client-facing reports without living in spreadsheets.",
  },
  {
    q: "What gets emailed to the client?",
    a: "A branded PDF with score, category breakdown, keyword plan, prioritized fixes, PageSpeed snapshot, and Local/GMB notes when those modules are enabled.",
  },
  {
    q: "How is this different from Looker Studio?",
    a: "You are not stitching Search Console tabs by hand. One form run audits, ranks, and delivery — then scheduled monitoring keeps the same URL warm for the next retainer cycle.",
  },
  {
    q: "Can I track Google Business Profile?",
    a: "Yes. Add business name + city or a Maps share link. We match the listing to the audited website when possible and flag NAP, category, and review gaps.",
  },
];

function ScorePanel() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.1)] sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[rgba(10,132,255,0.12)] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-[rgba(0,194,168,0.12)] blur-2xl" />

      <div className="relative flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] sm:text-xs">
          Site health
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
          ["Scheduled reports", "ON", "text-[var(--accent-2)]"],
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
              Agency rank tracker
            </p>

            <h1 className="mt-4 max-w-xl font-display text-[2.05rem] font-bold leading-[1.08] tracking-[-0.04em] text-[var(--text)] sm:mt-5 sm:text-5xl lg:text-[3.15rem]">
              Agency SEO rank tracker &amp;{" "}
              <span className="text-gradient">client reports</span> on autopilot
            </h1>

            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--muted)] sm:mt-5 sm:text-lg">
              Live Google positions, technical audits, Local/GMB checks, and white-label PDFs —
              save each client URL once and keep monitoring on a schedule.
            </p>

            <div className="mt-6 max-w-xl sm:mt-8">
              <AnalyzerForm onSubmit={runAudit} loading={loading} />
            </div>

            <TrustStats />
            <p className="mt-3 max-w-xl text-xs text-[var(--muted)] sm:text-sm">
              Every run can email a full PDF with errors, exact fixes, keyword plan, and CodAbhi
              branding so clients know what to do next.
            </p>
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
            <p className="mt-1 text-sm text-[var(--muted)]">Live SERP · reports · save monitor</p>
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
                How the agency SEO rank tracker works
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-[var(--muted)] sm:text-base">
                One workflow from first audit to scheduled client delivery — built as rank
                monitoring software for retainers, not a one-off checklist.
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
                  Why teams automate client reporting
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                  Manual decks burn billable hours. CodAbhi combines technical audits, live
                  position checks, PageSpeed, crawl depth, and broken-link sampling so your team
                  focuses on fixes that move search visibility.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                  Admins see green / yellow / red health per saved client. Pause anytime from the
                  dashboard when an engagement ends.
                </p>
                <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                  <li>• Crawl up to several internal pages per run</li>
                  <li>• Optional PageSpeed lab metrics (Core Web Vitals)</li>
                  <li>• Local / GMB listing match when you provide name + city or Maps link</li>
                  <li>• PDF export + inbox delivery for client and agency</li>
                </ul>
              </div>
              <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/seo-dashboard.jpg"
                  alt="CodAbhi agency dashboard showing audit scores and scheduled client report delivery"
                  width={960}
                  height={540}
                  className="h-auto w-full"
                  decoding="async"
                />
              </div>
            </section>

            <section className="mt-10 max-w-3xl sm:mt-14">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                White-label reports that scale retainers
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                Freelancers and agencies need rebrandable deliverables without a design sprint.
                CodAbhi packages score summaries, keyword movement, Local listing notes, and a
                prioritized action board into email-ready PDFs — paired with live Google position
                tracking.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                Compared with stitching Search Console or Looker Studio tabs, you get a single
                audit → rank → report loop. Sample the PDF after any run, then keep the same
                domain on the monitoring list for the next cycle.
              </p>
            </section>

            <section className="mt-10 max-w-3xl sm:mt-14">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Local search and GMB in the same pass
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                Many agency clients live or die on Maps. When you add a business name with city —
                or paste a Google Maps / GBP share link — CodAbhi looks up listing signals such as
                website match, phone/NAP consistency, category, rating, and review count, then folds
                those findings into the same priority plan.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                If no listing matches the audited website, we say so clearly instead of attaching
                an unrelated place. That keeps Local notes trustworthy for client conversations.
              </p>
            </section>

            <section className="mt-10 max-w-3xl sm:mt-14">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Plans that fit how agencies work
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                Start free on the public form: one URL, client email, optional keywords and GMB
                fields. Monitoring stores domains for scheduled re-checks. Agency ops use the admin
                panel for traffic-light health, pause/resume, and “run now” when a client asks for
                an update between cycles.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                Crawl depth, PageSpeed, and broken-link modules are toggles — turn them on when the
                engagement needs deeper coverage, keep them light for fast onboarding audits.
              </p>
            </section>

            <section className="mt-10 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm sm:mt-14 sm:p-8">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Frequently asked questions
              </h2>
              <div className="mt-6 space-y-5">
                {faqs.map((item) => (
                  <div key={item.q} className="border-t border-[var(--line)] pt-5 first:border-0 first:pt-0">
                    <h3 className="font-display text-lg font-bold">{item.q}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.a}</p>
                  </div>
                ))}
              </div>
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
