import FirebaseVideoPlayer from "@/components/firebasePlayer/FirebasePlayer";
import styles from "./page.module.css";
import ReactVideoPlayer from "@/components/reactPlayer/ReactPlayer";

export default function Home() {
  return (
    <>
      <main className={styles.main}>
        {false ? <ReactVideoPlayer /> : <FirebaseVideoPlayer />}
      </main>
    </>
  );
}
