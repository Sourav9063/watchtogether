"use client";
import { useProxyState } from "@/helper/hooks/useProxyState";
import styles from "../page.module.css";
import { useEffect, useState } from "react";

export default function Personal() {
  const state1 = useProxyState({ count: 1 });
  const state2 = useProxyState(state1.count * 2);
  state2.value = state1.count * 2;

  const [state3, setState3] = useState({
    count: 1,
  });
  const [state4, setState4] = useState(state3.count * 2);
  useEffect(() => {
    setState4(state3.count * 2);
    return () => {};
  }, [state3.count]);

  console.count("rerender");
  return (
    <>
      <main className={styles.main}>
        <div className={styles["cards"]}>
          <button
            onClick={() => {
              state1.count++;
            }}
          >
            useProxyState {state1.count}
          </button>
          <button
            onClick={() => {
              state2.value++;
            }}
          >
            useProxyState {state2.value}
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
