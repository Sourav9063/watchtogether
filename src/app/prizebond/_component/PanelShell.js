import Link from "next/link";

import { TEXTS } from "../texts";
import ActionIcon from "./ActionIcon";
import { css } from "./styles";

export default function PanelShell({ title, intro, children }) {
  return (
    <section className={css("pb-panel")} aria-labelledby="pb-panel-title">
      <div className={css("pb-panel-heading")}>
        <Link className={css("pb-home-button")} href="/prizebond">
          <ActionIcon name="home" size={19} />
          <span>{TEXTS.common.backHome}</span>
        </Link>
        <div>
          <p className={css("pb-panel-kicker")}>{TEXTS.hero.bank}</p>
          <h2
            className={css("pb-display-title", "pb-page-title")}
            id="pb-panel-title"
          >
            {title}
          </h2>
          <p>{intro}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
