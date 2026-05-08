'use client';

import React, { useEffect, useRef } from 'react';
import styles from './WebtorPlayer.module.css';

const WebtorPlayer = ({
  magnetURI,
  torrentUrl,
  path,
  title,
  width = '100%',
  height = '720px',
}) => {
  const playerRef = useRef(null);
  const playerIdRef = useRef(
    `webtor-player-${Math.random().toString(36).slice(2, 11)}`,
  );

  useEffect(() => {
    if (!playerRef.current || typeof window === 'undefined') return;
    if (!magnetURI && !torrentUrl) return;

    const playerElement = playerRef.current;
    playerElement.innerHTML = '';
    window.webtor = window.webtor || [];

    const config = {
      id: playerIdRef.current,
      width,
      height,
      controls: true,
    };

    if (magnetURI) {
      config.magnet = magnetURI;
    }

    if (torrentUrl) {
      config.torrentUrl = torrentUrl;
    }

    if (path) {
      config.path = path;
    }

    if (title) {
      config.title = title;
    }

    window.webtor.push(config);

    return () => {
      playerElement.innerHTML = '';
    };
  }, [height, magnetURI, path, title, torrentUrl, width]);

  return (
    <div className={styles.webtorContainer}>
      <div
        id={playerIdRef.current}
        ref={playerRef}
        style={{ width, height }}
        className={styles.playerContainer}
      />
    </div>
  );
};

export default WebtorPlayer;
