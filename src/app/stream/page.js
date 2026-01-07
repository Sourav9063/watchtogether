import styles from "./page.module.css";
import Link from "next/link";
import IframeWrapper from "@/components/IframeWrapper";
import BackLight from "@/components/backLigth/BackLight";
import StreamNavigation from "@/components/stream/StreamNavigation";

export default function Personal() {
  return (
    <>
      <main className={styles.main}>
        {/* <BackLight /> */}
        <Link href={"/stream"} style={{ textDecoration: "none" }}>
          <h1>Stream</h1>
        </Link>
        <StreamNavigation />
        <IframeWrapper />
        <p
          style={{
            marginTop: "auto",
            marginTop: "6rem",
            textAlign: "center",
          }}
        >
          Highly suggested to use an Ad blocker like{" "}
          <Link
            href={
              "https://chromewebstore.google.com/detail/ublock-origin-lite/ddkjiahejlhfcafbddmgiahcphecmpfh"
            }
            target="_blank"
          >
            uBlock
          </Link>
          {", or "}
          <Link
            href={
              "https://chromewebstore.google.com/detail/adblock-%E2%80%94-best-ad-blocker/gighmmpiobklfepjocnamgkkbiglidom"
            }
            target="_blank"
          >
            Adblock.
          </Link>
        </p>
        <p style={{ margin: "1rem" }}>
          For mobile use{" "}
          <Link
            href={
              "https://play.google.com/store/apps/details?id=com.brave.browser"
            }
            target="_blank"
          >
            Brave Browser
          </Link>
        </p>
        <Link
          href={"https://github.com/Sourav9063/watchtogether"}
          target="_blank"
          style={{ textDecoration: "none", marginBottom: "1.5rem" }}
        >
          Please give it a star!⭐
        </Link>
        <p>
          Sync Play does not host any files itself but instead only display&apos;s
          content from 3rd party providers. Legal issues should be taken up with
          them.
        </p>
      </main>
    </>
  );
}
