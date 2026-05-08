"use client";

import { useEffect } from "react";
import { useDragScroll } from "@/helper/hooks/useDragScroll";
import styles from "./TorrentStreamList.module.css";
import { useTorrent } from "./TorrentContext";

export default function TorrentStreamList() {
  const cardsRef = useDragScroll();
  const { resolvedId, selectedStream, setSelectedStream, streams } =
    useTorrent();

  useEffect(() => {
    if (!cardsRef.current) return;

    cardsRef.current.scrollTo({
      left: 0,
      behavior: "smooth",
    });
  }, [cardsRef, resolvedId]);

  function handleSelectStream(stream) {
    setSelectedStream(stream);
    document
      .querySelector("#iframe-player")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div
      className={`${styles.streamCards} hoverScrollbarX dragScrollX`}
      ref={cardsRef}
    >
      {streams.map((stream) => (
        <button
          className={`${styles.streamCard} ${
            selectedStream?.id === stream.id ? styles.streamCardActive : ""
          }`}
          draggable={false}
          key={stream.id}
          onClick={() => handleSelectStream(stream)}
          onDragStart={(event) => event.preventDefault()}
          type="button"
        >
          <strong>
            {stream.name.split("\n").map((line) => (
              <span key={line}>{line}</span>
            ))}
          </strong>
          <span className={styles.streamTitle}>{stream.displayTitle}</span>
          {stream.shouldShowFilename && (
            <span className={styles.streamFilename}>{stream.filename}</span>
          )}
          {(stream.peerCount || stream.size || stream.provider) && (
            <span className={styles.streamStats}>
              <span className={styles.streamStatsPrimary}>
                {stream.peerCount && <small>👤 {stream.peerCount}</small>}
                {stream.size && <small>💾 {stream.size}</small>}
              </span>
              {stream.provider && (
                <span className={styles.streamStatsSource}>
                  <small>⚙️ {stream.provider}</small>
                </span>
              )}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
