"use client";
import React, { useEffect, useRef } from "react";
import { useQuery, useSearchResults } from "../Provider/IframeDataProvider";
import TmdbCard from "./TmdbCard";
import styles from "./TmdbSearchResults.module.css";

export default function TmdbSearchResults() {
  const [searchResults, setSearchResults] = useSearchResults();
  const [query] = useQuery();

  useEffect(() => {
    if (!!searchResults.value) {
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
      {query && searchResults.type == "SEARCH" && (
        <>
          {searchResults.value.length > 0 ? (
            <h1>Search Results</h1>
          ) : (
            <h1>Found Nothing</h1>
          )}
        </>
      )}
      {searchResults.type == "HISTORY" && searchResults.value?.length > 0 && (
        <h1>Watch History</h1>
      )}
      <div className={`${styles["cards"]} ${styles[""]} `}>
        {searchResults.value.map((result) => (
          <TmdbCard
            key={result?.id}
            details={result}
            cardType={searchResults.type}
            setSearchResults={setSearchResults}
          />
        ))}
      </div>
    </div>
  );
}
