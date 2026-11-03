import type { Metadata } from "next";
import { Suspense } from "react";
import { DM_Sans, Syne } from "next/font/google";
import { AppNav } from "@/components/AppNav";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const title = "CodAbhi SEO — Weekly Reports & Google Rank Monitoring";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: title,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "automated SEO audit tool",
    "weekly SEO rank tracker",
    "weekly reports",
    "white label SEO client reports",
    "agency rank monitoring software",
    "continuous SEO monitoring",
    "live Google position tracking tool",
  ],
  authors: [{ name: "CodAbhi", url: "https://codabhi-dev.vercel.app/" }],
  creator: "CodAbhi",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "CodAbhi SEO — automated SEO audit tool and weekly Google rank reports",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "CodAbhi",
      url: "https://codabhi-dev.vercel.app/",
      logo: `${SITE_URL}/codabhi-logo.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Automated SEO audit tool",
        "Live Google position tracking",
        "Weekly client SEO reports",
        "White label SEO client reports",
        "Continuous SEO monitoring",
        "PageSpeed and broken link checks",
      ],
      provider: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "What does CodAbhi SEO automate?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "CodAbhi SEO is an automated SEO audit tool that checks on-page health, tracks live Google keyword rankings, and sends weekly reports to your client inbox with continuous SEO monitoring.",
          },
        },
        {
          "@type": "Question",
          name: "Can agencies send white label SEO client reports?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Agencies use CodAbhi for white label SEO client reports, scheduled SEO audit reports, and agency rank monitoring software workflows without rebuilding decks every week.",
          },
        },
        {
          "@type": "Question",
          name: "How often are weekly reports sent?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "When monitoring is enabled, CodAbhi runs audits and emails weekly reports every week so clients see SERP rank improvement progress without manual follow-up.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <Suspense fallback={<div className="h-14 border-b border-[var(--line)]" />}>
          <AppNav />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
