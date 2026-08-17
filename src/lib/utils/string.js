export function capitalizeFirst(value) {
  if (typeof value !== "string" || value.length === 0) return value;

  return value.charAt(0).toUpperCase() + value.slice(1);
}
