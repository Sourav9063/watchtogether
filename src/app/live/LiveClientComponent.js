"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import Channel from "../../components/Channel/Channel";
import { fetchM3U } from "../../helper/m3uFetcher";
import VideoOverlayPlayer from "../../components/reactPlayer/VideoOverlayPlayer";
import ChannelHistory from "../../components/ChannelHistory/ChannelHistory";
import {
  getLocalStorage,
  removeLocalStorage,
} from "@/helper/functions/localStorageFn";
import { Constants } from "@/helper/CONSTANTS";

const SingleM3u8Form = ({ setCurrentChannel }) => {
  const [m3u8Url, setM3u8Url] = useState("");

  const handleUrlChange = (e) => {
    setM3u8Url(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (m3u8Url) {
      setCurrentChannel({ url: m3u8Url, name: "Direct URL" });
      const element = document.querySelector("#live-player");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.inputContainer}>
      <input
        type="text"
        value={m3u8Url}
        onChange={handleUrlChange}
        placeholder="Enter M3U8 URL"
        className={styles.urlInput}
      />
      <button type="submit">Load URL</button>
    </form>
  );
};
const LiveClientComponent = ({ serverInitialChannels }) => {
  const DEFAULT_M3U_URL = process.env.NEXT_PUBLIC_DEFAULT_M3U_URL;

  const [channels, setChannels] = useState(serverInitialChannels || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [m3uUrl, setM3uUrl] = useState("");
  const [currentChannel, setCurrentChannel] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const searchParams = useSearchParams();

  const [history, setHistory] = useState([]);

  useEffect(() => {
    const channelHistory = getLocalStorage({
      key: Constants.LocalStorageKey.CHANNEL_HISTORY,
      emptyReturn: [],
    });
    setHistory(channelHistory);
    const channelUrl = searchParams.get("url");
    const channelName = searchParams.get("name");
    if (channelUrl && channelName) {
      setCurrentChannel({
        url: decodeURIComponent(channelUrl),
        name: decodeURIComponent(channelName),
      });
    }
  }, []);

  const handleClearHistory = useCallback(() => {
    removeLocalStorage({ key: Constants.LocalStorageKey.CHANNEL_HISTORY });
    setHistory([]);
  }, []);

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
    const element = document.querySelector("#live-player");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    if (channel) {
      const params = new URLSearchParams();
      params.set("url", encodeURIComponent(channel.url));
      params.set("name", encodeURIComponent(channel.name));
      window.history.pushState(null, "", `?${params.toString()}`);
    } else {
      window.history.pushState(null, "", "");
    }
  };

  const handleUrlChange = (e) => {
    setM3uUrl(e.target.value);
  };

  const handleSaveUrl = (e) => {
    e.preventDefault();
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
        <>
          <div className={`${styles.playerWrapper} back-light `}>
            <VideoOverlayPlayer
              currentChannel={currentChannel}
              setHistory={setHistory}
            />
          </div>
          <h2 className={styles.currentChannelName}>{currentChannel.name}</h2>
        </>
      )}
      <ChannelHistory
        onChannelClick={handleChannelClick}
        history={history}
        handleClearHistory={handleClearHistory}
      />
      <div className={styles.content}>
        <div className={styles.headerWrapper}>
          <h1>Live Channels</h1>
          <input
            type="text"
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {!loading && !error && channels.length > 0 && (
          <ul className={styles.channelList}>
            {channels
              .filter((channel) =>
                channel.name?.toLowerCase().includes(searchTerm.toLowerCase()),
              )
              .map((channel, index) => (
                <Channel
                  key={index + channel.url}
                  channel={channel}
                  onClick={handleChannelClick}
                />
              ))}
          </ul>
        )}
        <form className={styles.inputContainer}>
          <input
            type="text"
            value={m3uUrl}
            onChange={handleUrlChange}
            placeholder="Enter M3U URL"
            className={styles.urlInput}
          />
          <button type="button" onClick={(e) => handleSaveUrl(e)}>
            Load URL
          </button>
        </form>
        <SingleM3u8Form setCurrentChannel={setCurrentChannel} />
      </div>
    </>
  );
};

export default LiveClientComponent;
