"use client";
import { useTmdbSearch } from "@/helper/hooks/useTmdbSearch";
import styles from "./tmdbSearch.module.css";
import { useStore } from "@/helper/hooks/useStore";
import { Stores } from "@/helper/CONSTANTS";
import { PasteHistory } from "@/components/tmdbSearch/ParseHistory";
import { useEffect, useRef } from "react";
import { useDebounce } from "@/helper/hooks/useDebounce";

export default function TmdbSearch() {
  const [query, setQuery] = useStore(Stores.query);
  const debounce = useDebounce(query, 2000);
  const isMounted = useRef(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      setQuery(q);
    }
  }, []);

  // useEffect(() => {
  //   if (!isMounted.current) {
  //     isMounted.current = true;
  //     return;
  //   }
  //   const url = new URL(window.location);
  //   if (debounce) {
  //     url.searchParams.set("q", debounce);
  //   } else {
  //     url.searchParams.delete("q");
  //   }
  //   window.history.pushState(null, null, url.toString());
  // }, [debounce]);

  const [isAnime, setIsAnime] = useStore(Stores.isAnime);
  const status = useTmdbSearch();
  return (
    <div id="search-pos" className={styles["search-wrapper"]}>
      <PasteHistory />
      <div className={`${styles["search"]} ${styles[""]} `}>
        <h1>Search</h1>
        <div className={styles["search-input-wrapper"]}>
          <input
            ref={inputRef}
            type="text"
            value={query || ""}
            onChange={(e) => setQuery(e.target.value)}
          />
          {!!query && (
            <button
              aria-label="Clear search"
              className={styles["clear-search"]}
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              <svg
                aria-hidden="true"
                fill="none"
                height="18"
                viewBox="0 0 24 24"
                width="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6 6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
          )}
        </div>
        <div>
          <label className={styles["anime"]} htmlFor="isAnime">
            <h1>Anime</h1>
            <input
              id="isAnime"
              type="checkbox"
              value={isAnime}
              onChange={(e) => setIsAnime(e.target.checked)}
            />
          </label>
        </div>
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
