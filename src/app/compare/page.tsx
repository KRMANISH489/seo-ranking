"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import type { CompareResult } from "@/lib/seo/proTypes";
import { ScoreRing } from "@/components/ScoreRing";

export default function ComparePage() {
  const [yours, setYours] = useState("");
  const [competitor, setCompetitor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!yours.trim() || !competitor.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yours: yours.trim(),
          competitor: competitor.trim(),
          deepCrawl: true,
          pageSpeed: true,
          checkBrokenLinks: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Compare failed");
      setResult(data as CompareResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compare failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex-1">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Competitor SEO compare
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Side-by-side audit of your page vs a competitor — score delta, category gaps, and keyword edges.
        </p>

        <form onSubmit={onSubmit} className="glass mt-8 space-y-3 rounded-2xl p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={yours}
              onChange={(e) => setYours(e.target.value)}
              placeholder="Your URL"
              className="rounded-xl bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[rgba(34,224,208,0.45)] border border-transparent"
              disabled={loading}
            />
            <input
              value={competitor}
              onChange={(e) => setCompetitor(e.target.value)}
              placeholder="Competitor URL"
              className="rounded-xl bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[rgba(34,224,208,0.45)] border border-transparent"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !yours.trim() || !competitor.trim()}
            className="rounded-xl btn-brand px-5 py-3 font-semibold text-[var(--accent-on)] disabled:opacity-50"
          >
            {loading ? "Comparing (may take 1–2 min)…" : "Compare SEO"}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-5">
            <div className="glass rounded-2xl p-6">
              <p className="text-sm uppercase tracking-wider text-[var(--muted)]">Winner</p>
              <p className="mt-1 font-display text-2xl font-semibold capitalize text-[var(--accent)]">
                {result.delta.winner === "tie" ? "Tie" : result.delta.winner}
                <span className="ml-3 text-base text-[var(--muted)]">
                  (delta {result.delta.score > 0 ? "+" : ""}
                  {result.delta.score})
                </span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {result.delta.notes.map((n) => (
                  <li key={n}>• {n}</li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="glass rounded-2xl p-5 text-center">
                <p className="text-sm text-[var(--muted)]">Yours</p>
                <ScoreRing score={result.yours.overallScore} grade={result.yours.grade} />
                <p className="mt-2 break-all text-xs text-[var(--muted)]">{result.yours.url}</p>
                <Link
                  href={`/report/${result.yours.id}`}
                  className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline"
                >
                  Open full report →
                </Link>
              </div>
              <div className="glass rounded-2xl p-5 text-center">
                <p className="text-sm text-[var(--muted)]">Competitor</p>
                <ScoreRing score={result.competitor.overallScore} grade={result.competitor.grade} />
                <p className="mt-2 break-all text-xs text-[var(--muted)]">{result.competitor.url}</p>
                <Link
                  href={`/report/${result.competitor.id}`}
                  className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline"
                >
                  Open full report →
                </Link>
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <h2 className="font-display text-lg font-semibold">Category deltas</h2>
              <div className="mt-4 space-y-2">
                {result.delta.categoryDeltas.map((c) => (
                  <div key={c.category} className="flex items-center justify-between gap-3 text-sm">
                    <span className="w-28 text-[var(--muted)]">{c.category}</span>
                    <span>
                      {c.yours} vs {c.competitor}
                    </span>
                    <span className={c.delta >= 0 ? "text-emerald-300" : "text-rose-300"}>
                      {c.delta >= 0 ? "+" : ""}
                      {c.delta}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {result.delta.keywordEdge.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <h2 className="font-display text-lg font-semibold">Competitor keyword edge</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.delta.keywordEdge.map((k) => (
                    <span
                      key={k}
                      className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-sm"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
