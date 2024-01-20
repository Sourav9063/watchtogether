import React from "react";
import ProviderWrapper from "./Provider/ProviderWrapper";
import IframePlayer from "./iframePlayer/iframePlayer";
import TmdbSearch from "./tmdbSearch/tmdfSearch";
import TmdbSearchResults from "./TmdbSearchResults/TmdbSearchResults";
import IframeUseEffects from "./UseEffectWrappers/IframeUseEffects";

export default function IframeWrapper() {
  return (
    <ProviderWrapper>
      <IframeUseEffects />
      <IframePlayer />
      <TmdbSearch />
      <TmdbSearchResults />
    </ProviderWrapper>
  );
}
