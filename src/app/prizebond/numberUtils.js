const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";
const ASCII_DIGITS = "0123456789";

export function toBengaliDigits(value = "") {
  return String(value).replace(/\d/g, (digit) => BENGALI_DIGITS[Number(digit)]);
}

export function toAsciiDigits(value = "") {
  return String(value).replace(/[০-৯]/g, (digit) =>
    ASCII_DIGITS[BENGALI_DIGITS.indexOf(digit)],
  );
}

export function normalizeBondNumber(value, pad = true) {
  const normalized = toAsciiDigits(value).trim();
  if (!/^\d{1,7}$/.test(normalized)) return null;
  return pad ? normalized.padStart(7, "0") : normalized;
}

export function formatBondNumber(value) {
  const normalized = normalizeBondNumber(value);
  return normalized ? toBengaliDigits(normalized) : toBengaliDigits(value);
}

export function formatCount(value) {
  return toBengaliDigits(Number(value || 0).toLocaleString("bn-BD"));
}

export function formatAmount(value) {
  const amount = Number(value || 0);
  return `৳${toBengaliDigits(amount.toLocaleString("bn-BD"))}`;
}
