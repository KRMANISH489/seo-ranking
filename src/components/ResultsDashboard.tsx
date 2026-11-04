"use client";

import Link from "next/link";
import type { SeoIssue, KeywordItem } from "@/lib/seo/types";
import type { ProAuditResult } from "@/lib/seo/proTypes";
import { ScoreRing } from "./ScoreRing";
import { SerpPreview } from "./SerpPreview";
import { PriorityBoard } from "./PriorityBoard";

function severityStyles(severity: SeoIssue["severity"]) {
  switch (severity) {
    case "critical":
      return "border-[rgba(251,113,133,0.35)] bg-[rgba(251,113,133,0.08)] text-[#fecdd3]";
    case "warning":
      return "border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] text-[#fde68a]";
    case "info":
      return "border-[rgba(125,211,252,0.3)] bg-[rgba(125,211,252,0.07)] text-[#bae6fd]";
    default:
      return "border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.07)] text-[#a7f3d0]";
  }
}

function verdictBadge(verdict: KeywordItem["verdict"]) {
  const map = {
    good: "bg-[rgba(52,211,153,0.15)] text-[#6ee7b7]",
    weak: "bg-[rgba(251,191,36,0.15)] text-[#fcd34d]",
    bad: "bg-[rgba(251,113,133,0.15)] text-[#fda4af]",
    stuffed: "bg-[rgba(251,113,133,0.25)] text-[#fecdd3]",
  };
  return map[verdict];
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass animate-fade-up rounded-2xl p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function KeywordTable({ items, empty }: { items: KeywordItem[]; empty: string }) {
  if (!items.length) {
    return <p className="text-sm text-[var(--muted)]">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-[var(--muted)]">
          <tr>
            <th className="pb-2 pr-3 font-medium">Keyword</th>
            <th className="pb-2 pr-3 font-medium">Count</th>
            <th className="pb-2 pr-3 font-medium">Density</th>
            <th className="pb-2 pr-3 font-medium">Title</th>
            <th className="pb-2 pr-3 font-medium">H1</th>
            <th className="pb-2 pr-3 font-medium">Verdict</th>
            <th className="pb-2 font-medium">Why</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.keyword} className="border-t border-[var(--line)] align-top">
              <td className="py-3 pr-3 font-medium text-[var(--text)]">{item.keyword}</td>
              <td className="py-3 pr-3 text-[var(--muted)]">{item.count}</td>
              <td className="py-3 pr-3 text-[var(--muted)]">{item.density}%</td>
              <td className="py-3 pr-3">{item.inTitle ? "✓" : "—"}</td>
              <td className="py-3 pr-3">{item.inH1 ? "✓" : "—"}</td>
              <td className="py-3 pr-3">
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase ${verdictBadge(item.verdict)}`}>
                  {item.verdict}
                </span>
              </td>
              <td className="py-3 text-[var(--muted)]">
                <div>{item.reason}</div>
                {item.suggestion ? (
                  <div className="mt-1 text-[var(--accent)]">{item.suggestion}</div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ResultsDashboard({ result }: { result: ProAuditResult }) {
  const critical = result.issues.filter((i) => i.severity === "critical");
  const warnings = result.issues.filter((i) => i.severity === "warning");
  const passes = result.issues.filter((i) => i.severity === "pass");
  const infos = result.issues.filter((i) => i.severity === "info");
  const broken = result.brokenLinks?.filter((b) => !b.ok) || [];

  const orderedIssues = [...critical, ...warnings, ...infos, ...passes];

  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/report/${result.id}`}
          className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)]"
        >
          Open full report
        </Link>
        <a
          href={`/api/audits/${result.id}/pdf`}
          className="btn-brand rounded-lg px-3 py-1.5 text-sm"
        >
          Download PDF
        </a>
        <Link
          href="/history"
          className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)]"
        >
          History
        </Link>
      </div>

      <Section title="SEO health score" subtitle={result.summary}>
        <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
          <ScoreRing score={result.overallScore} grade={result.grade} />
          <div>
            <p className="mb-3 text-sm text-[var(--muted)]">
              Analyzed <span className="text-[var(--text)]">{result.url}</span>
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {result.categoryScores.map((c) => (
                <div key={c.category} className="rounded-xl bg-[var(--bg)] p-3">
                  <div className="text-xs uppercase tracking-wider text-[var(--muted)]">{c.category}</div>
                  <div className="mt-1 font-display text-2xl font-semibold">{c.score}</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="rounded-lg bg-[rgba(251,113,133,0.12)] px-3 py-1 text-[#fda4af]">
                {critical.length} critical
              </span>
              <span className="rounded-lg bg-[rgba(251,191,36,0.12)] px-3 py-1 text-[#fcd34d]">
                {warnings.length} warnings
              </span>
              <span className="rounded-lg bg-[rgba(52,211,153,0.12)] px-3 py-1 text-[#6ee7b7]">
                {passes.length} passed
              </span>
            </div>
          </div>
        </div>
      </Section>

      {(result.clientEmail || result.emailDelivery) && (
        <Section title="Email delivery" subtitle="Weekly reports to the client inbox (and your agency mailbox).">
          <div className="space-y-2 text-sm">
            {result.clientEmail ? (
              <p>
                Client: <span className="text-[var(--text)]">{result.clientEmail}</span>
              </p>
            ) : null}
            {result.monitorId ? (
              <p className="text-[var(--accent)]">
                Weekly monitoring ON (id {result.monitorId.slice(0, 8)}…) — pause anytime in Monitors.
              </p>
            ) : null}
            {result.emailDelivery?.sent?.length ? (
              <p className="text-emerald-300">Sent to: {result.emailDelivery.sent.join(", ")}</p>
            ) : null}
            {result.emailDelivery?.skipped ? (
              <p className="text-amber-200">{result.emailDelivery.skipped}</p>
            ) : null}
            {result.emailDelivery?.error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                <p className="font-semibold">Email issue</p>
                <p className="mt-1">{result.emailDelivery.error}</p>
                <p className="mt-2 text-xs text-rose-700">
                  Fix options: (1){" "}
                  <a
                    href="https://resend.com/domains"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Verify domain on Resend
                  </a>{" "}
                  → set <code>EMAIL_FROM=CodAbhi SEO &lt;reports@yourdomain.com&gt;</code> → Redeploy.
                  (2) Or set a working Gmail App Password in <code>SMTP_PASS</code> (SMTP is used as
                  automatic fallback for client inboxes). Details in Admin → Settings.
                </p>
              </div>
            ) : null}
          </div>
        </Section>
      )}

      <Section
        title="Live Google rank"
        subtitle={result.ranking?.summary || "Keyword positions from real Google SERP data."}
      >
        {!result.ranking ? (
          <p className="text-sm text-[var(--muted)]">Rank check was skipped.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-[var(--bg)] p-4">
                <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Best rank</div>
                <div className="font-display text-3xl font-semibold text-[var(--accent-2)]">
                  {result.ranking.bestPosition != null ? `#${result.ranking.bestPosition}` : "—"}
                </div>
              </div>
              <div className="rounded-xl bg-[var(--bg)] p-4">
                <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Domain</div>
                <div className="mt-1 font-medium">{result.ranking.targetDomain}</div>
              </div>
              <div className="rounded-xl bg-[var(--bg)] p-4">
                <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Keywords tracked</div>
                <div className="font-display text-3xl font-semibold">{result.ranking.results.length}</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-[var(--muted)]">
                  <tr>
                    <th className="pb-2 pr-3">Keyword</th>
                    <th className="pb-2 pr-3">Google position</th>
                    <th className="pb-2 pr-3">Page</th>
                    <th className="pb-2">Matched URL</th>
                  </tr>
                </thead>
                <tbody>
                  {result.ranking.results.map((r) => (
                    <tr key={r.keyword} className="border-t border-[var(--line)]">
                      <td className="py-2 pr-3 font-medium">{r.keyword}</td>
                      <td className="py-2 pr-3 text-[var(--accent)]">
                        {r.error
                          ? "API setup needed"
                          : r.found && r.position != null
                            ? `#${r.position}`
                            : "Not in top 100"}
                      </td>
                      <td className="py-2 pr-3">{r.page ?? "—"}</td>
                      <td className="py-2 max-w-[280px] truncate text-[var(--muted)]">
                        {r.matchedUrl || r.error || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.ranking.results[0]?.topCompetitors?.length ? (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-[var(--muted)]">
                  Top competitors for “{result.ranking.results[0].keyword}”
                </h3>
                <ul className="space-y-1 text-sm text-[var(--muted)]">
                  {result.ranking.results[0].topCompetitors.slice(0, 5).map((c) => (
                    <li key={c.link}>
                      #{c.position} — {c.title}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </Section>

      <Section title="Google SERP preview" subtitle="How this page may appear in search results.">
        <SerpPreview serp={result.serp} />
      </Section>

      <Section
        title="Priority action board"
        subtitle="Agency-style P0 / P1 / P2 plan — fix order for maximum ranking impact."
      >
        <PriorityBoard actions={result.priorityActions} />
      </Section>

      <Section
        title="Core Web Vitals & PageSpeed"
        subtitle={
          result.pageSpeed.enabled && !result.pageSpeed.error
            ? `Mobile lab metrics via PageSpeed Insights (${result.pageSpeed.strategy}).`
            : "PageSpeed layer status."
        }
      >
        {result.pageSpeed.error ? (
          <p className="text-sm text-[#fde68a]">{result.pageSpeed.error}</p>
        ) : result.pageSpeed.enabled ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Performance", result.pageSpeed.performance],
                ["SEO", result.pageSpeed.seo],
                ["Accessibility", result.pageSpeed.accessibility],
                ["Best practices", result.pageSpeed.bestPractices],
              ].map(([label, val]) => (
                <div key={String(label)} className="rounded-xl bg-[var(--bg)] p-4">
                  <div className="text-xs uppercase tracking-wider text-[var(--muted)]">{label}</div>
                  <div className="font-display text-3xl font-semibold">{val ?? "—"}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
              <div className="rounded-xl border border-[var(--line)] p-3">LCP: {result.pageSpeed.lcpMs ?? "—"} ms</div>
              <div className="rounded-xl border border-[var(--line)] p-3">CLS: {result.pageSpeed.cls ?? "—"}</div>
              <div className="rounded-xl border border-[var(--line)] p-3">INP: {result.pageSpeed.inpMs ?? "—"} ms</div>
              <div className="rounded-xl border border-[var(--line)] p-3">FCP: {result.pageSpeed.fcpMs ?? "—"} ms</div>
            </div>
            {result.pageSpeed.reportUrl ? (
              <a
                href={result.pageSpeed.reportUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-[var(--accent)] hover:underline"
              >
                Open full PageSpeed report →
              </a>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">PageSpeed was skipped for this run.</p>
        )}
      </Section>

      <Section
        title="Multi-page site crawl"
        subtitle={
          result.crawl.enabled
            ? `${result.crawl.pagesAnalyzed} internal pages · avg score ${result.crawl.averageScore ?? "—"}`
            : "Deep crawl skipped."
        }
      >
        {result.crawl.pages.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No extra internal pages crawled.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-[var(--muted)]">
                <tr>
                  <th className="pb-2 pr-3">URL</th>
                  <th className="pb-2 pr-3">Score</th>
                  <th className="pb-2 pr-3">Grade</th>
                  <th className="pb-2 pr-3">Words</th>
                  <th className="pb-2 pr-3">Crit</th>
                  <th className="pb-2">Warn</th>
                </tr>
              </thead>
              <tbody>
                {result.crawl.pages.map((p) => (
                  <tr key={p.url} className="border-t border-[var(--line)]">
                    <td className="py-2 pr-3 max-w-[320px] truncate">{p.url}</td>
                    <td className="py-2 pr-3">{p.score ?? "—"}</td>
                    <td className="py-2 pr-3">{p.grade ?? "—"}</td>
                    <td className="py-2 pr-3">{p.wordCount}</td>
                    <td className="py-2 pr-3">{p.issuesCritical}</td>
                    <td className="py-2">{p.issuesWarning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section
        title="Broken link check"
        subtitle={`${broken.length} broken of ${result.brokenLinks?.length || 0} sampled links.`}
      >
        {broken.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No broken links in the sampled set.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {broken.map((b) => (
              <li key={b.url} className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2">
                <span className="font-medium text-rose-200">{b.status ?? "ERR"}</span>
                <span className="ml-2 break-all text-[var(--muted)]">{b.url}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Gemini SEO strategist"
        subtitle={
          result.ai.enabled && !result.ai.error
            ? `Powered by ${result.ai.model || "Gemini"} — keyword judgment, rewrites, and priority plan.`
            : "Heuristic audit ran. Add GEMINI_API_KEY for AI strategist layer."
        }
      >
        {result.ai.error ? (
          <div className="rounded-xl border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] p-4 text-sm text-[#fde68a]">
            {result.ai.error}
            <p className="mt-2 text-[var(--muted)]">
              Create <code className="text-[var(--accent)]">.env.local</code> with{" "}
              <code className="text-[var(--accent)]">GEMINI_API_KEY=...</code> then restart{" "}
              <code className="text-[var(--accent)]">npm run dev</code>.
            </p>
          </div>
        ) : null}

        {result.ai.enabled && !result.ai.error ? (
          <div className="space-y-5">
            {result.ai.primaryKeyword ? (
              <div className="rounded-xl border border-[rgba(34,224,208,0.35)] bg-[rgba(34,224,208,0.08)] p-4">
                <div className="text-xs uppercase tracking-wider text-[var(--accent)]">
                  AI primary keyword
                </div>
                <div className="mt-1 font-display text-2xl font-semibold text-[var(--text)]">
                  {result.ai.primaryKeyword}
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-3">
              {[
                { label: "Suggested title", value: result.ai.suggestedTitle },
                { label: "Suggested meta", value: result.ai.suggestedMetaDescription },
                { label: "Suggested H1", value: result.ai.suggestedH1 },
              ].map((item) =>
                item.value ? (
                  <div key={item.label} className="rounded-xl bg-[var(--bg)] p-4">
                    <div className="text-xs uppercase tracking-wider text-[var(--muted)]">
                      {item.label}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">{item.value}</p>
                  </div>
                ) : null
              )}
            </div>

            {result.ai.keywordVerdicts.length > 0 ? (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--accent-2)]">
                  AI keyword verdicts
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {result.ai.keywordVerdicts.map((v) => (
                    <div
                      key={`ai-${v.keyword}-${v.verdict}`}
                      className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium">{v.keyword}</span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${verdictBadge(v.verdict)}`}
                        >
                          {v.verdict}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[var(--muted)]">{v.reason}</p>
                      {v.betterAlternative ? (
                        <p className="mt-2 text-sm text-[var(--accent)]">
                          Better: {v.betterAlternative}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {result.ai.priorityActions.length > 0 ? (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--ok)]">
                  Priority actions
                </h3>
                <ol className="space-y-2 text-sm">
                  {result.ai.priorityActions.map((action, idx) => (
                    <li
                      key={action}
                      className="flex gap-3 rounded-xl bg-[var(--bg)] px-4 py-3"
                    >
                      <span className="font-display font-semibold text-[var(--accent)]">
                        {idx + 1}.
                      </span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {result.ai.contentGaps.length > 0 ? (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--warn)]">
                  Content gaps
                </h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {result.ai.contentGaps.map((gap) => (
                    <li
                      key={gap}
                      className="rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--muted)]"
                    >
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </Section>

      <Section
        title="Keyword intelligence"
        subtitle="Auto-extracted from your page — bad/weak keywords flagged, better targets suggested. AI suggestions merge on top when Gemini is enabled."
      >
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-[var(--bg)] p-4">
            <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Words</div>
            <div className="font-display text-2xl font-semibold">{result.keywords.wordCount}</div>
          </div>
          <div className="rounded-xl bg-[var(--bg)] p-4">
            <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Unique terms</div>
            <div className="font-display text-2xl font-semibold">{result.keywords.uniqueWords}</div>
          </div>
          <div className="rounded-xl bg-[var(--bg)] p-4">
            <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Suggestions</div>
            <div className="font-display text-2xl font-semibold">{result.keywords.suggestions.length}</div>
          </div>
        </div>

        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
          Suggested keywords (use these)
        </h3>
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          {result.keywords.suggestions.map((s) => (
            <div key={`${s.type}-${s.keyword}`} className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-[var(--text)]">{s.keyword}</div>
                <span className="shrink-0 rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">
                  {s.type}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">{s.reason}</p>
              <p className="mt-2 text-xs uppercase tracking-wider text-[var(--accent-2)]">
                Intent: {s.estimatedIntent}
              </p>
            </div>
          ))}
        </div>

        {(result.keywords.badKeywords.length > 0 || result.keywords.stuffedKeywords.length > 0) && (
          <>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--danger)]">
              Bad / stuffed keywords (avoid as focus)
            </h3>
            <KeywordTable
              items={[...result.keywords.stuffedKeywords, ...result.keywords.badKeywords]}
              empty="No clearly bad focus keywords detected."
            />
          </>
        )}

        {result.keywords.weakKeywords.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--warn)]">
              Weak keywords (improve or replace)
            </h3>
            <KeywordTable items={result.keywords.weakKeywords} empty="" />
          </div>
        )}

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--ok)]">
            Strong keyword candidates
          </h3>
          <KeywordTable
            items={result.keywords.primaryCandidates}
            empty="No strong candidates yet — expand topical content."
          />
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Top phrases on page
          </h3>
          <KeywordTable items={result.keywords.topPhrases} empty="Not enough phrase data." />
        </div>
      </Section>

      <Section title="Full SEO checklist" subtitle="Every pass, warning, and critical finding from the audit.">
        <div className="space-y-3">
          {orderedIssues.map((issue) => (
            <article
              key={issue.id}
              className={`rounded-xl border p-4 ${severityStyles(issue.severity)}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-80">
                  {issue.severity} · {issue.category}
                </span>
              </div>
              <h3 className="mt-1 font-semibold text-[var(--text)]">{issue.title}</h3>
              <p className="mt-1 text-sm opacity-90">{issue.message}</p>
              <p className="mt-2 text-sm">
                <span className="font-semibold text-[var(--accent)]">Fix: </span>
                {issue.recommendation}
              </p>
              {issue.currentValue ? (
                <p className="mt-2 break-all rounded-lg bg-black/20 px-3 py-2 text-xs text-[var(--muted)]">
                  {issue.currentValue}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="On-page snapshot">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[var(--muted)]">Title</dt>
              <dd className="mt-0.5">{result.meta.title || "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Meta description</dt>
              <dd className="mt-0.5">{result.meta.description || "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">H1</dt>
              <dd className="mt-0.5">{result.headings.h1.join(" · ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Canonical</dt>
              <dd className="mt-0.5 break-all">{result.meta.canonical || "—"}</dd>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-[var(--muted)]">Images</dt>
                <dd>
                  {result.images.total} total / {result.images.withoutAlt} missing alt
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Links</dt>
                <dd>
                  {result.links.internal} internal / {result.links.external} external
                </dd>
              </div>
            </div>
          </dl>
        </Section>

        <Section title="Technical signals">
          <ul className="space-y-2 text-sm">
            <li>HTTPS: {result.technical.https ? "Yes" : "No"}</li>
            <li>robots.txt: {result.technical.hasRobotsTxt ? "Found" : "Missing"}</li>
            <li>Sitemap: {result.technical.hasSitemap ? result.technical.sitemapUrl : "Missing"}</li>
            <li>
              Structured data:{" "}
              {result.technical.hasStructuredData
                ? result.technical.structuredDataTypes.join(", ")
                : "None"}
            </li>
            <li>Viewport: {result.meta.viewport || "Missing"}</li>
            <li>Language: {result.meta.language || "Missing"}</li>
            <li>
              HTML fetch:{" "}
              {result.technical.loadTimeMs != null ? `${result.technical.loadTimeMs} ms` : "—"}
            </li>
            <li>
              Open Graph:{" "}
              {result.meta.ogTitle && result.meta.ogImage ? "Mostly complete" : "Incomplete"}
            </li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
