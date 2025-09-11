"use client";
import { useReactive } from "@/helper/hooks/useReactive";
import styles from "../page.module.css";
import { CardData } from "@/components/big-two/data/data";
import { useState } from "react";
import { useHorizontalScroll } from "@/helper/hooks/useHorizontalScroll";

export default function Personal() {
  const state = useReactive({ count: 1, card: "", cards: { count: 2 } });
  const state1 = useReactive(1);

  const [state2, setState] = useState({
    count: 1,
    card: "hello",
    cards: { count: 2 },
  });

  const ref = useHorizontalScroll();

  return (
    <>
      <main className={styles.main}>
        <p>{state.count}</p>
        <p>{state.card}</p>
        <p>{state.cards.index}</p>
        <h1>{state1.value}</h1>
        <div className={styles["cards"]} ref={ref}>
          {CardData.map((card, index) => {
            return (
              <button
                key={card.image}
                onClick={() => {
                  //useReactive state object
                  state.count = state.count + 1;
                  state.card = card.name;
                  state.cards.index = index;
                  // useReactive primary
                  state1.value = state1.value + 1;
                  //useState
                  setState((state) => {
                    return {
                      ...state,
                      count: state.count++,
                      card: card.name,
                      cards: {
                        index: index,
                        count: 10000,
                      },
                    };
                  });
                }}
              >
                {/* <p>{JSON.stringify(card)}</p> */}
                <img src={card.image} alt="" />
              </button>
            );
          })}
        </div>
        <p>{state2.count}</p>
        <p>{state2.card}</p>
        <p>{state2.cards.index}</p>
      </main>
    </>
  );
}
