"use client";

import { TEXTS } from "../texts";
import { formatCount } from "../numberUtils";
import { createWorkbook, getExportFilename, getValidNumbers } from "../workbook";
import ActionIcon from "./ActionIcon";
import CornerOrnament from "./AnotherCornerOrnament";
import PanelShell from "./PanelShell";
import { css } from "./styles";

export default function TransferPanel({ store, onImportSuccess }) {
  const exportNumbers = async () => {
    const numbers = getValidNumbers(store.entries);
    if (!numbers.length) {
      window.alert(TEXTS.transfer.nothingToExport);
      return;
    }

    const XLSX = await import("xlsx");
    XLSX.writeFile(createWorkbook(XLSX, numbers), getExportFilename());
  };

  const importNumbers = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const count = store.importNumbers(rows.flat());
      window.alert(TEXTS.transfer.imported(formatCount(count)));
      onImportSuccess();
    } catch {
      window.alert(TEXTS.transfer.importFailed);
    }
  };

  return (
    <PanelShell
      intro={TEXTS.transfer.intro}
      title={TEXTS.transfer.title}
    >
      <div className={css("pb-transfer-grid")}>
        <article className={css("pb-transfer-card")}>
          <CornerOrnament
            className={css("pb-card-corner")}
            color="var(--pb-rose)"
            position="bottom-left"
            size={92}
          />
          <span className={css("pb-large-icon")}><ActionIcon name="download" size={34} /></span>
          <h3>{TEXTS.transfer.export}</h3>
          <p>{TEXTS.transfer.exportHint}</p>
          <button
            className={css("pb-primary-button")}
            disabled={!store.entries.length}
            onClick={exportNumbers}
            type="button"
          >
            <ActionIcon name="download" size={20} />
            {TEXTS.transfer.export}
          </button>
        </article>

        <article className={css("pb-transfer-card")}>
          <CornerOrnament
            className={css("pb-card-corner")}
            color="var(--pb-gold)"
            position="top-right"
            size={92}
          />
          <span className={css("pb-large-icon")}><ActionIcon name="upload" size={34} /></span>
          <h3>{TEXTS.transfer.import}</h3>
          <p>{TEXTS.transfer.importHint}</p>
          <label className={css("pb-file-button")}>
            <ActionIcon name="upload" size={20} />
            <span>{TEXTS.transfer.chooseFile}</span>
            <input accept=".xlsx,.xls" onChange={importNumbers} type="file" />
          </label>
        </article>
      </div>
    </PanelShell>
  );
}
