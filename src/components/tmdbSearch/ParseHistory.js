import React, { useState, useCallback } from "react";
import styles from "./tmdbSearch.module.css";
import { useStore } from "@/helper/hooks/useStore";
import { Constants, Stores } from "@/helper/CONSTANTS";
import {
  addValueLocalStorageArray,
  addValueLocalStorageObject,
  getLocalStorage,
} from "@/helper/functions/localStorageFn";
export function PasteHistory() {
  const [historyJson, setHistoryJson] = useState("");
  const [isValidJson, setIsValidJson] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [btnTxt, setBtnTxt] = useState("Copy History");
  const autoFocusFn = useCallback(
    (element) => (element ? element.focus() : null),
    []
  );

  const [, setSearchResults] = useStore(Stores.searchResults);
  return (
    <div className={` ${styles["paste"]} `}>
      <h1
        className={`${styles["drop-down"]} `}
        onClick={() => setShowInput((state) => !state)}
      >
        History
        <span
          className={`${styles["arrow"]} ${showInput ? styles["open"] : ""} `}
        ></span>
      </h1>
      {showInput && (
        <>
          {getLocalStorage({
            key: Constants.LocalStorageKey.WATCH_HISTORY,
            emptyReturn: null,
          }) && (
            <div className={styles["copy-history-section"]}>
              <button
                className={`${styles["copy-history"]} ${styles[""]} `}
                onClick={() => {
                  const exportJSON = {
                    [Constants.LocalStorageKey.WATCH_HISTORY]: getLocalStorage({
                      key: Constants.LocalStorageKey.WATCH_HISTORY,
                      emptyReturn: [],
                    }),
                    [Constants.LocalStorageKey.TV_DATA]: getLocalStorage({
                      key: Constants.LocalStorageKey.TV_DATA,
                      emptyReturn: {},
                    }),
                  };
                  navigator.clipboard.writeText(JSON.stringify(exportJSON));
                  setBtnTxt("Copied");
                  setTimeout(() => {
                    setBtnTxt("Copy History");
                  }, 5000);
                }}
              >
                {btnTxt}
              </button>
              <h3>Or</h3>
            </div>
          )}

          <form
            className={styles["paste-form"]}
            action=""
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              ref={autoFocusFn}
              autofocus={true}
              placeholder="Paste JSON"
              className={styles["paste-input"]}
              type="text"
              value={historyJson}
              onChange={(e) => {
                const value = e.target.value;
                setHistoryJson(value);
                try {
                  JSON.parse(value);
                  setIsValidJson(true);
                } catch (error) {
                  setIsValidJson(false);
                }
              }}
            />
            <button
              type="submit"
              onClick={() => {
                if (!isValidJson) {
                  setShowInput(false);
                  return;
                }
                let parsedJson = {};
                try {
                  parsedJson = JSON.parse(historyJson);
                  addValueLocalStorageArray({
                    key: Constants.LocalStorageKey.WATCH_HISTORY,
                    values: parsedJson[Constants.LocalStorageKey.WATCH_HISTORY],
                  });
                  addValueLocalStorageObject({
                    key: Constants.LocalStorageKey.TV_DATA,
                    values: parsedJson[Constants.LocalStorageKey.TV_DATA],
                  });
                  setSearchResults((state) => {
                    if (state.type == "HISTORY") {
                      return {
                        ...state,
                        value: getLocalStorage({
                          key: Constants.LocalStorageKey.WATCH_HISTORY,
                          emptyReturn: [],
                        }),
                      };
                    }
                    return state;
                  });
                  setHistoryJson("");
                  setIsValidJson(false);
                  setShowInput(false);
                } catch (error) {
                  console.log(error);
                }
              }}
            >
              {isValidJson ? " Save" : "Cancel"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
