import type {
  AlertResolution,
  AlertSeverity,
  AlertStatus,
  ValueSource,
} from '../types/alerts.types';

type Tone = 'neutral' | 'warning' | 'danger' | 'success';

/** RF-ALT-001: the severity names of the SRS, with what each one means. Crítica stands out solid. */
export const SEVERITY_LABELS: Record<
  AlertSeverity,
  { label: string; long: string; tone: Tone; appearance: 'solid' | 'soft' }
> = {
  3: { label: 'Crítica', long: 'Sin disponible', tone: 'danger', appearance: 'solid' },
  2: { label: 'Alta', long: 'En o bajo el stock de seguridad', tone: 'danger', appearance: 'soft' },
  1: { label: 'Media', long: 'En o bajo el punto de reorden', tone: 'warning', appearance: 'soft' },
};

/** What happened, after the product's name: "Tornillo M8 se quedó sin disponible". */
export const SEVERITY_EVENTS: Record<AlertSeverity, string> = {
  3: 'se quedó sin disponible',
  2: 'llegó a su stock de seguridad',
  1: 'llegó a su punto de reorden',
};

export const STATUS_LABELS: Record<AlertStatus, { label: string; tone: Tone }> = {
  open: { label: 'Pendiente', tone: 'warning' },
  attended: { label: 'Atendida', tone: 'success' },
  resolved: { label: 'Resuelta', tone: 'neutral' },
  dismissed: { label: 'Descartada', tone: 'neutral' },
};

/** Why it was resolved, completing "Se resolvió el … porque …". */
export const RESOLUTION_LABELS: Record<AlertResolution, string> = {
  stockRecovered: 'el disponible volvió a superar el punto de reorden',
  reorderPointChanged: 'el punto de reorden bajó por debajo del disponible',
  noReorderPoint: 'se quitó el punto de reorden',
  inactive: 'se archivó el producto o se cerró el almacén',
};

export const SOURCE_LABELS: Record<ValueSource, { label: string; long: string }> = {
  manual: { label: 'Manual', long: 'definido a mano' },
  calculated: { label: 'Calculado', long: 'calculado por el pronóstico' },
};

export function formatDate(iso: string, withTime = false): string {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      ...(withTime ? { timeStyle: 'short' } : {}),
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** "hace 5 min", "hace 3 h", "hace 2 días": for the bell, where the exact date matters less. */
export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'hace 1 día' : `hace ${days} días`;
}
