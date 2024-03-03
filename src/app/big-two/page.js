import styles from "./page.module.css";
import Link from "next/link";
import IframeWrapper from "@/components/IframeWrapper";
import { cardsImage } from "@/components/big-two/assets";
import { CardData } from "@/components/big-two/data/data";
import { getCustomLink, randomIdWithTimeStamp } from "@/helper/customFunc";
export default function Personal() {
  return (
    <>
      <main className={styles.main}>
        <Link href={`big-two/${randomIdWithTimeStamp()}`}>create room</Link>
      </main>
    </>
  );
}
