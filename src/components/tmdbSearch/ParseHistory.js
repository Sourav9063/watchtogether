import React, { useState, useCallback } from "react";
import styles from "./tmdbSearch.module.css";
import { useIframeUrl } from "../Provider/IframeDataProvider";
import config from "@/config";
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
  const autoFocusFn = useCallback(
    (element) => (element ? element.focus() : null),
    []
  );

  const [, setSearchResults] = useStore(Stores.searchResults);
  return (
    <div className={`${styles["search"]} ${styles["paste"]} `}>
      {!showInput && (
        <button onClick={() => setShowInput((state) => !state)}>
          Paste History
        </button>
      )}
      {showInput && (
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
      )}
    </div>
  );
}
