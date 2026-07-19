"use client";

import { formatAmount, formatBondNumber, formatCount, toBengaliDigits } from "../numberUtils";
import { TEXTS } from "../texts";
import ActionIcon from "./ActionIcon";
import PanelShell from "./PanelShell";
import { css } from "./styles";

export default function CheckPanel({ entries, resultState, onCheck, onFallback }) {
  const chunkCount = Math.ceil(entries.length / 100);

  return (
    <PanelShell intro={TEXTS.check.intro} title={TEXTS.check.title}>
      <div className={css("pb-check-callout")}>
        <span className={css("pb-large-icon")}><ActionIcon name="check" size={38} /></span>
        <strong>{TEXTS.common.savedCount(formatCount(entries.length))}</strong>
        <button
          className={css("pb-primary-button")}
          disabled={!entries.length || resultState.status === "loading"}
          onClick={onCheck}
          type="button"
        >
          <ActionIcon name="check" size={21} />
          {resultState.status === "loading" ? TEXTS.check.checking : TEXTS.check.direct}
        </button>
      </div>

      {resultState.status === "error" && (
        <p className={css("pb-error")} role="alert">{resultState.error}</p>
      )}

      {resultState.status === "success" && (
        <div className={css("pb-check-result")} aria-live="polite">
          <h3>
            {TEXTS.check.summary(
              formatCount(resultState.data.uploadedCount),
              formatCount(resultState.data.matchedCount),
            )}
          </h3>
          {!resultState.data.matches.length ? (
            <p className={css("pb-no-match")}>{TEXTS.check.noMatch}</p>
          ) : (
            <div className={css("pb-match-list")}>
              {resultState.data.matches.map((match) => (
                <article className={css("pb-match-card")} key={`${match.number}-${match.drawDate}`}>
                  <strong>{formatBondNumber(match.number)}</strong>
                  <dl>
                    <div><dt>{TEXTS.check.prize}</dt><dd>{toBengaliDigits(match.prize)}</dd></div>
                    <div><dt>{TEXTS.check.amount}</dt><dd>{formatAmount(match.amount)}</dd></div>
                    <div><dt>{TEXTS.check.drawDate}</dt><dd>{toBengaliDigits(match.drawDate)}</dd></div>
                  </dl>
                  {match.drawPdfUrl && (
                    <a href={match.drawPdfUrl} rel="noopener noreferrer" target="_blank">
                      {TEXTS.check.drawDetails}
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
          {resultState.data.claimFormUrl && resultState.data.matchedCount > 0 && (
            <a
              className={css("pb-claim-link")}
              href={resultState.data.claimFormUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ActionIcon name="download" size={19} />
              {TEXTS.check.claimForm}
            </a>
          )}
        </div>
      )}

      {!!entries.length && (
        <div className={css("pb-fallback")}>
          <h3>{TEXTS.check.fallbackTitle}</h3>
          <p>{TEXTS.check.fallbackIntro}</p>
          <div className={css("pb-fallback-buttons")}>
            {Array.from({ length: chunkCount }, (_, index) => {
              const start = index * 100 + 1;
              const end = Math.min((index + 1) * 100, entries.length);
              return (
                <button key={start} onClick={() => onFallback(index)} type="button">
                  {TEXTS.check.fallbackButton(formatCount(start), formatCount(end))}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className={css("pb-authority-note")}>{TEXTS.check.authority}</p>
    </PanelShell>
  );
}
