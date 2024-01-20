"use client";
import React from "react";
import { useSearchResults } from "../Provider/IframeDataProvider";
import TmdbCard from "./TmdbCard";
import styles from "./TmdbSearchResults.module.css";

export default function TmdbSearchResults() {
  const [searchResults] = useSearchResults();
  if (!searchResults) return null;
  return (
    <div className={`${styles["search-result-wrapper"]} ${styles[""]} `}>
      <h1>Search Results</h1>
      <div className={`${styles["cards"]} ${styles[""]} `}>
        {searchResults.map((result) => (
          <TmdbCard key={result?.id} details={result} />
        ))}
      </div>
    </div>
  );
}
