import styles from "../page.module.css";
import Link from "next/link";
import IframeWrapper from "@/components/IframeWrapper";
export default function Personal() {
  return (
    <>
      <main className={styles.main}>
        <Link href={"/free-stream"} style={{ textDecoration: "none" }}>
          <h1>Free Stream</h1>
        </Link>
        <IframeWrapper />
      </main>
    </>
  );
}
