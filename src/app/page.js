import FirebaseVideoPlayer from "@/components/firebasePlayer/FirebasePlayer";
import styles from "./page.module.css";
import ReactVideoPlayer from "@/components/reactPlayer/ReactPlayer";
import Link from "next/link";
export default function Home() {
  return (
    <>
      <main className={styles.main}>
        <Link href={"/"} style={{ textDecoration: "none" }}>
          <h1>Sync Play</h1>
        </Link>
        <Link
          href={"/free-stream"}
          style={{
            position: "absolute",
            left: "1rem",
            top: "1rem",
          }}
        >
          <p>Free Stream</p>
        </Link>
        {false ? <ReactVideoPlayer /> : <FirebaseVideoPlayer />}
      </main>
    </>
  );
}
