'use client';

import React, { useEffect, useRef } from 'react';
import styles from './WebtorPlayer.module.css';

const WEBTOR_SDK_SRC =
  'https://cdn.jsdelivr.net/npm/@webtor/embed-sdk-js/dist/index.min.js';
let webtorSdkPromise = null;

function loadWebtorSdk() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.webtor?.push) return Promise.resolve();

  if (!webtorSdkPromise) {
    webtorSdkPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        `script[src="${WEBTOR_SDK_SRC}"]`,
      );

      window.webtor = window.webtor || [];

      if (existingScript) {
        existingScript.addEventListener('load', resolve, { once: true });
        existingScript.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = WEBTOR_SDK_SRC;
      script.async = true;
      script.charSet = 'utf-8';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  return webtorSdkPromise;
}

const WebtorPlayer = ({
  magnetURI,
  torrentUrl,
  fileIdx,
  file,
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

    let isCancelled = false;
    const playerElement = playerRef.current;
    playerElement.innerHTML = '';

    loadWebtorSdk()
      .then(() => {
        if (isCancelled) return;

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

        if (file) {
          config.file = file;
        }

        if (title) {
          config.title = title;
        }

        if (fileIdx !== undefined && fileIdx !== null && fileIdx !== '') {
          config.on = (event) => {
            if (event?.name !== 'TORRENT_FETCHED') return;

            const selectedFile = event.data?.files?.[Number(fileIdx)];
            const selectedPath = selectedFile?.path;

            if (selectedPath) {
              event.player?.open?.(selectedPath);
            }
          };
        }

        window.webtor.push(config);
      })
      .catch(() => {
        if (!isCancelled) {
          playerElement.innerHTML = '';
        }
      });

    return () => {
      isCancelled = true;
      playerElement.innerHTML = '';
    };
  }, [file, fileIdx, height, magnetURI, path, title, torrentUrl, width]);

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
