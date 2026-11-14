/**
 * A local day (`YYYY-MM-DD`, what a date filter holds) as an instant: its first or its last
 * millisecond in the user's time zone. The API filters by instants; people filter by their days.
 */
export function dayBound(day: string, end: boolean): string {
  const [year, month, date] = day.split('-').map(Number);
  const local = end
    ? new Date(year, month - 1, date, 23, 59, 59, 999)
    : new Date(year, month - 1, date, 0, 0, 0, 0);
  return local.toISOString();
}
