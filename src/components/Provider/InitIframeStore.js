"use client";
import config from "@/config";
import { Constants, Stores } from "@/helper/CONSTANTS";
import { getLocalStorage } from "@/helper/functions/localStorageFn";
import { useInitStore, useStore } from "@/helper/hooks/useStore";
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
    if (isIframeObjectValid({ iframeObj: iframeUrl })) {
      const { baseUrl, ...rest } = iframeUrl;
      localStorage.setItem("iframeUrl", JSON.stringify(rest));
      window.history.pushState(null, null, getIframeUrlForQuery({ iframeUrl }));
      setSeasonAndEpisode({ ...iframeUrl });
      document
        .getElementById("iframe-player")
        ?.scrollIntoView({ behavior: "smooth" });
    }

    const main = document.querySelector("." + styleMain.main);
    main.style.setProperty("--left-color", randomRGBA());
    main.style.setProperty("--right-color", randomRGBA());
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
        if (existing) {
          setIframeUrl((state) => {
            return { ...state, ...JSON.parse(existing) };
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
