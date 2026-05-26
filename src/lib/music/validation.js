export function cleanText(value, { max = 160, required = true } = {}) {
  if (typeof value !== "string") return required ? null : "";
  const cleaned = value.trim();
  if ((required && !cleaned) || cleaned.length > max) return null;
  return cleaned;
}

export function numericId(value) {
  return typeof value === "string" && /^\d{1,24}$/.test(value) ? value : null;
}

export function integerParam(value, fallback, min, max) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max
    ? parsed
    : null;
}
