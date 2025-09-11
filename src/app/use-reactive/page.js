"use client";
import { useReactive } from "@/helper/hooks/useReactive";
import styles from "../page.module.css";
import { useEffect, useRef, useState } from "react";

export default function Personal() {
  const renderCount = useRef(0)

  const state1 = useReactive({ count: 1 });
  const state2 = useReactive(state1.count * 2);

  const [state3, setState3] = useState({
    count: 1,
  });
  const [state4, setState4] = useState(state3.count * 2);

  useEffect(() => {
    setState4(state3.count * 2);
    return () => {};
  }, [state3.count]);

  renderCount.current++;
  return (
    <>
      <main className={styles.main}>
        <div className={styles["cards"]}>
          <div>Render count {renderCount.current}</div>

          <button
            onClick={() => {
              state1.count++;
            }}
          >
            useReactive {state1.count}
          </button>
          <button
            onClick={() => {
              state2.value++;
            }}
          >
            useReactive {state2.value}
          </button>
          <button
            onClick={() => {
              setState3((state) => ({ ...state, count: state.count + 1 }));
            }}
          >
            useState {state3.count}
          </button>
          <button
            onClick={() => {
              setState4((state) => {
                return state + 1;
              });
            }}
          >
            useState {state4}
          </button>
        </div>
      </main>
    </>
  );
}
