"use client";

import { useEffect, useState } from "react";
import { AdminGate } from "@/components/admin/AdminGate";

function SettingsInner() {
  const [status, setStatus] = useState<{
    smtpConfigured?: boolean;
    adminEmail?: string | null;
    smtpUser?: string | null;
    serpConfigured?: boolean;
  }>({});
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/monitors")
      .then((r) => r.json())
      .then((d) => setStatus(d.status || {}))
      .catch(() => undefined);
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
      name: "SMTP email",
      ok: Boolean(status.smtpConfigured),
      hint: status.smtpUser
        ? `From ${status.smtpUser}`
        : "Set SMTP_HOST / USER / PASS / FROM",
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
      <h1 className="font-display text-3xl font-bold tracking-tight">Backend settings</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Config via <code className="text-[var(--accent)]">.env.local</code> (local) or Vercel Environment
        Variables (production).
      </p>

      <div className="mt-6 space-y-3">
        {rows.map((r) => (
          <div key={r.name} className="glass flex items-center justify-between gap-3 rounded-2xl p-5">
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="mt-1 text-sm text-[var(--muted)]">{r.hint}</div>
            </div>
            <span
              className={`rounded-md px-2 py-1 text-xs font-bold uppercase ${
                r.ok ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-200"
              }`}
            >
              {r.ok ? "Ready" : "Setup"}
            </span>
          </div>
        ))}
      </div>

      <div className="glass mt-8 space-y-4 rounded-2xl p-5 text-sm text-[var(--muted)]">
        <p className="font-medium text-[var(--text)]">Gmail SMTP setup (email reports)</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Google Account →{" "}
            <a
              href="https://myaccount.google.com/security"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--accent)] hover:underline"
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
              className="text-[var(--accent)] hover:underline"
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
          <li>Vercel pe same keys add karke <strong className="text-[var(--text)]">Redeploy</strong></li>
        </ol>

        <button
          type="button"
          onClick={sendTest}
          disabled={testing}
          className="btn-brand rounded-xl px-4 py-2.5 text-sm disabled:opacity-50"
        >
          {testing ? "Sending…" : "Send test email to admin"}
        </button>
        {testMsg && <p className="text-[var(--text)]">{testMsg}</p>}
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
