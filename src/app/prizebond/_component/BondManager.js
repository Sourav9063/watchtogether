"use client";

import { TEXTS } from "../texts";
import { formatBondNumber, formatCount, toBengaliDigits } from "../numberUtils";
import ActionIcon from "./ActionIcon";
import PanelShell from "./PanelShell";
import { css } from "./styles";

export default function BondManager({ store }) {
  const { entries } = store;

  const editNumber = (number) => {
    const nextValue = window.prompt(
      TEXTS.manager.editPrompt,
      formatBondNumber(number),
    );
    if (nextValue === null) return;

    const result = store.updateNumber(number, nextValue);
    if (result === "invalid") window.alert(TEXTS.manager.invalidNumber);
    if (result === "duplicate") window.alert(TEXTS.manager.duplicateNumber);
  };

  const clearNumbers = () => {
    if (window.confirm(TEXTS.manager.clearConfirm)) store.clearNumbers();
  };

  const copyNumbers = async () => {
    try {
      await navigator.clipboard.writeText(
        entries.map((entry) => formatBondNumber(entry.number)).join("\n"),
      );
      window.alert(TEXTS.manager.copied);
    } catch {
      window.alert(TEXTS.manager.copyFailed);
    }
  };

  const tidyNumbers = () => {
    window.alert(TEXTS.manager.tidied(formatCount(store.tidyNumbers())));
  };

  return (
    <PanelShell
      intro={TEXTS.manager.intro}
      title={TEXTS.manager.title}
    >
      <div className={css("pb-toolbar")}>
        <button disabled={!entries.length} onClick={copyNumbers} type="button">
          <ActionIcon name="copy" size={19} />
          {TEXTS.manager.copy}
        </button>
        <button disabled={!entries.length} onClick={tidyNumbers} type="button">
          <ActionIcon name="manage" size={19} />
          {TEXTS.manager.tidy}
        </button>
        <button
          className={css("pb-danger-button")}
          disabled={!entries.length}
          onClick={clearNumbers}
          type="button"
        >
          <ActionIcon name="trash" size={19} />
          {TEXTS.manager.clear}
        </button>
      </div>

      <div className={css("pb-number-list")}>
        {!entries.length ? (
          <p className={css("pb-empty-state")}>{TEXTS.common.empty}</p>
        ) : (
          [...entries].reverse().map((entry, index) => (
            <article className={css("pb-number-card")} key={`${entry.number}-${index}`}>
              <span className={css("pb-number-index")}>
                {toBengaliDigits(entries.length - index)}
              </span>
              <div>
                <small>{TEXTS.manager.numberLabel}</small>
                <strong>{formatBondNumber(entry.number)}</strong>
              </div>
              <div className={css("pb-number-actions")}>
                <button onClick={() => editNumber(entry.number)} type="button">
                  <ActionIcon name="edit" size={18} />
                  <span>{TEXTS.manager.edit}</span>
                </button>
                <button
                  className={css("pb-icon-danger")}
                  onClick={() => store.removeNumber(entry.number)}
                  type="button"
                >
                  <ActionIcon name="trash" size={18} />
                  <span>{TEXTS.manager.remove}</span>
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </PanelShell>
  );
}
