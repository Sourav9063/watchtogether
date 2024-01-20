"use client";
import React from "react";
import { useQuery } from "../Provider/IframeDataProvider";
import { useTmdbSearch } from "@/helper/hooks/useTmdbSearch";
import styles from "./tmdbSearch.module.css";

export default function TmdbSearch() {
  const [query, setQuery] = useQuery();
  const status = useTmdbSearch();
  return (
    <div className={styles["search-wrapper"]}>
      <div className={`${styles["search"]} ${styles[""]} `}>
        <h1>Search</h1>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className={styles["status"]}>
        {status == "loading"
          ? "Loading..."
          : status == "error"
          ? "Something went wrong"
          : null}
      </div>
    </div>
  );
}
