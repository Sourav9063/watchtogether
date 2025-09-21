'use client'; // This directive makes the component a Client Component

import React, { useEffect, useRef, useState } from 'react';
import styles from './WebtorPlayer.module.css';

const WebtorPlayer = ({ magnetURI, width = '100%', height = '720px' }) => {
  const playerRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(null);

  useEffect(() => {
    if (playerRef.current && typeof window !== 'undefined') {
      // This assumes the webtor script loads a global 'webtor' object
      if (window.webtor) {
        window.webtor.push({
          id: playerRef.current.id,
          magnet: magnetURI,
          width: width,
          height: height,
          on: {
            torrent: 'ready',
            function(webtor) {
              console.log(webtor.files)
              setFiles(webtor.files);
              if (webtor.files.length > 0) {
                setSelectedFileIndex(0); // Select the first file by default
                webtor.selectFile(webtor.files[0]);
              }
            },
            play: 'file',
            function(webtor, file) {
              // Handle play event if needed
            }
          }
        });
      } else {
        console.warn("Webtor SDK not found. Make sure the script is loaded.");
        // You might want to dynamically load the script here if it's not loaded globally
      }
    }
  }, [magnetURI, width, height]); // Re-run effect if these props change

  const handleFileSelect = (file, index) => {
    setSelectedFileIndex(index);
    if (window.webtor && playerRef.current) {
      window.webtor.selectFile(file);
    }
  };

  // Assign a unique ID to the player container
  const playerId = `webtor-player-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={styles.webtorContainer}>
      <div id={playerId} ref={playerRef} style={{ width, height }} className={styles.playerContainer} />
      {files.length > 0 && (
        <div className={styles.fileList}>
          <h3>Files:</h3>
          <ul>
            {files.map((file, index) => (
              <li
                key={index}
                onClick={() => handleFileSelect(file, index)}
                className={index === selectedFileIndex ? styles.selectedFile : ''}
              >
                {file.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WebtorPlayer;