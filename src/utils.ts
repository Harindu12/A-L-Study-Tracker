/**
 * Formats a Date object to YYYY-MM-DD using the device's local calendar year, month, and day.
 * Avoids any UTC / toISOString timezone offset drift.
 */
export const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses a YYYY-MM-DD string into a Date object set to local noon.
 * Noon (12:00:00) safely avoids DST boundary shifts when adding/subtracting days.
 */
export const parseLocalDate = (dateStr: string): Date => {
  const parts = dateStr.split('T')[0].split('-').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }
  const fallback = new Date(dateStr.replace(/-/g, '/'));
  return isNaN(fallback.getTime()) ? new Date() : fallback;
};

/**
 * Returns today's date formatted as YYYY-MM-DD in the user's local timezone.
 */
export const todayStr = (): string => {
  return formatLocalDate(new Date());
};

/**
 * Adds or subtracts N days to a YYYY-MM-DD string in the user's local timezone.
 */
export const addDays = (dateStr: string, n: number): string => {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + n);
  return formatLocalDate(d);
};

/**
 * Returns the Monday (YYYY-MM-DD) of the week containing the given dateStr in the user's local timezone.
 * Standard week starts on Monday (Monday = 1, Sunday = 0 -> -6 days).
 */
export const mondayOf = (dateStr: string): string => {
  const d = parseLocalDate(dateStr);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatLocalDate(d);
};

export const uid = () => Math.random().toString(36).slice(2, 10);

