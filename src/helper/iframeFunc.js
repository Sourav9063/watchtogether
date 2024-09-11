import config from "@/config";

export const spacer = "-";

export const getIframeUrl = ({ iframeUrl, full = true }) => {
  if (iframeUrl.type == "anime") {
    iframeUrl.baseUrl = config.iframe.url7;
  }
  if (full) {
    switch (iframeUrl.baseUrl) {
      case config.iframe.url3:
        return getUrl3({ iframeUrl });
      case config.iframe.url4:
        return getUrl4({ iframeUrl });
      case config.iframe.url6:
        return getUrl6({ iframeUrl });
      case config.iframe.url7:
        return getUrl7({ iframeUrl });
    }
  }
  if (iframeUrl.type == "movie") {
    return (full ? iframeUrl.baseUrl : "") + "/movie/" + iframeUrl.id;
  } else if (iframeUrl.type == "anime") {
    return (
      (full ? iframeUrl.baseUrl : "") +
        "/anime/" +
        iframeUrl.id +
        "/" +
        iframeUrl.episode +
        "/" +
        iframeUrl.dub || 0
    );
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

const getUrl4 = ({ iframeUrl }) => {
  if (iframeUrl.type == "movie") {
    return `${iframeUrl.baseUrl}/embed/{iframeUrl.id}`;
  }
  return `${iframeUrl.baseUrl}/embedtv/${iframeUrl.id}?s=${iframeUrl.season}&s=1`;
};

const getUrl3 = ({ iframeUrl }) => {
  if (iframeUrl.type == "movie")
    return `${iframeUrl.baseUrl}?video_id=${iframeUrl.id}&tmdb=1`;
  return `${iframeUrl.baseUrl}?video_id=${iframeUrl.id}&tmdb=1&s=${iframeUrl.season}&e=${iframeUrl.episode}`;
};

const getUrl6 = ({ iframeUrl }) => {
  if (iframeUrl.type == "movie")
    return `${iframeUrl.baseUrl}/movie/${iframeUrl.id}`;
  return `${iframeUrl.baseUrl}/tv/${iframeUrl.id}-${iframeUrl.season}-${iframeUrl.episode}`;
};

const getUrl7 = ({ iframeUrl }) => {
  if (iframeUrl.type == "movie") {
    return `${iframeUrl.baseUrl}/movie/${iframeUrl.id}`;
  }
  if (iframeUrl.type == "anime") {
    return `${iframeUrl.baseUrl}/anime/${iframeUrl.id}/${iframeUrl.episode}/${
      iframeUrl.dub || 0
    }`;
  }
  return `${iframeUrl.baseUrl}/tv/${iframeUrl.id}/${iframeUrl.season}/${iframeUrl.episode}`;
};

export const getBaseUrlIndex = (src) => {
  if (!src) return 0;
  return config.iframe.urls.indexOf(src) || 0;
};
export const getSrc = (index) => {
  if (index < 0) return config.iframe.urls[0];
  return config.iframe.urls[index] || config.iframe.urls[0];
};

export const getIframeUrlForQuery = ({ iframeUrl }) => {
  const query = getIframeUrl({ iframeUrl, full: false }).replace("/", "");
  return (
    "?url=" +
    getBaseUrlIndex(iframeUrl.baseUrl) +
    spacer +
    query.replaceAll("/", spacer)
  );
};

export const getIframeObjectFromUrl = ({ url }) => {
  const queryString = new URLSearchParams(url).get("url");
  if (!queryString) return null;
  const queryStringSplit = queryString.split(spacer);
  const [baseUrlIndex, type, id, season, episode] = queryStringSplit;

  if (type == "movie") {
    if (!isIframeObjectValid({ iframeObj: { type, id } })) return null;
    return {
      type: type,
      id: id || "",
      baseUrl: getSrc(Number(baseUrlIndex)),
    };
  } else if (type == "tv") {
    if (!isIframeObjectValid({ iframeObj: { type, id, season, episode } }))
      return null;
    return {
      type: type,
      id: id || "",
      season: Number(season) ?? "",
      episode: Number(episode) ?? "",
      baseUrl: getSrc(Number(baseUrlIndex)),
    };
  } else if (type == "anime") {
    if (!isIframeObjectValid({ iframeObj: { type, id, season, episode } }))
      return null;
    return {
      type: type,
      id: id || "",
      episode: Number(season) || "",
      dub: Number(episode) ?? "0",
      baseUrl: getSrc(Number(baseUrlIndex)),
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
    return true;
  } else if (type == "anime") {
    if (typeof id == "undefined" || id == null) return false;
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
