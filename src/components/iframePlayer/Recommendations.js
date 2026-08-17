"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import TmdbCard from "../TmdbSearchResults/TmdbCard";
import styles from "./iframePlayer.module.css";
import { useStore } from "@/helper/hooks/useStore";
import { Stores } from "@/helper/CONSTANTS";
import { useDragScroll } from "@/helper/hooks/useDragScroll";
import { getRecommendationsAction } from "@/action/tmdb";

const recommendationsCache = new Map();

export default function Recommendations() {
  const [iframeUrl, setIframeUrl] = useStore(Stores.iframeUrl);
  const [, setSearchResults] = useStore(Stores.searchResults);
  const [recommendations, setRecommendations] = useState([]);
  const ref = useDragScroll();
  const { type, id } = iframeUrl || {};

  useEffect(() => {
    if (!type || !id) {
      setRecommendations([]);
      return;
    }

    const cacheKey = `${type}-${id}`;
    const cached = recommendationsCache.get(cacheKey);

    if (cached) {
      setRecommendations(cached);
      return;
    }

    let isActive = true;

    getRecommendationsAction(type, id).then((result) => {
      const results = result.success ? result.data || [] : [];

      recommendationsCache.set(cacheKey, results);

      if (isActive) {
        setRecommendations(results);
      }
    });

    return () => {
      isActive = false;
    };
  }, [id, type]);

  // A new title (or freshly loaded list) starts from the first card instead of
  // keeping the previous row's scroll offset.
  useLayoutEffect(() => {
    ref.current?.scrollTo({ left: 0, behavior: "auto" });
  }, [recommendations, ref]);

  if (!recommendations.length) return null;

  return (
    <div className={styles.recommendations}>
      <h1 className={styles.recommendationsTitle}>Recommended</h1>
      <div
        className={`${styles.recommendationsCards} hoverScrollbarX dragScrollX`}
        ref={ref}
      >
        {recommendations.map((result) => (
          <TmdbCard
            key={result?.id}
            details={result}
            setSearchResults={setSearchResults}
            setIframeUrl={setIframeUrl}
          />
        ))}
      </div>
    </div>
  );
}
