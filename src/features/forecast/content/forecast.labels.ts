import type { DemandClass, ForecastRun, RunStatus } from '../types/forecast.types';

export const RUN_STATUS: Record<
  RunStatus,
  { label: string; tone: 'primary' | 'success' | 'warning' | 'danger' }
> = {
  running: { label: 'En curso', tone: 'primary' },
  completed: { label: 'Completado', tone: 'success' },
  partial: { label: 'Parcial', tone: 'warning' },
  failed: { label: 'Falló', tone: 'danger' },
};

/** Syntetos–Boylan classes, in words a buyer understands. */
export const DEMAND_CLASS: Record<DemandClass, { label: string; description: string }> = {
  SMOOTH: {
    label: 'Regular',
    description: 'Se pide casi todas las semanas en cantidades parecidas.',
  },
  INTERMITTENT: {
    label: 'Intermitente',
    description: 'Hay semanas sin demanda, pero cuando la hay las cantidades son parecidas.',
  },
  ERRATIC: {
    label: 'Errática',
    description: 'Se pide casi todas las semanas, pero las cantidades cambian mucho.',
  },
  LUMPY: {
    label: 'Esporádica',
    description:
      'Muchas semanas sin demanda y cantidades muy distintas cuando la hay: es la más difícil de prever.',
  },
  INSUFFICIENT: {
    label: 'Historia insuficiente',
    description: 'Aún no hay semanas suficientes para clasificar su demanda.',
  },
  NOT_CLASSIFIABLE: {
    label: 'Sin clasificar',
    description: 'El servicio no pudo clasificar su demanda.',
  },
};

/** Why the service declined a series on purpose (`NO_FORECAST`). */
const REASONS: Record<string, string> = {
  inactive: 'El producto o el almacén están inactivos.',
  sold_to_order: 'El producto se vende sobre pedido: no se guarda inventario para él.',
  non_stock_warehouse: 'Este almacén no guarda inventario propio.',
  no_active_warehouse: 'El producto no está habilitado en ningún almacén activo.',
  history_only: 'De este producto solo se guarda el historial; no se pronostica.',
};

export const reasonText = (reason: string | null) =>
  (reason && REASONS[reason]) || 'El servicio decidió no pronosticar este producto aquí.';

/** Errors of one series (`ERROR`). */
const SERIES_ERRORS: Record<string, string> = {
  INSUFFICIENT_HISTORY:
    'Aún no tiene historia suficiente en este almacén para un pronóstico confiable.',
  MISSING_RESULT: 'El servicio de pronóstico no devolvió un resultado para este producto.',
  INVALID_RESPONSE: 'El servicio de pronóstico devolvió un resultado inválido para este producto.',
};

export const seriesErrorText = (code: string | undefined) =>
  (code && SERIES_ERRORS[code]) || 'El servicio no pudo pronosticar este producto.';

/** "100 pronosticados · 5 omitidos · 15 con error", leaving out what is zero. */
export function runOutcome(run: ForecastRun): string {
  const parts = [
    run.seriesOk > 0 && `${run.seriesOk} pronosticados`,
    run.seriesNoForecast > 0 && `${run.seriesNoForecast} omitidos`,
    run.seriesError > 0 && `${run.seriesError} con error`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : 'Sin resultados';
}

/** A date-only value (`YYYY-MM-DD`) as written: no time zone may move it to the day before. */
const asDay = (day: string) => new Date(`${day}T00:00:00Z`);

/** "17 nov". */
export const formatWeek = (day: string) =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(asDay(day))
    .replace('.', '');

/** "15 de noviembre de 2026". */
export const formatDay = (day: string) =>
  new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' }).format(asDay(day));

/** "18 nov 2026, 3:42 p. m.", in the user's time zone. */
export const formatInstant = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );

/** "3 min", "45 s": how long a run took. */
export function formatDuration(fromIso: string, toIso: string): string {
  const seconds = Math.max(0, Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 1000));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

/** The local day `weeks` weeks ago, `YYYY-MM-DD`: where the demand chart starts. */
export function weeksAgo(weeks: number, today = new Date()): string {
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - weeks * 7);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/** Whether the week starting on `start` (a Monday) has not ended yet. */
export function isCurrentWeek(start: string, today = new Date()): boolean {
  const end = asDay(start);
  end.setUTCDate(end.getUTCDate() + 7);
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return todayUtc < end.getTime();
}

/** Short reasons, for a table cell. */
const REASONS_SHORT: Record<string, string> = {
  inactive: 'Producto o almacén inactivo',
  sold_to_order: 'Se vende sobre pedido',
  non_stock_warehouse: 'Almacén sin inventario propio',
  no_active_warehouse: 'Sin almacén activo',
  history_only: 'Solo historial',
};

export const reasonShort = (reason: string | null) =>
  (reason && REASONS_SHORT[reason]) || 'Omitido por el servicio';

export const seriesErrorShort = (code: string | undefined) =>
  code === 'INSUFFICIENT_HISTORY' ? 'Historia insuficiente' : 'El servicio no pudo pronosticarlo';

/** "16 nov 2026", the day of an instant in the user's time zone. */
export const formatInstantDay = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(iso))
    .replace('.', '');
