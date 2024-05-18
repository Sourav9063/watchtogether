"use client";
import TmdbCard from "@/components/TmdbSearchResults/TmdbCard";
import { useStore } from "@/helper/hooks/useStore";
import React from "react";
import { Stores } from "@/helper/CONSTANTS";
import styles from "./LatestMedia.module.css";

export default function LatestMediaClient({ data }) {
  const [, setSearchResults] = useStore(Stores.searchResults);
  const [, setIframeUrl] = useStore(Stores.iframeUrl);
  return (
    <div className={styles["cards"]}>
      {data.map((item) => {
        return (
          <TmdbCard
            key={item.id}
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
