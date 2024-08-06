"use client";
import React, { createContext, useContext, useMemo, useState } from "react";
const contexts = {};

export default function GlobalStore({ storeKey, value, children }) {
  const [state, setState] = useState(value);
  const Context = useMemo(() => {
    if (!contexts[storeKey]) {
      contexts[storeKey] = createContext(value);
    }
    return contexts[storeKey];
  }, [storeKey, value]);

  return (
    <Context.Provider value={{ state, setState }}>
      <div>{children}</div>
      {/*  div is necessary */}
    </Context.Provider>
  );
}

export const useGlobalStore = (key) => {
  const { state, setState } = useContext(contexts[key]);
  return [state, setState];
};
