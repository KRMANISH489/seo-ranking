import nodemailer from "nodemailer";
import type { ProAuditResult } from "@/lib/seo/proTypes";
import { rankingSpeedTips, type RankingReport } from "@/lib/seo/googleRank";

function getAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL?.trim() || null;
}

function smtpPass(): string {
  return (process.env.SMTP_PASS || "").replace(/\s+/g, "");
}

function resendKey(): string {
  return process.env.RESEND_API_KEY?.trim() || "";
}

function fromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    "CodAbhi SEO <onboarding@resend.dev>"
  );
}

function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      smtpPass() &&
      process.env.SMTP_FROM?.trim()
  );
}

function isEmailConfigured(): boolean {
  return Boolean(resendKey()) || isSmtpConfigured();
}

function transporter() {
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = smtpPass();
  const host = (process.env.SMTP_HOST || "").trim().toLowerCase();
  if (host.includes("gmail.com")) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
  });
}

async function deliverMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const from = fromAddress();
  const key = resendKey();

  // Prefer Resend — more reliable on Vercel than Gmail SMTP
  if (key) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend ${res.status}: ${body.slice(0, 280)}`);
    }
    return;
  }

  const tx = transporter();
  await tx.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
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
      <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Keyword</th>
      <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Google position</th>
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
  const tipHtml = tips.map((t) => `<li>${escapeHtml(t)}</li>`).join("");
  const reportUrl = `${appBaseUrl}/report/${audit.id}`;
  const pdfUrl = `${appBaseUrl}/api/audits/${audit.id}/pdf`;
  const best =
    audit.ranking?.bestPosition != null ? `#${audit.ranking.bestPosition}` : "n/a";

  const logoUrl = `${appBaseUrl}/codabhi-mark.png`;

  return `<!DOCTYPE html><html><body style="margin:0;background:#eef6ff;color:#0b1220;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:28px;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
      <tr>
        <td style="vertical-align:middle;padding-right:12px;">
          <img src="${logoUrl}" width="44" height="44" alt="CodAbhi SEO" style="display:block;border-radius:12px;" />
        </td>
        <td style="vertical-align:middle;">
          <div style="font-size:18px;font-weight:700;color:#0b1220;line-height:1.2;">CodAbhi <span style="color:#0a84ff;">SEO</span></div>
          <div style="font-size:11px;color:#5b6b7c;letter-spacing:0.12em;text-transform:uppercase;margin-top:4px;">audit · rank · report</div>
        </td>
      </tr>
    </table>
    <h1 style="font-size:26px;margin:8px 0 6px;color:#0b1220;">${isWeekly ? "Weekly" : "Audit"} report</h1>
    <p style="color:#5b6b7c;font-size:14px;">For ${audience === "admin" ? "Admin" : "Client"} · ${new Date(audit.analyzedAt).toLocaleString()}</p>
    <p style="margin:18px 0 8px;"><a href="${escapeHtml(audit.url)}" style="color:#0a84ff;">${escapeHtml(audit.url)}</a></p>

    <div style="display:flex;gap:12px;margin:20px 0;">
      <div style="flex:1;background:#ffffff;border:1px solid #d7e6f7;border-radius:12px;padding:16px;">
        <div style="font-size:12px;color:#5b6b7c;">SEO score</div>
        <div style="font-size:36px;font-weight:700;color:#0a84ff;">${audit.overallScore}</div>
        <div style="color:#00a88f;">Grade ${escapeHtml(audit.grade)}</div>
      </div>
      <div style="flex:1;background:#ffffff;border:1px solid #d7e6f7;border-radius:12px;padding:16px;">
        <div style="font-size:12px;color:#5b6b7c;">Best Google rank</div>
        <div style="font-size:36px;font-weight:700;color:#0b1220;">${best}</div>
        <div style="color:#5b6b7c;font-size:13px;">Live SERP check</div>
      </div>
    </div>

    <h2 style="font-size:18px;margin-top:24px;color:#0b1220;">Keyword ranks</h2>
    <div style="background:#fff;color:#0f172a;border-radius:12px;padding:8px;overflow:auto;border:1px solid #d7e6f7;">
      ${rankRows(audit.ranking)}
    </div>

    <h2 style="font-size:18px;margin-top:24px;color:#0b1220;">Rank improvement tips</h2>
    <ul style="color:#334155;line-height:1.6;">${tipHtml || "<li>Keep monitoring weekly.</li>"}</ul>

    <div style="margin-top:28px;">
      <a href="${pdfUrl}" style="display:inline-block;background:#0a84ff;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;margin-right:10px;">Download PDF</a>
      <a href="${reportUrl}" style="display:inline-block;color:#0a84ff;text-decoration:underline;padding:12px 0;">Open full report</a>
    </div>

    <p style="color:#64748b;font-size:12px;margin-top:28px;">
      Automated by CodAbhi (https://codabhi-dev.vercel.app). Continuous SEO monitoring continues until paused in the agency dashboard.
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
        "Email not configured. Set RESEND_API_KEY (recommended) or SMTP_HOST/USER/PASS/FROM, plus ADMIN_EMAIL.",
      error: null,
    };
  }

  const sent: string[] = [];
  const errors: string[] = [];
  const isWeekly = Boolean(opts.isWeekly);

  async function trySend(to: string, audience: "client" | "admin", subject: string) {
    try {
      await deliverMail({
        to,
        subject,
        html: buildHtml({
          audit: opts.audit,
          audience,
          isWeekly,
          appBaseUrl,
        }),
      });
      sent.push(to);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Email send failed";
      errors.push(`${to}: ${friendlyEmailError(msg)}`);
    }
  }

  await trySend(
    opts.clientEmail,
    "client",
    `${isWeekly ? "[Weekly]" : "[Audit]"} CodAbhi SEO · Score ${opts.audit.overallScore} · ${opts.audit.url}`
  );

  if (admin && admin.toLowerCase() !== opts.clientEmail.toLowerCase()) {
    await trySend(
      admin,
      "admin",
      `${isWeekly ? "[Weekly Admin]" : "[Audit Admin]"} ${opts.audit.url} · Score ${opts.audit.overallScore} · Best rank ${opts.audit.ranking?.bestPosition ?? "n/a"}`
    );
  }

  return {
    sent,
    skipped: null,
    error: errors.length ? errors.join(" | ") : null,
  };
}

function friendlyEmailError(msg: string): string {
  if (/only send testing emails to your own email|verify a domain|resend\.com\/domains/i.test(msg)) {
    return (
      "Resend testing mode: client emails blocked. Verify a domain at https://resend.com/domains " +
      "then set EMAIL_FROM to an address on that domain (e.g. reports@yourdomain.com) and redeploy."
    );
  }
  return msg;
}

export function emailStatus() {
  const usingResend = Boolean(resendKey());
  return {
    smtpConfigured: isEmailConfigured(),
    emailProvider: usingResend ? "resend" : isSmtpConfigured() ? "smtp" : null,
    adminEmail: getAdminEmail(),
    smtpUser: process.env.SMTP_USER?.trim() || null,
    serpConfigured: Boolean(process.env.SERPER_API_KEY || process.env.SERPAPI_KEY),
  };
}

export async function sendTestEmail(to: string): Promise<{ ok: boolean; error: string | null }> {
  if (!isEmailConfigured()) {
    return {
      ok: false,
      error:
        "Email not configured. Recommended: set RESEND_API_KEY from https://resend.com (free). Or fix Gmail SMTP_PASS App Password.",
    };
  }
  try {
    const provider = resendKey() ? "Resend" : "SMTP";
    await deliverMail({
      to,
      subject: "CodAbhi SEO — test email OK",
      html: `<div style="font-family:Arial,sans-serif;padding:20px;background:#f3f5f8;color:#0b1220">
        <h2 style="color:#0a84ff">CodAbhi SEO</h2>
        <p>${provider} is working. Audit reports can now email client + admin.</p>
      </div>`,
    });
    return { ok: true, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Send failed";
    if (/BadCredentials|Invalid login|535/i.test(msg)) {
      return {
        ok: false,
        error: `${msg} | Gmail App Password invalid. Easier fix: create free key at https://resend.com → set RESEND_API_KEY on Vercel → Redeploy.`,
      };
    }
    return { ok: false, error: friendlyEmailError(msg) };
  }
}
