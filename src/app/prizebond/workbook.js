import { normalizeBondNumber, toBengaliDigits } from "./numberUtils";
import { TEXTS } from "./texts";

export function getValidNumbers(entries) {
  return entries
    .map((entry) => normalizeBondNumber(entry.number))
    .filter(Boolean);
}

export function createWorkbook(XLSX, numbers) {
  const worksheet = XLSX.utils.aoa_to_sheet(numbers.map((number) => [number]));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, TEXTS.file.sheetName);
  return workbook;
}

export function getExportFilename() {
  const now = new Date();
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
  ].map(toBengaliDigits);

  return `${TEXTS.file.baseName}-${parts[0]}-${parts[1]}-${parts[2]}_${parts[3]}-${parts[4]}.xlsx`;
}
