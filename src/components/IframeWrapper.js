import React from "react";
import ProviderWrapper from "./Provider/ProviderWrapper";
import IframePlayer from "./iframePlayer/iframePlayer";
import TmdbSearch from "./tmdbSearch/tmdbSearch";
import TmdbSearchResults from "./TmdbSearchResults/TmdbSearchResults";
import IframeUseEffects from "./UseEffectWrappers/IframeUseEffects";
import HoverSeEp from "./iframePlayer/hoverSeEp";
import InitIframeStore from "./Provider/InitIframeStore";

export default function IframeWrapper() {
  return (
    <>
      {/* <ProviderWrapper> */}
      <InitIframeStore />
      <IframeUseEffects />
      <HoverSeEp />
      <IframePlayer />
      <TmdbSearch />
      <TmdbSearchResults />
      {/* <Button>name</Button> */}
      {/* </ProviderWrapper> */}
    </>
  );
}
