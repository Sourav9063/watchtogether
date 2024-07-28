import styles from "./page.module.css";
import Link from "next/link";
import { randomIdWithTimeStamp } from "@/helper/customFunc";
export default function Personal() {
  return (
    <>
      <main className={styles.main}>
        <Link href={`big-two/${randomIdWithTimeStamp()}`}>create room</Link>
      </main>
    </>
  );
}
