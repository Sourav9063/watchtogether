import styles from "./page.module.css";
import Link from "next/link";
import IframeWrapper from "@/components/IframeWrapper";
import StreamNavigation from "@/components/stream/StreamNavigation";

const siteUrl = "https://syncplay.vercel.app";
const pageUrl = `${siteUrl}/stream`;
const pageTitle = "Sync Play Stream - Movies, Anime, IPTV and Live Sports";
const pageDescription =
  "Use Sync Play Stream to search movies and TV shows, browse anime, IPTV, live sports, manga and K-drama, and open streams in a fast web player.";

const streamCategories = [
  {
    name: "Movies and TV Shows",
    description:
      "Search for movies and series, pick a result, and start playback from the stream player.",
    href: "/stream",
  },
  {
    name: "Anime",
    description:
      "Open the anime section directly when you want animated series and episodes.",
    href: "/stream/anime",
  },
  {
    name: "Live Sports",
    description:
      "Jump to live sports streams from the same navigation used by the main player.",
    href: "/stream/livesports",
  },
  {
    name: "IPTV",
    description:
      "Browse IPTV streams through the dedicated stream category route.",
    href: "/stream/iptv",
  },
  {
    name: "Manga and K-drama",
    description:
      "Use the Manga and K-drama shortcuts for regional and category-specific discovery.",
    href: "/stream/manga",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "Sync Play",
      url: siteUrl,
      description: "A web app for playing videos and streams with friends.",
    },
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: pageTitle,
      description: pageDescription,
      isPartOf: {
        "@id": `${siteUrl}/#website`,
      },
      breadcrumb: {
        "@id": `${pageUrl}#breadcrumb`,
      },
      mainEntity: {
        "@id": `${pageUrl}#streaming-app`,
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${pageUrl}#streaming-app`,
      name: "Sync Play Stream",
      applicationCategory: "EntertainmentApplication",
      operatingSystem: "Any",
      url: pageUrl,
      description: pageDescription,
      featureList: [
        "Movie and TV show search",
        "Anime stream navigation",
        "Live sports stream navigation",
        "IPTV stream navigation",
        "Latest movie and TV additions",
      ],
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Sync Play",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Stream",
          item: pageUrl,
        },
      ],
    },
    {
      "@type": "ItemList",
      "@id": `${pageUrl}#stream-categories`,
      name: "Sync Play Stream Categories",
      itemListElement: streamCategories.map((category, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}${category.href}`,
        name: category.name,
        description: category.description,
      })),
    },
  ],
};

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "/stream",
  },
  keywords: [
    "Sync Play Stream",
    "watch together stream",
    "online stream player",
    "movie stream search",
    "anime streaming",
    "IPTV stream",
    "live sports stream",
    "K-drama stream",
  ],
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/stream",
    siteName: "Sync Play",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function StreamPage() {
  return (
    <main className={styles.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <section className={styles.hero} aria-labelledby="stream-page-title">
        <Link href="/stream" className={styles.brandLink}>
          <h1 id="stream-page-title">Stream</h1>
        </Link>
        <StreamNavigation />
      </section>

      <section className={styles.playerSection} aria-label="Stream player">
        <IframeWrapper />
      </section>

      <section
        className={styles.categorySection}
        aria-labelledby="stream-categories"
      >
        <div className={styles.sectionHeader}>
          <h2 id="stream-categories">Streaming categories</h2>
          <p>
            Choose a focused section or use the search box above to find a movie
            or TV show by title.
          </p>
        </div>
        <div className={styles.categoryGrid}>
          {streamCategories.map((category) => (
            <Link
              href={category.href}
              className={styles.categoryCard}
              key={category.name}
            >
              <h3>{category.name}</h3>
              <p>{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.infoSection} aria-labelledby="stream-notes">
        <h2 id="stream-notes">Stream player notes</h2>
        <div className={styles.infoGrid}>
          <p>
            Sync Play Stream is designed for quick playback, title search,
            category navigation, and latest movie or TV additions in a browser.
          </p>
          <p>
            For a cleaner desktop experience, an ad blocker such as{" "}
            <Link
              href={
                "https://chromewebstore.google.com/detail/ublock-origin-lite/ddkjiahejlhfcafbddmgiahcphecmpfh"
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              uBlock
            </Link>
            {", or "}
            <Link
              href={
                "https://chromewebstore.google.com/detail/adblock-%E2%80%94-best-ad-blocker/gighmmpiobklfepjocnamgkkbiglidom"
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              Adblock.
            </Link>
          </p>
          <p>
            On mobile,{" "}
            <Link
              href={
                "https://play.google.com/store/apps/details?id=com.brave.browser"
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              Brave Browser
            </Link>{" "}
            can help reduce intrusive ads from third-party providers.
          </p>
          <p>
            Sync Play does not host files. It displays content from third-party
            providers, so legal or takedown issues should be taken up with the
            relevant provider.
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <Link
          href="https://github.com/Sourav9063/watchtogether"
          target="_blank"
          rel="noopener noreferrer"
        >
          View Sync Play on GitHub
        </Link>
      </footer>
    </main>
  );
}
