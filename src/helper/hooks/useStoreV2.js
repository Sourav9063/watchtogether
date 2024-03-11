"use client";
import { useCallback, useLayoutEffect, useSyncExternalStore } from "react";

export const mainStore = {};
const subscribers = {};
const serverInitState = {};

const get = (scope) => {
  return mainStore[scope];
};

const set = (value, scope) => {
  if (typeof value === "function") value = value(mainStore[scope]);
  if (
    typeof value === "object" &&
    value !== null &&
    Array.isArray(value) === false
  ) {
    mainStore[scope] = { ...mainStore[scope], ...value };
  } else {
    mainStore[scope] = value;
  }

  return subscribers[scope]?.forEach((callback) => callback());
};

const subscribe = (scope) => {
  return (callback) => {
    if (subscribers[scope]) {
      subscribers[scope].add(callback);
    } else {
      subscribers[scope] = new Set([callback]);
    }
    return () => subscribers[scope]?.delete(callback);
  };
};

// const useStoreSetup = () => {
//   const get = useCallback((scope) => {
//     return mainStore[scope];
//   }, []);

//   const set = useCallback((value, scope) => {
//     if (typeof value === "function") value = value(mainStore[scope]);
//     if (
//       typeof value === "object" &&
//       value !== null &&
//       Array.isArray(value) === false
//     ) {
//       mainStore[scope] = { ...mainStore[scope], ...value };
//     } else {
//       mainStore[scope] = value;
//     }

//     return subscribers[scope]?.forEach((callback) => callback());
//   }, []);

//   const subscribe = useCallback((scope) => {
//     return (callback) => {
//       if (subscribers[scope]) {
//         subscribers[scope].add(callback);
//       } else {
//         subscribers[scope] = new Set([callback]);
//       }
//       return () => subscribers[scope]?.delete(callback);
//     };
//   }, []);

//   return { get, set, subscribe, mainStore, subscribers };
// };

/**
 * uses a global object to store the state separated by scope.
 * @param {string} scope
 * @param {Object} initState
 * @param {Function} effect
 * @returns {Array}
 *
 * @example
 * const [state, setState, dispatch] = useStore("scope", {
 *  initState: { value: 0 },
 *  effect: (state) => {}
 * });
 *
 */
export const useStore = (scope, { initState, effect } = {}) => {
  if (!scope) throw new Error("useStore must be used with a scope");

  if (!mainStore[scope]) {
    mainStore[scope] = initState;
  }
  const dispatch = useCallback(
    async (action, payload) => {
      if (!action || !(action instanceof Function)) {
        return;
      }
      const newState = await action({
        payload,
        state: mainStore[scope],
        dispatch,
        setState: set,
      });
      if (newState !== undefined) {
        set(newState, scope);
      }
    },
    [scope]
  );
  useLayoutEffect(() => {
    if (mainStore[scope] && initState) {
      mainStore[scope] = { ...mainStore[scope], ...initState };
      // return [mainStore[scope], (value) => set(value, scope), dispatch];
    }
  }, [scope]);
  // const store = useStoreSetup(scope, initState);

  const state = useSyncExternalStore(
    subscribe(scope),
    () => {
      return get(scope);
    },
    (val) => {
      if (initState) {
        serverInitState[scope] = initState;
      }
      return serverInitState[scope] || val;
    }
  );

  useLayoutEffect(() => {
    effect && effect(state);
    return () => {};
  }, [state]);

  return [state, (value) => set(value, scope), dispatch];
};

// export const useInitStore = (scope, initState) => {
//   serverInitState[scope] = initState;
//   const store = useStoreSetup(scope);
//   if (!store) {
//     throw new Error("no initStore found");
//   }
//   store.set(initState, scope);
//   return initState;
// };

// export default function InitStore({ scope, initState }) {
//   useInitStore(scope, initState);
//   return <></>;
// }
