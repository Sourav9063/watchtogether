'use client'; // This directive makes the component a Client Component

import React, { useEffect, useRef } from 'react';
import styles from './WebtorPlayer.module.css';

const WebtorPlayer = ({ magnetURI, width = '100%', height = '720px' }) => {
  const playerRef = useRef(null);

  useEffect(() => {
    if (playerRef.current && typeof window !== 'undefined') {
      // Ensure window.webtor exists before trying to use it
      // This assumes the webtor script loads a global 'webtor' object
      if (window.webtor) {
        window.webtor.push({
          id: playerRef.current.id,
          magnet: magnetURI,
          width: width,
          height: height,
          // Add other configurations as per webtor-io/embed-sdk-js documentation
        });
      } else {
        console.warn("Webtor SDK not found. Make sure the script is loaded.");
        // You might want to dynamically load the script here if it's not loaded globally
      }
    }
  }, [magnetURI, width, height]); // Re-run effect if these props change

  // Assign a unique ID to the player container
  const playerId = `webtor-player-${Math.random().toString(36).substr(2, 9)}`;

  return <div id={playerId} ref={playerRef} style={{ width, height }} className={styles.playerContainer} />;
};

export default WebtorPlayer;