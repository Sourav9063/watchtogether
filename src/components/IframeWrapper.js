import React from "react";
import ProviderWrapper from "./Provider/ProviderWrapper";
import IframePlayer from "./iframePlayer/iframePlayer";
import TmdbSearch from "./tmdbSearch/tmdfSearch";
import TmdbSearchResults from "./TmdbSearchResults/TmdbSearchResults";
import IframeUseEffects from "./UseEffectWrappers/IframeUseEffects";
import HoverSeEp from "./iframePlayer/hoverSeEp";

export default function IframeWrapper() {
  return (
    <ProviderWrapper>
      <IframeUseEffects />
      <HoverSeEp />
      <IframePlayer />
      <TmdbSearch />
      <TmdbSearchResults />
    </ProviderWrapper>
  );
}
