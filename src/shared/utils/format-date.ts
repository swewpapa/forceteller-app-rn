/**
 * Formats a date as `YYYY-MM-DD` (e.g. for daily horoscope cache keys).
 * Themed util file — we avoid a generic `utils.ts` per the naming convention.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
