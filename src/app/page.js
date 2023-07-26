import Image from "next/image";
import styles from "./page.module.css";
import VideoPlayer from "@/components/videoPlayer/VideoPlayer";
import CustomLink from "@/components/customButtons/CustomLink";

export default function Home() {
  return (
    <main className={styles.main}>
      <CustomLink />
      <VideoPlayer />
    </main>
  );
}
