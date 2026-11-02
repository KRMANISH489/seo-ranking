import type { Metadata } from "next";
import { Suspense } from "react";
import { DM_Sans, Syne } from "next/font/google";
import { AppNav } from "@/components/AppNav";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodAbhi SEO — Audit, Rank & Weekly Reports",
  description:
    "CodAbhi professional SEO audits with Gemini strategy, live Google rank, weekly client emails, PDF reports, and admin panel.",
  applicationName: "CodAbhi SEO",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<div className="h-14 border-b border-[var(--line)]" />}>
          <AppNav />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
