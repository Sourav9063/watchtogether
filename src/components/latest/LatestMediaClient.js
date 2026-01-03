"use client";
import TmdbCard from "@/components/TmdbSearchResults/TmdbCard";
import { useStore } from "@/helper/hooks/useStore";
import React from "react";
import { Stores } from "@/helper/CONSTANTS";
import styles from "./LatestMedia.module.css";
import { useHorizontalScroll } from "@/helper/hooks/useHorizontalScroll";

export default function LatestMediaClient({ data, type }) {
  const [, setSearchResults] = useStore(Stores.searchResults);
  const [, setIframeUrl] = useStore(Stores.iframeUrl);
  const ref = useHorizontalScroll();
  return (
    <div className={styles["cards"]} ref={ref}>
      {data?.map((item,index) => {
        if (!item.id) return;
        return (
          <TmdbCard
            key={item.id + item.title + type+index}
            details={item}
            showType={false}
            setIframeUrl={setIframeUrl}
            setSearchResults={setSearchResults}
          />
        );
      })}
    </div>
  );
}
