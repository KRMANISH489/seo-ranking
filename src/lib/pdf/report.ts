import { promises as fs } from "fs";
import path from "path";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ProAuditResult } from "@/lib/seo/proTypes";

const BRAND = {
  ink: [11, 18, 32] as [number, number, number],
  blue: [10, 132, 255] as [number, number, number],
  teal: [0, 194, 168] as [number, number, number],
  muted: [91, 107, 124] as [number, number, number],
  soft: [243, 245, 248] as [number, number, number],
  danger: [190, 18, 60] as [number, number, number],
  warn: [180, 83, 9] as [number, number, number],
};

type DocWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

function finalY(doc: jsPDF, fallback: number) {
  return (doc as DocWithTable).lastAutoTable?.finalY ?? fallback;
}

function ensureSpace(doc: jsPDF, y: number, need = 80): number {
  if (y + need > 780) {
    doc.addPage();
    return 48;
  }
  return y;
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const file = path.join(process.cwd(), "public", "codabhi-logo.png");
    const buf = await fs.readFile(file);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    try {
      const file = path.join(process.cwd(), "public", "icon-32.png");
      const buf = await fs.readFile(file);
      return `data:image/png;base64,${buf.toString("base64")}`;
    } catch {
      return null;
    }
  }
}

function drawPromoFooter(doc: jsPDF, margin: number) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...BRAND.soft);
    doc.rect(0, 800, 595, 42, "F");
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.muted);
    doc.text(
      "CodAbhi · CODE · CREATE · DELIVER  ·  https://codabhi-dev.vercel.app  ·  Automated SEO audits, weekly rank reports & agency dashboards",
      margin,
      818
    );
    doc.setTextColor(...BRAND.blue);
    doc.text(`Page ${i}/${pages}`, 555, 818, { align: "right" });
  }
}

export async function buildAuditPdf(audit: ProAuditResult): Promise<Buffer> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = 36;
  const logo = await loadLogoDataUrl();

  // —— Header / logo + company promo ——
  if (logo) {
    try {
      doc.addImage(logo, "PNG", margin, y, 36, 36);
    } catch {
      // ignore bad image
    }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BRAND.ink);
  doc.text("CodAbhi SEO", margin + (logo ? 46 : 0), y + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text("Professional SEO audit · Rank tracking · Weekly client reports", margin + (logo ? 46 : 0), y + 30);
  y += 52;

  doc.setFillColor(...BRAND.blue);
  doc.roundedRect(margin, y, 515, 46, 8, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Built by CodAbhi — CODE · CREATE · DELIVER", margin + 14, y + 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Web apps · SEO growth systems · Client reporting automation  ·  codabhi-dev.vercel.app",
    margin + 14,
    y + 34
  );
  y += 64;

  doc.setTextColor(...BRAND.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SEO Audit Report", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Generated ${new Date(audit.analyzedAt).toLocaleString()}`, margin, y);
  y += 14;
  doc.setTextColor(...BRAND.blue);
  doc.text(audit.url, margin, y);
  y += 24;

  // Score block
  doc.setTextColor(...BRAND.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.text(String(audit.overallScore), margin, y);
  doc.setFontSize(12);
  doc.text(`/ 100   Grade ${audit.grade}`, margin + 56, y - 6);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  const summaryLines = doc.splitTextToSize(audit.summary, 515);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 11 + 14;

  if (audit.ai.strategistSummary) {
    y = ensureSpace(doc, y, 60);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.ink);
    doc.text("AI strategist summary", margin, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.muted);
    const aiLines = doc.splitTextToSize(audit.ai.strategistSummary, 515);
    doc.text(aiLines, margin, y);
    y += aiLines.length * 11 + 14;
  }

  // Category scores
  y = ensureSpace(doc, y, 100);
  autoTable(doc, {
    startY: y,
    head: [["Category", "Score"]],
    body: audit.categoryScores.map((c) => [c.category, String(c.score)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: BRAND.blue, textColor: 255 },
    margin: { left: margin, right: margin },
  });
  y = finalY(doc, y) + 18;

  // Keywords — current + suggested
  y = ensureSpace(doc, y, 120);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BRAND.ink);
  doc.text("Keyword intelligence", margin, y);
  y += 8;

  const primary = audit.ai.primaryKeyword || "—";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Primary keyword target: ${primary}`, margin, y + 10);
  y += 18;

  const kwRows = [
    ...audit.keywords.stuffedKeywords.slice(0, 6).map((k) => [
      k.keyword,
      "STUFFED",
      `${k.density.toFixed(1)}%`,
      k.suggestion || "Reduce repeats; use natural synonyms.",
    ]),
    ...audit.keywords.weakKeywords.slice(0, 8).map((k) => [
      k.keyword,
      "WEAK",
      `${k.density.toFixed(1)}%`,
      k.suggestion || k.reason || "Add to title/H1 naturally.",
    ]),
    ...audit.keywords.primaryCandidates.slice(0, 6).map((k) => [
      k.keyword,
      "STRONG",
      `${k.density.toFixed(1)}%`,
      k.reason || "Keep as supporting term.",
    ]),
  ];

  if (kwRows.length) {
    autoTable(doc, {
      startY: y,
      head: [["Keyword", "Status", "Density", "Solution"]],
      body: kwRows,
      styles: { fontSize: 7.5, cellWidth: "wrap" },
      columnStyles: { 0: { cellWidth: 110 }, 3: { cellWidth: 260 } },
      headStyles: { fillColor: BRAND.teal, textColor: 255 },
      margin: { left: margin, right: margin },
    });
    y = finalY(doc, y) + 16;
  }

  const suggestions = [
    ...audit.ai.suggestedKeywords,
    ...audit.keywords.suggestions,
  ]
    .filter((s, i, arr) => arr.findIndex((x) => x.keyword.toLowerCase() === s.keyword.toLowerCase()) === i)
    .slice(0, 16);

  if (suggestions.length) {
    y = ensureSpace(doc, y, 100);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.ink);
    doc.text("Recommended new / better keywords", margin, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [["Keyword", "Type", "Intent", "Why use it"]],
      body: suggestions.map((s) => [s.keyword, s.type, s.estimatedIntent, s.reason]),
      styles: { fontSize: 7.5, cellWidth: "wrap" },
      columnStyles: { 0: { cellWidth: 130 }, 3: { cellWidth: 250 } },
      headStyles: { fillColor: BRAND.ink, textColor: 255 },
      margin: { left: margin, right: margin },
    });
    y = finalY(doc, y) + 16;
  }

  if (audit.ai.suggestedTitle || audit.ai.suggestedMetaDescription || audit.ai.suggestedH1) {
    y = ensureSpace(doc, y, 90);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.ink);
    doc.text("Suggested on-page copy", margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND.muted);
    const copyBits = [
      audit.ai.suggestedTitle ? `Title: ${audit.ai.suggestedTitle}` : null,
      audit.ai.suggestedH1 ? `H1: ${audit.ai.suggestedH1}` : null,
      audit.ai.suggestedMetaDescription
        ? `Meta: ${audit.ai.suggestedMetaDescription}`
        : null,
    ].filter(Boolean) as string[];
    for (const line of copyBits) {
      const wrapped = doc.splitTextToSize(line, 515);
      y = ensureSpace(doc, y, wrapped.length * 11 + 8);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 11 + 6;
    }
    y += 8;
  }

  // Google ranks
  if (audit.ranking?.results?.length) {
    y = ensureSpace(doc, y, 100);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.ink);
    doc.text("Live Google positions", margin, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [["Keyword", "Position", "Page", "Status"]],
      body: audit.ranking.results.map((r) => [
        r.keyword,
        r.found && r.position != null ? `#${r.position}` : "Not in top 100",
        r.page != null ? String(r.page) : "—",
        r.found ? "Ranking" : "Opportunity",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: BRAND.blue, textColor: 255 },
      margin: { left: margin, right: margin },
    });
    y = finalY(doc, y) + 16;
  }

  // ALL issues with solutions (critical → warning → info)
  const issueGroups = [
    {
      label: "Critical SEO errors + solutions",
      color: BRAND.danger,
      items: audit.issues.filter((i) => i.severity === "critical"),
    },
    {
      label: "Warnings + solutions",
      color: BRAND.warn,
      items: audit.issues.filter((i) => i.severity === "warning"),
    },
    {
      label: "Info / opportunities + solutions",
      color: BRAND.blue,
      items: audit.issues.filter((i) => i.severity === "info"),
    },
  ];

  for (const group of issueGroups) {
    if (!group.items.length) continue;
    y = ensureSpace(doc, y, 80);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.ink);
    doc.text(`${group.label} (${group.items.length})`, margin, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [["Issue", "Finding", "Exact solution"]],
      body: group.items.map((i) => [
        i.title,
        i.message + (i.currentValue ? ` (now: ${i.currentValue})` : ""),
        i.recommendation,
      ]),
      styles: { fontSize: 7, cellWidth: "wrap", valign: "top" },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 170 },
        2: { cellWidth: 200 },
      },
      headStyles: { fillColor: group.color, textColor: 255 },
      margin: { left: margin, right: margin },
      didDrawPage: () => {
        // keep footer clear
      },
    });
    y = finalY(doc, y) + 16;
  }

  // Priority actions
  if (audit.priorityActions.length) {
    y = ensureSpace(doc, y, 90);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.ink);
    doc.text("Priority action plan", margin, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [["Level", "Action", "Detail", "Impact"]],
      body: audit.priorityActions.map((a) => [a.level, a.title, a.detail, a.impact]),
      styles: { fontSize: 7.5, cellWidth: "wrap" },
      columnStyles: { 1: { cellWidth: 120 }, 2: { cellWidth: 240 } },
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      margin: { left: margin, right: margin },
    });
    y = finalY(doc, y) + 16;
  }

  // Content gaps
  if (audit.ai.contentGaps?.length) {
    y = ensureSpace(doc, y, 70);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.ink);
    doc.text("Content gaps to cover", margin, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.muted);
    for (const gap of audit.ai.contentGaps) {
      y = ensureSpace(doc, y, 20);
      doc.text(`• ${gap}`, margin, y);
      y += 12;
    }
    y += 8;
  }

  // PageSpeed + crawl + broken links (compact)
  y = ensureSpace(doc, y, 100);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.ink);
  doc.text("Technical extras", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);

  if (audit.pageSpeed.enabled && !audit.pageSpeed.error) {
    doc.text(
      `PageSpeed mobile — Perf ${audit.pageSpeed.performance ?? "—"} · SEO ${audit.pageSpeed.seo ?? "—"} · A11y ${audit.pageSpeed.accessibility ?? "—"} · LCP ${audit.pageSpeed.lcpMs ?? "—"}ms`,
      margin,
      y
    );
    y += 14;
  } else if (audit.pageSpeed.error) {
    doc.text(`PageSpeed: ${audit.pageSpeed.error}`, margin, y);
    y += 14;
  }

  if (audit.crawl.enabled && audit.crawl.pages.length) {
    y = ensureSpace(doc, y, 80);
    autoTable(doc, {
      startY: y,
      head: [["Crawled URL", "Score", "Words", "Crit", "Warn"]],
      body: audit.crawl.pages.map((p) => [
        p.url.replace(/^https?:\/\//, "").slice(0, 52),
        p.score != null ? String(p.score) : "—",
        String(p.wordCount),
        String(p.issuesCritical),
        String(p.issuesWarning),
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: BRAND.teal, textColor: 255 },
      margin: { left: margin, right: margin },
    });
    y = finalY(doc, y) + 14;
  }

  const broken = audit.brokenLinks.filter((b) => !b.ok);
  if (broken.length) {
    y = ensureSpace(doc, y, 80);
    autoTable(doc, {
      startY: y,
      head: [["Broken / failing URL", "Status / error", "Solution"]],
      body: broken.slice(0, 25).map((b) => [
        b.url.slice(0, 70),
        b.status != null ? String(b.status) : b.error || "fail",
        "Fix or remove the link; redirect if URL moved; re-crawl after deploy.",
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: BRAND.warn, textColor: 255 },
      margin: { left: margin, right: margin },
    });
    y = finalY(doc, y) + 16;
  }

  // Closing promo CTA page strip
  y = ensureSpace(doc, y, 90);
  doc.setFillColor(...BRAND.ink);
  doc.roundedRect(margin, y, 515, 72, 10, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Need CodAbhi to implement these fixes?", margin + 16, y + 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "We build SEO-ready websites, weekly rank monitoring, and white-label client reports.",
    margin + 16,
    y + 42
  );
  doc.setTextColor(...BRAND.teal);
  doc.text("https://codabhi-dev.vercel.app  ·  CODE · CREATE · DELIVER", margin + 16, y + 58);

  drawPromoFooter(doc, margin);

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
