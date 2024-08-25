"use client";
import { useGlobalStore } from "@/components/Provider/Store";
import { useDelayUnmount } from "@/helper/hooks/useDelayUnmount";
import styles from "./child.module.css";
import React, { useState } from "react";

export default function Child() {
  const [state] = useGlobalStore("GLOBAL");
  return <h1>GLOBAL:{state.count}</h1>;
}

export function Child2() {
  const [state] = useGlobalStore("ANOTHER");
  return <h1>ANOTHER:{state.another}</h1>;
}
export function Child3() {
  const [state] = useGlobalStore("ANOTHER");
  const [state2] = useGlobalStore("GLOBAL");
  return (
    <>
      <h1>GLOBAL:{state2.count}</h1>
      <h1>ANOTHER:{state.another}</h1>
    </>
  );
}

export function Button() {
  const [state, setState] = useGlobalStore("GLOBAL");
  return (
    <button
      onClick={() => {
        setState((state) => ({ ...state, count: state.count + 1 }));
      }}
    >
      {state.count}
    </button>
  );
}
export function Button2() {
  const [show, setShow] = useState(true);
  const [shouldMount, getAnimation] = useDelayUnmount(show, 500);
  return (
    <div>
      {shouldMount && (
        <h1 className={getAnimation("header", styles)}>Header</h1>
      )}
      <button
        onClick={() => {
          setShow((state) => !state);
        }}
      >
        {show ? "Show" : "Hide"}
      </button>
    </div>
  );
}

export const H1 = () => {
  return (
    <>
      <h1>Hhi1</h1>
      <Child />
    </>
  );
};
