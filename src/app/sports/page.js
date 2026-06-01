import Link from "next/link";
import StreamNavigation from "@/components/stream/StreamNavigation";
import SportsClient from "./SportsClient";
import styles from "./page.module.css";

const siteUrl = "https://syncplay.vercel.app";
const pageUrl = `${siteUrl}/sports`;
const pageTitle = "Sync Play Sports - Live Matches and Events";
const pageDescription =
  "Browse live sports matches, PPV events, and CDN Live sports streams in a modern animated web player.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "/sports",
  },
  keywords: [
    "Sync Play Sports",
    "live sports streams",
    "live matches",
    "PPV streams",
    "sports event browser",
  ],
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/sports",
    siteName: "Sync Play",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Sync Play Sports",
  applicationCategory: "EntertainmentApplication",
  operatingSystem: "Any",
  url: pageUrl,
  description: pageDescription,
  featureList: [
    "Live sports match browser",
    "Provider filtering",
    "Sport and tournament filtering",
    "Embedded stream player",
  ],
};

export default function SportsPage() {
  return (
    <main className={styles.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <section className={styles.hero} aria-labelledby="sports-title">
        <Link href="/sports" className={styles.brandLink}>
          <h1 id="sports-title">Sports</h1>
        </Link>
        <p className={styles.lead}>
          Live matches, PPV events, and sports channels in one focused player.
        </p>
        <StreamNavigation />
      </section>

      <SportsClient />
    </main>
  );
}
