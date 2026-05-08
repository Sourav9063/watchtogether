import FloatingNav from "@/components/stream/FloatingNav";
import styles from "./page.module.css";
import TorrentWorkspace from "./TorrentWorkspace";

export const metadata = {
  title: "Torrent Stream - Watch Together",
  description: "Stream torrent magnets in Watch Together.",
};

export default function TorrentPage() {
  return (
    <main className={styles.page}>
      <FloatingNav />

      <TorrentWorkspace />
    </main>
  );
}
