import React, { useState, useRef } from "react";
import { addValueLocalStorageArray } from "../../helper/functions/localStorageFn";
import { Constants } from "../../helper/CONSTANTS";
import ReactPlayer from "react-player";
import styles from "./VideoOverlayPlayer.module.css";

const PlayButton = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="white"
    className={styles.playIcon}
  >
    <path d="M8 5v14l11-7z" />
    <path d="M0 0h24v24H0z" fill="none" />
  </svg>
);

const VideoOverlayPlayer = ({ currentChannel, setHistory, ...rest }) => {
  const [isPaused, setIsPaused] = useState(true);
  const playerRef = useRef(null);

  const handlePlayPause = () => {
    setIsPaused(!isPaused);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handlePlay = () => {
    setIsPaused(false);
    const history = addValueLocalStorageArray({
      key: Constants.LocalStorageKey.CHANNEL_HISTORY,
      value: currentChannel,
    });
    setHistory(history);
  };

  return (
    <div className={styles.playerWrapper}>
      <ReactPlayer
        className={styles.reactPlayer}
        id="live-player"
        ref={playerRef}
        url={currentChannel.url}
        playing={!isPaused}
        onPause={handlePause}
        onPlay={handlePlay}
        width="100%"
        height="100%"
        controls={true}
        config={{
          file: {
            forceHLS: true,
          },
        }}
      />
      {isPaused && (
        <div className={styles.overlay} onClick={handlePlayPause}>
          <div className={styles.playButtonContainer}>
            <PlayButton />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoOverlayPlayer;
