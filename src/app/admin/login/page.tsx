import { Suspense } from "react";
import { AdminLoginForm } from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-[var(--muted)]">
          Loading…
        </main>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
