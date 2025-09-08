"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import styles from "./page.module.css";
import Channel from "../../components/Channel/Channel";
import BackLight from "@/components/backLigth/BackLight";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

const LivePage = () => {
  const DEFAULT_M3U_URL = process.env.NEXT_PUBLIC_DEFAULT_M3U_URL;
  const LOCAL_STORAGE_KEY = "m3u_url";

  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [m3uUrl, setM3uUrl] = useState("");
  const [currentChannel, setCurrentChannel] = useState(null);

  useEffect(() => {
    const storedUrl = localStorage.getItem(LOCAL_STORAGE_KEY);
    fetchAndParseM3U(storedUrl || DEFAULT_M3U_URL);
  }, []);

  const handleChannelClick = (channel) => {
    setCurrentChannel(channel);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchAndParseM3U = async (url) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      const parsedChannels = parseM3U(text);
      setChannels(parsedChannels);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const parseM3U = (m3uContent) => {
    const lines = m3uContent.split("\n");
    const channels = [];
    let currentChannel = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("#EXTINF:")) {
        const tvgLogoMatch = line.match(/tvg-logo="([^"]+)"/);
        const groupTitleMatch = line.match(/group-title="([^"]+)"/);
        const nameMatch = line.match(/,(.*)/);

        currentChannel = {
          name: nameMatch ? nameMatch[1].trim() : "Unknown Channel",
          group: groupTitleMatch ? groupTitleMatch[1] : "Unknown Group",
          logo: tvgLogoMatch ? tvgLogoMatch[1] : "",
          url: "",
        };
      } else if (line.startsWith("http")) {
        currentChannel.url = line;
        channels.push(currentChannel);
        currentChannel = {}; // Reset for the next channel
      }
    }
    return channels;
  };

  const handleUrlChange = (e) => {
    setM3uUrl(e.target.value);
  };

  const handleSaveUrl = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, m3uUrl);
    fetchAndParseM3U(m3uUrl || DEFAULT_M3U_URL);
  };

  if (loading) {
    return <div className={styles.container}>Loading channels...</div>;
  }

  if (error) {
    return <div className={styles.container}>Error: {error}</div>;
  }

  return (
    <>
      <BackLight />
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
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={m3uUrl}
            onChange={handleUrlChange}
            placeholder="Enter M3U URL"
            className={styles.urlInput}
          />
          <button onClick={handleSaveUrl}>Load & Save URL</button>
        </div>

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

export default LivePage;
