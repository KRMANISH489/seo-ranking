import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ProAuditResult } from "@/lib/seo/proTypes";

export function buildAuditPdf(audit: ProAuditResult): Buffer {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("CodAbhi SEO Audit Report", margin, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`Generated ${new Date(audit.analyzedAt).toLocaleString()}`, margin, y);
  y += 16;
  doc.setTextColor(20);
  doc.text(audit.url, margin, y);
  y += 28;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(`${audit.overallScore}`, margin, y);
  doc.setFontSize(12);
  doc.text(` / 100  ·  Grade ${audit.grade}`, margin + 48, y - 4);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const summaryLines = doc.splitTextToSize(audit.summary, 515);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 12 + 16;

  if (audit.ai.primaryKeyword) {
    doc.setFont("helvetica", "bold");
    doc.text(`Primary keyword: ${audit.ai.primaryKeyword}`, margin, y);
    y += 18;
  }

  autoTable(doc, {
    startY: y,
    head: [["Category", "Score"]],
    body: audit.categoryScores.map((c) => [c.category, String(c.score)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [34, 224, 208], textColor: [4, 21, 22] },
    margin: { left: margin, right: margin },
  });

  y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || y) + 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Priority actions", margin, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [["Level", "Action", "Category"]],
    body: audit.priorityActions.slice(0, 12).map((a) => [a.level, a.title, a.category]),
    styles: { fontSize: 8, cellWidth: "wrap" },
    columnStyles: { 1: { cellWidth: 320 } },
    headStyles: { fillColor: [167, 139, 250], textColor: [11, 17, 23] },
    margin: { left: margin, right: margin },
  });

  y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || y) + 20;

  if (y > 700) {
    doc.addPage();
    y = 48;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("SERP preview", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(26, 86, 219);
  doc.text(audit.serp.title, margin, y);
  y += 12;
  doc.setTextColor(0, 128, 0);
  doc.text(audit.serp.displayUrl, margin, y);
  y += 12;
  doc.setTextColor(60);
  const desc = doc.splitTextToSize(audit.serp.description, 515);
  doc.text(desc, margin, y);
  y += desc.length * 11 + 18;

  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.text("Top issues", margin, y);
  y += 8;

  const topIssues = audit.issues
    .filter((i) => i.severity === "critical" || i.severity === "warning")
    .slice(0, 10);

  autoTable(doc, {
    startY: y,
    head: [["Severity", "Issue", "Fix"]],
    body: topIssues.map((i) => [i.severity, i.title, i.recommendation]),
    styles: { fontSize: 8 },
    columnStyles: { 1: { cellWidth: 140 }, 2: { cellWidth: 280 } },
    headStyles: { fillColor: [190, 18, 60] },
    margin: { left: margin, right: margin },
  });

  // PageSpeed page
  doc.addPage();
  y = 48;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Performance & crawl", margin, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (audit.pageSpeed.enabled && !audit.pageSpeed.error) {
    doc.text(
      `PageSpeed (mobile): Perf ${audit.pageSpeed.performance ?? "—"} · SEO ${audit.pageSpeed.seo ?? "—"} · A11y ${audit.pageSpeed.accessibility ?? "—"}`,
      margin,
      y
    );
    y += 14;
    doc.text(
      `LCP ${audit.pageSpeed.lcpMs ?? "—"}ms · CLS ${audit.pageSpeed.cls ?? "—"} · INP ${audit.pageSpeed.inpMs ?? "—"}ms`,
      margin,
      y
    );
    y += 20;
  } else {
    doc.text(audit.pageSpeed.error || "PageSpeed not run.", margin, y);
    y += 20;
  }

  if (audit.crawl.enabled && audit.crawl.pages.length) {
    doc.setFont("helvetica", "bold");
    doc.text(
      `Site crawl: ${audit.crawl.pagesAnalyzed} pages · avg score ${audit.crawl.averageScore ?? "—"}`,
      margin,
      y
    );
    y += 10;
    autoTable(doc, {
      startY: y,
      head: [["URL", "Score", "Grade", "Words", "Crit", "Warn"]],
      body: audit.crawl.pages.map((p) => [
        p.url.replace(/^https?:\/\//, "").slice(0, 48),
        p.score != null ? String(p.score) : "—",
        p.grade || "—",
        String(p.wordCount),
        String(p.issuesCritical),
        String(p.issuesWarning),
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [34, 224, 208], textColor: [4, 21, 22] },
      margin: { left: margin, right: margin },
    });
  }

  const broken = audit.brokenLinks.filter((b) => !b.ok);
  if (broken.length) {
    const finalY =
      ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y) + 20;
    doc.setFont("helvetica", "bold");
    doc.text("Broken links", margin, finalY);
    autoTable(doc, {
      startY: finalY + 8,
      head: [["URL", "Status"]],
      body: broken.slice(0, 15).map((b) => [b.url.slice(0, 70), b.status != null ? String(b.status) : b.error || "fail"]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [180, 83, 9] },
      margin: { left: margin, right: margin },
    });
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(`CodAbhi · Confidential · Page ${i}/${pages}`, margin, 820);
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
