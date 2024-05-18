"use client";
import config from "@/config";
import { Constants, Stores } from "@/helper/CONSTANTS";
import { getLocalStorage } from "@/helper/functions/localStorageFn";
import { useStore } from "@/helper/hooks/useStore";
import React, { useEffect, useLayoutEffect } from "react";
import styleMain from "@/app/free-stream/page.module.css";
import { randomRGBA } from "@/helper/customFunc";
import {
  getIframeObjectFromUrl,
  getIframeUrlForQuery,
  isIframeObjectValid,
  setSeasonAndEpisode,
} from "@/helper/iframeFunc";

export default function InitIframeStore() {
  useStore(Stores.query, { initState: null });
  const [, setSearchResults] = useStore(Stores.searchResults, {
    initState: { type: "HISTORY", value: [] },
  });

  const iframeUrlEffect = () => {
    const main = document.querySelector("." + styleMain.main);
    main.style.setProperty("--left-color", randomRGBA());
    main.style.setProperty("--right-color", randomRGBA());

    if (isIframeObjectValid({ iframeObj: iframeUrl })) {
      const saveString = getIframeUrlForQuery({ iframeUrl });
      localStorage.setItem("iframeUrl", saveString);
      window.history.pushState(null, null, saveString);
      setSeasonAndEpisode({ ...iframeUrl });
      document
        .getElementById("iframe-player")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };
  const [iframeUrl, setIframeUrl] = useStore(Stores.iframeUrl, {
    initState: {
      baseUrl: config.iframe.urls[0],
      type: null,
      id: null,
      season: null,
      episode: null,
    },
    effect: iframeUrlEffect,
  });

  useEffect(() => {
    if (!iframeUrl.type) {
      const iframeObj = getIframeObjectFromUrl({
        url: window.location.search,
      });
      if (isIframeObjectValid({ iframeObj })) {
        setIframeUrl((state) => {
          return { ...state, ...iframeObj };
        });
      } else {
        const existing = localStorage.getItem("iframeUrl");
        const existingObj = getIframeObjectFromUrl({ url: existing });
        if (existing) {
          setIframeUrl((state) => {
            return { ...state, ...existingObj };
          });
        }
      }
    }
    return () => {};
  }, []);

  useLayoutEffect(() => {
    const watchHistory = getLocalStorage({
      key: Constants.LocalStorageKey.WATCH_HISTORY,
      emptyReturn: [],
    });
    setSearchResults((state) => {
      return { ...state, value: watchHistory };
    });

    return () => {};
  }, []);

  return <></>;
}
