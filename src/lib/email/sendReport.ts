import nodemailer from "nodemailer";
import type { ProAuditResult } from "@/lib/seo/proTypes";
import { rankingSpeedTips, type RankingReport } from "@/lib/seo/googleRank";

function getAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL?.trim() || null;
}

function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim() &&
      process.env.SMTP_FROM?.trim()
  );
}

function transporter() {
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function rankRows(ranking?: RankingReport | null): string {
  if (!ranking?.results?.length) {
    return `<p>No keyword rank data.</p>`;
  }
  const rows = ranking.results
    .map((r) => {
      const pos = r.found && r.position != null ? `#${r.position}` : "Not in top 100";
      const page = r.page ? ` (page ${r.page})` : "";
      return `<tr>
        <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(r.keyword)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;font-weight:700;">${pos}${page}</td>
      </tr>`;
    })
    .join("");
  return `<table style="border-collapse:collapse;width:100%;font-size:14px;">
    <thead><tr>
      <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;background:#f8fafc;">Keyword</th>
      <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;background:#f8fafc;">Google Rank</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(opts: {
  audit: ProAuditResult;
  audience: "client" | "admin";
  isWeekly: boolean;
  appBaseUrl: string;
}): string {
  const { audit, audience, isWeekly, appBaseUrl } = opts;
  const tips = audit.ranking ? rankingSpeedTips(audit.ranking) : [];
  const reportUrl = `${appBaseUrl}/report/${audit.id}`;
  const pdfUrl = `${appBaseUrl}/api/audits/${audit.id}/pdf`;
  const title = isWeekly ? "Weekly SEO Rank Report" : "SEO Audit Report";

  return `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;background:#0b1117;color:#f4f7fb;margin:0;padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#101820;border-radius:16px;padding:28px;border:1px solid #243041;">
    <p style="color:#22d3ee;letter-spacing:2px;font-size:12px;font-weight:700;text-transform:uppercase;">CodAbhi SEO</p>
    <h1 style="margin:8px 0 4px;font-size:24px;color:#fff;">${title}</h1>
    <p style="color:#94a3b8;font-size:14px;">For ${audience === "admin" ? "Admin" : "Client"} · ${new Date(audit.analyzedAt).toLocaleString()}</p>
    <p style="color:#cbd5e1;font-size:14px;word-break:break-all;">${escapeHtml(audit.url)}</p>

    <div style="display:flex;gap:16px;margin:24px 0;">
      <div style="background:#0b1117;border-radius:12px;padding:16px;flex:1;border:1px solid rgba(34,224,208,0.25);">
        <div style="color:#8b9bb0;font-size:12px;">SEO Score</div>
        <div style="font-size:36px;font-weight:700;color:#22d3ee;">${audit.overallScore}</div>
        <div style="color:#8b9bb0;">Grade ${audit.grade}</div>
      </div>
      <div style="background:#0b1117;border-radius:12px;padding:16px;flex:1;border:1px solid rgba(167,139,250,0.25);">
        <div style="color:#8b9bb0;font-size:12px;">Best Google Rank</div>
        <div style="font-size:36px;font-weight:700;color:#a78bfa;">${
          audit.ranking?.bestPosition != null ? "#" + audit.ranking.bestPosition : "—"
        }</div>
        <div style="color:#94a3b8;">Live SERP check</div>
      </div>
    </div>

    <p style="color:#cbd5e1;line-height:1.5;">${escapeHtml(audit.summary)}</p>
    ${audit.ranking ? `<p style="color:#94a3b8;font-size:13px;">${escapeHtml(audit.ranking.summary)}</p>` : ""}

    <h2 style="color:#fff;font-size:16px;margin-top:28px;">Google keyword ranks</h2>
    <div style="background:#fff;color:#0f172a;border-radius:12px;padding:8px;margin-top:8px;">
      ${rankRows(audit.ranking)}
    </div>

    <h2 style="color:#fff;font-size:16px;margin-top:28px;">Fastest path to better ranking</h2>
    <ol style="color:#cbd5e1;padding-left:18px;line-height:1.6;">
      ${tips.map((t) => `<li>${escapeHtml(t)}</li>`).join("") || "<li>Complete on-page P0 fixes from the full report.</li>"}
    </ol>

    <h2 style="color:#fff;font-size:16px;margin-top:28px;">Priority fixes (P0)</h2>
    <ul style="color:#cbd5e1;padding-left:18px;line-height:1.6;">
      ${audit.priorityActions
        .filter((a) => a.level === "P0")
        .slice(0, 6)
        .map((a) => `<li><strong>${escapeHtml(a.title)}</strong> — ${escapeHtml(a.detail)}</li>`)
        .join("") || "<li>No critical P0 items.</li>"}
    </ul>

    <div style="margin-top:28px;">
      <a href="${pdfUrl}" style="display:inline-block;background:#22d3ee;color:#041516;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;margin-right:10px;">Download PDF</a>
      <a href="${reportUrl}" style="display:inline-block;color:#22d3ee;text-decoration:underline;padding:12px 0;">Open full report</a>
    </div>

    <p style="color:#64748b;font-size:12px;margin-top:28px;">
      Automated by CodAbhi (https://codabhi-dev.vercel.app). Weekly monitoring continues until admin disables it.
    </p>
  </div>
</body></html>`;
}

export async function sendAuditEmails(opts: {
  audit: ProAuditResult;
  clientEmail: string;
  isWeekly?: boolean;
}): Promise<{ sent: string[]; skipped: string | null; error: string | null }> {
  const admin = getAdminEmail();
  const appBaseUrl = (process.env.APP_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

  if (!isEmailConfigured()) {
    return {
      sent: [],
      skipped:
        "Email not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (and ADMIN_EMAIL).",
      error: null,
    };
  }

  const sent: string[] = [];
  try {
    const tx = transporter();
    const isWeekly = Boolean(opts.isWeekly);

    const clientHtml = buildHtml({
      audit: opts.audit,
      audience: "client",
      isWeekly,
      appBaseUrl,
    });
    await tx.sendMail({
      from: process.env.SMTP_FROM,
      to: opts.clientEmail,
      subject: `${isWeekly ? "[Weekly]" : "[Audit]"} CodAbhi SEO · Score ${opts.audit.overallScore} · ${opts.audit.url}`,
      html: clientHtml,
    });
    sent.push(opts.clientEmail);

    if (admin && admin.toLowerCase() !== opts.clientEmail.toLowerCase()) {
      const adminHtml = buildHtml({
        audit: opts.audit,
        audience: "admin",
        isWeekly,
        appBaseUrl,
      });
      await tx.sendMail({
        from: process.env.SMTP_FROM,
        to: admin,
        subject: `${isWeekly ? "[Weekly Admin]" : "[Audit Admin]"} ${opts.audit.url} · Score ${opts.audit.overallScore} · Best rank ${opts.audit.ranking?.bestPosition ?? "n/a"}`,
        html: adminHtml,
      });
      sent.push(admin);
    }

    return { sent, skipped: null, error: null };
  } catch (err) {
    return {
      sent,
      skipped: null,
      error: err instanceof Error ? err.message : "Email send failed",
    };
  }
}

export function emailStatus() {
  return {
    smtpConfigured: isEmailConfigured(),
    adminEmail: getAdminEmail(),
    serpConfigured: Boolean(process.env.SERPER_API_KEY || process.env.SERPAPI_KEY),
  };
}
