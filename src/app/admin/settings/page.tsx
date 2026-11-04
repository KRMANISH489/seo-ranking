"use client";

import { useEffect, useState } from "react";
import { AdminGate } from "@/components/admin/AdminGate";

function SettingsInner() {
  const [status, setStatus] = useState<{
    smtpConfigured?: boolean;
    emailProvider?: string | null;
    adminEmail?: string | null;
    smtpUser?: string | null;
    serpConfigured?: boolean;
    smtpFallbackReady?: boolean;
    resendNeedsDomain?: boolean;
  }>({});
  const [storage, setStorage] = useState<"blob" | "filesystem" | null>(null);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/monitors")
      .then((r) => r.json())
      .then((d) => setStatus(d.status || {}))
      .catch(() => undefined);
    fetch("/api/audits")
      .then((r) => r.json())
      .then((d) => setStorage(d.storage === "blob" ? "blob" : "filesystem"))
      .catch(() => setStorage("filesystem"));
  }, []);

  async function sendTest() {
    setTesting(true);
    setTestMsg(null);
    try {
      const res = await fetch("/api/admin/test-email", { method: "POST", body: "{}" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Test failed");
      setTestMsg(`Test email sent to ${data.to}`);
    } catch (err) {
      setTestMsg(err instanceof Error ? err.message : "Test failed");
    } finally {
      setTesting(false);
    }
  }

  const rows = [
    {
      name: "Persistent storage (Blob)",
      ok: storage === "blob",
      hint:
        storage === "blob"
          ? "Vercel Blob connected — History/Admin will persist"
          : "Create Blob Store in Vercel Storage (BLOB_READ_WRITE_TOKEN)",
    },
    {
      name: "Gemini AI",
      ok: true,
      hint: "GEMINI_API_KEY in .env.local / Vercel",
    },
    {
      name: "Google rank (Serper)",
      ok: Boolean(status.serpConfigured),
      hint: "SERPER_API_KEY — live #position",
    },
    {
      name: "PageSpeed Insights",
      ok: true,
      hint: "Optional PAGESPEED_API_KEY — without it, shared quota can hit 429",
    },
    {
      name: "Email delivery",
      ok: Boolean(status.smtpConfigured) && (!status.resendNeedsDomain || status.smtpFallbackReady),
      hint: status.resendNeedsDomain
        ? status.smtpFallbackReady
          ? "Resend testing mode — client mail uses Gmail SMTP fallback"
          : "Resend can only email YOUR inbox until you verify a domain"
        : status.emailProvider
          ? `Provider: ${status.emailProvider}${status.smtpUser ? ` · ${status.smtpUser}` : ""}`
          : "Set RESEND_API_KEY (recommended) or Gmail SMTP",
    },
    {
      name: "Admin email CC",
      ok: Boolean(status.adminEmail),
      hint: status.adminEmail || "Set ADMIN_EMAIL",
    },
    {
      name: "Weekly cron",
      ok: true,
      hint: "Vercel cron Mon 09:00 UTC · or Run weekly on Dashboard",
    },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text)]">
        Backend settings
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Config via <code className="rounded bg-[var(--bg-soft)] px-1.5 py-0.5 text-[var(--accent)]">.env.local</code>{" "}
        (local) or Vercel Environment Variables (production).
      </p>

      <div className="mt-6 space-y-3">
        {rows.map((r) => (
          <div
            key={r.name}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm"
          >
            <div className="min-w-0">
              <div className="font-semibold text-[var(--text)]">{r.name}</div>
              <div className="mt-1 text-sm text-[var(--muted)]">{r.hint}</div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                r.ok
                  ? "bg-[rgba(0,194,168,0.14)] text-[#0a7a6a]"
                  : "bg-[rgba(217,119,6,0.14)] text-[#b45309]"
              }`}
            >
              {r.ok ? "Ready" : "Setup"}
            </span>
          </div>
        ))}
      </div>

      {!status.serpConfigured ? (
        <div className="mt-8 space-y-3 rounded-2xl border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)] shadow-sm">
          <p className="font-semibold text-[var(--text)]">Google rank (Serper) setup</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Sign up at{" "}
              <a
                href="https://serper.dev"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[var(--accent)] hover:underline"
              >
                serper.dev
              </a>{" "}
              and copy your API key
            </li>
            <li>
              Local: add <code className="text-[var(--accent)]">SERPER_API_KEY=...</code> in{" "}
              <code className="text-[var(--accent)]">.env.local</code>
            </li>
            <li>
              Production: Vercel → Environment Variables →{" "}
              <code className="text-[var(--accent)]">SERPER_API_KEY</code> → Redeploy
            </li>
          </ol>
        </div>
      ) : null}

      <div className="mt-8 space-y-3 rounded-2xl border border-[rgba(10,132,255,0.25)] bg-[rgba(10,132,255,0.06)] p-5 text-sm text-[var(--muted)]">
        <p className="font-semibold text-[var(--text)]">Recommended: Resend (fixes 535 BadCredentials)</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Create free account at{" "}
            <a
              href="https://resend.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--accent)] hover:underline"
            >
              resend.com
            </a>{" "}
            → API Keys → Create
          </li>
          <li>
            Vercel env: <code className="text-[var(--accent)]">RESEND_API_KEY=re_...</code>
          </li>
          <li>
            Optional:{" "}
            <code className="text-[var(--accent)]">
              EMAIL_FROM=CodAbhi SEO &lt;onboarding@resend.dev&gt;
            </code>{" "}
            (works for testing without a custom domain)
          </li>
          <li>
            Keep <code className="text-[var(--accent)]">ADMIN_EMAIL</code> = your inbox → Redeploy →
            Send test email
          </li>
        </ol>
        <p className="text-xs">
          Free Resend with <code>onboarding@resend.dev</code> can only email{" "}
          <strong className="text-[var(--text)]">your own Resend account inbox</strong>. To email
          clients (any address):
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-xs">
          <li>
            Open{" "}
            <a
              href="https://resend.com/domains"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--accent)] hover:underline"
            >
              resend.com/domains
            </a>{" "}
            → Add Domain (e.g. yourdomain.com)
          </li>
          <li>Add the DNS records Resend shows (at your domain DNS provider)</li>
          <li>
            Set Vercel{" "}
            <code className="text-[var(--accent)]">
              EMAIL_FROM=CodAbhi SEO &lt;reports@yourdomain.com&gt;
            </code>
          </li>
          <li>Redeploy → client emails will work</li>
        </ol>
      </div>

      <div className="mt-8 space-y-4 rounded-2xl border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)] shadow-sm">
        <p className="font-semibold text-[var(--text)]">Optional: Gmail SMTP setup</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Google Account →{" "}
            <a
              href="https://myaccount.google.com/security"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--accent)] hover:underline"
            >
              Security
            </a>{" "}
            → turn on <strong className="text-[var(--text)]">2-Step Verification</strong>
          </li>
          <li>
            Open{" "}
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--accent)] hover:underline"
            >
              App Passwords
            </a>{" "}
            → create for “Mail” → copy 16-char password
          </li>
          <li>
            Set env: <code className="text-[var(--accent)]">SMTP_PASS</code> = that password (spaces OK)
          </li>
          <li>
            Also set <code className="text-[var(--accent)]">SMTP_HOST=smtp.gmail.com</code>,{" "}
            <code className="text-[var(--accent)]">SMTP_PORT=587</code>,{" "}
            <code className="text-[var(--accent)]">SMTP_USER</code>,{" "}
            <code className="text-[var(--accent)]">SMTP_FROM</code>,{" "}
            <code className="text-[var(--accent)]">ADMIN_EMAIL</code>
          </li>
          <li>
            Vercel pe same keys add karke <strong className="text-[var(--text)]">Redeploy</strong>
          </li>
        </ol>
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>535 BadCredentials?</strong> Use a Gmail App Password only (not login password).{" "}
          <code className="text-[var(--accent)]">SMTP_USER</code> must match that Gmail. No quotes around
          Vercel values. Save → Redeploy → test again.
        </p>

        <button
          type="button"
          onClick={sendTest}
          disabled={testing}
          className="btn-brand rounded-xl px-4 py-2.5 text-sm disabled:opacity-50"
        >
          {testing ? "Sending…" : "Send test email to admin"}
        </button>
        {testMsg && <p className="font-medium text-[var(--text)]">{testMsg}</p>}
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminGate>
      <SettingsInner />
    </AdminGate>
  );
}
