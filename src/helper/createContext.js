"use client";

import {
  createContext as reactCreateContext,
  useContext as reactUseContext,
  useMemo,
  useReducer,
  useState,
} from "react";

function createBaseContext(name, errorMessage) {
  const Context = reactCreateContext(null);
  Context.displayName = name;

  const useCtx = () => {
    const context = reactUseContext(Context);
    if (context === null) throw new Error(errorMessage);
    return context;
  };

  return { Context, useCtx };
}

export function createDataContext(options = {}) {
  const {
    name = "DataContext",
    errorMessage = `use${name} must be used within a ${name}Provider`,
  } = options;
  const { Context, useCtx } = createBaseContext(name, errorMessage);

  const Provider = ({ children, value }) => (
    <Context.Provider value={value}>{children}</Context.Provider>
  );

  return [Provider, useCtx];
}

export function createStateContext(options = {}) {
  const {
    name = "StateContext",
    errorMessage = `use${name} must be used within a ${name}Provider`,
  } = options;
  const { Context, useCtx } = createBaseContext(name, errorMessage);

  const Provider = ({ children, value }) => {
    const [state, setState] = useState(() => value);
    const memoizedValue = useMemo(() => [state, setState], [state]);

    return (
      <Context.Provider value={memoizedValue}>{children}</Context.Provider>
    );
  };

  return [Provider, useCtx];
}

export function createReducerContext(reducer, options = {}) {
  const {
    name = "ReducerContext",
    errorMessage = `use${name} must be used within a ${name}Provider`,
  } = options;
  const { Context, useCtx } = createBaseContext(name, errorMessage);

  const Provider = ({ children, value }) => {
    const [state, dispatch] = useReducer(reducer, value, (arg) => arg);
    const memoizedValue = useMemo(() => [state, dispatch], [state]);

    return (
      <Context.Provider value={memoizedValue}>{children}</Context.Provider>
    );
  };

  return [Provider, useCtx];
}

export const ProviderComposer = ({ providers, children }) => {
  return (
    <>
      {providers.reduceRight((acc, { provider: Provider, props, key }, index) => {
        return (
          <Provider key={key ?? index} {...props}>
            {acc}
          </Provider>
        );
      }, children)}
    </>
  );
};
