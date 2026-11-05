import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import { AppNav } from "@/components/AppNav";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const title = SITE_TITLE;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: title,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "agency SEO rank tracker",
    "white label client reports",
    "live Google position tracking",
    "agency rank monitoring software",
    "automated client reports",
    "Local SEO GMB audit",
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
        alt: "CodAbhi agency SEO rank tracker with scheduled client reports",
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
      { url: "/codabhi-mark.png", type: "image/png", sizes: "256x256" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: ["/codabhi-mark.png"],
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
      logo: `${SITE_URL}/codabhi-mark.png`,
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
        "Agency SEO rank tracker",
        "Live Google position tracking",
        "White-label scheduled client reports",
        "Local SEO / Google Business Profile checks",
        "PageSpeed and broken link checks",
        "Admin traffic-light client health",
      ],
      provider: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "What is CodAbhi’s agency SEO rank tracker?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "CodAbhi audits a client site, checks live Google positions for target keywords, reviews Local/GMB signals when provided, and saves the URL for scheduled follow-up reports.",
          },
        },
        {
          "@type": "Question",
          name: "Can agencies send white-label client reports?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Each run can email a PDF with scores, keyword movement, prioritized fixes, and CodAbhi branding so retainers stay transparent without rebuilding decks by hand.",
          },
        },
        {
          "@type": "Question",
          name: "How does scheduled monitoring work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "After the first audit with monitoring enabled, CodAbhi stores the client URL and re-checks on a weekly cadence. Admins see green, yellow, or red health based on the latest score and rank.",
          },
        },
        {
          "@type": "Question",
          name: "Does it cover Google Business Profile / Local search?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Add a business name plus city or a Maps link to pull listing signals such as NAP match, rating, reviews, and category gaps into the same audit report.",
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
      className={`${jakarta.variable} ${sora.variable} h-full antialiased`}
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
