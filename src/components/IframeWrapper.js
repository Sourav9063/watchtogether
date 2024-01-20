import React from "react";
import ProviderWrapper from "./Provider/ProviderWrapper";
import IframePlayer from "./iframePlayer/iframePlayer";
import TmdbSearch from "./tmdbSearch/tmdfSearch";
import TmdbSearchResults from "./TmdbSearchResults/TmdbSearchResults";

export default function IframeWrapper() {
  return (
    <ProviderWrapper>
      <IframePlayer />
      <TmdbSearch />
      <TmdbSearchResults />
    </ProviderWrapper>
  );
}
