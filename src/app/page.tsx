"use client";

import { useState } from "react";
import { AnalyzerForm, type AnalyzeOptionsInput } from "@/components/AnalyzerForm";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { BrandLogo } from "@/components/BrandLogo";
import type { ProAuditResult } from "@/lib/seo/proTypes";

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
            CodAbhi SEO Suite
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            Audit. Rank. Email.
            <span className="block text-[var(--accent-2)]">Every week, automatically.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            Enter client URL + email. CodAbhi audits SEO, checks real Google rank, emails client &
            admin, and keeps weekly reports running until you pause monitoring.
          </p>
        </header>

        <AnalyzerForm onSubmit={runAudit} loading={loading} />

        {loading && (
          <div className="glass mt-8 animate-fade-up rounded-2xl p-8 text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            <p className="font-display text-lg font-semibold">Running full audit + Google rank…</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              SEO suite · live SERP position · email to client & admin · save monitor
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
          <section className="mt-10 grid gap-4 animate-fade-up-delay sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Live Google rank", body: "See exact position (#1, #12…) for target keywords." },
              { title: "Weekly auto mail", body: "Client + admin get score, rank & fix plan every week." },
              { title: "Admin control", body: "Keep monitoring ON until you pause it in Monitors." },
              { title: "Faster to top", body: "Rank-based tips to climb pages ASAP." },
            ].map((card) => (
              <div key={card.title} className="glass rounded-2xl p-5">
                <h2 className="font-display text-lg font-semibold">{card.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{card.body}</p>
              </div>
            ))}
          </section>
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
