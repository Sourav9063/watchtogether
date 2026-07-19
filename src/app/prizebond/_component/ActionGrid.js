import { TEXTS } from "../texts";
import ActionIcon from "./ActionIcon";
import { css } from "./styles";

const ACTIONS = ["scan", "manage", "transfer", "check"];

export default function ActionGrid({ activeView, onSelect }) {
  return (
    <nav className={css("pb-action-section")} aria-label={TEXTS.navigation.eyebrow}>
      <p className={css("pb-section-eyebrow")}>{TEXTS.navigation.eyebrow}</p>
      <div className={css("pb-action-grid")}>
        {ACTIONS.map((action) => {
          const item = TEXTS.navigation[action];
          return (
            <button
              aria-current={activeView === action ? "page" : undefined}
              className={css("pb-action-card")}
              key={action}
              onClick={() => onSelect(action)}
              type="button"
            >
              <span className={css("pb-action-icon")}>
                <ActionIcon name={action} size={30} />
              </span>
              <span className={css("pb-action-copy")}>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
