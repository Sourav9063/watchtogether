"use client";
import React, { useEffect, useRef } from "react";
import { useQuery, useSearchResults } from "../Provider/IframeDataProvider";
import TmdbCard from "./TmdbCard";
import styles from "./TmdbSearchResults.module.css";
import { useStore } from "@/helper/hooks/useStore";
import { Constants, Stores } from "@/helper/CONSTANTS";
import { getLocalStorage } from "@/helper/functions/localStorageFn";

export default function TmdbSearchResults() {
  const [searchResults, setSearchResults] = useStore(Stores.searchResults);
  const [, setIframeUrl] = useStore(Stores.iframeUrl);

  useEffect(() => {
    if (!!searchResults.value && searchResults.type == "SEARCH") {
      document
        .getElementById("search-pos")
        ?.scrollIntoView({ behavior: "smooth" });
    }

    return () => {};
  }, [searchResults.value]);

  if (!searchResults.value)
    return (
      <div
        className={`${styles["search-result-wrapper"]} ${styles[""]} `}
      ></div>
    );
  return (
    <div className={`${styles["search-result-wrapper"]} ${styles[""]} `}>
      {searchResults.type == "SEARCH" && (
        <>
          {searchResults.value.length > 0 ? (
            <h1>Search Results</h1>
          ) : (
            <h1>Found Nothing</h1>
          )}
        </>
      )}
      {searchResults.type == "HISTORY" && searchResults.value?.length > 0 && (
        <div className={styles["history"]}>
          <h1>Watch History</h1>
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
            }}
          >
            Copy History
          </button>
        </div>
      )}
      <div className={`${styles["cards"]} ${styles[""]} `}>
        {searchResults.value.map((result) => (
          <TmdbCard
            key={result?.id}
            details={result}
            cardType={searchResults.type}
            setSearchResults={setSearchResults}
            setIframeUrl={setIframeUrl}
          />
        ))}
      </div>
    </div>
  );
}
