"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export function AdminLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-md rounded-2xl p-8">
        <BrandLogo href="https://codabhi-dev.vercel.app/" size="lg" showTagline external />
        <h1 className="mt-5 font-display text-3xl font-bold">Admin login</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          CodAbhi SEO backend — clients, weekly monitors, audits & reports.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin email (optional)"
            className="w-full rounded-xl bg-[var(--bg)] px-4 py-3 text-sm outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full rounded-xl bg-[var(--bg)] px-4 py-3 text-sm outline-none"
            required
          />
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl btn-brand py-3 font-semibold text-[var(--accent-on)] disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

        <p className="mt-6 text-xs text-[var(--muted)]">
          Password = <code className="text-[var(--accent)]">ADMIN_PASSWORD</code> or{" "}
          <code className="text-[var(--accent)]">ADMIN_SECRET</code> from{" "}
          <code>.env.local</code>
        </p>
        <Link href="/" className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline">
          ← Back to site
        </Link>
      </div>
    </main>
  );
}
