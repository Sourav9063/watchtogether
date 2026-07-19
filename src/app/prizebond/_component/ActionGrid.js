import Link from "next/link";

import { TEXTS } from "../texts";
import ActionIcon from "./ActionIcon";
import CornerOrnament from "./AnotherCornerOrnament";
import { css } from "./styles";

const ACTIONS = ["scan", "manage", "transfer", "check"];
const ACTION_ROUTES = {
  scan: "/prizebond/scan",
  manage: "/prizebond/bonds",
  transfer: "/prizebond/import",
  check: "/prizebond/result",
};

export default function ActionGrid() {
  return (
    <nav className={css("pb-action-section")} aria-label={TEXTS.navigation.eyebrow}>
      <p className={css("pb-section-eyebrow")}>{TEXTS.navigation.eyebrow}</p>
      <div className={css("pb-action-grid")}>
        {ACTIONS.map((action) => {
          const item = TEXTS.navigation[action];
          return (
            <Link
              className={css("pb-action-card")}
              href={ACTION_ROUTES[action]}
              key={action}
            >
              <CornerOrnament
                className={css("pb-card-corner")}
                color="var(--pb-ink)"
                position="bottom-right"
                size={72}
              />
              <span className={css("pb-action-icon")}>
                <ActionIcon name={action} size={30} />
              </span>
              <span className={css("pb-action-copy")}>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
