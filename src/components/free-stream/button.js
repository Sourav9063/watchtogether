"use client";

import { Stores } from "@/helper/CONSTANTS";
import { useStore } from "@/helper/hooks/useStore";
import React from "react";

export default function Button({ children }) {
  const [state, setState] = useStore(Stores.searchResults, {
    initState: { text: "hello" },
  });
  return (
    <div
      onClick={() => {
        setState((state) => {
          return { ...state, text: "bye" };
        });
      }}
    >
      {state.text}
    </div>
  );
}
