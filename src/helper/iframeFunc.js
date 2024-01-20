export const spacer = "-";

export const getIframeUrl = ({ iframeUrl, full = true }) => {
  if (iframeUrl.type == "movie") {
    return (full ? iframeUrl.baseUrl : "") + "/movie/" + iframeUrl.id;
  } else {
    return (
      (full ? iframeUrl.baseUrl : "") +
      "/tv/" +
      iframeUrl.id +
      "/" +
      iframeUrl.season +
      "/" +
      iframeUrl.episode
    );
  }
};
export const getIframeUrlForQuery = ({ iframeUrl }) => {
  const query = getIframeUrl({ iframeUrl, full: false }).replace("/", "");
  return "?url=" + query.replaceAll("/", spacer);
};

export const getIframeObjectFromUrl = ({ url }) => {
  const queryString = new URLSearchParams(url).get("url");
  if (!queryString) return null;
  const queryStringSplit = queryString.split(spacer);
  const [type, id, season, episode] = queryStringSplit;

  if (type == "movie") {
    if (!isIframeObjectValid({ iframeObj: { type, id } })) return null;
    return {
      type: type,
      id: id || "",
    };
  } else if (type == "tv") {
    if (!isIframeObjectValid({ iframeObj: { type, id, season, episode } }))
      return null;
    return {
      type: type,
      id: id || "",
      season: Number(season) || "",
      episode: Number(episode) || "",
    };
  } else {
    return null;
  }
};

export const isIframeObjectValid = ({ iframeObj }) => {
  if (!iframeObj) return false;
  const { type, id, season, episode } = iframeObj;
  if (type == "movie") {
    if (typeof id == "undefined" || id == null) return false;
    return true;
  } else if (type == "tv") {
    if (typeof id == "undefined" || id == null) return false;
    if (typeof season == "undefined" || season == null) return false;
    return true;
  } else {
    return false;
  }
};

export const getSeasonAndEpisode = ({ id }) => {
  const defaultResponse = { season: 1, episode: 1 };
  const tvData = localStorage.getItem("tvData");
  if (!tvData) return defaultResponse;
  const tvDataParsed = JSON.parse(tvData);
  const tvShow = tvDataParsed[id];
  return tvShow
    ? { season: Number(tvShow.season), episode: Number(tvShow.episode) }
    : defaultResponse;
};

export const setSeasonAndEpisode = ({ type, id, season, episode }) => {
  if (type != "tv") return;
  const tvData = localStorage.getItem("tvData");
  const tvDataParsed = tvData ? JSON.parse(tvData) : {};
  tvDataParsed[id] = { season, episode };
  localStorage.setItem("tvData", JSON.stringify(tvDataParsed));
};

// if (iframeUrl.baseUrl == config.iframe.url4) {
//   return getUrl4({ iframeUrl, full });
// }

// const getUrl4 = ({ iframeUrl, full }) => {
//   const { type, id, season, episode } = iframeUrl;
//   if (type == "movie") {
//     return (full ? iframeUrl.baseUrl : "") + "/embed/" + iframeUrl.id;
//   } else {
//     return (
//       (full ? iframeUrl.baseUrl : "") +
//       "/embedtv/" +
//       iframeUrl.id +
//       "&s=" +
//       iframeUrl.season +
//       "&e=" +
//       iframeUrl.episode
//     );
//   }
// };

export const itrSeEp = ({ state, itrSe = 0, itrEp = 0 }) => {
  const { season, episode } = state;
  return {
    season: Math.max(1, Number(season) + itrSe),
    episode: itrSe != 0 ? 1 : Math.max(1, Number(episode) + itrEp),
  };
};
