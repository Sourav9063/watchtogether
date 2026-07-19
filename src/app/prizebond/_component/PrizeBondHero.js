import { TEXTS } from "../texts";
import OrnamentalFrame from "./OrnamentalFrame";
import { css } from "./styles";

export default function PrizeBondHero({ count }) {
  return (
    <OrnamentalFrame className={css("pb-hero-frame")}>
      <header className={css("pb-hero")}>
        <div className={css("pb-hero-bank")}>
          <svg
            aria-label={TEXTS.hero.ribbon}
            focusable="false"
            role="img"
            viewBox="0 0 600 110"
          >
            <path
              className={css("pb-hero-bank-arch")}
              d="M24 100Q300-55 576 100l-28 8Q300 5 52 108Z"
            />
            <path
              className={css("pb-hero-bank-edge")}
              d="M52 108Q300 5 548 108"
            />
            <path
              d="M74 98Q300 7 526 98"
              fill="none"
              id="pb-hero-ribbon-curve"
            />
            <text>
              <textPath
                href="#pb-hero-ribbon-curve"
                startOffset="50%"
                textAnchor="middle"
              >
                {TEXTS.hero.ribbon}
              </textPath>
            </text>
          </svg>
        </div>
        <p className={css("pb-hero-byline")}>{TEXTS.hero.byline}</p>
        <div className={css("pb-hero-emblem")} aria-hidden="true">
          <span />
        </div>
        <h1 className={css("pb-display-title", "pb-hero-title")}>
          {TEXTS.hero.title}
        </h1>
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
