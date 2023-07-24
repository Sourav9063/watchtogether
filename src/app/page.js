import Image from "next/image";
import styles from "./page.module.css";
import VideoPlayer from "@/components/videoPlayer/VideoPlayer";

export default function Home() {
  return (
    <main className={styles.main}>
      <VideoPlayer />
    </main>
  );
}
