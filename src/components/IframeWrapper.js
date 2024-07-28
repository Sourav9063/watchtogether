import IframePlayer from "./iframePlayer/iframePlayer";
import TmdbSearch from "./tmdbSearch/tmdbSearch";
import TmdbSearchResults from "./TmdbSearchResults/TmdbSearchResults";
import IframeUseEffects from "./UseEffectWrappers/IframeUseEffects";
import HoverSeEp from "./iframePlayer/hoverSeEp";
import InitIframeStore from "./Provider/InitIframeStore";
import LatestMedia, { LatestType } from "./latest/LatestMedia";

export default function IframeWrapper() {
  return (
    <>
      <InitIframeStore />
      <IframeUseEffects />
      <HoverSeEp />
      <IframePlayer />
      <TmdbSearch />
      <TmdbSearchResults />
      <LatestMedia type={LatestType.MOVIE_ADD} />
      <LatestMedia type={LatestType.TV_ADD} />
      <LatestMedia type={LatestType.MOVIE_NEW} />
      <LatestMedia type={LatestType.TV_NEW} />
    </>
  );
}
