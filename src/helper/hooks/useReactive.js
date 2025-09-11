import { useState } from "react";
export const useReactive = (initialState = {}) => {
  if (typeof initialState != "object") {
    initialState = { value: initialState };
  }
  const [state, setState] = useState(initialState);
  state.setState = setState;
  const handler = {
    set(_, prop, value) {
      if (value !== state[prop]) {
        setState((state) => {
          return { ...state, [prop]: value };
        });
      }
      return Reflect.set(...arguments);
    },
  };
  const stateProxy = new Proxy(state, handler);
  return stateProxy;
};
