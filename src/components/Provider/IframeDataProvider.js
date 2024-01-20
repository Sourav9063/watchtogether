"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import styleMain from "@/app/free-stream/page.module.css";
import { randomRGBA } from "@/helper/customFunc";
import { useRouter } from "next/navigation";
import {
  getIframeObjectFromUrl,
  getIframeUrlForQuery,
  isIframeObjectValid,
} from "@/helper/iframeFunc";
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
    if (!iframeUrl) {
      const iframeObj = getIframeObjectFromUrl({
        url: window.location.search,
      });
      if (isIframeObjectValid({ iframeObj })) {
        setIframeUrl(iframeObj);
      } else {
        const existing = localStorage.getItem("iframeUrl");
        if (existing) {
          setIframeUrl(JSON.parse(existing));
        }
      }
    }
    return () => {};
  }, []);

  useEffect(() => {
    if (isIframeObjectValid({ iframeObj: iframeUrl })) {
      localStorage.setItem("iframeUrl", JSON.stringify(iframeUrl));
      window.history.pushState(null, null, getIframeUrlForQuery({ iframeUrl }));
    }

    const main = document.querySelector("." + styleMain.main);
    main.style.setProperty("--left-color", randomRGBA());
    main.style.setProperty("--right-color", randomRGBA());
    return () => {};
  }, [iframeUrl]);

  return [iframeUrl, setIframeUrl];
};

export const useQuery = () => {
  return useContext(IframeDataContext).query;
};

export const useSearchResults = () => {
  return useContext(IframeDataContext).searchResults;
};
