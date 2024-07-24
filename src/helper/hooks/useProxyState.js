import { useState } from "react";
export const useProxyState = (initialState = {}) => {
  if (typeof initialState != "object") {
    initialState = { value: initialState };
  }
  const [state, setState] = useState(initialState);
  state.setState = setState;
  const handler = {
    set(_, prop, value) {
      setState((state) => {
        return { ...state, [prop]: value };
      });
      return Reflect.set(...arguments);
    },
  };
  const stateProxy = new Proxy(state, handler);
  return stateProxy;
};
