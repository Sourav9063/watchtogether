"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import styleMain from "@/app/page.module.css";
import { randomRGBA } from "@/helper/customFunc";
export const IframeDataContext = createContext({});
export default function IframeDataProvider({ children }) {
  const [iframeUrl, setIframeUrl] = useState(null);
  const [query, setQuery] = useState(null);
  const [searchResults, setSearchResults] = useState(null);

  return (
    <IframeDataContext.Provider
      value={{
        iframeUrl: [iframeUrl, setIframeUrl],
        query: [query, setQuery],
        searchResults: [searchResults, setSearchResults],
      }}
    >
      {children}
    </IframeDataContext.Provider>
  );
}

export const useGlobalState = () => useContext(IframeDataContext);

export const useIframeUrl = () => {
  const [iframeUrl, setIframeUrl] = useContext(IframeDataContext).iframeUrl;

  useEffect(() => {
    const existing = localStorage.getItem("iframeUrl");
    if (existing) {
      setIframeUrl(JSON.parse(existing));
    }

    const main = document.querySelector("." + styleMain.main);
    main.style.setProperty("--left-color", randomRGBA());
    main.style.setProperty("--right-color", randomRGBA());
    return () => {};
  }, []);

  return [iframeUrl, setIframeUrl];
};

export const useQuery = () => {
  return useContext(IframeDataContext).query;
};

export const useSearchResults = () => {
  return useContext(IframeDataContext).searchResults;
};
