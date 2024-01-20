"use client";
import React from "react";
import { useQuery } from "../Provider/IframeDataProvider";
import { useTmdbSearch } from "@/helper/hooks/useTmdbSearch";
import styles from "./tmdbSearch.module.css";

export default function TmdbSearch() {
  const [query, setQuery] = useQuery();
  useTmdbSearch();
  return (
    <div className={`${styles["search"]} ${styles[""]} `}>
      <h1>Search</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}
