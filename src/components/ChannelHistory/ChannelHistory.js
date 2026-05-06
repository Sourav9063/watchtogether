import React from "react";
import { Constants } from "../../helper/CONSTANTS";
import styles from "./ChannelHistory.module.css";
import Channel from "@/components/Channel/Channel";
import { useDragScroll } from "@/helper/hooks/useDragScroll";

const ChannelHistory = ({ onChannelClick, history, handleClearHistory }) => {
  const ref = useDragScroll();

  if (history?.length === 0) {
    return <></>;
  }

  return (
    <div className={styles.historyContainer}>
      <div className={styles.header}>
        <h1>Watch History</h1>
        <button onClick={handleClearHistory} className={styles.clearButton}>
          Clear History
        </button>
      </div>
      <ul
        className={`${styles.historyList} hoverScrollbarX dragScrollX`}
        ref={ref}
      >
        {history.map((channel, index) => (
          <Channel
            key={channel.url + Constants.LocalStorageKey.CHANNEL_HISTORY + index}
            channel={channel}
            onClick={onChannelClick}
          />
        ))}
      </ul>
    </div>
  );
};

export default ChannelHistory;
