import styles from "./CustomLinkPage.module.css";
import VideoPlayer from "@/components/videoPlayer/VideoPlayer";
import CopyButton from "@/components/customButtons/CopyButton";
export default function CustomLinkPage() {
  return (
    <main className={styles.main}>
      <CopyButton></CopyButton>
      <VideoPlayer />
    </main>
  );
}
