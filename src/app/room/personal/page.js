import styles from "../../page.module.css";
import ReactVideoPlayer from "@/components/reactPlayer/ReactPlayer";
import Link from "next/link";
import FirebaseVideoPlayerPersonal from "@/components/firebasePlayer/FirebasePlayerPersonal";
export default function Personal() {
  return (
    <>
      <main className={styles.main}>
        <Link href={"/"} style={{ textDecoration: "none" }}>
          <h1>Sync Play</h1>
        </Link>
        {/* {false ? <ReactVideoPlayer /> : <FirebaseVideoPlayerPersonal />} */}
        <FirebaseVideoPlayerPersonal />
      </main>
    </>
  );
}
