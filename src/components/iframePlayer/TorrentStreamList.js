"use client";

import { useEffect } from "react";
import { useDragScroll } from "@/helper/hooks/useDragScroll";
import styles from "./TorrentStreamList.module.css";
import { useTorrent } from "./TorrentContext";

function removeTorrentioBrand(value) {
  return (value || "")
    .replace(/\btorrentio\b/gi, "")
    .replace(/[|:•-]\s*$/g, "")
    .replace(/^\s*[|:•-]\s*/g, "")
    .trim();
}

export default function TorrentStreamList() {
  const cardsRef = useDragScroll();
  const { pageKey, selectedStream, setSelectedStream, streams } =
    useTorrent();

  useEffect(() => {
    if (!cardsRef.current) return;

    cardsRef.current.scrollTo({
      left: 0,
      behavior: "smooth",
    });
  }, [cardsRef, pageKey]);

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
      {streams.map((stream) => {
        const nameLines = stream.name
          .split("\n")
          .map(removeTorrentioBrand)
          .filter(Boolean);
        const displayNameLines = nameLines.length > 0 ? nameLines : [stream.name];
        const [qualityLabel, ...releaseLines] = displayNameLines;
        const provider = removeTorrentioBrand(stream.provider);

        return (
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
            <strong className={styles.streamQuality}>
              {qualityLabel}
            </strong>
            {releaseLines.length > 0 && (
              <span className={styles.streamNameLines}>
                {releaseLines.map((line, lineIndex) => (
                  <span key={`${line}-${lineIndex}`}>{line}</span>
                ))}
              </span>
            )}
            <span className={styles.streamTitle}>{stream.displayTitle}</span>
            {stream.shouldShowFilename && (
              <span className={styles.streamFilename}>{stream.filename}</span>
            )}
            {(stream.peerCount || stream.size || provider) && (
              <span className={styles.streamStats}>
                <span className={styles.streamStatsPrimary}>
                  {stream.peerCount && <small>👤 {stream.peerCount}</small>}
                  {stream.size && <small>💾 {stream.size}</small>}
                </span>
                {provider && (
                  <span className={styles.streamStatsSource}>
                    <small>⚙️ {provider}</small>
                  </span>
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
