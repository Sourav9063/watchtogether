import React from "react";
import styles from "./Channel.module.css";

const Channel = ({ channel, onClick }) => {
  return (
    <li className={styles.channelItem} onClick={() => onClick(channel)}>
      {channel.logo && (
        <img
          src={channel.logo}
          alt={`${channel.name} logo`}
          // className={styles.channelLogo}
          className={`${styles["channelLogo"]} back-light`}
        />
      )}
      <div className={styles.channelInfo}>
        <p className={styles.channelGroup}>{channel.group}</p>
        <h2 className={styles.channelName}>{channel.name}</h2>
      </div>
      {/* The URL is not displayed as per feedback */}
    </li>
  );
};

export default Channel;
