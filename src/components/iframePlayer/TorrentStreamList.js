"use client";

import { useEffect, useState } from "react";
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
  const [copiedStreamId, setCopiedStreamId] = useState("");
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

  async function handleCopyMagnet(event, stream) {
    event.preventDefault();
    event.stopPropagation();

    if (!stream.magnetURI) return;

    try {
      await navigator.clipboard.writeText(stream.magnetURI);
      setCopiedStreamId(stream.id);
      setTimeout(() => {
        setCopiedStreamId((currentId) =>
          currentId === stream.id ? "" : currentId,
        );
      }, 1500);
    } catch (error) {
      console.error("Failed to copy magnet link", error);
    }
  }

  function handleCopyMagnetKeyDown(event, stream) {
    if (event.key !== "Enter" && event.key !== " ") return;

    handleCopyMagnet(event, stream);
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
          <div
            className={`${styles.streamCard} ${
              selectedStream?.id === stream.id ? styles.streamCardActive : ""
            }`}
            key={stream.id}
          >
            {stream.magnetURI && (
              <div
                aria-label={`Copy magnet link for ${stream.displayTitle}`}
                className={styles.copyMagnetButton}
                draggable={false}
                onClick={(event) => handleCopyMagnet(event, stream)}
                onDragStart={(event) => event.preventDefault()}
                onKeyDown={(event) => handleCopyMagnetKeyDown(event, stream)}
                onMouseDown={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                role="button"
                tabIndex={0}
                title={
                  copiedStreamId === stream.id
                    ? "Magnet link copied"
                    : "Copy magnet link"
                }
              >
                {copiedStreamId === stream.id ? (
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.3 5.7a1 1 0 0 1 0 1.4l-10 10a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.4l4.3 4.29 9.3-9.29a1 1 0 0 1 1.4 0Z" />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-1v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3h1V7Zm2 1h3a3 3 0 0 1 3 3v3h1a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v1Zm-3 2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H7Z" />
                  </svg>
                )}
              </div>
            )}
            <button
              className={styles.streamCardContent}
              draggable={false}
              onClick={() => handleSelectStream(stream)}
              onDragStart={(event) => event.preventDefault()}
              type="button"
            >
              <strong className={styles.streamQuality}>{qualityLabel}</strong>
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
          </div>
        );
      })}
    </div>
  );
}
