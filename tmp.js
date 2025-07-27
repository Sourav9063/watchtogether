
"use client"
import React, { useState, useEffect, useRef } from 'react';
// Use dynamic import for client-side rendering
// This ensures webtor is only loaded on the client side
// and avoids issues with server-side rendering (SSR)
import { initWebtor, playWebtor } from './webtor/WebtorGenerator';

const TorrentPage = () => {
  const [magnetLink, setMagnetLink] = useState('');
  const webtorRef = useRef(null);
  const [webtorInstance, setWebtorInstance] = useState(null);

  useEffect(() => {
    import('@webtor/embed-sdk-js')
      .then((webtor) => {
        setWebtorInstance(webtor);
        initWebtor(webtor, webtorRef, {
          features: {
            pictureInPicture: true,
            downloadSpeed: true,
            uploadSpeed: true,
            peers: true,
            progress: true,
            time: true,
            duration: true,
            volume: true,
            mute: true,
            playPause: true,
            seek: true,
            next: true,
            previous: true,
            settings: true,
            miniPlayer: true,
          },
        });
      })
      .catch((error) => console.error('Failed to load Webtor SDK:', error));
  }, []);

  const handlePlay = () => {
    if (webtorInstance) {
      playWebtor(webtorInstance, webtorRef, magnetLink, {});
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Torrent Streamer</h1>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={magnetLink}
          onChange={(e) => setMagnetLink(e.target.value)}
          placeholder="Enter Magnet Link"
          style={{ width: '80%', padding: '10px', marginRight: '10px' }}
        />
        <button onClick={handlePlay} style={{ padding: '10px 20px' }}>
          Play
        </button>
      </div>
      <div id="webtor-player" ref={webtorRef} style={{ width: '100%', height: '500px' }}></div>
    </div>
  );
};

export default TorrentPage;
// app/page.js