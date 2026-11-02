"use client";

import { useEffect, useState } from "react";
import { AdminGate } from "@/components/admin/AdminGate";

function SettingsInner() {
  const [status, setStatus] = useState<{
    smtpConfigured?: boolean;
    adminEmail?: string | null;
    serpConfigured?: boolean;
  }>({});

  useEffect(() => {
    fetch("/api/monitors")
      .then((r) => r.json())
      .then((d) => setStatus(d.status || {}))
      .catch(() => undefined);
  }, []);

  const rows = [
    {
      name: "Gemini AI",
      ok: true,
      hint: "GEMINI_API_KEY in .env.local",
    },
    {
      name: "Google rank (Serper)",
      ok: Boolean(status.serpConfigured),
      hint: "SERPER_API_KEY — live #position",
    },
    {
      name: "SMTP email",
      ok: Boolean(status.smtpConfigured),
      hint: "SMTP_HOST / USER / PASS / FROM",
    },
    {
      name: "Admin email CC",
      ok: Boolean(status.adminEmail),
      hint: status.adminEmail || "Set ADMIN_EMAIL",
    },
    {
      name: "Weekly cron",
      ok: true,
      hint: "Vercel cron Mon 09:00 UTC · or /api/cron/weekly",
    },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">Backend settings</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Config is managed via <code className="text-[var(--accent)]">.env.local</code> (secure, not in UI).
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

      <div className="glass mt-8 rounded-2xl p-5 text-sm text-[var(--muted)]">
        <p className="font-medium text-[var(--text)]">Admin login password</p>
        <p className="mt-2">
          Uses <code className="text-[var(--accent)]">ADMIN_PASSWORD</code> if set, otherwise{" "}
          <code className="text-[var(--accent)]">ADMIN_SECRET</code>. Current local default was set in{" "}
          <code>.env.local</code>.
        </p>
        <p className="mt-4 font-medium text-[var(--text)]">API backend routes</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>/api/analyze — public audit + enroll monitor</li>
          <li>/api/admin/* — login, stats, session</li>
          <li>/api/monitors — client monitor CRUD</li>
          <li>/api/cron/weekly — weekly batch emails</li>
        </ul>
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
