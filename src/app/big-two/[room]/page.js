import styles from "../page.module.css";
import { CardData } from "@/components/big-two/data/data";
export default async function Personal() {
  // const distributeCards = (cards) => {
  //   const players = 4;
  //   const cardsPerPlayer = 13;
  //   const distributedCards = [];
  //   for (let i = 0; i < players; i++) {
  //     distributedCards.push(
  //       cards.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer)
  //     );
  //   }
  //   return distributedCards;
  // };

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
