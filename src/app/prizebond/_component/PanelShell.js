import { TEXTS } from "../texts";
import ActionIcon from "./ActionIcon";
import { css } from "./styles";

export default function PanelShell({ title, intro, children, onHome }) {
  return (
    <section className={css("pb-panel")} aria-labelledby="pb-panel-title">
      <div className={css("pb-panel-heading")}>
        <button className={css("pb-home-button")} onClick={onHome} type="button">
          <ActionIcon name="home" size={19} />
          <span>{TEXTS.common.backHome}</span>
        </button>
        <div>
          <p className={css("pb-panel-kicker")}>{TEXTS.hero.bank}</p>
          <h2 id="pb-panel-title">{title}</h2>
          <p>{intro}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
