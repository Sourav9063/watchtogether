"use client";
import React from "react";
import { useQuery, useSearchResults } from "../Provider/IframeDataProvider";
import TmdbCard from "./TmdbCard";
import styles from "./TmdbSearchResults.module.css";

export default function TmdbSearchResults() {
  const [searchResults] = useSearchResults();
  const [query] = useQuery();

  if (!searchResults)
    return (
      <div
        className={`${styles["search-result-wrapper"]} ${styles[""]} `}
      ></div>
    );
  return (
    <div className={`${styles["search-result-wrapper"]} ${styles[""]} `}>
      {query && (
        <>
          {searchResults.length > 0 ? (
            <h1>Search Results</h1>
          ) : (
            <h1>Found Nothing</h1>
          )}
        </>
      )}
      <div className={`${styles["cards"]} ${styles[""]} `}>
        {searchResults.map((result) => (
          <TmdbCard key={result?.id} details={result} />
        ))}
      </div>
    </div>
  );
}
