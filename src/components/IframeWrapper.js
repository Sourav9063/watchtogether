import IframePlayer from "./iframePlayer/iframePlayer";
import TmdbSearch from "./tmdbSearch/tmdbSearch";
import TmdbSearchResults from "./TmdbSearchResults/TmdbSearchResults";
import IframeUseEffects from "./UseEffectWrappers/IframeUseEffects";
import HoverSeEp from "./iframePlayer/hoverSeEp";
import InitIframeStore from "./Provider/InitIframeStore";
import LatestMedia, { LatestType } from "@/components/latest/LatestMedia";
import styles from "./IframeWrapper.module.css";
import { randomRGBA } from "@/helper/customFunc";

export default function IframeWrapper() {
  return (
    <>
      <InitIframeStore />
      <IframeUseEffects />
      <HoverSeEp />
      <IframePlayer />
      <section
        style={{
          "--left-color": randomRGBA(0.4),
          "--right-color": randomRGBA(0.4),
        }}
        className={styles["wrapper-history"]}
      >
        <TmdbSearch />
        <TmdbSearchResults />
      </section>
      <LatestMedia type={LatestType.MOVIE_ADD} />
      <LatestMedia type={LatestType.TV_ADD} />
    </>
  );
}
