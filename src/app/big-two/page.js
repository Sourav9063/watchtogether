import styles from "./page.module.css";
import Link from "next/link";
import IframeWrapper from "@/components/IframeWrapper";
import { cardsImage } from "@/components/big-two/assets";
import { CardData } from "@/components/big-two/data/data";
export default function Personal() {
  return (
    <>
      <main className={styles.main}>
        {CardData.map((card) => {
          return (
            <div key={card.image}>
              <p>{JSON.stringify(card)}</p>
              <img src={card.image} alt="" />
            </div>
          );
        })}
      </main>
    </>
  );
}
