import Link from "next/link";
import navStyles from "./StreamNavigation.module.css";

export default function StreamNavigation() {
  return (
    <nav className={navStyles.nav}>
      <Link href="/stream">Home</Link>
      <Link href="/torrent">Torrent</Link>
      <Link href="/stream/anime">Anime</Link>
      <Link href="/stream/livesports">Live Sports</Link>
      <Link href="/stream/iptv">IPTV</Link>
      <Link href="/stream/manga">Manga</Link>
      <Link href="/stream/kdrama">Kdrama</Link>
    </nav>
  );
}