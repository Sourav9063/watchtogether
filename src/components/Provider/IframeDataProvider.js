// "use client";
// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useLayoutEffect,
//   useState,
// } from "react";
// import styleMain from "@/app/free-stream/page.module.css";
// import { randomRGBA } from "@/helper/customFunc";
// import { useRouter } from "next/navigation";
// import {
//   getIframeObjectFromUrl,
//   getIframeUrlForQuery,
//   isIframeObjectValid,
//   setSeasonAndEpisode,
// } from "@/helper/iframeFunc";
// import config from "@/config";
// import { getLocalStorage } from "@/helper/functions/localStorageFn";
// import { Constants } from "@/helper/CONSTANTS";
// export const IframeDataContext = createContext({});
// export default function IframeDataProvider({ children }) {
//   const [iframeUrl, setIframeUrl] = useState({
//     baseUrl: config.iframe.urls[0],
//   });
//   const [query, setQuery] = useState(null);
//   const [searchResults, setSearchResults] = useState({
//     type: "HISTORY",
//     value: [],
//   });

//   useEffect(() => {
//     if (!iframeUrl.type) {
//       const iframeObj = getIframeObjectFromUrl({
//         url: window.location.search,
//       });
//       if (isIframeObjectValid({ iframeObj })) {
//         setIframeUrl((state) => {
//           return { ...state, ...iframeObj };
//         });
//       } else {
//         const existing = localStorage.getItem("iframeUrl");
//         if (existing) {
//           setIframeUrl((state) => {
//             return { ...state, ...JSON.parse(existing) };
//           });
//         }
//       }
//     }
//     return () => {};
//   }, []);

//   useLayoutEffect(() => {
//     const watchHistory = getLocalStorage({
//       key: Constants.LocalStorageKey.WATCH_HISTORY,
//       emptyReturn: [],
//     });
//     setSearchResults((state) => {
//       return { ...state, value: watchHistory };
//     });

//     return () => {};
//   }, []);

//   useEffect(() => {
//     if (isIframeObjectValid({ iframeObj: iframeUrl })) {
//       const { baseUrl, ...rest } = iframeUrl;
//       localStorage.setItem("iframeUrl", JSON.stringify(rest));
//       window.history.pushState(null, null, getIframeUrlForQuery({ iframeUrl }));
//       setSeasonAndEpisode({ ...iframeUrl });
//       document
//         .getElementById("iframe-player")
//         ?.scrollIntoView({ behavior: "smooth" });
//     }

//     const main = document.querySelector("." + styleMain.main);
//     main.style.setProperty("--left-color", randomRGBA());
//     main.style.setProperty("--right-color", randomRGBA());
//     return () => {};
//   }, [iframeUrl]);

//   return (
//     <IframeDataContext.Provider
//       value={{
//         iframeUrl: [iframeUrl, setIframeUrl],
//         query: [query, setQuery],
//         searchResults: [searchResults, setSearchResults],
//       }}
//     >
//       {children}
//     </IframeDataContext.Provider>
//   );
// }

// export const useGlobalState = () => useContext(IframeDataContext);

// export const useIframeUrl = () => {
//   return useContext(IframeDataContext).iframeUrl;
// };

// export const useQuery = () => {
//   return useContext(IframeDataContext).query;
// };

// export const useSearchResults = () => {
//   return useContext(IframeDataContext).searchResults;
// };
