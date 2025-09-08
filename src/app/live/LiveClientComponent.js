"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import styles from "./page.module.css";
import Channel from "../../components/Channel/Channel";
import { fetchM3U } from "../../helper/m3uFetcher";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

const LiveClientComponent = ({ serverInitialChannels }) => {
  const DEFAULT_M3U_URL = process.env.NEXT_PUBLIC_DEFAULT_M3U_URL;

  const [channels, setChannels] = useState(serverInitialChannels || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [m3uUrl, setM3uUrl] = useState("");
  const [currentChannel, setCurrentChannel] = useState(null);

  const clientFetchM3U = useCallback(async (url) => {
    setLoading(true);
    setError(null);
    try {
      const parsedChannels = await fetchM3U(url);
      setChannels(parsedChannels);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);


  const handleChannelClick = (channel) => {
    setCurrentChannel(channel);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUrlChange = (e) => {
    setM3uUrl(e.target.value);
  };

  const handleSaveUrl = () => {
    clientFetchM3U(m3uUrl || DEFAULT_M3U_URL);
  };

  if (loading) {
    return <div className={styles.container}>Loading channels...</div>;
  }

  if (error) {
    return <div className={styles.container}>Error: {error}</div>;
  }

  return (
    <>
      {currentChannel && (
        <div className={`${styles.playerWrapper} back-light `}>
          <ReactPlayer
            url={currentChannel.url}
            controls={true}
            playing={true}
            width="100%"
            height="100%"
            config={{
              file: {
                forceHLS: true,
              },
            }}
          />
        </div>
      )}
      <div className={styles.content}>
        {currentChannel && <h2 className={styles.currentChannelName}>{currentChannel.name}</h2>}
        <h1>Live Channels</h1>
        <form className={styles.inputContainer}>
          <input
            type="text"
            value={m3uUrl}
            onChange={handleUrlChange}
            placeholder="Enter M3U URL"
            className={styles.urlInput}
          />
          <button onClick={handleSaveUrl}>Load & Save URL</button>
        </form>

        {!loading && !error && channels.length > 0 && (
          <ul className={styles.channelList}>
            {channels.map((channel, index) => (
              <Channel
                key={index}
                channel={channel}
                onClick={handleChannelClick}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default LiveClientComponent;