import FirebaseVideoPlayer from "@/components/firebasePlayer/FirebasePlayer";
import styles from "./page.module.css";
import ReactVideoPlayer from "@/components/reactPlayer/ReactPlayer";
import Link from "next/link";
import ServerComponentWrapper from "@/components/serverComponentWrapper/ServerComponentWrapper";
export default function Home() {
  return (
    <>
      <main className={styles.main}>
        <Link href={"/"} style={{ textDecoration: "none" }}>
          <h1>Sync Play</h1>
        </Link>
        <Link
          href={"/stream"}
          style={{
            position: "absolute",
            left: "1rem",
            top: "1rem",
          }}
        >
          <p>Free Stream</p>
        </Link>
        <Link
          href={"/live"}
          style={{
            position: "absolute",
            left: "1rem",
            top: "2.2rem",
          }}
        >
          <p>Live</p>
        </Link>
        {/* {false ? <ReactVideoPlayer /> : <FirebaseVideoPlayer />} */}
        <ServerComponentWrapper>
          <FirebaseVideoPlayer />
        </ServerComponentWrapper>
      </main>
    </>
  );
}
