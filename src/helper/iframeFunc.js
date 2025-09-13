import config from "@/config";

export const spacer = "-";

export const getIframeUrl = ({ iframeUrl, full = true }) => {
  if (iframeUrl.type == "anime") {
    if (
      ![
        config.iframe.url7,
        config.iframe.url9,
        config.iframe.url8,
        config.iframe.url16,
      ].includes(iframeUrl.baseUrl)
    ) {
      iframeUrl.baseUrl = config.iframe.url9;
    }
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
      case config.iframe.url8:
      case config.iframe.url9:
        return getUrl8_9({ iframeUrl });
      case config.iframe.url13:
      case config.iframe.url14:
      case config.iframe.url15:
        return getUrl13_14({ iframeUrl });
      case config.iframe.url16:
        return getUrl16({ iframeUrl });
      case config.iframe.url17:
        return getUrl17({ iframeUrl });
      default:
        return getDefaultUrl({ iframeUrl });
    }
  }
  return getDefaultUrl({ iframeUrl }).replace(iframeUrl.baseUrl, "");
};

const getDefaultUrl = ({ iframeUrl }) => {
  switch (iframeUrl.type) {
    case "movie":
      return `${iframeUrl.baseUrl}/movie/${iframeUrl.id}`;
    case "anime":
      return `${iframeUrl.baseUrl}/anime/${iframeUrl.id}/${iframeUrl.episode}/${
        iframeUrl.dub || "0"
      }`;
    default:
      return `${iframeUrl.baseUrl}/tv/${iframeUrl.id}/${iframeUrl.season}/${iframeUrl.episode}`;
  }
};
const getUrl8_9 = ({ iframeUrl }) => {
  switch (iframeUrl.type) {
    case "movie":
      return `${iframeUrl.baseUrl}/movie/${iframeUrl.id}`;
    case "anime":
      return `${iframeUrl.baseUrl}/anime/${iframeUrl.id}/${iframeUrl.episode}${
        iframeUrl.dub ? "?dub=true" : "?dub=false"
      }`;
    default:
      return `${iframeUrl.baseUrl}/tv/${iframeUrl.id}/${iframeUrl.season}/${iframeUrl.episode}`;
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
      iframeUrl.dub || "0"
    }`;
  }
  return `${iframeUrl.baseUrl}/tv/${iframeUrl.id}/${iframeUrl.season}/${iframeUrl.episode}`;
};

const getUrl13_14 = ({ iframeUrl }) => {
  if (iframeUrl.type == "movie")
    return `${iframeUrl.baseUrl}?type=movie&id=${iframeUrl.id}`;
  return `${iframeUrl.baseUrl}?type=tv&id=${iframeUrl.id}&season=${iframeUrl.season}&episode=${iframeUrl.episode}`;
};

const getUrl16 = ({ iframeUrl }) => {
  if (iframeUrl.type === "anime")
    return `${iframeUrl.baseUrl}/anime/${iframeUrl.id}/${iframeUrl.episode}/${
      iframeUrl.dub ? "dub" : "sub"
    }?fallback=true`;

  return getDefaultUrl({ iframeUrl });
};

const getUrl17 = ({ iframeUrl }) => {
  return `${iframeUrl.baseUrl}/${iframeUrl.id}/${iframeUrl.season}/${iframeUrl.episode}`;
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
      season: !season ? 1 : Number(season),
      episode: !episode ? 1 : Number(episode),
      baseUrl: getSrc(Number(baseUrlIndex)),
    };
  } else if (type == "anime") {
    if (!isIframeObjectValid({ iframeObj: { type, id, season, episode } }))
      return null;
    return {
      type: type,
      id: id || "",
      episode: !season ? 1 : Number(season),
      dub: !episode ? 0 : Number(episode),
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
  const defaultResponse = { season: 1, episode: 1, dub: 0 };
  const tvData = localStorage.getItem("tvData");
  if (!tvData) return defaultResponse;
  const tvDataParsed = JSON.parse(tvData);
  const tvShow = tvDataParsed[id];
  return tvShow
    ? {
        season: Number(tvShow.season),
        episode: Number(tvShow.episode),
        dub: Number(tvShow.dub || 0),
      }
    : defaultResponse;
};

export const setSeasonAndEpisode = ({
  type,
  id,
  season = 1,
  episode = 1,
  dub = 0,
}) => {
  if (type != "tv" && type != "anime") return;
  const tvData = localStorage.getItem("tvData");
  const tvDataParsed = tvData ? JSON.parse(tvData) : {};
  tvDataParsed[id] = { season, episode, dub };
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
