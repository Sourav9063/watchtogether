import IframePlayer from "./iframePlayer/iframePlayer";
import TmdbSearch from "./tmdbSearch/tmdbSearch";
import TmdbSearchResults from "./TmdbSearchResults/TmdbSearchResults";
import IframeUseEffects from "./UseEffectWrappers/IframeUseEffects";
import HoverSeEp from "./iframePlayer/hoverSeEp";
import InitIframeStore from "./Provider/InitIframeStore";
import LatestMedia, { LatestType } from "@/components/latest/LatestMedia";
import styles from "./IframeWrapper.module.css";

export default function IframeWrapper() {
  return (
    <>
      <InitIframeStore />
      <IframeUseEffects />
      <HoverSeEp />
      <IframePlayer />
      <div
        className={styles["wrapper-history"]}
      >
        <TmdbSearch />
        <TmdbSearchResults />
      </div>
      <LatestMedia type={LatestType.MOVIE_ADD} />
      <LatestMedia type={LatestType.TV_ADD} />
    </>
  );
}
