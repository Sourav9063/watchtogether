import config from "@/config";

export const spacer = "-";

export const getIframeUrl = ({ iframeUrl, full = true }) => {
  if (iframeUrl.type === "anime") {
    if (!config.iframe.animeUrls.includes(iframeUrl.baseUrl)) {
      iframeUrl.baseUrl = config.iframe.animeUrls[0];
    }
  }
  if (full) {
    if (iframeUrl.baseUrl && iframeUrl.baseUrl === config.tabs[0]) {
      return getCinetaroUrl({ iframeUrl });
    }

    switch (iframeUrl.baseUrl) {
      case config.iframe.url1:
      case config.iframe.url38:
        return getUrl1_38({ iframeUrl });
      case config.iframe.url3:
        return getUrl3({ iframeUrl });
      case config.iframe.url4:
        return getUrl4({ iframeUrl });
      case config.iframe.url6:
        return getUrl6({ iframeUrl });
      case config.iframe.url7:
        return getDefaultUrl({ iframeUrl });
      case config.iframe.url8:
      case config.iframe.url9:
        return getUrl8_9({ iframeUrl });
      case config.iframe.url13:
      case config.iframe.url14:
      case config.iframe.url15:
      case config.iframe.url31:
        return getUrl13_14({ iframeUrl });
      case config.iframe.url16:
        return getUrl16({ iframeUrl });
      case config.iframe.url25:
        return getUrl25({ iframeUrl });
      case config.iframe.url17:
      case config.iframe.url27:
        return getUrl17_27({ iframeUrl });
      case config.iframe.url23:
        return getUrl23({ iframeUrl });
      // case config.iframe.url30:
      //   return getUrl30({ iframeUrl });
      case config.iframe.url21:
      case config.iframe.url32:
      case config.iframe.url35:
      case config.iframe.url39:
      case config.iframe.url45:
      case config.iframe.url48:
      case config.iframe.url49:
      case config.iframe.url51:
      case config.iframe.url56:
      case config.iframe.url65:
        return getDefaultUrl({ iframeUrl });
      case config.iframe.url40:
      case config.iframe.url41:
        return getUrl40_41({ iframeUrl });
      case config.iframe.url42:
        return getUrl42({ iframeUrl });
      case config.iframe.url43:
        return getUrl43({ iframeUrl });
      case config.iframe.url44:
        return getUrl44({ iframeUrl });
      case config.iframe.url47:
        return getUrl47({ iframeUrl });
      case config.iframe.url50:
        return getUrl50({ iframeUrl });
      case config.iframe.url53:
        return getUrl53({ iframeUrl });
      case config.iframe.url55:
        return getUrl55({ iframeUrl });
      case config.iframe.url57:
        return getUrl57({ iframeUrl });
      case config.iframe.url58:
        return getUrl58({ iframeUrl });
      case config.iframe.url59:
        return getUrl59({ iframeUrl });
      case config.iframe.url61:
        return getUrl61({ iframeUrl });
      case config.iframe.url62:
        return getUrl62({ iframeUrl });
      case config.iframe.url63:
        return getUrl13_14({ iframeUrl });
      case config.iframe.url64:
        return getUrl64({ iframeUrl });
      case config.iframe.url66:
        return getUrl66({ iframeUrl });
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

const getUrl1_38 = ({ iframeUrl }) => {
  if (iframeUrl.type === "movie")
    return `${iframeUrl.baseUrl}/movie/${iframeUrl.id}`;
  return `${iframeUrl.baseUrl}/tv/${iframeUrl.id}/${iframeUrl.season}-${iframeUrl.episode}`;
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

const getUrl23 = ({ iframeUrl }) => {
  switch (iframeUrl.type) {
    case "movie":
      return `${iframeUrl.baseUrl}/tmdb-movie-${iframeUrl.id}`;
    default:
      return `${iframeUrl.baseUrl}/tmdb-tv-${iframeUrl.id}/${iframeUrl.season}/${iframeUrl.episode}`;
  }
};

const getUrl4 = ({ iframeUrl }) => {
  if (iframeUrl.type === "movie") {
    return `${iframeUrl.baseUrl}/embed/{iframeUrl.id}`;
  }
  return `${iframeUrl.baseUrl}/embedtv/${iframeUrl.id}?s=${iframeUrl.season}&s=1`;
};

const getUrl3 = ({ iframeUrl }) => {
  if (iframeUrl.type === "movie")
    return `${iframeUrl.baseUrl}?video_id=${iframeUrl.id}&tmdb=1`;
  return `${iframeUrl.baseUrl}?video_id=${iframeUrl.id}&tmdb=1&s=${iframeUrl.season}&e=${iframeUrl.episode}`;
};

const getUrl6 = ({ iframeUrl }) => {
  if (iframeUrl.type === "movie")
    return `${iframeUrl.baseUrl}/movie/${iframeUrl.id}`;
  return `${iframeUrl.baseUrl}/tv/${iframeUrl.id}-${iframeUrl.season}-${iframeUrl.episode}`;
};

const getUrl13_14 = ({ iframeUrl }) => {
  if (iframeUrl.type === "movie")
    return `${iframeUrl.baseUrl}?type=movie&id=${iframeUrl.id}`;
  return `${iframeUrl.baseUrl}?type=tv&id=${iframeUrl.id}&season=${iframeUrl.season}&episode=${iframeUrl.episode}`;
};

const getUrl16 = ({ iframeUrl }) => {
  if (iframeUrl.type === "anime")
    return `${iframeUrl.baseUrl}/anime/${iframeUrl.id}/${iframeUrl.episode}`;

  return getDefaultUrl({ iframeUrl });
};

const getUrl25 = ({ iframeUrl }) => {
  if (iframeUrl.type === "anime")
    return `${iframeUrl.baseUrl}/anime/${iframeUrl.id}/${iframeUrl.episode}/${
      iframeUrl.dub ? "dub" : "sub"
    }`;

  return getDefaultUrl({ iframeUrl });
};

const getUrl17_27 = ({ iframeUrl }) => {
  if (iframeUrl.type === "movie") return `${iframeUrl.baseUrl}/${iframeUrl.id}`;
  return `${iframeUrl.baseUrl}/${iframeUrl.id}/${iframeUrl.season}/${iframeUrl.episode}`;
};

const getUrl30 = ({ iframeUrl }) => {
  if (iframeUrl.type === "movie")
    return `${iframeUrl.baseUrl}/movie/?id=${iframeUrl.id}`;
  return `${iframeUrl.baseUrl}/tv/?id=${iframeUrl.id}&s=${iframeUrl.season}&e=${iframeUrl.episode}`;
};

const getUrl47 = ({ iframeUrl }) => {
  if (iframeUrl.type === "movie")
    return `${iframeUrl.baseUrl}/${iframeUrl.id}`;

  return `${iframeUrl.baseUrl}/${iframeUrl.id}/${iframeUrl.season}-${iframeUrl.episode}`;
};

const getUrl50 = ({ iframeUrl }) => {
  if (iframeUrl.type !== "anime") return getDefaultUrl({ iframeUrl });
  return `${iframeUrl.baseUrl}/anime/${iframeUrl.id}/${iframeUrl.episode}?dub=${Boolean(
    iframeUrl.dub,
  )}`;
};

const getPreferredId = ({ iframeUrl, idType }) => {
  if (idType === "imdb") return iframeUrl.imdbId || iframeUrl.id;
  if (idType === "mal") return iframeUrl.malId || iframeUrl.id;
  return iframeUrl.id;
};

const getUrl53 = ({ iframeUrl }) => {
  if (iframeUrl.type === "movie") {
    const id = getPreferredId({ iframeUrl, idType: "imdb" });
    return `${iframeUrl.baseUrl}/movie?imdb=${id}`;
  }

  return `${iframeUrl.baseUrl}/tv?tmdb=${iframeUrl.id}&season=${iframeUrl.season}&episode=${iframeUrl.episode}`;
};

const getUrl55 = ({ iframeUrl }) => {
  const id = getPreferredId({ iframeUrl, idType: "imdb" });
  return `${iframeUrl.baseUrl}?type=${iframeUrl.type}&id=${id}`;
};

const getUrl57 = ({ iframeUrl }) => {
  if (iframeUrl.type === "movie")
    return `${iframeUrl.baseUrl}/movie?id=${iframeUrl.id}`;

  return `${iframeUrl.baseUrl}/tv?id=${iframeUrl.id}&s=${iframeUrl.season}&e=${iframeUrl.episode}`;
};

const getUrl58 = ({ iframeUrl }) => {
  const id = getPreferredId({
    iframeUrl,
    idType: iframeUrl.type === "movie" ? "imdb" : "tmdb",
  });
  if (iframeUrl.type === "movie") return `${iframeUrl.baseUrl}/movie/${id}`;
  return `${iframeUrl.baseUrl}/tv/${id}/${iframeUrl.season}/${iframeUrl.episode}`;
};

const getUrl59 = ({ iframeUrl }) => {
  if (iframeUrl.type === "anime")
    return `${iframeUrl.baseUrl}/anime/${iframeUrl.id}/${iframeUrl.episode}`;

  return getDefaultUrl({ iframeUrl });
};

const getUrl61 = ({ iframeUrl }) => {
  if (iframeUrl.type === "movie")
    return `${iframeUrl.baseUrl}/filme/${iframeUrl.id}`;

  return `${iframeUrl.baseUrl}/serie/${iframeUrl.id}/${iframeUrl.season}/${iframeUrl.episode}`;
};

const getUrl62 = ({ iframeUrl }) => {
  if (iframeUrl.type === "movie")
    return `${iframeUrl.baseUrl}/film.php?id=${iframeUrl.id}`;

  return `${iframeUrl.baseUrl}/serie.php?id=${iframeUrl.id}&sa=${iframeUrl.season}&epi=${iframeUrl.episode}`;
};

const getUrl64 = ({ iframeUrl }) => {
  if (iframeUrl.type === "movie")
    return `${iframeUrl.baseUrl}/movie/?id=${iframeUrl.id}`;

  return `${iframeUrl.baseUrl}/tv/?id=${iframeUrl.id}/${iframeUrl.season}/${iframeUrl.episode}`;
};

const getUrl66 = ({ iframeUrl }) => {
  const id = getPreferredId({ iframeUrl, idType: "mal" });
  return `${iframeUrl.baseUrl}?id=${id}&e=${iframeUrl.episode}`;
};

const getUrl42 = ({ iframeUrl }) => {
  const audio = iframeUrl.dub ? "dub" : "sub";

  if (iframeUrl.type === "movie")
    return `${iframeUrl.baseUrl}/movie/${iframeUrl.id}?audio=${audio}`;

  if (iframeUrl.type === "anime")
    return `${iframeUrl.baseUrl}/tv/anilist-${iframeUrl.id}/1/${iframeUrl.episode}?audio=${audio}`;

  return `${iframeUrl.baseUrl}/tv/${iframeUrl.id}/${iframeUrl.season}/${iframeUrl.episode}?audio=${audio}`;
};

const getUrl40_41 = ({ iframeUrl }) => {
  const audio = iframeUrl.dub ? "dub" : "sub";
  return `${iframeUrl.baseUrl}/stream/ani/${iframeUrl.id}/${iframeUrl.episode}/${audio}`;
};

const getUrl43 = ({ iframeUrl }) => {
  const audio = iframeUrl.dub ? "dub" : "sub";
  return `${iframeUrl.baseUrl}/${iframeUrl.id}/${iframeUrl.episode}/${audio}`;
};

const getUrl44 = ({ iframeUrl }) => {
  if (iframeUrl.type === "movie")
    return `${iframeUrl.baseUrl}/movie/${iframeUrl.id}`;

  if (iframeUrl.type === "anime") {
    const isDub = iframeUrl.dub ? "true" : "false";
    return `${iframeUrl.baseUrl}/anime/${iframeUrl.id}/${iframeUrl.episode}?dub=${isDub}`;
  }

  return `${iframeUrl.baseUrl}/tv/${iframeUrl.id}/${iframeUrl.season}/${iframeUrl.episode}`;
};

const getCinetaroUrl = ({ iframeUrl }) => {
  const params = new URLSearchParams({
    server: "maple",
    embed: "true",
    ep: String(iframeUrl.episode || 1),
    skip: "true",
    autoPlay: "1",
    asi: "1",
  });

  if (iframeUrl.type === "movie") {
    params.set("id", `${iframeUrl.id}-movie`);
  } else {
    params.set(
      "id",
      `${iframeUrl.id}-${iframeUrl.season || 1}-${iframeUrl.episode || 1}`,
    );
  }

  return `${iframeUrl.baseUrl}?${params.toString()}`;
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

  if (type === "movie") {
    if (!isIframeObjectValid({ iframeObj: { type, id } })) return null;
    return {
      type: type,
      id: id || "",
      baseUrl: getSrc(Number(baseUrlIndex)),
    };
  } else if (type === "tv") {
    if (!isIframeObjectValid({ iframeObj: { type, id, season, episode } }))
      return null;
    return {
      type: type,
      id: id || "",
      season: !season ? 1 : Number(season),
      episode: !episode ? 1 : Number(episode),
      baseUrl: getSrc(Number(baseUrlIndex)),
    };
  } else if (type === "anime") {
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
  if (type === "movie") {
    if (typeof id === "undefined" || id === null) return false;
    return true;
  } else if (type === "tv") {
    if (typeof id === "undefined" || id === null) return false;
    return true;
  } else if (type === "anime") {
    if (typeof id === "undefined" || id === null) return false;
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

// if (iframeUrl.baseUrl === config.iframe.url4) {
//   return getUrl4({ iframeUrl, full });
// }

// const getUrl4 = ({ iframeUrl, full }) => {
//   const { type, id, season, episode } = iframeUrl;
//   if (type === "movie") {
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
