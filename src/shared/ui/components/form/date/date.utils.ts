/**
 * Calendar math for the DatePicker. Dates travel as local `YYYY-MM-DD` strings (what `<input type="date">`
 * and most APIs use), never as UTC timestamps, so a day never shifts with the time zone.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseISODate(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  // Rejects "2026-02-31", which `Date` would silently roll over to March.
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

export function toISODate(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function addMonths(date: Date, months: number): Date {
  // Day 1 on purpose: Jan 31 + 1 month must be February, not March 3.
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Days of the month of `month`, plus how many empty cells precede the 1st (weeks start on Monday). */
export function buildMonth(month: Date): { leading: number; days: Date[] } {
  const first = startOfMonth(month);
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return {
    leading: (first.getDay() + 6) % 7,
    days: Array.from(
      { length: count },
      (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1),
    ),
  };
}

export const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'] as const;

const monthLabel = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' });
const dayLabel = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' });
const shortLabel = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export const formatMonth = (date: Date) => monthLabel.format(date);
export const formatLongDate = (date: Date) => dayLabel.format(date);
export const formatShortDate = (date: Date) => shortLabel.format(date);
