import { TEXTS } from "../texts";
import OrnamentalFrame from "./OrnamentalFrame";
import { css } from "./styles";

export default function PrizeBondHero({ count }) {
  return (
    <OrnamentalFrame className={css("pb-hero-frame")}>
      <header className={css("pb-hero")}>
        <div className={css("pb-hero-bank")}>{TEXTS.hero.bank}</div>
        <p className={css("pb-government")}>{TEXTS.hero.government}</p>
        <div className={css("pb-hero-emblem")} aria-hidden="true">
          <span />
        </div>
        <h1>{TEXTS.hero.title}</h1>
        <div className={css("pb-denomination")}>{TEXTS.hero.denomination}</div>
        <p className={css("pb-hero-subtitle")}>{TEXTS.hero.subtitle}</p>
        <div className={css("pb-hero-meta")}>
          <span>{TEXTS.common.savedCount(count)}</span>
          <span>{TEXTS.hero.seal}</span>
        </div>
      </header>
    </OrnamentalFrame>
  );
}
