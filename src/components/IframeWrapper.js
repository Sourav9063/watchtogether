import React from "react";
import ProviderWrapper from "./Provider/ProviderWrapper";
import IframePlayer from "./iframePlayer/iframePlayer";
import TmdbSearch from "./tmdbSearch/tmdfSearch";
import TmdbSearchResults from "./TmdbSearchResults/TmdbSearchResults";
import IframeUseEffects from "./UseEffectWrappers/IframeUseEffects";
import HoverSeEp from "./iframePlayer/hoverSeEp";
import InitStore from "@/helper/hooks/useStore";
import { Stores } from "@/helper/CONSTANTS";

export default function IframeWrapper() {
  return (
    <ProviderWrapper>
      <InitStore scope={Stores.query} initState={null} />
      <InitStore
        scope={Stores.searchResults}
        initState={{ type: "HISTORY", value: [] }}
      />
      <IframeUseEffects />
      <HoverSeEp />
      <IframePlayer />
      <TmdbSearch />
      <TmdbSearchResults />
    </ProviderWrapper>
  );
}
