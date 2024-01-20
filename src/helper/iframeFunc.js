import config from "@/config";

export const spacer = "-";

export const getIframeUrl = ({ iframeUrl, full = true }) => {
  if (iframeUrl.type == "movie") {
    return (full ? config.personal.url : "") + "/movie/" + iframeUrl.id;
  } else {
    return (
      (full ? config.personal.url : "") +
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
      season: season || "",
      episode: episode || "",
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
