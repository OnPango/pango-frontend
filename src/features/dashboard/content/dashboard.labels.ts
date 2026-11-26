import type { LevelDays, Severity } from '../types/dashboard.types';

/** RF-ALT-001: the severity names, as Alertas shows them. */
export const SEVERITY_LABELS: Record<Severity, string> = {
  3: 'Crítica',
  2: 'Alta',
  1: 'Media',
};

/** The periods of "Nivel de inventario". */
export const LEVEL_OPTIONS: { value: LevelDays; label: string }[] = [
  { value: 7, label: 'Últimos 7 días' },
  { value: 30, label: 'Últimos 30 días' },
  { value: 90, label: 'Últimos 90 días' },
];

/** "Hace 5 min", "Hace 2 horas", "Ayer", "Hace 4 días", or the date beyond a week. */
export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? 'Hace 1 hora' : `Hace ${hours} horas`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return formatDay(iso.slice(0, 10));
}

/** "12 nov 2026" for a `YYYY-MM-DD`. */
export function formatDay(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(
    new Date(year, month - 1, date),
  );
}

/** "Se acaba en ~3 días": how long the stock lasts at the forecast. */
export function coverLabel(days: number | null): string | null {
  if (days === null) return null;
  if (days === 0) return 'Ya no alcanza';
  if (days === 1) return 'Alcanza ~1 día';
  return `Alcanza ~${days} días`;
}

/**
 * How a figure changed against one month earlier: "12%" with its direction, or the difference
 * when there was nothing then ("+4"). Null when nothing changed.
 */
export function trendOf(current: number, previous: number) {
  if (current === previous) return null;
  const direction = current > previous ? ('up' as const) : ('down' as const);
  if (previous === 0) {
    return { direction, label: `${current > 0 ? '+' : ''}${current.toLocaleString('es-CO')}` };
  }
  const change = Math.abs(Math.round(((current - previous) / previous) * 100));
  return { direction, label: `${change}%` };
}

/** "17 nov" for a `YYYY-MM-DD`: the chart's axis. */
export function formatShortDay(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' })
    .format(new Date(year, month - 1, date))
    .replace('.', '');
}

/** Spanish names of the imported history's movement codes (the kardex template). */
export const IMPORTED_CODE_LABELS: Record<string, string> = {
  OPENING_BALANCE: 'Saldo inicial',
  PURCHASE_RECEIPT: 'Compra',
  SALE: 'Venta',
  INTERNAL_CONSUMPTION: 'Consumo interno',
  ADJUSTMENT_IN: 'Ajuste de entrada',
  ADJUSTMENT_OUT: 'Ajuste de salida',
  TRANSFER_OUT: 'Traslado (salida)',
  TRANSFER_IN: 'Traslado (entrada)',
};
